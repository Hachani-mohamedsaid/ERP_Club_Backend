export const ANALYSTE_INFO = {
  name: "Sami Gharbi",
  club: "FC Carthage",
  season: "2026",
};

export type FormationId = "4-3-3" | "4-2-3-1" | "3-5-2" | "5-3-2";

export interface PitchPlayer {
  id: string;
  name: string;
  short: string;
  position: string;
  x: number;
  y: number;
  ovr: number;
  fatigue: number;
  speed?: number;
  xg?: number;
  injuryRisk?: number;
  heatmap?: number[];
}

export interface TacticalMetrics {
  possession: number;
  xG: number;
  pressing: "Faible" | "Moyen" | "Fort";
  fatigueRisk: "Faible" | "Moyen" | "Élevé";
}

export interface TacticalSuggestion {
  id: string;
  action: string;
  impact: string;
  type: "positive" | "warning";
  confidence: number;
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: "tir" | "but" | "faute" | "occasion" | "contre";
  label: string;
  description: string;
  timestamp: number;
}

export interface OpponentIntel {
  name: string;
  leftPct: number;
  centerPct: number;
  rightPct: number;
  advice: string[];
  keyPlayers: { name: string; role: string; threat: number }[];
  weaknesses: string[];
  dangerZones: { zone: string; intensity: number }[];
}

export interface InjuryPrediction {
  id: string;
  name: string;
  prob7: number;
  prob14: number;
  prob30: number;
  factors: { label: string; value: number; color: string }[];
}

export interface EvolutionForecast {
  player: string;
  metric: string;
  current: number;
  forecast30: number;
  forecast90: number;
  history: { month: string; value: number; predicted?: boolean }[];
}

export interface MarketValueEntry {
  player: string;
  current: string;
  m3: string;
  m6: string;
  factors: { label: string; score: number }[];
}

export interface ScoutingCompare {
  internal: { name: string; ovr: number; speed: number; technique: number; physical: number; potential: number };
  external: { name: string; club: string; ovr: number; speed: number; technique: number; physical: number; potential: number };
  similarity: number;
  similarPlayers: { name: string; club: string; match: number }[];
}

export interface DetectedPattern {
  id: string;
  pattern: string;
  confidence: number;
  category: "performance" | "injury" | "tactical";
}

export interface TrainingPlanDay {
  day: string;
  session: string;
  intensity: string;
  type: "cardio" | "repos" | "explosivite" | "force" | "tactique";
}

export interface VideoCoachInsight {
  category: "top" | "error" | "weak" | "strong";
  title: string;
  detail: string;
  timestamp?: string;
}

