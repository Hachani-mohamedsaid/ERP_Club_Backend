import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ScoutService } from './scout.service';
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
} from './data/scout-geo-catalog';

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
  source: 'prospect' | 'ai';
  inDatabase?: boolean;
  prospectId?: string;
};

type SquadCache = Record<string, { players: SquadPlayer[]; generatedAt: string }>;

@Injectable()
export class ScoutMapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scout: ScoutService,
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

  private async getSquadCache(): Promise<SquadCache> {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const cache = extended.scoutSquadCache;
    if (cache && typeof cache === 'object' && !Array.isArray(cache)) {
      return cache as SquadCache;
    }
    return {};
  }

  private async saveSquadCache(teamId: string, players: SquadPlayer[]) {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const cache = (extended.scoutSquadCache ?? {}) as SquadCache;
    cache[teamId] = { players, generatedAt: new Date().toISOString() };

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

  async getMapTeams(user: JwtPayload, countryId: string) {
    const country = getCountry(countryId);
    if (!country) throw new NotFoundException('Pays introuvable.');

    const prospects = await this.scout.listProspects(user);
    const teams = getTeamsByCountry(countryId).map((t) => {
      const dbCount = this.countProspectsForTeam(prospects, t.name);
      return {
        ...t,
        playerCount: dbCount || Math.max(3, Math.round(t.avgPotential / 15)),
        dbProspects: dbCount,
      };
    });

    return { country, teams };
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

  async getTeamSquad(user: JwtPayload, teamId: string, refresh = false) {
    const team = getTeam(teamId);
    if (!team) throw new NotFoundException('Équipe introuvable.');
    const country = getCountry(team.countryId);
    if (!country) throw new NotFoundException('Pays introuvable.');

    const prospects = await this.scout.listProspects(user);
    const dbPlayers = prospects
      .filter((p) => matchClubName(p.club, team.name))
      .map((p) => this.mapProspectToSquadPlayer(p));

    const cache = await this.getSquadCache();
    const cached = cache[teamId];
    const cacheAge = cached
      ? Date.now() - new Date(cached.generatedAt).getTime()
      : Infinity;
    const cacheValid = !refresh && cached && cacheAge < 7 * 24 * 60 * 60 * 1000;

    if (cacheValid && cached.players.length > 0) {
      const merged = this.mergeSquad(dbPlayers, cached.players);
      return {
        team: { ...team, country },
        players: merged,
        sources: { database: dbPlayers.length, ai: merged.filter((p) => p.source === 'ai').length },
        cached: true,
      };
    }

    const config = await this.resolveAiConfig();
    let aiPlayers: SquadPlayer[] = [];

    if (config.enabled && config.apiKey) {
      try {
        const raw = await this.callOpenAi(
          config.apiKey,
          config.model,
          `Tu es un expert scout football ODIN ERP.
Génère l'effectif actuel RÉEL de l'équipe demandée (saison 2024-25 ou la plus récente).
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
- 18 à 22 joueurs réels actuels de l'équipe
- potential et currentRating entre 55 et 95
- Utilise les VRAIS noms de joueurs professionnels
- Positions en abréviations FR (BU, MC, DC, etc.)`,
          `Équipe: ${team.name}\nLigue: ${team.league}\nPays: ${country.name}\nVille: ${team.city}`,
          2500,
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

        aiPlayers = (parsed.players ?? []).map((p, i) => ({
          id: `${teamId}-ai-${i}`,
          name: p.name,
          position: p.position,
          age: p.age,
          nationality: p.nationality,
          flag: country.flag,
          potential: p.potential,
          currentRating: p.currentRating,
          marketValue: p.marketValue,
          source: 'ai' as const,
          inDatabase: false,
        }));
      } catch {
        aiPlayers = this.fallbackSquad(team, country);
      }
    } else {
      aiPlayers = this.fallbackSquad(team, country);
    }

    const merged = this.mergeSquad(dbPlayers, aiPlayers);
    if (aiPlayers.length > 0) {
      await this.saveSquadCache(teamId, aiPlayers);
    }

    return {
      team: { ...team, country },
      players: merged,
      sources: { database: dbPlayers.length, ai: merged.filter((p) => p.source === 'ai').length },
      cached: false,
      aiEnabled: Boolean(config.apiKey && config.enabled),
    };
  }

  private mergeSquad(dbPlayers: SquadPlayer[], aiPlayers: SquadPlayer[]): SquadPlayer[] {
    const seen = new Set(dbPlayers.map((p) => p.name.toLowerCase()));
    const extra = aiPlayers.filter((p) => !seen.has(p.name.toLowerCase()));
    return [...dbPlayers, ...extra].sort((a, b) => b.potential - a.potential);
  }
}
