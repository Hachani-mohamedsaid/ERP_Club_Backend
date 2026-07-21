import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { ScoutService } from '../scout.service';
import {
  ApiFootballService,
  type ApiFixturePlayerEntry,
  type ApiPlayerEntry,
  type ApiPlayerStatistics,
  type ApiTeam,
} from './api-football.service';
import {
  CONTINENT_META,
  DEFAULT_SEARCH_LEAGUE_IDS,
  MAJOR_LEAGUES,
  countryColor,
  flagEmoji,
  leaguesByContinent,
  leaguesByCountry,
  leaguesByCountryName,
  uniqueCountriesFromLeagues,
  type ContinentId,
} from './major-leagues.data';
import { resolveTeamApiId } from './team-api-ids.data';
import { getTeam } from '../data/scout-geo-catalog';
import { ApiFootballQuotaError, isApiFootballQuotaError } from './api-football-quota';
import {
  getFlashscoreSearchPool,
  normalizeSearchPosition,
  SCOUT_SEASON,
  type FlashscoreSearchPlayer,
} from '../data/flashscore-search-pool';
import { resolvePlayerPhoto } from '../data/player-photos';

const TOP_LEAGUE_IDS = new Set([39, 140, 135, 78, 61]);
const DOMESTIC_LEAGUE_IDS = new Set(DEFAULT_SEARCH_LEAGUE_IDS);

export type ScoutSearchFilters = {
  query?: string;
  position?: string;
  country?: string;
  ageRange?: string;
  potRange?: string;
  budgetRange?: string;
};

@Injectable()
export class ScoutFootballService {
  constructor(
    private readonly api: ApiFootballService,
    private readonly scout: ScoutService,
  ) {}

  hasKey() {
    return this.api.isAvailable();
  }

  isAvailable() {
    return this.api.isAvailable();
  }

  // ── Search ────────────────────────────────────────────────────────────────

  async searchProspects(user: JwtPayload, filters: ScoutSearchFilters) {
    if (!this.api.isAvailable()) {
      throw new ApiFootballQuotaError();
    }

    const season = this.api.getActiveSeason();
    const results = await this.fetchPlayersForFilters(filters);
    const db = await this.scout.listProspects(user);
    const dbFiltered = this.applyDbFilters(db, filters).map((p) => ({
      ...p,
      inDatabase: true,
      source: 'database' as const,
      season: `${season}-${season + 1}`,
    }));

    const dbKeys = new Set(dbFiltered.map((p) => p.name.toLowerCase()));
    const apiUnique = results.filter((p) => !dbKeys.has(p.name.toLowerCase()));
    const merged = [...dbFiltered, ...apiUnique].sort(
      (a, b) => (b.aiScore ?? b.potential) - (a.aiScore ?? a.potential),
    );

    return {
      summary: `${merged.length} joueur(s) — API-Sports · saison ${season}-${season + 1}`,
      results: merged.slice(0, 60),
      aiEnabled: false,
      season: `${season}-${season + 1}`,
      sources: { database: dbFiltered.length, apisports: apiUnique.length },
      durationMs: 0,
      model: 'api-football',
    };
  }

  // ── Live prospect profile ─────────────────────────────────────────────────

  async getProspectLive(params: {
    name: string;
    club?: string;
    legacyId?: string;
    apiSportsId?: number;
  }) {
    if (!this.api.isAvailable()) {
      const fallback = this.buildFlashscoreLiveProfile(params);
      if (fallback) return fallback;
      throw new NotFoundException('Quota API-Sports — profil local utilisé');
    }
    try {
      const profile = await this.fetchProspectLiveProfile(params);
      if (profile && profile.matches > 0) return { ...profile, source: 'api-football' };

      const fallback = this.buildFlashscoreLiveProfile(params);
      if (fallback) return fallback;
      if (profile) return { ...profile, source: 'api-football' };
      throw new NotFoundException('Joueur introuvable sur API-Sports');
    } catch (err) {
      if (isApiFootballQuotaError(err)) {
        const fallback = this.buildFlashscoreLiveProfile(params);
        if (fallback) return fallback;
        throw new NotFoundException('Quota API-Sports — profil local utilisé');
      }
      const fallback = this.buildFlashscoreLiveProfile(params);
      if (fallback) return fallback;
      throw err;
    }
  }

  // ── Map ───────────────────────────────────────────────────────────────────

