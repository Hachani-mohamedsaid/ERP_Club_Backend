/** Données analyste étendues — servies via /api/analyste/* */

export interface PPIPlayer {
  id: string;
  name: string;
  position: string;
  age: number;
  ppi: number;
  speed: number;
  pressing: number;
  xg: number;
  dribbling: number;
  defending: number;
  stamina: number;
  vision: number;
  leadership: number;
  trend: number[];
  fatigue: number;
  form: "rising" | "falling" | "stable";
  strengths: string[];
  weaknesses: string[];
}

export const PPI_PLAYERS: PPIPlayer[] = [
  { id: "1", name: "Ahmed Ben Salah", position: "BU", age: 24, ppi: 89, speed: 91, pressing: 87, xg: 85, dribbling: 82, defending: 48, stamina: 60, vision: 78, leadership: 72, trend: [82, 84, 85, 87, 88, 89], fatigue: 85, form: "rising", strengths: ["Vitesse", "xG élevé", "Pressing"], weaknesses: ["Fatigue critique", "Défense"] },
  { id: "2", name: "Ali Mansouri", position: "AG", age: 26, ppi: 84, speed: 88, pressing: 76, xg: 72, dribbling: 85, defending: 55, stamina: 88, vision: 80, leadership: 65, trend: [80, 81, 82, 83, 83, 84], fatigue: 20, form: "stable", strengths: ["Dribbling", "Endurance", "Vision"], weaknesses: ["xG", "Leadership"] },
  { id: "3", name: "Youssef Trabelsi", position: "MOC", age: 23, ppi: 71, speed: 75, pressing: 72, xg: 70, dribbling: 78, defending: 60, stamina: 65, vision: 85, leadership: 68, trend: [78, 75, 72, 70, 71, 71], fatigue: 35, form: "falling", strengths: ["Vision", "Technique"], weaknesses: ["En rééducation", "Vitesse", "Stamina"] },
  { id: "4", name: "Mohamed Sassi", position: "AD", age: 22, ppi: 80, speed: 86, pressing: 80, xg: 75, dribbling: 79, defending: 50, stamina: 72, vision: 74, leadership: 60, trend: [75, 76, 78, 79, 80, 80], fatigue: 62, form: "rising", strengths: ["Vitesse", "Pressing"], weaknesses: ["Leadership", "Défense"] },
  { id: "5", name: "Karim Dridi", position: "MC", age: 27, ppi: 82, speed: 78, pressing: 85, xg: 65, dribbling: 72, defending: 80, stamina: 70, vision: 82, leadership: 85, trend: [85, 84, 83, 82, 82, 82], fatigue: 78, form: "falling", strengths: ["Leadership", "Vision", "Défense"], weaknesses: ["Fatigue élevée", "xG"] },
  { id: "6", name: "Sami Bouazizi", position: "MC", age: 25, ppi: 78, speed: 76, pressing: 78, xg: 62, dribbling: 70, defending: 76, stamina: 80, vision: 76, leadership: 72, trend: [74, 75, 76, 77, 78, 78], fatigue: 45, form: "rising", strengths: ["Endurance", "Pressing", "Défense"], weaknesses: ["xG"] },
  { id: "7", name: "Ridha Ammar", position: "DD", age: 28, ppi: 76, speed: 74, pressing: 72, xg: 45, dribbling: 62, defending: 88, stamina: 82, vision: 68, leadership: 80, trend: [73, 74, 75, 75, 76, 76], fatigue: 38, form: "stable", strengths: ["Défense", "Leadership", "Endurance"], weaknesses: ["xG", "Dribbling"] },
  { id: "8", name: "Haddad", position: "GB", age: 30, ppi: 85, speed: 68, pressing: 65, xg: 35, dribbling: 55, defending: 90, stamina: 80, vision: 82, leadership: 88, trend: [83, 84, 84, 85, 85, 85], fatigue: 25, form: "stable", strengths: ["Défense", "Leadership", "Vision"], weaknesses: ["xG", "Vitesse"] },
];

export const PREDICTION_TEAMS = ["FC Carthage", "EST", "CA", "CSS", "ESS", "ST", "CS Sfax", "OB"];

export interface MatchPredictionResult {
  win: number;
  draw: number;
  loss: number;
  scores: { score: string; prob: number }[];
  xgHome: number;
  xgAway: number;
  models: { name: string; win: number; draw: number; loss: number }[];
  factors: { label: string; home: number; away: number }[];
  keyPlayers: { name: string; impact: string; color: string }[];
}

