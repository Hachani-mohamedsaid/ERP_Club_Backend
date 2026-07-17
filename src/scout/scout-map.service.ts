import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ScoutService } from './scout.service';
import { ScoutFootballService } from './api-football/scout-football.service';
import {
  CONTINENTS,
  COUNTRIES,
  TEAMS,
  NATIONALITY_TO_COUNTRY,
  getCountriesByContinent,
  getTeamsByCountry,
  getContinent,
  getCountry,
  getTeam,
  matchClubName,
  type GeoTeam,
} from './data/scout-geo-catalog';
import { rosterTeamId } from './data/league-rosters';
import {
  resolveFlashscoreSquad,
  hasCuratedFlashscoreSquad,
  filterDepartedPlayers,
} from './data/flashscore-squads';
import { resolvePlayerPhoto } from './data/player-photos';

type SquadPlayer = {
  id: string;
  name: string;
  position: string;
  age: number;
  nationality: string;
  flag: string;
  potential: number;
  currentRating: number;
  marketValue: string;
  source: 'prospect' | 'flashscore' | 'ai';
  inDatabase?: boolean;
  prospectId?: string;
  photoUrl?: string;
};

type SquadCache = Record<string, { players: SquadPlayer[]; generatedAt: string; source?: 'live' | 'flashscore' }>;
type TeamCache = Record<string, { teams: GeoTeam[]; generatedAt: string }>;