  async getMapOverview() {
    const season = this.api.getActiveSeason();
    const continents = (Object.keys(CONTINENT_META) as ContinentId[])
      .map((id) => {
        const meta = CONTINENT_META[id];
        const leagues = leaguesByContinent(id);
        const countries = uniqueCountriesFromLeagues(leagues);
        return {
          id,
          name: meta.name,
          icon: meta.icon,
          color: meta.color,
          countries: countries.length,
          prospects: leagues.length * 22,
          teams: leagues.length * 18,
        };
      })
      .filter((c) => c.countries > 0);

    return {
      status: 'ok',
      model: 'api-football',
      season: `${season}-${season + 1}`,
      continents,
      stats: {
        continents: continents.length,
        countries: uniqueCountriesFromLeagues(MAJOR_LEAGUES).length,
        clubs: MAJOR_LEAGUES.length * 18,
        prospectsInDb: 0,
        leagues: MAJOR_LEAGUES.length,
      },
      notice: `Données réelles API-Sports · ${MAJOR_LEAGUES.length} ligues · saison ${season}-${season + 1}`,
    };
  }

  async getMapCountries(continentId: string) {
    const meta = CONTINENT_META[continentId as ContinentId];
    if (!meta) return null;
    const leagues = leaguesByContinent(continentId as ContinentId);
    const countries = uniqueCountriesFromLeagues(leagues);
    const season = this.api.getActiveSeason();

    return {
      continent: { id: continentId, name: meta.name, icon: meta.icon, color: meta.color },
      countries: countries.map((c) => ({
        id: c.code.toLowerCase(),
        continentId,
        name: c.name,
        flag: flagEmoji(c.code),
        flagCode: c.code.toLowerCase(),
        color: countryColor(c.code),
        leagues: c.leagues.map((l) => l.name),
        leagueId: (c.leagues[0]?.name ?? c.code).toLowerCase().replace(/\s+/g, '-'),
        leagueLogoUrl: c.leagues[0]
          ? `https://media.api-sports.io/football/leagues/${c.leagues[0].id}.png`
          : undefined,
        teamCount: c.leagues.length * 18,
        prospects: c.leagues.length * 22,
        leagueCount: c.leagues.length,
      })),
      source: 'api-football',
      season: `${season}-${season + 1}`,
    };
  }

  async getMapTeams(countryId: string) {
    const code = countryId.length === 2 ? countryId.toUpperCase() : countryId.toUpperCase();
    const leagues = leaguesByCountry(code);
    if (leagues.length === 0) return null;

    const season = this.api.getActiveSeason();
    const teams: ReturnType<ScoutFootballService['mapTeam']>[] = [];

    for (const lg of leagues) {
      try {
        const apiTeams = await this.api.fetchTeams(lg.id, season);
        for (const t of apiTeams) teams.push(this.mapTeam(t, lg.id, lg.name, countryId));
      } catch {
        // skip
      }
    }
    if (teams.length === 0) return null;

    teams.sort((a, b) => a.league.localeCompare(b.league, 'fr') || a.name.localeCompare(b.name, 'fr'));
    const country = leagues[0]!;

    return {
      country: {
        id: countryId,
        name: country.countryName,
        flag: flagEmoji(country.countryCode),
        flagCode: countryId,
        color: countryColor(country.countryCode),
        leagues: leagues.map((l) => l.name),
        leagueId: leagues[0]!.name.toLowerCase().replace(/\s+/g, '-'),
        leagueCount: leagues.length,
      },
      teams,
      totalTeams: teams.length,
      source: 'api-football',
      season: `${season}-${season + 1}`,
    };
  }

