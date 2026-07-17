import { Injectable } from '@nestjs/common';
import {
  ApiFootballQuotaError,
  isApiFootballQuotaError,
} from './api-football-quota';

const BASE = 'https://v3.football.api-sports.io';
const TTL_MS = 1000 * 60 * 60 * 6;
const REQUEST_GAP_MS = 350;

type CacheEntry<T> = { data: T; expires: number };

export interface ApiTeam {
  team: { id: number; name: string; code: string | null; country: string; logo: string };
  venue: { city: string | null; name: string | null };
}

export interface ApiSquadPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string | null;
}

export interface ApiPlayerStatistics {
  team: { id: number; name: string; logo: string };
  league: { id: number; name: string; country: string; season?: number };
  games: {
    position: string | null;
    appearences: number | null;
    minutes: number | null;
    rating: string | number | null;
  };
  goals: { total: number | null; assists: number | null };
  passes?: { accuracy: number | null; key: number | null };
  dribbles?: { success: number | null; attempts: number | null };
  tackles?: { total: number | null; interceptions: number | null };
  duels?: { total: number | null; won: number | null };
}

export interface ApiPlayerEntry {
  player: {
    id: number;
    name: string;
    firstname: string | null;
    lastname: string | null;
    age: number | null;
    nationality: string | null;
    photo: string | null;
    height: string | null;
    weight: string | null;
  };
  statistics: ApiPlayerStatistics[];
}

export interface ApiFixturePlayerEntry {
  player: { id: number; name: string };
  statistics: {
    games: { minutes: number | null; rating: string | number | null; position: string | null };
    goals: { total: number | null; assists: number | null };
    team: { id: number; name: string };
  }[];
  fixture: {
    id: number;
    date: string;
    teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  };
}

export interface ApiTransfer {
  player: { id: number; name: string };
  transfers: {
    date: string;
    type: string;
    teams: {
      in: { id: number; name: string; logo: string };
      out: { id: number; name: string; logo: string };
    };
  }[];
}

@Injectable()
export class ApiFootballService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private lastRequestAt = 0;
  private resolvedSeason = 2024;
  private quotaBlockedUntil = 0;

  hasKey(): boolean {
    const key = this.getKey();
    return key.length > 10;
  }

  isAvailable(): boolean {
    return this.hasKey() && Date.now() >= this.quotaBlockedUntil;
  }

  private markQuotaBlocked(durationMs = 60 * 60 * 1000) {
    this.quotaBlockedUntil = Date.now() + durationMs;
  }

  getActiveSeason(): number {
    return this.resolvedSeason;
  }

  bustCache(prefix?: string) {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const k of this.cache.keys()) {
      if (k.includes(prefix)) this.cache.delete(k);
    }
  }

  private getKey() {
    return process.env.API_FOOTBALL_KEY ?? process.env.VITE_API_FOOTBALL_KEY ?? '';
  }

  private async throttle() {
    const wait = REQUEST_GAP_MS - (Date.now() - this.lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastRequestAt = Date.now();
  }

  private async fetchJson<T>(url: string): Promise<{ ok: boolean; json: T }> {
    const key = this.getKey();
    for (let attempt = 0; attempt < 4; attempt++) {
      await this.throttle();
      const res = await fetch(url, { headers: { 'x-apisports-key': key } });
      const json = (await res.json()) as T;
      if (res.status === 429 && attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      return { ok: res.ok, status: res.status, json } as { ok: boolean; json: T };
    }
    return { ok: false, json: {} as T };
  }

  private async fetchApi<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const key = this.getKey();
    if (!key) throw new Error('API_FOOTBALL_KEY manquante');

    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    const url = `${BASE}${path}${qs ? `?${qs}` : ''}`;

    const hit = this.cache.get(url) as CacheEntry<T> | undefined;
    if (hit && hit.expires > Date.now()) return hit.data;

    const { ok, json } = await this.fetchJson<{ response: T; errors?: Record<string, string> }>(url);
    if (!ok || (json.errors && Object.keys(json.errors).length > 0)) {
      const errMsg = `API-Football: ${JSON.stringify(json.errors ?? { status: 'error' })}`;
      if (isApiFootballQuotaError(errMsg)) {
        this.markQuotaBlocked();
        throw new ApiFootballQuotaError(errMsg);
      }
      throw new Error(errMsg);
    }

    this.cache.set(url, { data: json.response, expires: Date.now() + TTL_MS });
    return json.response;
  }

  fetchTeams(leagueId: number, season = this.resolvedSeason) {
    return this.fetchApi<ApiTeam[]>('/teams', { league: leagueId, season });
  }

  fetchSquad(teamId: number) {
    return this.fetchApi<{ team: { id: number; name: string; logo: string }; players: ApiSquadPlayer[] }[]>(
      '/players/squads',
      { team: teamId },
    );
  }

  fetchTransfers(teamId: number) {
    return this.fetchApi<ApiTransfer[]>('/transfers', { team: teamId });
  }

  searchPlayersInLeague(query: string, leagueId: number, season = this.resolvedSeason) {
    return this.fetchApi<ApiPlayerEntry[]>('/players', { search: query, league: leagueId, season });
  }

  fetchLeaguePlayers(leagueId: number, page = 1, season = this.resolvedSeason) {
    return this.fetchApi<ApiPlayerEntry[]>('/players', { league: leagueId, season, page });
  }

  fetchTopScorers(leagueId: number, season = this.resolvedSeason) {
    return this.fetchApi<ApiPlayerEntry[]>('/players/topscorers', { league: leagueId, season });
  }

  fetchPlayerProfile(playerId: number, season = this.resolvedSeason) {
    return this.fetchApi<ApiPlayerEntry[]>('/players', { id: playerId, season });
  }

  fetchPlayerFixtures(playerId: number, season = this.resolvedSeason) {
    return this.fetchApi<ApiFixturePlayerEntry[]>('/fixtures/players', { player: playerId, season });
  }
}
