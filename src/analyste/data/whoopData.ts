export interface SleepStages {
  awake: number;
  light: number;
  sws: number;
  rem: number;
}

export interface SyncEvent {
  time: string;
  type: string;
  status: "ok" | "warn" | "error";
}

export interface WhoopTimelineEvent {
  time: string;
  label: string;
}

export interface WhoopAlert {
  id: string;
  message: string;
  type: "ok" | "warn" | "error";
  time: string;
}

export interface WhoopPlayerMetrics {
  id: string;
  name: string;
  position: string;
  number: number;
  photo: string;
  club: string;
  age: number;
  height: string;
  weight: string;
  bloodGroup: string;
  dominantFoot: string;
  injuryHistory: string;
  deviceId: string;
  firmware: string;
  athleteId: string;
  memberSince: string;
  connected: boolean;
  lastSync: string;
  lastSyncAt: string;
  battery: number;
  recovery: number;
  recoveryDelta: number;
  strain: number;
  strainTarget: number;
  sleepHours: number;
  sleepPerformance: number;
  sleepNeed: number;
  sleepStages: SleepStages;
  hrv: number;
  hrvBaseline: number;
  restingHr: number;
  skinTemp: number;
  respiratoryRate: number;
  spo2: number;
  stress: number;
  calories: number;
  steps: number;
  fitnessScore: number;
  fitToPlay: boolean;
  injuryRisk: "Low" | "Medium" | "High";
  readiness: "Optimal" | "Prêt" | "Modéré" | "Fatigué" | "Repos";
  weeklyStrain: { day: string; strain: number; recovery: number }[];
  hourlyHr: { hour: string; bpm: number }[];
  zones: { zone: string; minutes: number; color: string }[];
  syncLog: SyncEvent[];
  timeline: WhoopTimelineEvent[];
  alerts: WhoopAlert[];
  coachNotes: string;
  upcomingMatch: string;
  weather: string;
  todayGoals: string[];
  aiInsight: string;
  aiRecommendations: string[];
  aiConfidence: number;
}

const BASE_TIMELINE: WhoopTimelineEvent[] = [
  { time: "08:00", label: "Réveil · sommeil analysé" },
  { time: "09:20", label: "Entraînement collectif" },
  { time: "11:00", label: "Recovery window" },
  { time: "15:30", label: "Session tactique" },
  { time: "18:00", label: "Recommandation sommeil 22h30" },
];

const BASE_ALERTS: WhoopAlert[] = [
  { id: "a1", message: "Sync complétée", type: "ok", time: "14:28" },
  { id: "a2", message: "Recovery au-dessus baseline", type: "ok", time: "08:15" },
];

const BASE_SYNC: SyncEvent[] = [
  { time: "14:28:41", type: "Recovery calculé", status: "ok" },
  { time: "14:28:39", type: "Sommeil importé", status: "ok" },
  { time: "14:28:38", type: "HRV synchronisé", status: "ok" },
];

type PlayerInput = Omit<WhoopPlayerMetrics, "club" | "age" | "height" | "weight" | "bloodGroup" | "dominantFoot" | "injuryHistory" | "recoveryDelta" | "spo2" | "stress" | "calories" | "steps" | "fitnessScore" | "fitToPlay" | "injuryRisk" | "timeline" | "alerts" | "coachNotes" | "upcomingMatch" | "weather" | "todayGoals" | "aiRecommendations" | "aiConfidence"> &
  Partial<Pick<WhoopPlayerMetrics, "club" | "age" | "height" | "weight" | "bloodGroup" | "dominantFoot" | "injuryHistory" | "recoveryDelta" | "spo2" | "stress" | "calories" | "steps" | "fitnessScore" | "fitToPlay" | "injuryRisk" | "timeline" | "alerts" | "coachNotes" | "upcomingMatch" | "weather" | "todayGoals" | "aiRecommendations" | "aiConfidence">>;