export function computeMatchPrediction(home: string, away: string): MatchPredictionResult {
  const seed = (home.charCodeAt(0) + away.charCodeAt(1)) % 100;
  const win = 30 + (seed % 30);
  const draw = 20 + ((seed * 7) % 18);
  const loss = 100 - win - draw;
  return {
    win,
    draw,
    loss,
    scores: [
      { score: "2-1", prob: 14 + (seed % 8) },
      { score: "1-0", prob: 11 + (seed % 7) },
      { score: "2-0", prob: 10 + (seed % 6) },
      { score: "1-1", prob: 13 + (seed % 5) },
      { score: "2-2", prob: 7 + (seed % 4) },
    ],
    xgHome: parseFloat((1.6 + (seed % 10) / 10).toFixed(1)),
    xgAway: parseFloat((1.1 + ((seed * 3) % 10) / 10).toFixed(1)),
    models: [
      { name: "Random Forest", win: win + 2, draw: draw - 1, loss: loss - 1 },
      { name: "XGBoost", win: win - 1, draw: draw + 2, loss: loss - 1 },
      { name: "CatBoost", win: win + 1, draw: draw - 2, loss: loss + 1 },
    ],
    factors: [
      { label: "Forme récente", home: 72 + (seed % 12), away: 58 + ((seed * 2) % 15) },
      { label: "xG moyen", home: 68 + (seed % 10), away: 52 + ((seed * 3) % 12) },
      { label: "Défense", home: 75 + (seed % 8), away: 64 + ((seed * 4) % 10) },
      { label: "Domicile", home: 82 + (seed % 6), away: 45 + ((seed * 5) % 8) },
      { label: "Blessures", home: 88 - (seed % 10), away: 70 - ((seed * 2) % 12) },
      { label: "Momentum", home: 65 + (seed % 15), away: 60 + ((seed * 6) % 12) },
    ],
    keyPlayers: [
      { name: "Ahmed Ben Salah", impact: "+8% xG", color: "#22C55E" },
      { name: "Karim Dridi", impact: "-5% pressing", color: "#FF7A00" },
      { name: "Ali Mansouri", impact: "+12% dribbles", color: "#3B82F6" },
    ],
  };
}

export interface ChemistryLink {
  a: string;
  b: string;
  score: number;
  passing: number;
  movement: number;
  pressing: number;
  history: number;
}

export const CHEMISTRY_PLAYERS = ["Ahmed", "Ali", "Youssef", "Mohamed", "Karim", "Sami", "Ridha", "Haddad"];

export const CHEMISTRY_MATRIX: ChemistryLink[] = [
  { a: "Ahmed", b: "Ali", score: 92, passing: 95, movement: 91, pressing: 88, history: 94 },
  { a: "Ahmed", b: "Karim", score: 45, passing: 42, movement: 48, pressing: 46, history: 44 },
  { a: "Ahmed", b: "Mohamed", score: 85, passing: 87, movement: 84, pressing: 82, history: 87 },
  { a: "Ali", b: "Youssef", score: 78, passing: 80, movement: 76, pressing: 77, history: 79 },
  { a: "Ali", b: "Sami", score: 82, passing: 83, movement: 80, pressing: 84, history: 81 },
  { a: "Karim", b: "Ridha", score: 88, passing: 86, movement: 89, pressing: 90, history: 87 },
  { a: "Karim", b: "Sami", score: 75, passing: 74, movement: 77, pressing: 73, history: 76 },
  { a: "Youssef", b: "Mohamed", score: 68, passing: 70, movement: 65, pressing: 68, history: 69 },
  { a: "Ridha", b: "Haddad", score: 91, passing: 88, movement: 90, pressing: 93, history: 93 },
  { a: "Mohamed", b: "Ali", score: 79, passing: 80, movement: 78, pressing: 79, history: 79 },
  { a: "Sami", b: "Ridha", score: 84, passing: 82, movement: 85, pressing: 86, history: 83 },
  { a: "Ahmed", b: "Haddad", score: 62, passing: 60, movement: 64, pressing: 63, history: 61 },
];

export const CHEMISTRY_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  Ahmed: { x: 50, y: 15 },
  Ali: { x: 80, y: 30 },
  Youssef: { x: 75, y: 60 },
  Mohamed: { x: 50, y: 80 },
  Karim: { x: 20, y: 60 },
  Sami: { x: 15, y: 30 },
  Ridha: { x: 10, y: 50 },
  Haddad: { x: 50, y: 50 },
};

