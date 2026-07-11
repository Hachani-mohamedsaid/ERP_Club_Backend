/** Club canonique saison 2026-2027 — dédoublonnage recherche / pool. */

export function normPlayerName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function normClubName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Joueur → club officiel Flashscore 2026-2027 */
export const PRIMARY_CLUB_2026: Record<string, string> = {
  'kylian mbappe': 'real madrid',
  'jude bellingham': 'real madrid',
  'vinicius jr': 'real madrid',
  'vinicius junior': 'real madrid',
  'federico valverde': 'real madrid',
  'thibaut courtois': 'real madrid',
  'rodrygo': 'real madrid',
  'erling haaland': 'manchester city',
  'phil foden': 'manchester city',
  'rodri': 'manchester city',
  'kevin de bruyne': 'manchester city',
  'ruben dias': 'manchester city',
  'pedri': 'barcelona',
  'lamine yamal': 'barcelona',
  'gavi': 'barcelona',
  'robert lewandowski': 'barcelona',
  'raphinha': 'barcelona',
  'julian alvarez': 'atletico madrid',
  'antoine griezmann': 'atletico madrid',
  'jan oblak': 'atletico madrid',
  'harry kane': 'bayern munich',
  'jamal musiala': 'bayern munich',
  'mohamed salah': 'liverpool',
  'virgil van dijk': 'liverpool',
  'bukayo saka': 'arsenal',
  'declan rice': 'arsenal',
  'cole palmer': 'chelsea',
  'ousmane dembele': 'paris sg',
  'vitinha': 'paris sg',
  'florian wirtz': 'bayer leverkusen',
  'khvicha kvaratskhelia': 'paris sg',
};

export function clubMatchesPrimary(playerName: string, club: string): boolean {
  const primary = PRIMARY_CLUB_2026[normPlayerName(playerName)];
  if (!primary) return false;
  const c = normClubName(club);
  return c === primary || c.includes(primary) || primary.includes(c);
}

export function pickBetterClubEntry<
  T extends { name: string; club: string; potential: number; inDatabase?: boolean },
>(a: T, b: T): T {
  if (a.inDatabase && !b.inDatabase) return a;
  if (b.inDatabase && !a.inDatabase) return b;

  const aMatch = clubMatchesPrimary(a.name, a.club);
  const bMatch = clubMatchesPrimary(b.name, b.club);
  if (aMatch && !bMatch) return a;
  if (bMatch && !aMatch) return b;

  return a.potential >= b.potential ? a : b;
}

export function dedupePlayersByName<
  T extends { name: string; club: string; potential: number; inDatabase?: boolean },
>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = normPlayerName(item.name);
    const prev = map.get(key);
    map.set(key, prev ? pickBetterClubEntry(prev, item) : item);
  }
  return Array.from(map.values());
}
