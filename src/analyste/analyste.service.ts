import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ClubAccessService } from '../club/club-access.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ANALYSTE_MODULE_KEYS,
  AnalysteModuleKey,
  buildAnalyisteSeeds,
} from './analyste-seed';
import { computeMatchPrediction } from './data/analysteExtendedData';

type ChemistryLink = { a: string; b: string; score: number };
type InjuryForecast = { confidence: number; riskAfterReturn: number; returnDays: number };
type TransferTarget = { compatibility: number; xgGain: string };

@Injectable()
export class AnalysteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
  ) {}

  private orgId(user: JwtPayload) {
    return this.access.requireOrganization(user);
  }

  private async getPayload<T>(organizationId: string, moduleKey: AnalysteModuleKey): Promise<T> {
    await this.ensureSeeded(organizationId);
    const row = await this.prisma.analysteModuleData.findUniqueOrThrow({
      where: { organizationId_moduleKey: { organizationId, moduleKey } },
    });
    return row.payload as T;
  }

  async ensureSeeded(organizationId: string, analystName?: string) {
    const existing = await this.prisma.analysteModuleData.count({
      where: { organizationId },
    });
    if (existing >= ANALYSTE_MODULE_KEYS.length) return;

    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { clubName: true },
    });

    const seeds = buildAnalyisteSeeds(org.clubName, analystName);
    await this.prisma.$transaction(
      ANALYSTE_MODULE_KEYS.map((moduleKey) =>
        this.prisma.analysteModuleData.upsert({
          where: { organizationId_moduleKey: { organizationId, moduleKey } },
          create: {
            organizationId,
            moduleKey,
            payload: seeds[moduleKey] as object,
          },
          update: {
            payload: seeds[moduleKey] as object,
          },
        }),
      ),
    );
  }

  async getDashboard(user: JwtPayload) {
    const organizationId = this.orgId(user);
    await this.ensureSeeded(organizationId, user.fullName);
    const data = await this.getPayload<{
      info: { name: string; club: string; season: string };
      patterns: unknown[];
      liveStats: unknown[];
      tacticalCenter: unknown;
    }>(organizationId, 'dashboard');

    return {
      ...data,
      info: { ...data.info, name: user.fullName || data.info.name },
    };
  }

  getExecutive(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'executive');
  }

  getLiveMatch(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'live-match');
  }

  async getPredictionTeams(user: JwtPayload) {
    return this.getPayload<{ teams: string[] }>(this.orgId(user), 'prediction-teams');
  }

  async predictMatch(user: JwtPayload, home: string, away: string) {
    const { teams } = await this.getPredictionTeams(user);
    const h = home || teams[0];
    const a = away || teams[1];
    return { home: h, away: a, prediction: computeMatchPrediction(h, a) };
  }

  getPPI(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'ppi');
  }

  async getChemistry(user: JwtPayload) {
    const data = await this.getPayload<{
      players: string[];
      matrix: ChemistryLink[];
      nodePositions: Record<string, { x: number; y: number }>;
    }>(this.orgId(user), 'chemistry');

    const teamAvg = Math.round(
      data.matrix.reduce((s, m) => s + m.score, 0) / data.matrix.length,
    );
    const sorted = [...data.matrix].sort((a, b) => b.score - a.score);
    return {
      ...data,
      summary: {
        teamAvg,
        bestPair: sorted[0],
        worstPair: sorted[sorted.length - 1],
        topDuos: sorted.slice(0, 4),
      },
    };
  }

  getPatterns(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'patterns');
  }

  getTactical(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'tactical');
  }

  getVideoAnalysis(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'video-analysis');
  }

  getVideoCoach(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'video-coach');
  }

  getReplay(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'replay');
  }

  getOpponent(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'opponent');
  }

  async getFatigue(user: JwtPayload) {
    const data = await this.getPayload<{
      intervals: string[];
      teamFatigue: { interval: string; fatigue: number }[];
      playerHeatmaps: unknown;
    }>(this.orgId(user), 'fatigue');

    const crash = data.teamFatigue.reduce(
      (max, d) => (d.fatigue > max.fatigue ? d : max),
      data.teamFatigue[0],
    );

    return {
      ...data,
      summary: {
        maxFatigue: 89,
        collapseRange: '75-90',
        criticalErrors: 3,
        actionsDelta: -48,
        crashInterval: crash.interval,
      },
    };
  }

  getWhoop(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'whoop');
  }

  getInjuries(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'injuries');
  }

  async getInjuryForecast(user: JwtPayload) {
    const data = await this.getPayload<{ forecasts: InjuryForecast[] }>(
      this.orgId(user),
      'injury-forecast',
    );

    const avgConfidence = Math.round(
      data.forecasts.reduce((s, f) => s + f.confidence, 0) / data.forecasts.length,
    );
    const avgRelapse = Math.round(
      data.forecasts.reduce((s, f) => s + f.riskAfterReturn, 0) / data.forecasts.length,
    );
    const fastest = data.forecasts.reduce(
      (min, f) => (f.returnDays < min.returnDays ? f : min),
      data.forecasts[0],
    );

    return {
      ...data,
      summary: {
        injuredCount: data.forecasts.length,
        fastestReturnDays: fastest.returnDays,
        avgConfidence,
        avgRelapseRisk: avgRelapse,
      },
    };
  }

  async getTransfer(user: JwtPayload) {
    const data = await this.getPayload<{ transfers: TransferTarget[] }>(
      this.orgId(user),
      'transfer',
    );

    const avgCompat = Math.round(
      data.transfers.reduce((s, t) => s + t.compatibility, 0) / data.transfers.length,
    );
    const maxXg = data.transfers.reduce((max, t) => {
      const n = parseInt(t.xgGain.replace(/\D/g, ''), 10);
      return n > max ? n : max;
    }, 0);

    return {
      ...data,
      summary: {
        targeted: data.transfers.length,
        avgCompatibility: avgCompat,
        maxXgGain: `+${maxXg}%`,
        totalBudget: '5.1M€',
      },
    };
  }

  getMarketValue(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'market-value');
  }

  getScouting(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'scouting');
  }

  getEvolution(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'evolution');
  }

  getTraining(user: JwtPayload) {
    return this.getPayload(this.orgId(user), 'training');
  }
}