export interface TransferTarget {
  id: string;
  name: string;
  club: string;
  position: string;
  age: number;
  cost: string;
  compatibility: number;
  xgGain: string;
  ppiScore: number;
  speed: number;
  pressing: number;
  stamina: number;
  vision: number;
  dribbling: number;
  reason: string;
  risk: "Faible" | "Moyen" | "Élevé";
  contract: string;
  nationality: string;
}

export const TRANSFER_TARGETS: TransferTarget[] = [
  { id: "t1", name: "Hamza Lahmar", club: "ES Tunis", position: "BU", age: 23, cost: "1.2M€", compatibility: 89, xgGain: "+14%", ppiScore: 87, speed: 90, pressing: 84, stamina: 78, vision: 76, dribbling: 82, reason: "Profil similaire Ahmed Ben Salah · Faible fatigue · xG élevé", risk: "Faible", contract: "18 mois", nationality: "TUN" },
  { id: "t2", name: "Ramzi Fejlaoui", club: "Club Africain", position: "MC", age: 25, cost: "850K€", compatibility: 82, xgGain: "+9%", ppiScore: 81, speed: 76, pressing: 88, stamina: 85, vision: 82, dribbling: 70, reason: "Vision de jeu · Compatible Karim Dridi · Leadership", risk: "Faible", contract: "12 mois", nationality: "TUN" },
  { id: "t3", name: "Yassine Bouali", club: "US Monastir", position: "DD", age: 27, cost: "600K€", compatibility: 78, xgGain: "+6%", ppiScore: 76, speed: 74, pressing: 75, stamina: 88, vision: 68, dribbling: 60, reason: "Solide défensivement · Bon pressing haut · Contrat court", risk: "Moyen", contract: "6 mois", nationality: "TUN" },
  { id: "t4", name: "Fares Chammam", club: "Sfax CS", position: "MOC", age: 21, cost: "380K€", compatibility: 74, xgGain: "+11%", ppiScore: 72, speed: 82, pressing: 71, stamina: 73, vision: 85, dribbling: 80, reason: "Jeune talent · Excellent xG · Potentiel élevé", risk: "Moyen", contract: "24 mois", nationality: "TUN" },
  { id: "t5", name: "Bilel Ifa", club: "Étranger", position: "AG", age: 24, cost: "2.1M€", compatibility: 91, xgGain: "+18%", ppiScore: 90, speed: 92, pressing: 87, stamina: 81, vision: 79, dribbling: 89, reason: "Meilleure compatibilité équipe · Vitesse exceptionnelle · Boost xG immédiat", risk: "Élevé", contract: "36 mois", nationality: "TUN" },
];

export const FATIGUE_INTERVALS = ["0-15", "15-30", "30-45", "45-60", "60-75", "75-90"];

export const TEAM_FATIGUE_BY_MIN = [
  { interval: "0-15", fatigue: 18, actions: 142, intensity: 92, goals: 1, errors: 0 },
  { interval: "15-30", fatigue: 32, actions: 138, intensity: 88, goals: 0, errors: 1 },
  { interval: "30-45", fatigue: 50, actions: 128, intensity: 82, goals: 0, errors: 1 },
  { interval: "45-60", fatigue: 58, actions: 135, intensity: 85, goals: 1, errors: 0 },
  { interval: "60-75", fatigue: 74, actions: 112, intensity: 72, goals: 0, errors: 2 },
  { interval: "75-90", fatigue: 89, actions: 94, intensity: 61, goals: 0, errors: 3 },
];

export interface PlayerHeatmap {
  name: string;
  data: { interval: string; fatigue: number; sprints: number }[];
}

export const PLAYER_HEATMAPS: PlayerHeatmap[] = [
  { name: "Ahmed Ben Salah", data: [{ interval: "0-15", fatigue: 15, sprints: 8 }, { interval: "15-30", fatigue: 30, sprints: 9 }, { interval: "30-45", fatigue: 50, sprints: 7 }, { interval: "45-60", fatigue: 65, sprints: 6 }, { interval: "60-75", fatigue: 82, sprints: 4 }, { interval: "75-90", fatigue: 95, sprints: 2 }] },
  { name: "Karim Dridi", data: [{ interval: "0-15", fatigue: 20, sprints: 6 }, { interval: "15-30", fatigue: 35, sprints: 7 }, { interval: "30-45", fatigue: 52, sprints: 6 }, { interval: "45-60", fatigue: 65, sprints: 5 }, { interval: "60-75", fatigue: 78, sprints: 3 }, { interval: "75-90", fatigue: 88, sprints: 2 }] },
  { name: "Ali Mansouri", data: [{ interval: "0-15", fatigue: 10, sprints: 9 }, { interval: "15-30", fatigue: 20, sprints: 10 }, { interval: "30-45", fatigue: 32, sprints: 9 }, { interval: "45-60", fatigue: 42, sprints: 8 }, { interval: "60-75", fatigue: 54, sprints: 7 }, { interval: "75-90", fatigue: 62, sprints: 6 }] },
];