export interface ExecutiveKpi {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

export interface ExecutiveAIReco {
  type: "sell" | "renew" | "recruit";
  player: string;
  reason: string;
}

export const AI_TACTICAL_CENTER = {
  formation: "4-3-3" as FormationId,
  winProbability: 78,
  weakPoint: "Couloir droit",
  keyPlayer: "Ahmed Ben Salah",
  risk: "Fatigue élevée milieu terrain",
  recommendations: [
    "Renforcer couloir droit avec Ridha Ammar en soutien défensif.",
    "Réduire charge Karim Dridi — risque blessure genou +18%.",
    "Exploiter couloir gauche adversaire (42% des attaques EST).",
  ],
};

export const FORMATION_PRESETS: Record<FormationId, { x: number; y: number }[]> = {
  "4-3-3": [
    { x: 50, y: 92 }, { x: 18, y: 72 }, { x: 38, y: 75 }, { x: 62, y: 75 }, { x: 82, y: 72 },
    { x: 30, y: 52 }, { x: 50, y: 48 }, { x: 70, y: 52 },
    { x: 22, y: 28 }, { x: 50, y: 22 }, { x: 78, y: 28 },
  ],
  "4-2-3-1": [
    { x: 50, y: 92 }, { x: 18, y: 72 }, { x: 38, y: 75 }, { x: 62, y: 75 }, { x: 82, y: 72 },
    { x: 38, y: 55 }, { x: 62, y: 55 },
    { x: 22, y: 38 }, { x: 50, y: 35 }, { x: 78, y: 38 },
    { x: 50, y: 18 },
  ],
  "3-5-2": [
    { x: 50, y: 92 }, { x: 28, y: 74 }, { x: 50, y: 76 }, { x: 72, y: 74 },
    { x: 15, y: 52 }, { x: 32, y: 50 }, { x: 50, y: 48 }, { x: 68, y: 50 }, { x: 85, y: 52 },
    { x: 38, y: 22 }, { x: 62, y: 22 },
  ],
  "5-3-2": [
    { x: 50, y: 92 }, { x: 12, y: 70 }, { x: 30, y: 74 }, { x: 50, y: 76 }, { x: 70, y: 74 }, { x: 88, y: 70 },
    { x: 30, y: 50 }, { x: 50, y: 48 }, { x: 70, y: 50 },
    { x: 38, y: 22 }, { x: 62, y: 22 },
  ],
};

export const DEFAULT_SQUAD: PitchPlayer[] = [
  { id: "gb", name: "Haddad", short: "HAD", position: "GB", x: 50, y: 92, ovr: 82, fatigue: 25, speed: 68, xg: 0.0, injuryRisk: 12 },
  { id: "dd", name: "Ridha Ammar", short: "AMM", position: "DD", x: 18, y: 72, ovr: 79, fatigue: 38, speed: 84, xg: 0.1, injuryRisk: 18 },
  { id: "dc1", name: "Sami Bouazizi", short: "BOU", position: "DC", x: 38, y: 75, ovr: 81, fatigue: 45, speed: 76, xg: 0.1, injuryRisk: 22 },
  { id: "dc2", name: "Karim Dridi", short: "DRI", position: "DC", x: 62, y: 75, ovr: 83, fatigue: 78, speed: 74, xg: 0.1, injuryRisk: 58 },
  { id: "dg", name: "Mohamed Sassi", short: "SAS", position: "DG", x: 82, y: 72, ovr: 80, fatigue: 62, speed: 88, xg: 0.2, injuryRisk: 38 },
  { id: "mc1", name: "Ali Mansouri", short: "MAN", position: "MC", x: 30, y: 52, ovr: 84, fatigue: 20, speed: 85, xg: 0.3, injuryRisk: 12 },
  { id: "mc2", name: "Youssef Trabelsi", short: "TRA", position: "MOC", x: 50, y: 48, ovr: 78, fatigue: 35, speed: 80, xg: 0.4, injuryRisk: 45 },
  { id: "mc3", name: "Wael Lahmar", short: "LAH", position: "MC", x: 70, y: 52, ovr: 79, fatigue: 48, speed: 82, xg: 0.3, injuryRisk: 25 },
  { id: "ag", name: "Hamza Mathlouthi", short: "MAT", position: "AG", x: 22, y: 28, ovr: 81, fatigue: 30, speed: 89, xg: 0.5, injuryRisk: 20 },
  { id: "bu", name: "Ahmed Ben Salah", short: "AHM", position: "BU", x: 50, y: 22, ovr: 88, fatigue: 85, speed: 88, xg: 0.9, injuryRisk: 82 },
  { id: "ad", name: "Mohamed Sassi", short: "SAS2", position: "AD", x: 78, y: 28, ovr: 80, fatigue: 62, speed: 90, xg: 0.6, injuryRisk: 38 },
];

export const BENCH_PLAYERS: PitchPlayer[] = [
  { id: "b1", name: "Oussama Haddadi", short: "HAD2", position: "DG", x: 0, y: 0, ovr: 77, fatigue: 15, speed: 86, xg: 0.1, injuryRisk: 10 },
  { id: "b2", name: "Firas Chaouat", short: "CHA", position: "BU", x: 0, y: 0, ovr: 83, fatigue: 22, speed: 84, xg: 0.7, injuryRisk: 18 },
  { id: "b3", name: "Anis Slimane", short: "SLI", position: "MC", x: 0, y: 0, ovr: 80, fatigue: 18, speed: 83, xg: 0.3, injuryRisk: 14 },
  { id: "b4", name: "Bilel Ifa", short: "IFA", position: "DC", x: 0, y: 0, ovr: 78, fatigue: 28, speed: 72, xg: 0.0, injuryRisk: 30 },
  { id: "b5", name: "Aymen Dahmen", short: "DAH", position: "GB", x: 0, y: 0, ovr: 79, fatigue: 12, speed: 66, xg: 0.0, injuryRisk: 8 },
];

export const TACTICAL_SUGGESTIONS: TacticalSuggestion[] = [
  { id: "s1", action: "Déplacer Ahmed à gauche", impact: "+12% xG", type: "positive", confidence: 92 },
  { id: "s2", action: "Retirer Karim Dridi", impact: "-20% risque blessure", type: "warning", confidence: 87 },
  { id: "s3", action: "Pressing haut sur MC adverse", impact: "+8% possession", type: "positive", confidence: 78 },
];

export const MATCH_EVENTS: MatchEvent[] = [
  { id: "e1", minute: 12, type: "tir", label: "Tir", description: "Ahmed — frappe lointaine, corner", timestamp: 720 },
  { id: "e2", minute: 25, type: "but", label: "But", description: "Ahmed Ben Salah — 1-0", timestamp: 1500 },
  { id: "e3", minute: 42, type: "faute", label: "Faute", description: "Karim Dridi — carton jaune", timestamp: 2520 },
  { id: "e4", minute: 55, type: "occasion", label: "Occasion", description: "Ali Mansouri — passe décisive manquée", timestamp: 3300 },
  { id: "e5", minute: 80, type: "contre", label: "Contre-attaque", description: "Transition rapide — tir bloqué", timestamp: 4800 },
];

export const OPPONENT_INTEL: OpponentIntel = {
  name: "EST",
  leftPct: 42,
  centerPct: 33,
  rightPct: 25,
  advice: ["Renforcer latéral gauche", "Couvrir transitions rapides centre", "Pressing sur meneur de jeu #10"],
  keyPlayers: [
    { name: "Jebali", role: "MOC", threat: 88 },
    { name: "Badri", role: "BU", threat: 82 },
    { name: "Chaalali", role: "MC", threat: 76 },
  ],
  weaknesses: ["Défense centrale lente", "Couloir droit exposé", "Faiblesse sur coups de pied arrêtés"],
  dangerZones: [
    { zone: "Couloir gauche", intensity: 92 },
    { zone: "Zone 14", intensity: 78 },
    { zone: "Surface", intensity: 65 },
    { zone: "Couloir droit", intensity: 45 },
  ],
};

export const INJURY_PREDICTIONS: InjuryPrediction[] = [
  {
    id: "1", name: "Ahmed Ben Salah", prob7: 83, prob14: 71, prob30: 52,
    factors: [
      { label: "Fatigue", value: 85, color: "#EF4444" },
      { label: "Sommeil", value: 62, color: "#F59E0B" },
      { label: "Charge", value: 92, color: "#EF4444" },
      { label: "Historique blessure", value: 78, color: "#F59E0B" },
    ],
  },
  {
    id: "5", name: "Karim Dridi", prob7: 58, prob14: 48, prob30: 35,
    factors: [
      { label: "Fatigue", value: 78, color: "#F59E0B" },
      { label: "Sommeil", value: 71, color: "#F59E0B" },
      { label: "Charge", value: 88, color: "#EF4444" },
      { label: "Historique blessure", value: 55, color: "#22C55E" },
    ],
  },
  {
    id: "2", name: "Ali Mansouri", prob7: 12, prob14: 18, prob30: 22,
    factors: [
      { label: "Fatigue", value: 20, color: "#22C55E" },
      { label: "Sommeil", value: 88, color: "#22C55E" },
      { label: "Charge", value: 68, color: "#22C55E" },
      { label: "Historique blessure", value: 15, color: "#22C55E" },
    ],
  },
];

export const EVOLUTION_FORECASTS: EvolutionForecast[] = [
  {
    player: "Ahmed Ben Salah", metric: "Vitesse", current: 88, forecast30: 91, forecast90: 94,
    history: [
      { month: "Jan", value: 84 }, { month: "Fév", value: 85 }, { month: "Mar", value: 86 },
      { month: "Avr", value: 87 }, { month: "Mai", value: 87 }, { month: "Juin", value: 88 },
      { month: "Juil", value: 91, predicted: true }, { month: "Sep", value: 94, predicted: true },
    ],
  },
  {
    player: "Ali Mansouri", metric: "Endurance", current: 88, forecast30: 90, forecast90: 92,
    history: [
      { month: "Jan", value: 82 }, { month: "Fév", value: 84 }, { month: "Mar", value: 85 },
      { month: "Avr", value: 86 }, { month: "Mai", value: 87 }, { month: "Juin", value: 88 },
      { month: "Juil", value: 90, predicted: true }, { month: "Sep", value: 92, predicted: true },
    ],
  },
];

export const MARKET_VALUES: MarketValueEntry[] = [
  {
    player: "Ahmed Ben Salah", current: "2.3M€", m3: "2.8M€", m6: "3.5M€",
    factors: [
      { label: "Performance", score: 92 }, { label: "Âge", score: 85 },
      { label: "Minutes", score: 78 }, { label: "Buts", score: 88 }, { label: "Passes D.", score: 72 },
    ],
  },
  {
    player: "Ali Mansouri", current: "1.8M€", m3: "2.1M€", m6: "2.4M€",
    factors: [
      { label: "Performance", score: 84 }, { label: "Âge", score: 80 },
      { label: "Minutes", score: 82 }, { label: "Buts", score: 65 }, { label: "Passes D.", score: 91 },
    ],
  },
];

export const SCOUTING_COMPARE: ScoutingCompare = {
  internal: { name: "Ahmed Ben Salah", ovr: 88, speed: 88, technique: 85, physical: 82, potential: 90 },
  external: { name: "Youssef Msakni", club: "Al Arabi", ovr: 86, speed: 86, technique: 88, physical: 78, potential: 87 },
  similarity: 89,
  similarPlayers: [
    { name: "Youssef Msakni", club: "Al Arabi", match: 89 },
    { name: "Hamza Lahmar", club: "CSS", match: 82 },
    { name: "Wahbi Khazri", club: "Montpellier", match: 78 },
    { name: "Seifeddine Jaziri", club: "Zamalek", match: 75 },
    { name: "Anis Ben Slimane", club: "Sheffield Utd", match: 72 },
    { name: "Hamdi Harbaoui", club: "Al Ettifaq", match: 68 },
    { name: "Taha Yassine Khenissi", club: "Espérance", match: 65 },
    { name: "Ayman Dahmen", club: "Monastir", match: 62 },
    { name: "Mohamed Ali Moncer", club: "Sfax", match: 58 },
    { name: "Nader Ghandri", club: "CA Bizertin", match: 55 },
  ],
};

export const DETECTED_PATTERNS: DetectedPattern[] = [
  { id: "p1", pattern: "Les performances chutent après 75 minutes.", confidence: 94, category: "performance" },
  { id: "p2", pattern: "Les blessures augmentent après 3 matchs consécutifs.", confidence: 87, category: "injury" },
  { id: "p3", pattern: "Le pressing diminue de 22% en deuxième mi-temps.", confidence: 91, category: "tactical" },
  { id: "p4", pattern: "xG +0.4 quand Ahmed démarre à gauche.", confidence: 82, category: "tactical" },
  { id: "p5", pattern: "Récupération -15% après séances haute intensité consécutives.", confidence: 79, category: "injury" },
];

export const DEFAULT_TRAINING_PLAN: TrainingPlanDay[] = [
  { day: "Lundi", session: "Cardio", intensity: "Moyenne", type: "cardio" },
  { day: "Mardi", session: "Repos", intensity: "Basse", type: "repos" },
  { day: "Mercredi", session: "Explosivité", intensity: "Haute", type: "explosivite" },
  { day: "Jeudi", session: "Force", intensity: "Moyenne", type: "force" },
  { day: "Vendredi", session: "Tactique", intensity: "Moyenne", type: "tactique" },
];

export const VIDEO_COACH_INSIGHTS: VideoCoachInsight[] = [
  { category: "top", title: "But Ahmed 25'", detail: "Appel profonde parfait, finition du pied gauche.", timestamp: "25:12" },
  { category: "strong", title: "Pressing collectif 1ère MT", detail: "Récupérations hautes x3 en zone adverse.", timestamp: "18:00" },
  { category: "error", title: "Perte balle Karim 42'", detail: "Passe risquée sous pression — carton jaune.", timestamp: "42:30" },
  { category: "weak", title: "Couloir droit exposé", detail: "3 occasions concédées sur transitions rapides.", timestamp: "55:00" },
];

export const EXECUTIVE_KPIS: ExecutiveKpi[] = [
  { label: "Valeur effectif", value: "18.4M€", change: "+12%", positive: true },
  { label: "Évolution saison", value: "+8.2 OVR", change: "+3.1%", positive: true },
  { label: "ROI joueurs", value: "142%", change: "+18%", positive: true },
  { label: "Budget restant", value: "1.2M€", change: "-8%", positive: false },
  { label: "Performance équipe", value: "7.4/10", change: "+0.6", positive: true },
];

export const EXECUTIVE_AI_RECO: ExecutiveAIReco[] = [
  { type: "sell", player: "Mohamed Sassi", reason: "Pic de valeur — 2.1M€ estimé, demande scout confirmée" },
  { type: "renew", player: "Ahmed Ben Salah", reason: "Performance elite + potentiel marché 3.5M€ à 6 mois" },
  { type: "recruit", player: "Hamza Lahmar (CSS)", reason: "Similarité 82% Ali Mansouri — complément MC" },
];

export function computeTacticalMetrics(players: PitchPlayer[], formation: FormationId): TacticalMetrics {
  const avgFatigue = players.reduce((s, p) => s + p.fatigue, 0) / players.length;
  const avgOvr = players.reduce((s, p) => s + p.ovr, 0) / players.length;
  const spreadX = Math.max(...players.map((p) => p.x)) - Math.min(...players.map((p) => p.x));

  let possession = 55 + Math.round((avgOvr - 80) * 0.8);
  let xG = 1.2 + (avgOvr - 80) * 0.05 + (formation === "4-3-3" ? 0.3 : formation === "4-2-3-1" ? 0.15 : 0);

  if (formation === "3-5-2") possession += 5;
  if (formation === "5-3-2") { possession -= 3; xG -= 0.2; }

  const pressing: TacticalMetrics["pressing"] = spreadX > 70 ? "Fort" : spreadX > 55 ? "Moyen" : "Faible";
  const fatigueRisk: TacticalMetrics["fatigueRisk"] = avgFatigue >= 70 ? "Élevé" : avgFatigue >= 45 ? "Moyen" : "Faible";

  return {
    possession: Math.min(72, Math.max(48, Math.round(possession))),
    xG: Math.round(xG * 10) / 10,
    pressing,
    fatigueRisk,
  };
}

export function applyFormation(players: PitchPlayer[], formation: FormationId): PitchPlayer[] {
  const positions = FORMATION_PRESETS[formation];
  return players.slice(0, positions.length).map((p, i) => ({
    ...p,
    x: positions[i].x,
    y: positions[i].y,
  }));
}

// FIFA-style OVR color tiers
export function fifaOvrColor(ovr: number): { color: string; bg: string; label: string } {
  if (ovr >= 90) return { color: "#A855F7", bg: "linear-gradient(145deg,#c084fc,#7e22ce)", label: "Elite" };
  if (ovr >= 85) return { color: "#F59E0B", bg: "linear-gradient(145deg,#fbbf24,#b45309)", label: "Gold" };
  if (ovr >= 80) return { color: "#22C55E", bg: "linear-gradient(145deg,#4ade80,#15803d)", label: "Green" };
  return { color: "#3B82F6", bg: "linear-gradient(145deg,#60a5fa,#1d4ed8)", label: "Blue" };
}

// FIFA Chemistry — link strength color between two connected players
export function chemistryColor(a: PitchPlayer, b: PitchPlayer): { color: string; strength: "Excellent" | "Moyen" | "Faible" } {
  const fatigueAvg = (a.fatigue + b.fatigue) / 2;
  const ovrAvg = (a.ovr + b.ovr) / 2;
  const score = ovrAvg - fatigueAvg * 0.5;
  if (score >= 60) return { color: "#22C55E", strength: "Excellent" };
  if (score >= 45) return { color: "#F59E0B", strength: "Moyen" };
  return { color: "#EF4444", strength: "Faible" };
}
