/**
 * Pool joueurs Flashscore 2026-2027 — alimente Recherche + ODIN AI Scout.
 */

import { LEAGUE_ROSTERS, rosterTeamId } from './league-rosters';
import { resolveFlashscoreSquad } from './flashscore-squads';
import { getCountry } from './scout-geo-catalog';
import { dedupePlayersByName } from './player-primary-club';

export const SCOUT_SEASON = '2026-2027';

export type FlashscoreSearchPlayer = {
  poolId: string;
  name: string;
  club: string;
  league: string;
  countryId: string;
  nationality: string;
  position: string;
  age: number;
  potential: number;
  currentRating: number;
  marketValue: string;
  valueMK: number;
  season: typeof SCOUT_SEASON;
  source: 'flashscore';
};

function parseMarketValueMK(value: string): number {
  const v = value.toLowerCase().replace(/\s/g, '');
  const m = v.match(/([\d,.]+)(m|k)?€?/);
  if (!m) return 500;
  const num = parseFloat(m[1].replace(',', '.'));
  if (Number.isNaN(num)) return 500;
  if (m[2] === 'm') return Math.round(num * 1000);
  if (m[2] === 'k' || v.includes('k')) return Math.round(num);
  return num >= 100 ? Math.round(num) : Math.round(num * 1000);
}

function buildPool(): FlashscoreSearchPlayer[] {
  const out: FlashscoreSearchPlayer[] = [];

  for (const [countryId, roster] of Object.entries(LEAGUE_ROSTERS)) {
    const country = getCountry(countryId);
    const countryName = country?.name ?? countryId;

    for (const team of roster.teams) {
      const teamId = rosterTeamId(countryId, team.name);
      const squad = resolveFlashscoreSquad(
        teamId,
        team.name,
        countryId,
        countryName,
        team.avgPotential ?? 74,
      );

      squad.forEach((p, i) => {
        out.push({
          poolId: `${teamId}-fs-${i}`,
          name: p.name,
          club: team.name,
          league: roster.league,
          countryId,
          nationality: p.nationality,
          position: p.position,
          age: p.age,
          potential: p.potential,
          currentRating: p.currentRating,
          marketValue: p.marketValue,
          valueMK: parseMarketValueMK(p.marketValue),
          season: SCOUT_SEASON,
          source: 'flashscore',
        });
      });
    }
  }

  return dedupePlayersByName(out);
}

let cachedPool: FlashscoreSearchPlayer[] | null = null;

export function invalidateFlashscoreSearchPoolCache() {
  cachedPool = null;
}

export function getFlashscoreSearchPool(): FlashscoreSearchPlayer[] {
  if (!cachedPool) cachedPool = buildPool();
  return cachedPool;
}

export function getFlashscoreSearchPoolStats() {
  const pool = getFlashscoreSearchPool();
  const clubs = new Set(pool.map((p) => p.club));
  return {
    totalPlayers: pool.length,
    clubs: clubs.size,
    season: SCOUT_SEASON,
  };
}

export function normalizeSearchPosition(pos: string): string {
  const map: Record<string, string> = {
    GB: 'GK',
    AG: 'Ailier G',
    AD: 'Ailier D',
    MOC: 'MC',
    MDC: 'MC',
  };
  return map[pos] ?? pos;
}