export interface InjuryForecastEntry {
  id: string;
  name: string;
  position: string;
  injury: string;
  startDate: string;
  returnDays: number;
  confidence: number;
  recoverySteps: { day: number; label: string; done: boolean }[];
  riskAfterReturn: number;
  load: number;
  fatigue: number;
  recoveryTimeline: { day: string; fitness: number }[];
}

export const INJURY_FORECASTS: InjuryForecastEntry[] = [
  { id: "f1", name: "Ahmed Ben Salah", position: "BU", injury: "Ischio-jambier droit Grade II", startDate: "10/06/2026", returnDays: 14, confidence: 87, recoverySteps: [{ day: 1, label: "RICE Protocol — repos + glace", done: true }, { day: 3, label: "Électrostimulation + bain froid", done: true }, { day: 7, label: "Course légère 30min", done: true }, { day: 10, label: "Exercices sans ballon", done: false }, { day: 14, label: "Retour entraînement complet", done: false }], riskAfterReturn: 38, load: 92, fatigue: 85, recoveryTimeline: [{ day: "J0", fitness: 30 }, { day: "J3", fitness: 40 }, { day: "J5", fitness: 52 }, { day: "J7", fitness: 63 }, { day: "J10", fitness: 74 }, { day: "J12", fitness: 82 }, { day: "J14", fitness: 91 }] },
  { id: "f2", name: "Youssef Trabelsi", position: "MOC", injury: "Entorse cheville Grade I", startDate: "01/06/2026", returnDays: 7, confidence: 92, recoverySteps: [{ day: 1, label: "Immobilisation + anti-inflammatoires", done: true }, { day: 3, label: "Kiné quotidienne", done: true }, { day: 5, label: "Proprioception", done: true }, { day: 7, label: "Retour entraînement partiel", done: false }], riskAfterReturn: 25, load: 55, fatigue: 35, recoveryTimeline: [{ day: "J0", fitness: 45 }, { day: "J2", fitness: 55 }, { day: "J4", fitness: 65 }, { day: "J5", fitness: 73 }, { day: "J6", fitness: 80 }, { day: "J7", fitness: 88 }] },
  { id: "f3", name: "Karim Dridi", position: "MC", injury: "Douleur genou (inflammation légère)", startDate: "15/06/2026", returnDays: 5, confidence: 78, recoverySteps: [{ day: 1, label: "Cryothérapie quotidienne", done: true }, { day: 2, label: "Repos actif — vélo", done: true }, { day: 4, label: "Injection anti-inflammatoire", done: false }, { day: 5, label: "Feu vert médecin", done: false }], riskAfterReturn: 45, load: 88, fatigue: 78, recoveryTimeline: [{ day: "J0", fitness: 55 }, { day: "J1", fitness: 60 }, { day: "J3", fitness: 70 }, { day: "J4", fitness: 78 }, { day: "J5", fitness: 84 }] },
];

export interface LiveMatchEvent {
  minute: number;
  type: "goal" | "card" | "sub" | "var";
  player: string;
  team: "home" | "away";
  desc: string;
}

export interface LiveMinuteData {
  minute: number;
  possession: number;
  fatigue: number;
  winProb: number;
  xg: number;
}

export const LIVE_MATCH_DATA: LiveMinuteData[] = [
  { minute: 0, possession: 50, fatigue: 10, winProb: 43, xg: 0.0 },
  { minute: 5, possession: 55, fatigue: 14, winProb: 46, xg: 0.1 },
  { minute: 10, possession: 58, fatigue: 18, winProb: 50, xg: 0.3 },
  { minute: 15, possession: 62, fatigue: 22, winProb: 54, xg: 0.6 },
  { minute: 20, possession: 59, fatigue: 27, winProb: 52, xg: 0.8 },
  { minute: 25, possession: 63, fatigue: 33, winProb: 56, xg: 1.1 },
  { minute: 30, possession: 60, fatigue: 39, winProb: 58, xg: 1.4 },
  { minute: 35, possession: 55, fatigue: 45, winProb: 55, xg: 1.6 },
  { minute: 40, possession: 52, fatigue: 51, winProb: 52, xg: 1.8 },
  { minute: 45, possession: 57, fatigue: 56, winProb: 54, xg: 2.0 },
  { minute: 50, possession: 61, fatigue: 60, winProb: 57, xg: 2.2 },
  { minute: 55, possession: 59, fatigue: 65, winProb: 55, xg: 2.4 },
  { minute: 60, possession: 54, fatigue: 70, winProb: 53, xg: 2.6 },
  { minute: 65, possession: 50, fatigue: 76, winProb: 50, xg: 2.7 },
];

