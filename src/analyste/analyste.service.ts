import { Injectable } from '@nestjs/common';
import {
  AI_TACTICAL_CENTER,
  ANALYSTE_INFO,
  BENCH_PLAYERS,
  DEFAULT_SQUAD,
  DEFAULT_TRAINING_PLAN,
  DETECTED_PATTERNS,
  EVOLUTION_FORECASTS,
  EXECUTIVE_AI_RECO,
  EXECUTIVE_KPIS,
  INJURY_PREDICTIONS,
  MARKET_VALUES,
  MATCH_EVENTS,
  OPPONENT_INTEL,
  SCOUTING_COMPARE,
  TACTICAL_SUGGESTIONS,
  VIDEO_COACH_INSIGHTS,
} from './data/analysteData';
import {
  CHEMISTRY_MATRIX,
  CHEMISTRY_NODE_POSITIONS,
  CHEMISTRY_PLAYERS,
  DASHBOARD_LIVE_STATS,
  INJURY_FORECASTS,
  LIVE_MATCH_DATA,
  LIVE_MATCH_EVENTS,
  LIVE_MATCH_PLAYERS,
  PATTERNS_SUMMARY,
  PLAYER_HEATMAPS,
  PPI_PLAYERS,
  PREDICTION_TEAMS,
  TEAM_FATIGUE_BY_MIN,
  TRAINING_BANNER,
  TRANSFER_TARGETS,
  VIDEO_AI_INSIGHTS,
  VIDEO_HIGHLIGHTS,
  computeMatchPrediction,
} from './data/analysteExtendedData';
import { WHOOP_SQUAD } from './data/whoopData';

@Injectable()
export class AnalysteService {
  getDashboard() {
    return {
      info: ANALYSTE_INFO,
      patterns: DETECTED_PATTERNS,
      liveStats: DASHBOARD_LIVE_STATS,
      tacticalCenter: AI_TACTICAL_CENTER,
    };
  }

  getExecutive() {
    return { kpis: EXECUTIVE_KPIS, recommendations: EXECUTIVE_AI_RECO };
  }

  getLiveMatch() {
    return {
      homeTeam: 'FC Carthage',
      awayTeam: 'EST',
      score: { home: 1, away: 1 },
      minute: 65,
      minuteData: LIVE_MATCH_DATA,
      events: LIVE_MATCH_EVENTS,
      players: LIVE_MATCH_PLAYERS,
    };
  }

  getPredictionTeams() {
    return { teams: PREDICTION_TEAMS };
  }

  predictMatch(home: string, away: string) {
    const h = home || PREDICTION_TEAMS[0];
    const a = away || PREDICTION_TEAMS[1];
    return { home: h, away: a, prediction: computeMatchPrediction(h, a) };
  }

  getPPI() {
    return { players: PPI_PLAYERS };
  }

  getChemistry() {
    const teamAvg = Math.round(
      CHEMISTRY_MATRIX.reduce((s, m) => s + m.score, 0) / CHEMISTRY_MATRIX.length,
    );
    const sorted = [...CHEMISTRY_MATRIX].sort((a, b) => b.score - a.score);
    return {
      players: CHEMISTRY_PLAYERS,
      matrix: CHEMISTRY_MATRIX,
      nodePositions: CHEMISTRY_NODE_POSITIONS,
      summary: {
        teamAvg,
        bestPair: sorted[0],
        worstPair: sorted[sorted.length - 1],
        topDuos: sorted.slice(0, 4),
      },
    };
  }

  getPatterns() {
    return { patterns: DETECTED_PATTERNS, summary: PATTERNS_SUMMARY };
  }

  getTactical() {
    return {
      squad: DEFAULT_SQUAD,
      bench: BENCH_PLAYERS,
      suggestions: TACTICAL_SUGGESTIONS,
      aiCenter: AI_TACTICAL_CENTER,
    };
  }

  getVideoAnalysis() {
    return {
      matchTitle: 'FC Carthage vs EST — Match Footage',
      highlights: VIDEO_HIGHLIGHTS,
      insights: VIDEO_AI_INSIGHTS,
      events: MATCH_EVENTS,
    };
  }

  getVideoCoach() {
    return { insights: VIDEO_COACH_INSIGHTS };
  }

  getReplay() {
    return { events: MATCH_EVENTS, videoDuration: 5400 };
  }

  getOpponent() {
    return { intel: OPPONENT_INTEL };
  }

  getFatigue() {
    const crash = TEAM_FATIGUE_BY_MIN.reduce(
      (max, d) => (d.fatigue > max.fatigue ? d : max),
      TEAM_FATIGUE_BY_MIN[0],
    );
    return {
      intervals: ['0-15', '15-30', '30-45', '45-60', '60-75', '75-90'],
      teamFatigue: TEAM_FATIGUE_BY_MIN,
      playerHeatmaps: PLAYER_HEATMAPS,
      summary: {
        maxFatigue: 89,
        collapseRange: '75-90',
        criticalErrors: 3,
        actionsDelta: -48,
        crashInterval: crash.interval,
      },
    };
  }

  getWhoop() {
    return { squad: WHOOP_SQUAD, defaultPlayerId: '2' };
  }

  getInjuries() {
    return { predictions: INJURY_PREDICTIONS };
  }

  getInjuryForecast() {
    const avgConfidence = Math.round(
      INJURY_FORECASTS.reduce((s, f) => s + f.confidence, 0) / INJURY_FORECASTS.length,
    );
    const avgRelapse = Math.round(
      INJURY_FORECASTS.reduce((s, f) => s + f.riskAfterReturn, 0) / INJURY_FORECASTS.length,
    );
    const fastest = INJURY_FORECASTS.reduce(
      (min, f) => (f.returnDays < min.returnDays ? f : min),
      INJURY_FORECASTS[0],
    );
    return {
      forecasts: INJURY_FORECASTS,
      summary: {
        injuredCount: INJURY_FORECASTS.length,
        fastestReturnDays: fastest.returnDays,
        avgConfidence,
        avgRelapseRisk: avgRelapse,
      },
    };
  }

  getTransfer() {
    const avgCompat = Math.round(
      TRANSFER_TARGETS.reduce((s, t) => s + t.compatibility, 0) / TRANSFER_TARGETS.length,
    );
    const maxXg = TRANSFER_TARGETS.reduce((max, t) => {
      const n = parseInt(t.xgGain.replace(/\D/g, ''), 10);
      return n > max ? n : max;
    }, 0);
    return {
      transfers: TRANSFER_TARGETS,
      summary: {
        targeted: TRANSFER_TARGETS.length,
        avgCompatibility: avgCompat,
        maxXgGain: `+${maxXg}%`,
        totalBudget: '5.1M€',
      },
    };
  }

  getMarketValue() {
    return { values: MARKET_VALUES };
  }

  getScouting() {
    return { compare: SCOUTING_COMPARE };
  }

  getEvolution() {
    return { forecasts: EVOLUTION_FORECASTS };
  }

  getTraining() {
    return { plan: DEFAULT_TRAINING_PLAN, banner: TRAINING_BANNER };
  }
}