function enrich(p: PlayerInput): WhoopPlayerMetrics {
  return {
    club: "FC Carthage",
    age: 26,
    height: "1.82 m",
    weight: "78 kg",
    bloodGroup: "O+",
    dominantFoot: "Droit",
    injuryHistory: "Aucune blessure active",
    recoveryDelta: 2,
    spo2: 98,
    stress: 28,
    calories: 2650,
    steps: 8400,
    fitnessScore: 82,
    fitToPlay: true,
    injuryRisk: "Low",
    timeline: BASE_TIMELINE,
    alerts: BASE_ALERTS,
    coachNotes: "Profil stable — suivi standard.",
    upcomingMatch: "Espérance ST · Sam 20h00",
    weather: "22°C · Humidité 64%",
    todayGoals: ["Hydratation 3L", "Étirements 15 min", "Couche 22h30"],
    aiRecommendations: ["Maintenir charge actuelle", "Monitoring HRV"],
    aiConfidence: 91,
    ...p,
  };
}

export const WHOOP_SQUAD: WhoopPlayerMetrics[] = [
  enrich({
    id: "1",
    name: "Ahmed Ben Salah",
    position: "ATT",
    number: 9,
    photo: "https://images.unsplash.com/photo-1574629810360-43c2d185f1d8?w=120&h=120&fit=crop&crop=faces",
    deviceId: "W4-9A2F-8841",
    firmware: "5.2.1",
    athleteId: "ATH-88412",
    memberSince: "Août 2024",
    connected: true,
    lastSync: "Il y a 3 min",
    lastSyncAt: "14:28:41",
    battery: 78,
    recovery: 82,
    strain: 14.2,
    strainTarget: 15.5,
    sleepHours: 7.4,
    sleepPerformance: 88,
    sleepNeed: 8.0,
    sleepStages: { awake: 0.4, light: 3.2, sws: 2.1, rem: 1.7 },
    hrv: 68,
    hrvBaseline: 61,
    restingHr: 48,
    skinTemp: 36.4,
    respiratoryRate: 14.2,
    readiness: "Optimal",
    weeklyStrain: [
      { day: "Lun", strain: 12.1, recovery: 74 },
      { day: "Mar", strain: 15.8, recovery: 62 },
      { day: "Mer", strain: 8.2, recovery: 85 },
      { day: "Jeu", strain: 16.4, recovery: 58 },
      { day: "Ven", strain: 6.1, recovery: 91 },
      { day: "Sam", strain: 18.2, recovery: 55 },
      { day: "Dim", strain: 14.2, recovery: 82 },
    ],
    hourlyHr: [
      { hour: "00h", bpm: 46 }, { hour: "04h", bpm: 44 }, { hour: "08h", bpm: 62 },
      { hour: "12h", bpm: 78 }, { hour: "16h", bpm: 142 }, { hour: "20h", bpm: 88 },
    ],
    zones: [
      { zone: "Zone 0", minutes: 420, color: "#64748B" },
      { zone: "Zone 1", minutes: 38, color: "#3B82F6" },
      { zone: "Zone 2", minutes: 22, color: "#22C55E" },
      { zone: "Zone 3", minutes: 14, color: "#F59E0B" },
      { zone: "Zone 4", minutes: 8, color: "#FF7A00" },
      { zone: "Zone 5", minutes: 3, color: "#EF4444" },
    ],
    syncLog: BASE_SYNC,
    aiInsight: "Récupération excellente — charge match demain recommandée. HRV +12% vs baseline personnelle (61 ms).",
    recoveryDelta: 5,
    fitnessScore: 88,
    injuryRisk: "Low",
    aiRecommendations: ["Titulaire recommandé", "Charge match normale", "Hydratation 3L"],
    aiConfidence: 94,
  }),
  enrich({
    id: "2",
    name: "Karim Dridi",
    position: "MIL",
    number: 8,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces",
    deviceId: "W4-7C1B-2290",
    firmware: "5.2.1",
    athleteId: "ATH-22908",
    memberSince: "Jan 2025",
    connected: true,
    lastSync: "Il y a 8 min",
    lastSyncAt: "14:23:12",
    battery: 64,
    recovery: 58,
    strain: 16.8,
    strainTarget: 14.0,
    sleepHours: 6.1,
    sleepPerformance: 71,
    sleepNeed: 8.2,
    sleepStages: { awake: 0.8, light: 2.8, sws: 1.6, rem: 0.9 },
    hrv: 52,
    hrvBaseline: 58,
    restingHr: 54,
    skinTemp: 36.7,
    respiratoryRate: 15.1,
    readiness: "Modéré",
    weeklyStrain: [
      { day: "Lun", strain: 14.2, recovery: 68 },
      { day: "Mar", strain: 17.1, recovery: 52 },
      { day: "Mer", strain: 11.4, recovery: 71 },
      { day: "Jeu", strain: 18.9, recovery: 48 },
      { day: "Ven", strain: 9.2, recovery: 76 },
      { day: "Sam", strain: 19.4, recovery: 44 },
      { day: "Dim", strain: 16.8, recovery: 58 },
    ],
    hourlyHr: [
      { hour: "00h", bpm: 52 }, { hour: "04h", bpm: 50 }, { hour: "08h", bpm: 68 },
      { hour: "12h", bpm: 82 }, { hour: "16h", bpm: 156 }, { hour: "20h", bpm: 94 },
    ],
    zones: [
      { zone: "Zone 0", minutes: 380, color: "#64748B" },
      { zone: "Zone 1", minutes: 45, color: "#3B82F6" },
      { zone: "Zone 2", minutes: 28, color: "#22C55E" },
      { zone: "Zone 3", minutes: 18, color: "#F59E0B" },
      { zone: "Zone 4", minutes: 12, color: "#FF7A00" },
      { zone: "Zone 5", minutes: 6, color: "#EF4444" },
    ],
    syncLog: [
      { time: "14:23:12", type: "Recovery calculé", status: "ok" },
      { time: "14:23:10", type: "Strain jour mis à jour (16.8)", status: "warn" },
      { time: "14:23:09", type: "Sommeil importé (6h06)", status: "ok" },
    ],
    aiInsight: "Strain au-dessus de l'objectif (14.0) — réduire intensité séance. Risque fatigue J+2 si charge maintenue.",
    recoveryDelta: -2,
    fitnessScore: 62,
    fitToPlay: false,
    injuryRisk: "Medium",
    stress: 58,
    alerts: [
      { id: "k1", message: "Strain élevé (16.8)", type: "warn", time: "14:23" },
      { id: "k2", message: "Sommeil insuffisant", type: "warn", time: "08:00" },
    ],
    aiRecommendations: ["Réduire intensité", "Boire 1.5L", "Sieste 30 min"],
    aiConfidence: 93,
    coachNotes: "Limiter sprints haute intensité aujourd'hui.",
  }),
  enrich({
    id: "3",
    name: "Ali Mansouri",
    position: "DEF",
    number: 4,
    photo: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=120&h=120&fit=crop&crop=faces",
    deviceId: "W4-3D8E-7712",
    firmware: "5.2.0",
    athleteId: "ATH-77124",
    memberSince: "Mars 2024",
    connected: true,
    lastSync: "Il y a 1 min",
    lastSyncAt: "14:30:05",
    battery: 91,
    recovery: 91,
    strain: 9.4,
    strainTarget: 12.0,
    sleepHours: 8.2,
    sleepPerformance: 94,
    sleepNeed: 7.8,
    sleepStages: { awake: 0.3, light: 3.5, sws: 2.4, rem: 2.0 },
    hrv: 74,
    hrvBaseline: 66,
    restingHr: 46,
    skinTemp: 36.2,
    respiratoryRate: 13.8,
    readiness: "Optimal",
    weeklyStrain: [
      { day: "Lun", strain: 8.1, recovery: 88 },
      { day: "Mar", strain: 10.2, recovery: 82 },
      { day: "Mer", strain: 5.4, recovery: 95 },
      { day: "Jeu", strain: 11.8, recovery: 78 },
      { day: "Ven", strain: 4.2, recovery: 96 },
      { day: "Sam", strain: 12.4, recovery: 80 },
      { day: "Dim", strain: 9.4, recovery: 91 },
    ],
    hourlyHr: [
      { hour: "00h", bpm: 44 }, { hour: "04h", bpm: 42 }, { hour: "08h", bpm: 58 },
      { hour: "12h", bpm: 72 }, { hour: "16h", bpm: 128 }, { hour: "20h", bpm: 76 },
    ],
    zones: [
      { zone: "Zone 0", minutes: 450, color: "#64748B" },
      { zone: "Zone 1", minutes: 28, color: "#3B82F6" },
      { zone: "Zone 2", minutes: 15, color: "#22C55E" },
      { zone: "Zone 3", minutes: 8, color: "#F59E0B" },
      { zone: "Zone 4", minutes: 4, color: "#FF7A00" },
      { zone: "Zone 5", minutes: 1, color: "#EF4444" },
    ],
    syncLog: BASE_SYNC,
    aiInsight: "Profil recovery elite — disponible titulaire sans restriction. Sommeil au-dessus du besoin (+24 min).",
    recoveryDelta: 8,
    fitnessScore: 94,
    injuryRisk: "Low",
    aiConfidence: 96,
  }),
  enrich({
    id: "4",
    name: "Youssef Khelifi",
    position: "GAR",
    number: 1,
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces",
    deviceId: "W4-1F4A-0038",
    firmware: "5.1.9",
    athleteId: "ATH-00381",
    memberSince: "Juin 2024",
    connected: false,
    lastSync: "Hier 22:14",
    lastSyncAt: "22:14:33",
    battery: 12,
    recovery: 42,
    strain: 11.2,
    strainTarget: 13.0,
    sleepHours: 5.8,
    sleepPerformance: 58,
    sleepNeed: 8.5,
    sleepStages: { awake: 1.1, light: 2.4, sws: 1.4, rem: 0.9 },
    hrv: 41,
    hrvBaseline: 55,
    restingHr: 58,
    skinTemp: 36.9,
    respiratoryRate: 15.8,
    readiness: "Fatigué",
    weeklyStrain: [
      { day: "Lun", strain: 10.1, recovery: 55 },
      { day: "Mar", strain: 13.4, recovery: 48 },
      { day: "Mer", strain: 7.8, recovery: 62 },
      { day: "Jeu", strain: 14.2, recovery: 44 },
      { day: "Ven", strain: 8.1, recovery: 68 },
      { day: "Sam", strain: 15.1, recovery: 38 },
      { day: "Dim", strain: 11.2, recovery: 42 },
    ],
    hourlyHr: [
      { hour: "00h", bpm: 56 }, { hour: "04h", bpm: 54 }, { hour: "08h", bpm: 72 },
      { hour: "12h", bpm: 88 }, { hour: "16h", bpm: 118 }, { hour: "20h", bpm: 82 },
    ],
    zones: [
      { zone: "Zone 0", minutes: 410, color: "#64748B" },
      { zone: "Zone 1", minutes: 32, color: "#3B82F6" },
      { zone: "Zone 2", minutes: 18, color: "#22C55E" },
      { zone: "Zone 3", minutes: 10, color: "#F59E0B" },
      { zone: "Zone 4", minutes: 5, color: "#FF7A00" },
      { zone: "Zone 5", minutes: 2, color: "#EF4444" },
    ],
    syncLog: [
      { time: "22:14:33", type: "Dernière sync — appareil hors ligne", status: "error" },
      { time: "22:14:30", type: "Batterie faible (12%)", status: "warn" },
      { time: "18:02:11", type: "Recovery calculé (42%)", status: "warn" },
    ],
    aiInsight: "Appareil déconnecté depuis 16h — resynchroniser avant entraînement. Recovery critique, sommeil -2h42 vs besoin.",
    recoveryDelta: -6,
    fitnessScore: 48,
    fitToPlay: false,
    injuryRisk: "High",
    stress: 72,
    spo2: 96,
    alerts: [
      { id: "y1", message: "Recovery < 50%", type: "error", time: "18:02" },
      { id: "y2", message: "Batterie 12%", type: "warn", time: "22:14" },
      { id: "y3", message: "Joueur déconnecté", type: "error", time: "22:14" },
    ],
    aiRecommendations: ["Repos actif", "Resync WHOOP", "Évaluation médicale"],
    aiConfidence: 89,
    coachNotes: "Ne pas convoquer sans avis médical.",
  }),
];

export function readinessColor(r: WhoopPlayerMetrics["readiness"]) {
  switch (r) {
    case "Optimal": return "#34d399";
    case "Prêt": return "#3B82F6";
    case "Modéré": return "#fbbf24";
    case "Fatigué": return "#f97316";
    case "Repos": return "#ef4444";
  }
}

export function strainColor(s: number) {
  if (s >= 18) return "#E84855";
  if (s >= 14) return "#F5A623";
  if (s >= 10) return "#F59E0B";
  return "#44D62C";
}

export function recoveryColor(v: number) {
  if (v >= 67) return "#34d399";
  if (v >= 34) return "#fbbf24";
  return "#ef4444";
}