export const LIVE_MATCH_EVENTS: LiveMatchEvent[] = [
  { minute: 12, type: "goal", player: "Ali Mansouri", team: "home", desc: "But — tête sur corner" },
  { minute: 28, type: "card", player: "Karim Dridi", team: "home", desc: "Carton jaune — faute tactique" },
  { minute: 45, type: "goal", player: "---", team: "away", desc: "Égalisation adverse" },
  { minute: 61, type: "sub", player: "Ahmed Ben Salah", team: "home", desc: "Remplacement — fatigue élevée (85%)" },
];

export const LIVE_MATCH_PLAYERS = [
  { name: "Ali Mansouri", fatigue: 55, risk: 18, readiness: 92, shouldSub: false },
  { name: "Karim Dridi", fatigue: 82, risk: 62, readiness: 58, shouldSub: true },
  { name: "Mohamed Sassi", fatigue: 68, risk: 42, readiness: 72, shouldSub: false },
  { name: "Sami Bouazizi", fatigue: 47, risk: 22, readiness: 88, shouldSub: false },
  { name: "Ridha Ammar", fatigue: 50, risk: 20, readiness: 85, shouldSub: false },
];

export const VIDEO_HIGHLIGHTS = [
  { id: "h1", time: "12'42", type: "But", player: "Ali Mansouri", desc: "Tête sur corner — angle parfait 6m", conf: 98, tags: ["Coup de tête", "Corner", "Surface"] },
  { id: "h2", time: "28'18", type: "Faute", player: "Karim Dridi", desc: "Faute tactique — blocage pressing", conf: 94, tags: ["Pressing haut", "Récupération"] },
  { id: "h3", time: "44'55", type: "Occasion", player: "Ahmed", desc: "Frappe 20m — poteau gauche — xG 0.41", conf: 91, tags: ["Frappe lointaine", "xG élevé"] },
  { id: "h4", time: "61'02", type: "Remplacement", player: "Ahmed → Sami", desc: "Substitution — fatigue 85% détectée", conf: 99, tags: ["Fatigue", "Tactical"] },
  { id: "h5", time: "78'33", type: "Danger", player: "Défense", desc: "Couloir gauche ouvert — contre-attaque", conf: 87, tags: ["Défense", "Contre"] },
];

export const VIDEO_AI_INSIGHTS = [
  { player: "Ali Mansouri", rating: 8.8, analysis: "Meilleure performance. 12 dribbles réussis, 92% passes. Pressing efficace premier tiers.", trend: "up" as const },
  { player: "Ahmed Ben Salah", rating: 7.2, analysis: "Diminution visible après 60min — fatigue. 3 pertes de balle zone offensive. Remplacement justifié.", trend: "down" as const },
  { player: "Karim Dridi", rating: 7.5, analysis: "Bonne couverture axiale. Leadership défensif. Carton jaune évitable — gestion.", trend: "stable" as const },
  { player: "Ridha Ammar", rating: 8.1, analysis: "Excellent duel aérien (78%). Sortie propre gardien à 34'. Aucune erreur détectée.", trend: "up" as const },
];

export const DASHBOARD_LIVE_STATS = [
  { label: "Possession", value: "64%", color: "#8B5CF6" },
  { label: "xG Projeté", value: "2.3", color: "#22C55E" },
  { label: "Risque global", value: "Moyen", color: "#F59E0B" },
  { label: "Joueurs dispos", value: "21/26", color: "#3B82F6" },
];

export const PATTERNS_SUMMARY =
  "Le modèle deep learning a analysé 847 matchs, 12 400 séances et 3 saisons de données wearables. Voici les patterns détectés automatiquement avec confiance > 75%.";

export const TRAINING_BANNER =
  "Programme généré pour Ahmed Ben Salah — fatigue 85%, hamstring en surveillance, match samedi.";