const SQUAD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ScoutMapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scout: ScoutService,
    private readonly scoutFootball: ScoutFootballService,
  ) {}

  private async resolveAiConfig() {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const enabled = extended.aiEnabled !== false;
    const model = String(extended.aiModel ?? 'gpt-4o-mini');
    const apiKey =
      process.env.OPENAI_API_KEY?.trim() ||
      String(extended.aiApiKey ?? '').trim();
    return { enabled, model, apiKey, provider: String(extended.aiProvider ?? 'openai') };
  }

  private async callOpenAi(
    apiKey: string,
    model: string,
    system: string,
    userPrompt: string,
    maxTokens = 2200,
  ): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new BadRequestException(`OpenAI (${res.status}): ${errBody.slice(0, 280)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new BadRequestException('Réponse OpenAI vide.');
    return content;
  }

  private async getTeamCache(): Promise<TeamCache> {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const cache = extended.scoutTeamCache;
    if (cache && typeof cache === 'object' && !Array.isArray(cache)) {
      return cache as TeamCache;
    }
    return {};
  }

  private async saveTeamCache(countryId: string, teams: GeoTeam[]) {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const cache = (extended.scoutTeamCache ?? {}) as TeamCache;
    cache[countryId] = { teams, generatedAt: new Date().toISOString() };

    await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        extendedSettings: { ...extended, scoutTeamCache: cache } as never,
      },
      update: {
        extendedSettings: { ...extended, scoutTeamCache: cache } as never,
      },
    });
  }

  private mergeTeamLists(base: GeoTeam[], extra: GeoTeam[]): GeoTeam[] {
    const result: GeoTeam[] = [...base];
    for (const t of extra) {
      const dup = result.some((x) => matchClubName(x.name, t.name));
      if (!dup) result.push(t);
    }
    return result.sort((a, b) => b.avgPotential - a.avgPotential);
  }

  private async fetchLeagueTeamsFromAi(
    country: NonNullable<ReturnType<typeof getCountry>>,
    config: Awaited<ReturnType<ScoutMapService['resolveAiConfig']>>,
  ): Promise<GeoTeam[]> {
    if (!config.apiKey) return [];
    const league = country.leagues[0] ?? 'Division 1';
    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Expert football ODIN ERP. Liste TOUS les clubs de la division 1 actuelle du pays.
Réponds UNIQUEMENT en JSON:
{"teams":[{"name":"Nom officiel","city":"Ville","avgPotential":75,"scoutActivity":"Moyenne","logoColor":"E30613"}]}
Règles: liste COMPLÈTE (16-20 clubs), noms réels, saison 2024-25.`,
      `Pays: ${country.name}\nLigue: ${league}\nLeagueId: ${country.leagueId}`,
      2800,
    );

    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '')) as {
      teams?: {
        name: string;
        city: string;
        avgPotential?: number;
        scoutActivity?: string;
        logoColor?: string;
      }[];
    };

    return (parsed.teams ?? []).map((t) => ({
      id: rosterTeamId(country.id, t.name),
      countryId: country.id,
      name: t.name,
      league,
      leagueId: country.leagueId,
      city: t.city,
      tier: 'Pro' as const,
      avgPotential: t.avgPotential ?? 74,
      scoutActivity: (t.scoutActivity as GeoTeam['scoutActivity']) ?? 'Moyenne',
      logoColor: t.logoColor,
    }));
  }

  private async resolveTeam(teamId: string): Promise<GeoTeam | undefined> {
    const staticTeam = getTeam(teamId);
    if (staticTeam) return staticTeam;

    const cache = await this.getTeamCache();
    for (const entry of Object.values(cache)) {
      const found = entry.teams.find((t) => t.id === teamId);
      if (found) return found;
    }
    return undefined;
  }

  private async getSquadCache(): Promise<SquadCache> {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const cache = extended.scoutSquadCache;
    if (cache && typeof cache === 'object' && !Array.isArray(cache)) {
      return cache as SquadCache;
    }
    return {};
  }

  private async saveSquadCache(
    teamId: string,
    players: SquadPlayer[],
    source: 'live' | 'flashscore' = 'flashscore',
  ) {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const cache = (extended.scoutSquadCache ?? {}) as SquadCache;
    cache[teamId] = { players, generatedAt: new Date().toISOString(), source };

    await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        extendedSettings: { ...extended, scoutSquadCache: cache } as never,
      },
      update: {
        extendedSettings: { ...extended, scoutSquadCache: cache } as never,
      },
    });
  }

  private countProspectsForContinent(
    prospects: Awaited<ReturnType<ScoutService['listProspects']>>,
    continentId: string,
  ) {
    const countryIds = new Set(getCountriesByContinent(continentId).map((c) => c.id));
    return prospects.filter((p) => {
      const cid = NATIONALITY_TO_COUNTRY[p.nationality];
      return cid && countryIds.has(cid);
    }).length;
  }

  private countProspectsForCountry(
    prospects: Awaited<ReturnType<ScoutService['listProspects']>>,
    countryId: string,
  ) {
    const country = getCountry(countryId);
    if (!country) return 0;
    return prospects.filter((p) => {
      const cid = NATIONALITY_TO_COUNTRY[p.nationality];
      return cid === countryId || p.nationality === country.name;
    }).length;
  }

  private countProspectsForTeam(
    prospects: Awaited<ReturnType<ScoutService['listProspects']>>,
    teamName: string,
  ) {
    return prospects.filter((p) => matchClubName(p.club, teamName)).length;
  }

  async getMapOverview(user: JwtPayload) {
    if (this.scoutFootball.isAvailable()) {
      try {
        const live = await this.scoutFootball.getMapOverview();
        const prospects = await this.scout.listProspects(user);
        return {
          ...live,
          stats: { ...live.stats, prospectsInDb: prospects.length },
          continents: live.continents.map((c) => ({
            ...c,
            prospects: this.countProspectsForContinent(prospects, c.id) || c.prospects,
          })),
        };
      } catch {
        /* fallback below */
      }
    }

    const [config, prospects] = await Promise.all([
      this.resolveAiConfig(),
      this.scout.listProspects(user),
    ]);

    const continents = CONTINENTS.map((c) => {
      const countries = getCountriesByContinent(c.id);
      const dbProspects = this.countProspectsForContinent(prospects, c.id);
      const teamCount = countries.reduce((s, co) => s + getTeamsByCountry(co.id).length, 0);
      return {
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        countries: countries.length,
        prospects: dbProspects || countries.reduce((s, co) => s + getTeamsByCountry(co.id).length * 2, 0),
        teams: teamCount,
      };
    });

    return {
      status: !config.enabled ? 'disabled' : config.apiKey ? 'available' : 'no_key',
      model: config.model,
      continents,
      stats: {
        continents: CONTINENTS.length,
        countries: COUNTRIES.length,
        clubs: TEAMS.length,
        prospectsInDb: prospects.length,
      },
    };
  }

  async getMapCountries(user: JwtPayload, continentId: string) {
    if (this.scoutFootball.isAvailable()) {
      try {
        const live = await this.scoutFootball.getMapCountries(continentId);
        if (live) {
          const prospects = await this.scout.listProspects(user);
          return {
            ...live,
            countries: live.countries.map((c) => ({
              ...c,
              prospects: this.countProspectsForCountry(prospects, c.id) || c.prospects,
            })),
          };
        }
      } catch {
        /* fallback below */
      }
    }

    const continent = getContinent(continentId);
    if (!continent) throw new NotFoundException('Continent introuvable.');

    const prospects = await this.scout.listProspects(user);
    const countries = getCountriesByContinent(continentId).map((c) => {
      const teams = getTeamsByCountry(c.id);
      const dbProspects = this.countProspectsForCountry(prospects, c.id);
      return {
        ...c,
        teamCount: teams.length,
        prospects: dbProspects || teams.reduce((s, t) => s + Math.max(1, Math.round(t.avgPotential / 20)), 0),
      };
    });

    return { continent, countries };
  }

  async getMapTeams(user: JwtPayload, countryId: string, refresh = false) {
    if (this.scoutFootball.isAvailable()) {
      try {
        const live = await this.scoutFootball.getMapTeams(countryId);
        if (live && live.teams.length > 0) {
          const prospects = await this.scout.listProspects(user);
          return {
            ...live,
            teams: live.teams.map((t) => ({
              ...t,
              dbProspects: this.countProspectsForTeam(prospects, t.name),
            })),
            total: live.totalTeams,
          };
        }
      } catch {
        /* fallback below */
      }
    }

    const country = getCountry(countryId);
    if (!country) throw new NotFoundException('Pays introuvable.');

    const prospects = await this.scout.listProspects(user);
    let allTeams = getTeamsByCountry(countryId);

    const cache = await this.getTeamCache();
    const cached = cache[countryId];
    const cacheAge = cached ? Date.now() - new Date(cached.generatedAt).getTime() : Infinity;
    const cacheValid = !refresh && cached && cacheAge < 30 * 24 * 60 * 60 * 1000;

    if (cacheValid && cached.teams.length > allTeams.length) {
      allTeams = this.mergeTeamLists(allTeams, cached.teams);
    } else if (allTeams.length < 12) {
      const config = await this.resolveAiConfig();
      if (config.enabled && config.apiKey) {
        try {
          const aiTeams = await this.fetchLeagueTeamsFromAi(country, config);
          if (aiTeams.length > 0) {
            allTeams = this.mergeTeamLists(allTeams, aiTeams);
            await this.saveTeamCache(countryId, allTeams);
          }
        } catch {
          /* garde la liste statique */
        }
      }
    }

    const teams = allTeams.map((t) => {
      const dbCount = this.countProspectsForTeam(prospects, t.name);
      const fsCount = resolveFlashscoreSquad(
        t.id,
        t.name,
        t.countryId,
        country.name,
        t.avgPotential,
      ).length;
      return {
        ...t,
        playerCount: fsCount || dbCount || Math.max(3, Math.round(t.avgPotential / 15)),
        dbProspects: dbCount,
      };
    });

    return { country, teams, total: teams.length };
  }

  private mapProspectToSquadPlayer(
    p: Awaited<ReturnType<ScoutService['listProspects']>>[0],
  ): SquadPlayer {
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      age: p.age,
      nationality: p.nationality,
      flag: p.flag,
      potential: p.potential,
      currentRating: p.currentRating,
      marketValue: p.marketValue,
      source: 'prospect',
      inDatabase: true,
      prospectId: p.id,
    };
  }

  private fallbackSquad(team: ReturnType<typeof getTeam>, country: ReturnType<typeof getCountry>): SquadPlayer[] {
    if (!team || !country) return [];
    const positions = ['GB', 'DC', 'DC', 'DG', 'DD', 'MDC', 'MC', 'MC', 'BU', 'BU'];
    return positions.map((pos, i) => ({
      id: `${team.id}-fb-${i}`,
      name: `Joueur ${i + 1}`,
      position: pos,
      age: 20 + (i % 6),
      nationality: country.name,
      flag: country.flag,
      potential: Math.max(65, team.avgPotential - 5 + (i % 8)),
      currentRating: Math.max(60, team.avgPotential - 10 + (i % 6)),
      marketValue: `${500 + i * 100}K €`,
      source: 'ai' as const,
      inDatabase: false,
    }));
  }

  private mapFlashscoreToSquad(
    teamId: string,
    players: ReturnType<typeof resolveFlashscoreSquad>,
    countryFlag: string,
  ): SquadPlayer[] {
    return players.map((p, i) => ({
      id: `${teamId}-fs-${i}`,
      name: p.name,
      position: p.position,
      age: p.age,
      nationality: p.nationality,
      flag: countryFlag,
      potential: p.potential,
      currentRating: p.currentRating,
      marketValue: p.marketValue,
      source: 'flashscore' as const,
      inDatabase: false,
      photoUrl: resolvePlayerPhoto(p.name) ?? undefined,
    }));
  }

  private async fetchLiveSquadFromOpenAi(
    teamId: string,
    team: GeoTeam,
    country: NonNullable<ReturnType<typeof getCountry>>,
    config: { apiKey: string; model: string },
  ): Promise<SquadPlayer[]> {
    const today = new Date().toISOString().slice(0, 10);
    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es un fournisseur de données football style Flashscore pour ODIN ERP.
Date du jour: ${today}
Génère l'effectif ACTUEL et COMPLET de l'équipe (dernière saison en cours ou la plus récente).
N'inclus AUCUN joueur ayant quitté le club (transferts, prêts terminés, retraités, libérés).
Réponds UNIQUEMENT en JSON valide:
{
  "players": [
    {
      "name": "Nom complet réel",
      "position": "BU|MC|DC|DG|DD|GB|MDC|MOC|AG|AD",
      "age": 24,
      "nationality": "Pays",
      "potential": 82,
      "currentRating": 78,
      "marketValue": "15M €"
    }
  ]
}
Règles:
- 18 à 25 joueurs réels actuels de l'équipe AUJOURD'HUI
- potential et currentRating entre 55 et 95
- Utilise les VRAIS noms de joueurs professionnels
- Positions en abréviations FR (BU, MC, DC, etc.)`,
      `Équipe: ${team.name}\nLigue: ${team.league}\nPays: ${country.name}\nVille: ${team.city}\nDate: ${today}`,
      2800,
    );

    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '')) as {
      players?: {
        name: string;
        position: string;
        age: number;
        nationality: string;
        potential: number;
        currentRating: number;
        marketValue: string;
      }[];
    };

    return (parsed.players ?? []).map((p, i) => ({
      id: `${teamId}-live-${i}`,
      name: p.name,
      position: p.position,
      age: p.age,
      nationality: p.nationality,
      flag: country.flag,
      potential: p.potential,
      currentRating: p.currentRating,
      marketValue: p.marketValue,
      source: 'flashscore' as const,
      inDatabase: false,
    }));
  }

  private filterSquadDeparted(
    players: SquadPlayer[],
    teamId: string,
    teamName: string,
    countryId: string,
  ): SquadPlayer[] {
    return players.filter((p) => {
      const kept = filterDepartedPlayers(
        [{
          name: p.name,
          position: p.position,
          age: p.age,
          nationality: p.nationality,
          potential: p.potential,
          currentRating: p.currentRating,
          marketValue: p.marketValue,
        }],
        teamId,
        teamName,
        countryId,
      );
      return kept.length > 0;
    });
  }

  async getTeamSquad(user: JwtPayload, teamId: string, refresh = false) {
    if (this.scoutFootball.isAvailable()) {
      try {
        const live = await this.scoutFootball.getTeamSquad(teamId, refresh);
        if (live) {
          const prospects = await this.scout.listProspects(user);
          const dbProspects = prospects
            .filter((p) => matchClubName(p.club, live.team.name))
            .map((p) => this.mapProspectToSquadPlayer(p));
          const players = this.mergeFlashscoreRoster(
            live.players.map((p) => ({ ...p, source: 'flashscore' as const })),
            dbProspects,
          );
          return {
            ...live,
            players,
            sources: {
              database: players.filter((p) => p.inDatabase).length,
              flashscore: players.length,
              ai: 0,
            },
          };
        }
      } catch {
        /* fallback below */
      }
    }

    const team = await this.resolveTeam(teamId);
    if (!team) throw new NotFoundException('Équipe introuvable.');
    const country = getCountry(team.countryId);
    if (!country) throw new NotFoundException('Pays introuvable.');

    const prospects = await this.scout.listProspects(user);
    const dbProspects = prospects
      .filter((p) => matchClubName(p.club, team.name))
      .map((p) => this.mapProspectToSquadPlayer(p));

    const isCurated = hasCuratedFlashscoreSquad(teamId, team.name, team.countryId);
    const flashscoreSeeds = resolveFlashscoreSquad(
      teamId,
      team.name,
      team.countryId,
      country.name,
      team.avgPotential,
    );
    const staticPlayers = this.mapFlashscoreToSquad(teamId, flashscoreSeeds, country.flag);

    let rosterPlayers = staticPlayers;
    let dataSource: 'live' | 'flashscore' = 'flashscore';
    let updatedAt = new Date().toISOString();
    let fromCache = false;

    const cache = await this.getSquadCache();
    const cached = cache[teamId];
    const cacheAge = cached
      ? Date.now() - new Date(cached.generatedAt).getTime()
      : Infinity;
    const cacheStale = cacheAge >= SQUAD_CACHE_TTL_MS;
    const hasLegacyAiCache = cached?.players.some((p) => p.source === 'ai') ?? false;
    const hasBadLiveCache =
      cached?.source === 'live' &&
      this.filterSquadDeparted(cached.players, teamId, team.name, team.countryId).length <
        cached.players.length;

    // Effectifs curés Flashscore : jamais remplacés par OpenAI (souvent obsolète)
    if (isCurated) {
      rosterPlayers = staticPlayers;
      dataSource = 'flashscore';
      const cachedNames = new Set(cached?.players.map((p) => p.name.toLowerCase()) ?? []);
      const staticNames = staticPlayers.map((p) => p.name.toLowerCase());
      const cacheMismatch =
        Boolean(cached) &&
        (cachedNames.size !== staticNames.length ||
          staticNames.some((n) => !cachedNames.has(n)));
      if (
        refresh ||
        !cached ||
        hasLegacyAiCache ||
        hasBadLiveCache ||
        cached.source === 'live' ||
        cacheMismatch
      ) {
        await this.saveSquadCache(teamId, staticPlayers, 'flashscore');
        updatedAt = new Date().toISOString();
      } else if (cached && !cacheStale) {
        rosterPlayers = this.filterSquadDeparted(
          cached.players.map((p) => ({ ...p, source: 'flashscore' as const })),
          teamId,
          team.name,
          team.countryId,
        );
        updatedAt = cached.generatedAt;
        fromCache = true;
      }
    } else {
      const shouldLiveRefresh = refresh || cacheStale || hasLegacyAiCache || hasBadLiveCache;
      const config = await this.resolveAiConfig();

      if (shouldLiveRefresh && config.enabled && config.apiKey) {
        try {
          const live = this.filterSquadDeparted(
            await this.fetchLiveSquadFromOpenAi(teamId, team, country, config),
            teamId,
            team.name,
            team.countryId,
          );
          if (live.length >= 11) {
            rosterPlayers = live;
            dataSource = 'live';
            updatedAt = new Date().toISOString();
            await this.saveSquadCache(teamId, live, 'live');
          } else if (staticPlayers.length > 0) {
            rosterPlayers = staticPlayers;
            await this.saveSquadCache(teamId, staticPlayers, 'flashscore');
          }
        } catch {
          rosterPlayers = staticPlayers;
          if (staticPlayers.length > 0) {
            await this.saveSquadCache(teamId, staticPlayers, 'flashscore');
          }
        }
      } else if (cached && !cacheStale && cached.players.length > 0 && !hasLegacyAiCache && !hasBadLiveCache) {
        rosterPlayers = this.filterSquadDeparted(
          cached.players.map((p) => ({ ...p, source: 'flashscore' as const })),
          teamId,
          team.name,
          team.countryId,
        );
        dataSource = cached.source === 'live' ? 'live' : 'flashscore';
        updatedAt = cached.generatedAt;
        fromCache = true;
      } else if (staticPlayers.length > 0) {
        rosterPlayers = staticPlayers;
        await this.saveSquadCache(teamId, staticPlayers, 'flashscore');
      }
    }

    rosterPlayers = this.filterSquadDeparted(rosterPlayers, teamId, team.name, team.countryId);
    const players = this.mergeFlashscoreRoster(rosterPlayers, dbProspects);
    const linkedDb = players.filter((p) => p.inDatabase).length;
    const config = await this.resolveAiConfig();

    return {
      team: { ...team, country },
      players,
      sources: {
        database: linkedDb,
        flashscore: players.length,
        ai: 0,
      },
      dataSource: isCurated ? 'flashscore' : dataSource,
      season: '2026-2027',
      updatedAt,
      cached: fromCache,
      autoRefresh: !isCurated && (refresh || cacheStale),
      aiEnabled: Boolean(config.apiKey && config.enabled),
    };
  }

  /** Effectif Flashscore = source de vérité ; la base scout ne fait qu'enrichir les joueurs déjà présents. */
  private mergeFlashscoreRoster(
    rosterPlayers: SquadPlayer[],
    dbProspects: SquadPlayer[],
  ): SquadPlayer[] {
    const dbByName = new Map(dbProspects.map((p) => [p.name.toLowerCase(), p]));
    return rosterPlayers
      .map((player) => {
        const db = dbByName.get(player.name.toLowerCase());
        if (!db) return player;
        return {
          ...player,
          id: db.id,
          inDatabase: true,
          prospectId: db.prospectId,
          potential: Math.max(player.potential, db.potential),
          currentRating: Math.max(player.currentRating, db.currentRating),
        };
      })
      .sort((a, b) => b.potential - a.potential);
  }
}
