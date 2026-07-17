/** Mapping catalog team IDs → API-Sports team IDs */
export const TEAM_API_SPORTS_IDS: Record<string, number> = {
  est: 990, ca: 988, css: 983, st: 991, mon: 992, ari: 21435,
  psg: 85, ol: 80, om: 81, rm: 541, barca: 529, atm: 530,
  benfica: 211, porto: 212, city: 50, arsenal: 42, liverpool: 40,
  manu: 33, chelsea: 49, bayern: 157, dortmund: 165, leverkusen: 168,
  inter: 505, milan: 489, juve: 496, napoli: 492,
  ajax: 194, psv: 197, feyenoord: 198, brugge: 569, anderlecht: 554,
  flamengo: 127, palmeiras: 121, boca: 451, river: 435,
  kab: 918, mc: 906, wyd: 968, raj: 976,
};

export function resolveTeamApiId(teamId: string, teamName?: string): number | null {
  if (teamId.startsWith('apisports-')) {
    const n = Number(teamId.replace('apisports-', ''));
    return Number.isFinite(n) ? n : null;
  }
  const mapped = TEAM_API_SPORTS_IDS[teamId];
  if (mapped) return mapped;
  const numeric = Number(teamId);
  return Number.isFinite(numeric) ? numeric : null;
}
