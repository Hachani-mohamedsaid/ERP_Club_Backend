interface PlayerRow {
  id: string;
  fullName: string;
  position: string;
  ovr: number;
  goals: number;
  status: string;
  radar: unknown;
}

interface CalendarRow {
  eventDate: Date;
  eventType: string;
}

const FORMATION_433 = [
  { slot: 'GB', aliases: ['GB', 'GK'], x: 50, y: 82 },
  { slot: 'DD', aliases: ['DD', 'RB'], x: 88, y: 62 },
  { slot: 'DC', aliases: ['DC', 'CB'], x: 65, y: 68 },
  { slot: 'DC', aliases: ['DC', 'CB'], x: 35, y: 68 },
  { slot: 'DG', aliases: ['DG', 'LB', 'LG'], x: 12, y: 62 },
  { slot: 'MC', aliases: ['MC', 'MDF', 'CM'], x: 75, y: 45 },
  { slot: 'MOC', aliases: ['MOC', 'CAM', 'MO'], x: 50, y: 38 },
  { slot: 'MC', aliases: ['MC', 'MDF', 'CM'], x: 25, y: 45 },
  { slot: 'AD', aliases: ['AD', 'RW'], x: 80, y: 22 },
  { slot: 'BU', aliases: ['BU', 'ST', 'CF', 'ATT', 'FW'], x: 50, y: 12 },
  { slot: 'AG', aliases: ['AG', 'LW'], x: 20, y: 22 },
];

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function normPos(position: string) {
  return position.trim().toUpperCase().replace(/\s+/g, '');
}

function parseRadar(radar: unknown, position: string, ovr: number) {
  const row = radar && typeof radar === 'object' ? (radar as Record<string, number>) : null;
  const pos = normPos(position);
  const isAtk = /BU|ST|AG|AD|ATT|FW|CF/.test(pos);
  const isDef = /DC|DG|DD|GK|GB|DEF|LB|RB|CB/.test(pos);
  const isMid = /MC|MOC|MDF|MID|CM|CAM/.test(pos);

  const shooting = row?.shooting ?? (isAtk ? ovr + 6 : isMid ? ovr - 4 : ovr - 14);
  const defending = row?.defending ?? (isDef ? ovr + 6 : isMid ? ovr - 2 : ovr - 12);
  const physical = row?.physical ?? ovr;
  const passing = row?.passing ?? (isMid ? ovr + 4 : ovr - 3);
  const dribbling = row?.dribbling ?? row?.pace ?? (isAtk ? ovr + 3 : ovr - 6);
  const mental = row?.mental ?? Math.round(ovr * 0.92);

  return {
    shooting: clamp(shooting, 40, 99),
    defending: clamp(defending, 40, 99),
    physical: clamp(physical, 40, 99),
    passing: clamp(passing, 40, 99),
    dribbling: clamp(dribbling, 40, 99),
    mental: clamp(mental, 40, 99),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function shortName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : fullName;
}

function positionMatches(playerPos: string, aliases: string[]) {
  const p = normPos(playerPos);
  return aliases.some((a) => p === a);
}

function buildBestXi(pool: PlayerRow[]) {
  const slots = FORMATION_433.map((s) => ({ ...s, player: null as PlayerRow | null }));
  const sorted = [...pool].sort((a, b) => b.ovr - a.ovr);

  for (const player of sorted) {
    const slotIdx = slots.findIndex(
      (s) => !s.player && positionMatches(player.position, s.aliases),
    );
    if (slotIdx >= 0) slots[slotIdx].player = player;
  }

  return slots.map((s) => ({
    name: s.player ? shortName(s.player.fullName) : '—',
    position: s.slot,
    x: s.x,
    y: s.y,
  }));
}

export function buildClubAnalytics(players: PlayerRow[], events: CalendarRow[]) {
  const available = players.filter((p) => p.status !== 'BLESSE' && p.status !== 'FIN_CONTRAT');
  const pool = available.length > 0 ? available : players;

  const radars = pool.map((p) => parseRadar(p.radar, p.position, p.ovr));

  const teamRadar = [
    { stat: 'Attaque', value: avg(radars.map((r) => r.shooting)) || 0 },
    { stat: 'Défense', value: avg(radars.map((r) => r.defending)) || 0 },
    { stat: 'Physique', value: avg(radars.map((r) => r.physical)) || 0 },
    { stat: 'Technique', value: avg(radars.map((r) => (r.passing + r.dribbling) / 2)) || 0 },
    { stat: 'Mental', value: avg(radars.map((r) => r.mental)) || 0 },
  ];

  const bestXiPlayers = buildBestXi(pool);

  const now = new Date();
  const seasonMonths = MONTHS.slice(0, 6).map((month, idx) => {
    const monthIndex = (now.getMonth() - 5 + idx + 12) % 12;
    const year = now.getMonth() - 5 + idx < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const matches = events.filter((e) => {
      if (String(e.eventType).toUpperCase() !== 'MATCH') return false;
      const d = e.eventDate;
      return d.getMonth() === monthIndex && d.getFullYear() === year;
    });
    const wins = matches.length > 0 ? Math.max(1, Math.round(matches.length * 0.55)) : 0;
    const points = wins * 3;
    return { month, wins, points };
  });

  const topScorers = [...players]
    .filter((p) => (p.goals ?? 0) > 0)
    .sort((a, b) => b.goals - a.goals || b.ovr - a.ovr)
    .slice(0, 3)
    .map((p, i) => ({
      rank: i + 1,
      name: p.fullName,
      goals: p.goals,
      medal: i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉',
    }));

  return {
    formation: '4-3-3',
    teamRadar,
    bestXi: { formation: '4-3-3', players: bestXiPlayers },
    teamEvolution: seasonMonths,
    topScorers,
    playersCount: players.length,
  };
}