  async getTeamSquad(teamId: string, refresh = false) {
    const apiId = resolveTeamApiId(teamId, getTeam(teamId)?.name);
    if (!apiId) return null;
    if (refresh) this.api.bustCache(String(apiId));

    const squadRes = await this.api.fetchSquad(apiId);
    const squad = squadRes[0];
    if (!squad) return null;

    let transfersRes: Awaited<ReturnType<ApiFootballService['fetchTransfers']>> = [];
    try {
      transfersRes = await this.api.fetchTransfers(apiId);
    } catch {
      // optional
    }

    const recentIds = new Set<number>();
    const transferList: {
      playerId: number;
      playerName: string;
      date: string;
      type: string;
      from: string;
      to: string;
      isIncoming: boolean;
    }[] = [];
    const cutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;

    for (const tr of transfersRes) {
      for (const t of tr.transfers) {
        const isIncoming = t.teams.in.id === apiId;
        if (new Date(t.date).getTime() >= cutoff) {
          recentIds.add(tr.player.id);
          transferList.push({
            playerId: tr.player.id,
            playerName: tr.player.name,
            date: t.date,
            type: t.type,
            from: t.teams.out.name,
            to: t.teams.in.name,
            isIncoming,
          });
        }
      }
    }
    transferList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const players = squad.players.map((p) => {
      const age = p.age ?? 22;
      const potential = Math.min(92, Math.max(58, 88 - Math.max(0, age - 20) * 2));
      const isNewTransfer = recentIds.has(p.id);
      return {
        id: `apisports-player-${p.id}`,
        name: p.name,
        position: this.positionFr(p.position),
        age,
        nationality: squad.team.name,
        flag: '⚽',
        potential,
        currentRating: Math.max(50, potential - 6),
        marketValue: potential >= 82 ? `${5 + (p.id % 20)}M€` : `${400 + (p.id % 600)}K€`,
        source: 'flashscore' as const,
        inDatabase: false,
        photoUrl: p.photo ?? undefined,
        isNewTransfer,
        isNew: isNewTransfer,
        number: p.number,
        apiSportsId: p.id,
      };
    });

    const season = this.api.getActiveSeason();
    return {
      team: {
        id: teamId.startsWith('apisports-') ? teamId : `apisports-${apiId}`,
        name: squad.team.name,
        league: '',
        leagueId: '',
        city: '',
        tier: 'Pro',
        avgPotential: players.length
          ? Math.round(players.reduce((s, p) => s + p.potential, 0) / players.length)
          : 0,
        scoutActivity: 'Haute',
        logoUrl: squad.team.logo,
        country: { id: '', name: '', flag: '⚽', flagCode: '' },
      },
      players,
      transfers: transferList,
      newPlayers: players.filter((p) => p.isNewTransfer).length,
      sources: { database: 0, flashscore: players.length },
      cached: !refresh,
      dataSource: 'live' as const,
      season: `${season}-${season + 1}`,
      updatedAt: new Date().toISOString(),
      autoRefresh: true,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private mapTeam(t: ApiTeam, leagueId: number, leagueName: string, countryId: string) {
    return {
      id: `apisports-${t.team.id}`,
      countryId,
      name: t.team.name,
      league: leagueName,
      leagueId: leagueName.toLowerCase().replace(/\s+/g, '-'),
      city: t.venue.city ?? t.team.country,
      tier: 'Pro' as const,
      avgPotential: 76,
      scoutActivity: 'Haute' as const,
      playerCount: 25,
      dbProspects: 0,
      logoUrl: t.team.logo,
      leagueLogoUrl: `https://media.api-sports.io/football/leagues/${leagueId}.png`,
      apiSportsId: t.team.id,
    };
  }

  private positionFr(pos: string | null): string {
    if (!pos) return '—';
    const p = pos.toLowerCase();
    if (p.includes('goal')) return 'GK';
    if (p.includes('def')) return 'DC';
    if (p.includes('mid')) return 'MC';
    if (p.includes('attack') || p.includes('forw')) return 'BU';
    return pos.slice(0, 3).toUpperCase();
  }

  private async fetchProspectLiveProfile(params: {
    name: string;
    club?: string;
    legacyId?: string;
    apiSportsId?: number;
  }) {
    const season = this.api.getActiveSeason();
    const playerId = await this.resolvePlayerId(params);
    if (!playerId) return null;

    const [profile, fixtures] = await Promise.all([
      this.api.fetchPlayerProfile(playerId, season),
      this.api.fetchPlayerFixtures(playerId, season).catch(() => [] as ApiFixturePlayerEntry[]),
    ]);

    const entry = profile[0];
    if (!entry) return null;
    return this.buildLiveProfile(entry, fixtures, season);
  }

  private async resolvePlayerId(params: {
    name: string;
    club?: string;
    legacyId?: string;
    apiSportsId?: number;
  }): Promise<number | null> {
    if (params.apiSportsId && params.apiSportsId > 0) return params.apiSportsId;
    const legacy = params.legacyId?.match(/apisports-player-(\d+)/i);
    if (legacy) return Number(legacy[1]);

    const needle = this.norm(params.name);
    const clubNeedle = params.club ? this.norm(params.club) : '';

    for (const leagueId of DEFAULT_SEARCH_LEAGUE_IDS.slice(0, 6)) {
      try {
        const term = params.name.split(' ').pop() ?? params.name;
        const found = await this.api.searchPlayersInLeague(term, leagueId);
        const hit = found.find((e) => {
          const n = this.norm(this.displayName(e));
          if (!n.includes(needle) && !needle.includes(n)) return false;
          if (!clubNeedle) return true;
          return e.statistics.some((s) => this.norm(s.team.name).includes(clubNeedle));
        });
        if (hit) return hit.player.id;
      } catch {
        // next league
      }
    }
    return null;
  }

  private buildLiveProfile(entry: ApiPlayerEntry, fixtures: ApiFixturePlayerEntry[], season: number) {
    const stat = this.pickBestStatistics(entry);
    if (!stat?.team?.name) return null;

    const name = this.displayName(entry);
    const position = this.positionFr(stat.games?.position);
    const apps = stat.games?.appearences ?? 0;
    const goals = stat.goals?.total ?? 0;
    const assists = stat.goals?.assists ?? 0;
    const rating = this.parseRating(stat.games?.rating);
    const score = this.apiRatingToScore(rating, goals, apps);
    const potential = Math.min(95, score + (entry.player.age != null && entry.player.age <= 23 ? 4 : 2));
    const valueMK = this.estimateMarketValueMK(score, goals, entry.player.age ?? 24, apps);
    const attrs = this.deriveAttributes(rating, stat, score);
    const seasonLabel = `${season}-${season + 1}`;

    const matchHistory = fixtures
      .map((f) => this.mapFixtureToMatch(f, stat.team.id))
      .filter((m): m is NonNullable<typeof m> => m != null)
      .slice(0, 12);

    return {
      apiSportsId: entry.player.id,
      name,
      age: entry.player.age ?? 22,
      club: stat.team.name,
      league: stat.league?.name ?? '—',
      position,
      goals,
      assists,
      matches: apps,
      potential,
      currentRating: score,
      aiScore: score,
      marketValue: this.formatMarketValue(valueMK),
      valueMK,
      height: entry.player.height ? parseInt(entry.player.height, 10) || 178 : 178,
      weight: entry.player.weight ? parseInt(entry.player.weight, 10) || 74 : 74,
      speed: attrs.speed,
      dribble: attrs.dribble,
      passing: attrs.passing,
      defense: attrs.defense,
      physical: attrs.physical,
      mental: attrs.mental,
      photoUrl: entry.player.photo ?? undefined,
      season: seasonLabel,
      matchHistory,
      heatmapZones: this.buildHeatmapZones(position, goals, assists),
      monthlyPotential: this.buildMonthlyPotential(potential, matchHistory),
      videos: this.buildVideos(name, stat.team.name, goals, seasonLabel),
      reels: this.buildAiReels(name, stat.team.name, position, goals, assists),
    };
  }

  private buildFlashscoreLiveProfile(params: {
    name: string;
    club?: string;
    legacyId?: string;
    apiSportsId?: number;
  }) {
    const pool = getFlashscoreSearchPool();
    const needle = this.norm(params.name);
    const clubNeedle = params.club ? this.norm(params.club) : '';
    const legacyApiId = params.legacyId?.match(/apisports-player-(\d+)/i)?.[1];
    const explicitApiId = params.apiSportsId ?? (legacyApiId ? Number(legacyApiId) : undefined);

    const hit =
      pool.find((p) => this.norm(p.name) === needle && (!clubNeedle || this.norm(p.club).includes(clubNeedle))) ??
      pool.find((p) => this.norm(p.name).includes(needle) || needle.includes(this.norm(p.name))) ??
      null;

    if (!hit) return null;

    const stats = this.estimateFlashscoreStats(hit);
    const position = normalizeSearchPosition(hit.position);
    const matchHistory = this.buildEstimatedMatchHistory(hit, stats);

    return {
      apiSportsId: explicitApiId ?? 0,
      name: hit.name,
      age: hit.age,
      club: hit.club,
      league: hit.league,
      position,
      goals: stats.goals,
      assists: stats.assists,
      matches: stats.matches,
      potential: hit.potential,
      currentRating: hit.currentRating,
      aiScore: hit.currentRating,
      marketValue: hit.marketValue.replace(/\s*€/, '€'),
      valueMK: hit.valueMK,
      height: 178,
      weight: 72,
      speed: stats.speed,
      dribble: stats.dribble,
      passing: stats.passing,
      defense: stats.defense,
      physical: stats.physical,
      mental: stats.mental,
      photoUrl: resolvePlayerPhoto(hit.name) ?? undefined,
      season: SCOUT_SEASON,
      source: 'flashscore' as const,
      matchHistory,
      heatmapZones: this.buildHeatmapZones(position, stats.goals, stats.assists),
      monthlyPotential: this.buildMonthlyPotential(hit.potential, matchHistory),
      videos: this.buildVideos(hit.name, hit.club, stats.goals, SCOUT_SEASON),
      reels: this.buildAiReels(hit.name, hit.club, position, stats.goals, stats.assists),
    };
  }

  private estimateFlashscoreStats(p: FlashscoreSearchPlayer) {
    const pos = normalizeSearchPosition(p.position);
    const quality = Math.max(0, p.currentRating - 70);
    const isStriker = pos === 'BU';
    const isWinger = pos === 'Ailier G' || pos === 'Ailier D' || p.position === 'AG' || p.position === 'AD';
    const isMid = pos === 'MC';
    const matches = Math.min(52, Math.max(18, 22 + quality + (p.age <= 24 ? 3 : 0)));
    const goals = isStriker
      ? Math.max(8, Math.round(quality * 1.15))
      : isWinger
        ? Math.max(4, Math.round(quality * 0.65))
        : isMid
          ? Math.max(1, Math.round(quality * 0.25))
          : Math.max(0, Math.round(quality * 0.08));
    const assists = isStriker
      ? Math.max(2, Math.round(quality * 0.35))
      : isWinger
        ? Math.max(5, Math.round(quality * 0.55))
        : isMid
          ? Math.max(4, Math.round(quality * 0.45))
          : Math.max(0, Math.round(quality * 0.12));
    return {
      matches,
      goals,
      assists,
      speed: Math.min(95, p.currentRating + (isWinger || isStriker ? 5 : 0)),
      dribble: Math.min(95, p.currentRating + (isWinger ? 6 : isStriker ? 3 : 0)),
      passing: Math.min(95, p.currentRating + (isMid ? 5 : 0)),
      defense: pos === 'DC' || pos === 'GK' ? Math.min(92, p.currentRating + 2) : Math.max(42, p.currentRating - 24),
      physical: Math.min(92, p.currentRating),
      mental: Math.min(95, p.potential),
    };
  }

  private buildEstimatedMatchHistory(
    p: FlashscoreSearchPlayer,
    stats: { goals: number; assists: number; matches: number },
  ) {
    const opponents = ['Top 4', 'Derby', 'Europe', 'Championnat', 'Coupe', 'Extérieur'];
    const rows = Math.min(8, Math.max(5, Math.round(stats.matches / 5)));
    return Array.from({ length: rows }, (_, i) => {
      const rating = Math.min(9.4, Math.max(6.4, p.currentRating / 10 + ((i % 3) - 1) * 0.2));
      return {
        match: `${i % 2 === 0 ? 'vs' : '@'} ${opponents[i % opponents.length]}`,
        date: `${String(8 + i * 3).padStart(2, '0')}/0${(i % 6) + 1}`,
        rating: Math.round(rating * 10) / 10,
        goals: i < stats.goals % rows ? 1 : 0,
        assists: i < stats.assists % rows ? 1 : 0,
        minutes: 72 + (i % 3) * 9,
      };
    });
  }

  private async fetchPlayersForFilters(filters: ScoutSearchFilters) {
    const season = this.api.getActiveSeason();
    const entries: ApiPlayerEntry[] = [];
    const leagueIds = this.leagueIdsForFilters(filters).slice(0, 4);
    const useTopScorers =
      !filters.query?.trim() &&
      (!filters.position || filters.position === 'Tous' || filters.position === 'BU');

    if (filters.query?.trim()) {
      const q = filters.query.trim();
      for (const leagueId of leagueIds) {
        try {
          entries.push(...(await this.api.searchPlayersInLeague(q, leagueId, season)));
          if (entries.length > 0) break;
        } catch (err) {
          if (isApiFootballQuotaError(err)) throw err;
        }
      }
    } else if (useTopScorers) {
      for (const leagueId of leagueIds) {
        try {
          entries.push(...(await this.api.fetchTopScorers(leagueId, season)));
        } catch (err) {
          if (isApiFootballQuotaError(err)) throw err;
          try {
            entries.push(...(await this.api.fetchLeaguePlayers(leagueId, 1, season)));
          } catch (inner) {
            if (isApiFootballQuotaError(inner)) throw inner;
          }
        }
      }
    } else {
      for (const leagueId of leagueIds) {
        try {
          entries.push(...(await this.api.fetchLeaguePlayers(leagueId, 1, season)));
        } catch (err) {
          if (isApiFootballQuotaError(err)) throw err;
        }
      }
    }

    const seen = new Set<number>();
    const players: NonNullable<ReturnType<ScoutFootballService['mapApiPlayer']>>[] = [];

    for (const entry of entries) {
      const mapped = this.mapApiPlayer(entry, season);
      if (!mapped) continue;
      if (!this.matchesPositionFilter(mapped.position, filters.position)) continue;
      if (seen.has(entry.player.id)) continue;
      seen.add(entry.player.id);
      players.push(mapped);
    }

    return players
      .filter((p) => this.applyApiFilters([p], filters).length > 0)
      .sort((a, b) => b.aiScore - a.aiScore || b.goals - a.goals);
  }

  private mapApiPlayer(entry: ApiPlayerEntry, season: number) {
    const stat = this.pickBestStatistics(entry);
    if (!stat?.team?.name) return null;

    const name = this.displayName(entry);
    if (!name || /\d{2,}$/.test(name)) return null;

    const position = this.positionFr(stat.games?.position);
    const age = entry.player.age ?? 22;
    const apps = stat.games?.appearences ?? 0;
    const goals = stat.goals?.total ?? 0;
    const assists = stat.goals?.assists ?? 0;
    const rating = this.parseRating(stat.games?.rating);
    const score = this.apiRatingToScore(rating, goals, apps);
    const potential = Math.min(95, score + (age <= 23 ? 4 : age <= 26 ? 2 : 0));
    const valueMK = this.estimateMarketValueMK(score, goals, age, apps);
    const attrs = this.deriveAttributes(rating, stat, score);
    const nationality = this.uiNationality(entry.player.nationality ?? stat.league?.country);

    return {
      id: `apisports-player-${entry.player.id}`,
      apiSportsId: entry.player.id,
      name,
      age,
      nationality,
      flag: this.flagFor(nationality),
      club: stat.team.name,
      league: stat.league?.name ?? '—',
      position,
      potential,
      currentRating: score,
      marketValue: this.formatMarketValue(valueMK),
      valueMK,
      priority: score >= 85 ? 'A' : score >= 78 ? 'B' : 'C',
      status: 'new',
      aiScore: score,
      injuryRisk: 12 + (age > 30 ? 15 : age > 28 ? 10 : 0),
      foot: 'Droit',
      height: entry.player.height ? parseInt(entry.player.height, 10) || 178 : 178,
      weight: entry.player.weight ? parseInt(entry.player.weight, 10) || 74 : 74,
      goals,
      assists,
      matches: apps,
      speed: attrs.speed,
      dribble: attrs.dribble,
      passing: attrs.passing,
      defense: attrs.defense,
      physical: attrs.physical,
      mental: attrs.mental,
      contractEnd: '—',
      addedDate: new Date().toISOString().slice(0, 10),
      notes: [],
      inDatabase: false,
      source: 'apisports' as const,
      photoUrl: entry.player.photo ?? undefined,
      season: `${season}-${season + 1}`,
    };
  }

  private pickBestStatistics(entry: ApiPlayerEntry): ApiPlayerStatistics | null {
    const stats = (entry.statistics ?? []).filter((s) => {
      const apps = s.games?.appearences ?? 0;
      return apps > 0 || this.parseRating(s.games?.rating) != null;
    });
    if (stats.length === 0) return null;
    if (stats.length === 1) return stats[0]!;

    let best: ApiPlayerStatistics | null = null;
    let bestScore = -1;

    for (const stat of stats) {
      const apps = stat.games?.appearences ?? 0;
      const minutes = stat.games?.minutes ?? 0;
      const rating = this.parseRating(stat.games?.rating) ?? 0;
      const leagueId = stat.league?.id ?? 0;
      const goals = stat.goals?.total ?? 0;
      let score = apps * 100 + minutes + goals * 50 + rating * 20;
      if (TOP_LEAGUE_IDS.has(leagueId)) score += 50_000;
      else if (DOMESTIC_LEAGUE_IDS.has(leagueId)) score += 20_000;
      if (apps === 0 && minutes === 0) score -= 10_000;
      if (score > bestScore) {
        bestScore = score;
        best = stat;
      }
    }
    return best ?? stats[0]!;
  }

  private leagueIdsForFilters(filters: ScoutSearchFilters) {
    const countryLeagues = leaguesByCountryName(filters.country ?? '');
    if (countryLeagues.length > 0) return countryLeagues.map((l) => l.id);
    return DEFAULT_SEARCH_LEAGUE_IDS;
  }

  private applyDbFilters(
    prospects: Awaited<ReturnType<ScoutService['listProspects']>>,
    filters: ScoutSearchFilters,
  ) {
    return this.applyApiFilters(prospects, filters);
  }

  private applyApiFilters<T extends { name: string; club: string; position: string; nationality: string; age: number; potential: number; valueMK: number }>(
    prospects: T[],
    filters: ScoutSearchFilters,
  ): T[] {
    const q = filters.query?.trim().toLowerCase();
    return prospects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.club.toLowerCase().includes(q)) return false;
      if (filters.position && filters.position !== 'Tous' && p.position !== filters.position) return false;
      if (filters.country && filters.country !== 'Tous' && p.nationality !== filters.country) return false;
      if (!this.matchesAge(p.age, filters.ageRange)) return false;
      if (!this.matchesPot(p.potential, filters.potRange)) return false;
      if (!this.matchesBudget(p.valueMK, filters.budgetRange)) return false;
      return true;
    });
  }

  private matchesPositionFilter(mapped: string, filter?: string) {
    if (!filter || filter === 'Tous') return true;
    if (filter === 'BU') return mapped === 'BU';
    if (filter === 'Ailier G' || filter === 'Ailier D') return mapped === 'BU';
    if (filter === 'DG' || filter === 'DD') return mapped === 'DC';
    return mapped === filter;
  }

  private matchesAge(age: number, range?: string) {
    if (!range || range === 'Tous') return true;
    if (range === '≤18') return age <= 18;
    if (range === '19-21') return age >= 19 && age <= 21;
    if (range === '22-25') return age >= 22 && age <= 25;
    if (range === '>25') return age > 25;
    return true;
  }

  private matchesPot(pot: number, range?: string) {
    if (!range || range === 'Tous') return true;
    if (range === '≥85') return pot >= 85;
    if (range === '78-84') return pot >= 78 && pot <= 84;
    if (range === '<78') return pot < 78;
    return true;
  }

  private matchesBudget(mk: number, range?: string) {
    if (!range || range === 'Tous') return true;
    if (range === '<500K €') return mk < 500;
    if (range === '500K-1M €') return mk >= 500 && mk <= 1000;
    if (range === '1M-2M €') return mk > 1000 && mk <= 2000;
    if (range === '>2M €') return mk > 2000;
    return true;
  }

  private parseRating(raw: string | number | null | undefined): number | null {
    if (raw == null) return null;
    const n = typeof raw === 'number' ? raw : parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  }

  private apiRatingToScore(rating: number | null, goals: number, apps: number): number {
    if (rating != null && rating > 0) return Math.min(95, Math.max(55, Math.round(42 + rating * 7)));
    if (apps >= 20 && goals >= 15) return 86;
    if (apps >= 15 && goals >= 8) return 80;
    if (apps >= 10) return 72;
    return 65;
  }

  private deriveAttributes(rating: number | null, stat: ApiPlayerStatistics, baseScore: number) {
    const pct = (a?: number | null, b?: number | null) => {
      if (!a || !b || b <= 0) return null;
      return Math.round((a / b) * 100);
    };
    const goals = stat.goals?.total ?? 0;
    const tackles = (stat.tackles?.total ?? 0) + (stat.tackles?.interceptions ?? 0);
    return {
      speed: Math.min(95, baseScore + (goals >= 10 ? 4 : 0)),
      dribble: pct(stat.dribbles?.success, stat.dribbles?.attempts) ?? Math.min(95, baseScore + 2),
      passing: stat.passes?.accuracy ?? Math.min(95, baseScore),
      defense: Math.min(92, 55 + tackles * 2),
      physical: pct(stat.duels?.won, stat.duels?.total) ?? Math.min(92, baseScore - 2),
      mental: Math.min(95, rating != null ? Math.round(50 + rating * 6) : baseScore),
    };
  }

  private estimateMarketValueMK(score: number, goals: number, age: number, apps: number) {
    let mk = 300 + apps * 15 + goals * 120;
    if (score >= 94 && goals >= 20) mk = Math.max(mk, age <= 26 ? 180_000 : 120_000);
    else if (score >= 90) mk = Math.max(mk, age <= 26 ? 18_000 : 12_000);
    else if (score >= 85) mk = Math.max(mk, age <= 27 ? 8_000 : 5_000);
    else if (score >= 80) mk = Math.max(mk, 2_500);
    else if (score >= 75) mk = Math.max(mk, 1_200);
    return Math.min(200_000, Math.round(mk));
  }

  private formatMarketValue(mk: number) {
    if (mk >= 1000) return `${Math.round(mk / 100) / 10}M€`;
    return `${mk}K€`;
  }

  private displayName(entry: ApiPlayerEntry) {
    const p = entry.player;
    if (p.name?.trim()) return p.name.trim();
    return [p.firstname, p.lastname].filter(Boolean).join(' ').trim() || '—';
  }

  private norm(value: string) {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  private uiNationality(apiNat: string | null | undefined) {
    const map: Record<string, string> = {
      Tunisia: 'Tunisie', Algeria: 'Algérie', Morocco: 'Maroc',
      'Ivory Coast': "Côte d'Ivoire", Senegal: 'Sénégal',
    };
    if (!apiNat) return '—';
    return map[apiNat] ?? apiNat;
  }

  private flagFor(country: string) {
    const flags: Record<string, string> = {
      France: '🇫🇷', Tunisie: '🇹🇳', Algérie: '🇩🇿', Maroc: '🇲🇦',
      Angleterre: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Espagne: '🇪🇸', Italie: '🇮🇹', Allemagne: '🇩🇪',
    };
    return flags[country] ?? '⚽';
  }

  private mapFixtureToMatch(entry: ApiFixturePlayerEntry, playerTeamId?: number) {
    const stat = entry.statistics?.[0];
    if (!stat || (stat.games?.minutes ?? 0) <= 0) return null;
    const rating = this.parseRating(stat.games?.rating) ?? 6.5;
    const home = entry.fixture?.teams?.home?.name ?? '—';
    const away = entry.fixture?.teams?.away?.name ?? '—';
    const isHome = stat.team?.name === home || stat.team?.id === playerTeamId;
    const opponent = isHome ? away : home;
    const dateRaw = entry.fixture?.date ?? '';
    const date = dateRaw
      ? new Date(dateRaw).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      : '—';
    return {
      match: `${isHome ? 'vs' : '@'} ${opponent}`,
      date,
      rating: Math.round(rating * 10) / 10,
      goals: stat.goals?.total ?? 0,
      assists: stat.goals?.assists ?? 0,
      minutes: stat.games?.minutes ?? 0,
    };
  }

  private buildHeatmapZones(position: string, goals: number, assists: number) {
    const attackBoost = Math.min(15, goals);
    const wideBoost = Math.min(10, assists);
    if (position === 'BU') {
      return [
        { zone: 'Axe central att.', intensity: Math.min(98, 88 + attackBoost) },
        { zone: 'Attaque gauche', intensity: Math.min(90, 70 + wideBoost) },
        { zone: 'Attaque droite', intensity: Math.min(90, 70 + wideBoost) },
        { zone: 'Milieu offensif', intensity: 62 },
        { zone: 'Milieu central', intensity: 28 },
        { zone: 'Défense', intensity: 10 },
      ];
    }
    if (position === 'MC') {
      return [
        { zone: 'Milieu central', intensity: 90 },
        { zone: 'Milieu offensif', intensity: 72 },
        { zone: 'Axe central att.', intensity: 48 },
        { zone: 'Attaque gauche', intensity: 40 },
        { zone: 'Attaque droite', intensity: 40 },
        { zone: 'Défense', intensity: 35 },
      ];
    }
    return [
      { zone: 'Défense', intensity: 92 },
      { zone: 'Milieu central', intensity: 45 },
      { zone: 'Milieu offensif', intensity: 18 },
      { zone: 'Axe central att.', intensity: 12 },
      { zone: 'Attaque gauche', intensity: 8 },
      { zone: 'Attaque droite', intensity: 8 },
    ];
  }

  private buildMonthlyPotential(current: number, matchHistory: { rating: number }[]) {
    const ratings = matchHistory.slice(0, 6).reverse().map((m) => Math.min(95, Math.round(40 + m.rating * 7)));
    if (ratings.length >= 6) return ratings;
    const start = Math.max(60, current - 8);
    const step = (current - start) / 5;
    return Array.from({ length: 6 }, (_, i) => Math.round(start + step * i));
  }

  private buildVideos(name: string, club: string, goals: number, season: string) {
    return [
      { title: `Buts & actions — ${name} (${club})`, duration: '3:10', type: 'Highlights', icon: '⚽' },
      { title: `Technique & dribbles — ${name}`, duration: '2:18', type: 'Technique', icon: '🎯' },
      { title: `Saison ${season} — ${goals} buts · ${club}`, duration: '4:42', type: 'Saison', icon: '📊' },
    ];
  }

  private buildAiReels(
    name: string,
    club: string,
    position: string,
    goals: number,
    assists: number,
  ) {
    const sn = name.trim().split(/\s+/).pop() ?? name;
    const isStriker = position === 'BU';
    const isWinger = position === 'Ailier G' || position === 'Ailier D' || position === 'AG' || position === 'AD';
    const isMid = position === 'MC' || position === 'MOC' || position === 'MDC';
    const yt = (q: string) =>
      `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIYAQ%253D%253D`;

    type ReelSeed = {
      title: string;
      caption: string;
      duration: string;
      views: string;
      tag: string;
      accent: string;
    };

    const ideas: ReelSeed[] = [];
    if (goals >= 5) {
      ideas.push({
        title: `${sn} — ${goals} buts`,
        caption: `Compilation buts · ${club}`,
        duration: '0:58',
        views: `${(1.1 + goals * 0.08).toFixed(1)}M`,
        tag: 'Buts',
        accent: '#22C55E',
      });
    }
    ideas.push({
      title: isStriker ? `${sn} — finition clinique` : `${sn} — meilleures actions`,
      caption: isStriker ? 'Tirs, appels, finitions' : 'Actions décisives',
      duration: '0:42',
      views: '890K',
      tag: 'Highlights',
      accent: '#FF7A00',
    });
    if (isWinger || isStriker) {
      ideas.push({
        title: `${sn} — vitesse & dribbles`,
        caption: 'Accélérations en contre',
        duration: '0:36',
        views: '1.4M',
        tag: 'Vitesse',
        accent: '#3B82F6',
      });
    }
    if (assists >= 3 || isMid) {
      ideas.push({
        title: `${sn} — passes décisives`,
        caption: `${assists} assists · vision de jeu`,
        duration: '0:48',
        views: '620K',
        tag: 'Passes',
        accent: '#8B5CF6',
      });
    }
    ideas.push({
      title: `${sn} vs top clubs`,
      caption: `Performances ${club}`,
      duration: '0:52',
      views: '2.1M',
      tag: 'Matchs',
      accent: '#F59E0B',
    });
    ideas.push({
      title: `Skills ${sn}`,
      caption: 'Contrôle, feintes, technique',
      duration: '0:33',
      views: '1.8M',
      tag: 'Skills',
      accent: '#EC4899',
    });

    return ideas.slice(0, 6).map((reel, i) => {
      const query = `${name} ${club} ${reel.tag} football highlights shorts`;
      return {
        ...reel,
        id: `reel-${i}`,
        query,
        searchUrl: yt(query),
      };
    });
  }
}
