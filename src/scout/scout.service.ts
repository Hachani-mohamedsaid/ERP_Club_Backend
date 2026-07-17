import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isManchesterUnitedOrg,
  MANCHESTER_UNITED_2026_2027,
  MU_SEASON_TAG,
  type ScoutDatasetBundle,
} from './data/manchester-united-2026-2027.dataset';
import { resolvePlayerPhoto, resolvePlayerPhotoAsync } from './data/player-photos';
import { normPlayerName } from './data/player-primary-club';
import { CalendarEventType, Prisma, RecruitmentStatus } from '@prisma/client';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ClubAccessService } from '../club/club-access.service';
import { PrismaService } from '../prisma/prisma.service';

type ScoutExtra = Record<string, unknown>;
type WatchlistNote = { date: string; text: string };

const WORKFLOW_TO_STATUS: Record<string, RecruitmentStatus> = {
  new: 'NON_TRAITE',
  analysis: 'EN_OBSERVATION',
  validation: 'SHORTLISTE',
  signature: 'CONTACTE',
  done: 'CONTACTE',
};

const STATUS_TO_WORKFLOW: Record<RecruitmentStatus, string> = {
  NON_TRAITE: 'new',
  EN_OBSERVATION: 'analysis',
  SHORTLISTE: 'validation',
  CONTACTE: 'signature',
  REFUSE: 'new',
};

const SEED_PROSPECTS = [
  {
    fullName: 'Youssef Ben Ali',
    age: 17,
    position: 'BU',
    externalClub: 'AS Ariana',
    nationality: 'Tunisie',
    potential: 89,
    score: 74,
    status: 'SHORTLISTE' as RecruitmentStatus,
    scoutExtra: {
      legacyId: 'pr1',
      flag: '🇹🇳',
      league: 'Ligue 2 TUN',
      workflow: 'validation',
      priority: 'A',
      aiScore: 92,
      injuryRisk: 12,
      marketValue: '1.2M €',
      valueMK: 1200,
      currentRating: 74,
      foot: 'Droit',
      height: 183,
      weight: 76,
      goals: 18,
      assists: 6,
      matches: 28,
      speed: 88,
      dribble: 84,
      passing: 72,
      defense: 42,
      physical: 80,
      mental: 81,
      contractEnd: '2027-06',
      agent: 'Karim Boutaïeb',
    },
  },
  {
    fullName: 'Nader Trabelsi',
    age: 19,
    position: 'MC',
    externalClub: 'Stade Tunisien',
    nationality: 'Tunisie',
    potential: 84,
    score: 72,
    status: 'EN_OBSERVATION' as RecruitmentStatus,
    scoutExtra: {
      legacyId: 'pr2',
      flag: '🇹🇳',
      league: 'Ligue 1 TUN',
      workflow: 'analysis',
      priority: 'A',
      aiScore: 85,
      injuryRisk: 22,
      marketValue: '850K €',
      valueMK: 850,
      currentRating: 72,
      foot: 'Les deux',
      height: 178,
      weight: 72,
      goals: 8,
      assists: 14,
      matches: 30,
      speed: 76,
      dribble: 80,
      passing: 88,
      defense: 65,
      physical: 74,
      mental: 83,
      contractEnd: '2026-12',
    },
  },
  {
    fullName: 'Mouhamed Diallo',
    age: 21,
    position: 'Ailier G',
    externalClub: 'AFAD Djékanou',
    nationality: 'Côte d\'Ivoire',
    potential: 81,
    score: 71,
    status: 'NON_TRAITE' as RecruitmentStatus,
    scoutExtra: {
      legacyId: 'pr3',
      flag: '🇨🇮',
      league: 'Ligue 1 CI',
      workflow: 'new',
      priority: 'B',
      aiScore: 78,
      injuryRisk: 18,
      marketValue: '750K €',
      valueMK: 750,
      currentRating: 71,
      foot: 'Gauche',
      height: 174,
      weight: 68,
      goals: 12,
      assists: 9,
      matches: 25,
      speed: 92,
      dribble: 88,
      passing: 74,
      defense: 48,
      physical: 72,
      mental: 75,
      contractEnd: '2027-06',
    },
  },
  {
    fullName: 'Karim Sassi',
    age: 22,
    position: 'DC',
    externalClub: 'US Monastir',
    nationality: 'Tunisie',
    potential: 78,
    score: 70,
    status: 'CONTACTE' as RecruitmentStatus,
    scoutExtra: {
      legacyId: 'pr4',
      flag: '🇹🇳',
      league: 'Ligue 1 TUN',
      workflow: 'signature',
      priority: 'B',
      aiScore: 74,
      injuryRisk: 8,
      marketValue: '650K €',
      valueMK: 650,
      currentRating: 70,
      foot: 'Droit',
      height: 190,
      weight: 85,
      goals: 3,
      assists: 1,
      matches: 24,
      speed: 68,
      dribble: 55,
      passing: 70,
      defense: 84,
      physical: 88,
      mental: 80,
      contractEnd: '2028-06',
    },
  },
  {
    fullName: 'Ali Messi',
    age: 20,
    position: 'DG',
    externalClub: 'JS Kabylie',
    nationality: 'Algérie',
    potential: 76,
    score: 68,
    status: 'CONTACTE' as RecruitmentStatus,
    scoutExtra: {
      legacyId: 'pr5',
      flag: '🇩🇿',
      league: 'Ligue 1 DZ',
      workflow: 'done',
      priority: 'C',
      aiScore: 70,
      injuryRisk: 35,
      marketValue: '550K €',
      valueMK: 550,
      currentRating: 68,
      foot: 'Gauche',
      height: 176,
      weight: 71,
      goals: 4,
      assists: 8,
      matches: 22,
      speed: 84,
      dribble: 78,
      passing: 76,
      defense: 72,
      physical: 75,
      mental: 70,
      contractEnd: '2027-06',
    },
  },
  {
    fullName: 'Ibrahim Touré',
    age: 19,
    position: 'MC',
    externalClub: 'Génération Foot',
    nationality: 'Sénégal',
    potential: 86,
    score: 72,
    status: 'EN_OBSERVATION' as RecruitmentStatus,
    scoutExtra: {
      legacyId: 'pr6',
      flag: '🇸🇳',
      league: 'Elite 1 SN',
      workflow: 'analysis',
      priority: 'A',
      aiScore: 88,
      injuryRisk: 14,
      marketValue: '900K €',
      valueMK: 900,
      currentRating: 72,
      foot: 'Droit',
      height: 180,
      weight: 74,
      goals: 6,
      assists: 11,
      matches: 27,
      speed: 82,
      dribble: 85,
      passing: 86,
      defense: 62,
      physical: 78,
      mental: 82,
      contractEnd: '2027-06',
      agent: 'Samba Diallo Agency',
    },
  },
];

const DEFAULT_SCOUT_DATASET: ScoutDatasetBundle = {
  season: '',
  prospects: SEED_PROSPECTS.map((p) => ({
    ...p,
    createdAt: '2026-01-01T10:00:00.000Z',
    scoutExtra: { ...p.scoutExtra, seasonTag: 'default-africa' },
  })),
  reports: [],
  missions: [],
  watchlist: [
    { prospectName: 'Youssef Ben Ali', priority: 'A', notes: [] },
    { prospectName: 'Ibrahim Touré', priority: 'A', notes: [] },
  ],
};

@Injectable()
export class ScoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
  ) {}

  private orgId(user: JwtPayload) {
    return this.access.requireOrganization(user);
  }

  private isScoutSchemaError(err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return err.code === 'P2021' || err.code === 'P2022';
    }
    return err instanceof Error && err.message.includes('does not exist');
  }

  private rethrowDbError(err: unknown): never {
    if (this.isScoutSchemaError(err)) {
      throw new BadRequestException(
        'Base de données scout non à jour. Redéployez le backend sur Render (Manual Deploy).',
      );
    }
    throw err;
  }

  private async withScoutDb<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (!this.isScoutSchemaError(err)) {
        this.rethrowDbError(err);
      }
      await this.prisma.ensureScoutSchema();
      try {
        return await fn();
      } catch (retryErr) {
        this.rethrowDbError(retryErr);
      }
    }
  }

  private extra(p: { scoutExtra: Prisma.JsonValue | null }): ScoutExtra {
    if (!p.scoutExtra || typeof p.scoutExtra !== 'object' || Array.isArray(p.scoutExtra)) {
      return {};
    }
    return p.scoutExtra as ScoutExtra;
  }

  private formatProspect(
    p: {
      id: string;
      fullName: string;
      age: number;
      position: string;
      externalClub: string;
      nationality: string;
      potential: number;
      score: number;
      status: RecruitmentStatus;
      notes: string | null;
      scoutExtra: Prisma.JsonValue | null;
      createdAt: Date;
    },
    watchlist?: { priority: string; notes: Prisma.JsonValue | null } | null,
  ) {
    const ex = this.extra(p);
    const workflow =
      (typeof ex.workflow === 'string' ? ex.workflow : null) ??
      STATUS_TO_WORKFLOW[p.status] ??
      'new';

    let watchlistNotes: WatchlistNote[] = [];
    if (watchlist?.notes && Array.isArray(watchlist.notes)) {
      watchlistNotes = watchlist.notes as WatchlistNote[];
    }

    return {
      id: p.id,
      legacyId: typeof ex.legacyId === 'string' ? ex.legacyId : p.id,
      apiSportsId: typeof ex.apiSportsId === 'number' ? ex.apiSportsId : undefined,
      name: p.fullName,
      age: p.age,
      nationality: p.nationality,
      flag: typeof ex.flag === 'string' ? ex.flag : '🏳️',
      club: p.externalClub,
      league: typeof ex.league === 'string' ? ex.league : '—',
      position: p.position,
      potential: p.potential,
      currentRating: typeof ex.currentRating === 'number' ? ex.currentRating : p.score,
      marketValue: typeof ex.marketValue === 'string' ? ex.marketValue : `${p.potential * 10}K €`,
      valueMK: typeof ex.valueMK === 'number' ? ex.valueMK : Math.round(p.potential * 10),
      priority: watchlist?.priority ?? (typeof ex.priority === 'string' ? ex.priority : 'B'),
      status: workflow,
      aiScore: typeof ex.aiScore === 'number' ? ex.aiScore : p.potential,
      injuryRisk: typeof ex.injuryRisk === 'number' ? ex.injuryRisk : 15,
      foot: typeof ex.foot === 'string' ? ex.foot : 'Droit',
      height: typeof ex.height === 'number' ? ex.height : 178,
      weight: typeof ex.weight === 'number' ? ex.weight : 72,
      goals: typeof ex.goals === 'number' ? ex.goals : 0,
      assists: typeof ex.assists === 'number' ? ex.assists : 0,
      matches: typeof ex.matches === 'number' ? ex.matches : 0,
      speed: typeof ex.speed === 'number' ? ex.speed : 70,
      dribble: typeof ex.dribble === 'number' ? ex.dribble : 70,
      passing: typeof ex.passing === 'number' ? ex.passing : 70,
      defense: typeof ex.defense === 'number' ? ex.defense : 60,
      physical: typeof ex.physical === 'number' ? ex.physical : 70,
      mental: typeof ex.mental === 'number' ? ex.mental : 70,
      contractEnd: typeof ex.contractEnd === 'string' ? ex.contractEnd : '2027-06',
      agent: typeof ex.agent === 'string' ? ex.agent : undefined,
      photoUrl:
        typeof ex.photoUrl === 'string'
          ? ex.photoUrl
          : resolvePlayerPhoto(p.fullName) ?? undefined,
      season:
        typeof ex.seasonTag === 'string' && ex.seasonTag.includes('2026')
          ? '2026-2027'
          : undefined,
      addedDate: p.createdAt.toISOString().split('T')[0],
      notes: watchlistNotes,
      inWatchlist: Boolean(watchlist),
      note: p.notes ?? '',
    };
  }

  private async hasDatasetTag(organizationId: string, tag: string) {
    const rows = await this.prisma.recruitmentProspect.findMany({
      where: { organizationId },
      select: { scoutExtra: true },
      take: 20,
    });
    return rows.some((r) => {
      const ex = (r.scoutExtra ?? {}) as ScoutExtra;
      return ex.seasonTag === tag;
    });
  }

  private async clearScoutOrgData(organizationId: string) {
    await this.prisma.scoutWatchlist.deleteMany({ where: { organizationId } });
    await this.prisma.scoutReport.deleteMany({ where: { organizationId } });
    await this.prisma.recruitmentProspect.deleteMany({ where: { organizationId } });
    await this.prisma.clubCalendarEvent.deleteMany({
      where: { organizationId, eventType: 'SCOUT' },
    });
  }

  private async applyScoutDataset(
    organizationId: string,
    scoutName: string,
    dataset: ScoutDatasetBundle,
  ) {
    for (const seed of dataset.prospects) {
      const photoUrl =
        (typeof seed.scoutExtra.photoUrl === 'string' ? seed.scoutExtra.photoUrl : null) ??
        resolvePlayerPhoto(seed.fullName);
      await this.prisma.recruitmentProspect.create({
        data: {
          organizationId,
          fullName: seed.fullName,
          age: seed.age,
          position: seed.position,
          externalClub: seed.externalClub,
          nationality: seed.nationality,
          potential: seed.potential,
          score: seed.score,
          status: seed.status,
          scoutName,
          scoutExtra: { ...seed.scoutExtra, ...(photoUrl ? { photoUrl } : {}) } as Prisma.InputJsonValue,
          createdAt: new Date(seed.createdAt),
        },
      });
    }

    const prospects = await this.prisma.recruitmentProspect.findMany({
      where: { organizationId },
    });
    const byName = new Map(prospects.map((p) => [p.fullName, p]));

    for (const w of dataset.watchlist) {
      const p = byName.get(w.prospectName);
      if (!p) continue;
      await this.prisma.scoutWatchlist.create({
        data: {
          organizationId,
          prospectId: p.id,
          priority: w.priority,
          scoutName,
          notes: w.notes as Prisma.InputJsonValue,
        },
      });
    }

    for (const r of dataset.reports) {
      const p = byName.get(r.prospectName);
      await this.prisma.scoutReport.create({
        data: {
          organizationId,
          prospectId: p?.id,
          prospectName: r.prospectName,
          scoutName,
          matchObserved: r.matchObserved,
          opponent: r.opponent,
          decision: r.decision,
          aiScore: r.aiScore,
          recommendation: r.recommendation,
          technique: r.aiScore,
          physique: r.aiScore - 2,
          mental: r.aiScore - 1,
          tactique: r.aiScore,
          vitesse: r.aiScore,
          createdAt: new Date(r.createdAt),
        },
      });
    }

    for (const m of dataset.missions) {
      await this.prisma.clubCalendarEvent.create({
        data: {
          organizationId,
          title: m.title,
          eventDate: new Date(m.eventDate),
          eventTime: m.eventTime,
          eventType: 'SCOUT' as CalendarEventType,
          location: m.location,
          notes: m.notes,
          extraData: { seasonTag: MU_SEASON_TAG } as Prisma.InputJsonValue,
        },
      });
    }
  }

  private async ensureSeed(organizationId: string, scoutName: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { clubName: true },
    });

    const isMU = isManchesterUnitedOrg(org?.clubName);
    const dataset = isMU ? MANCHESTER_UNITED_2026_2027 : DEFAULT_SCOUT_DATASET;
    const targetTag = isMU ? MU_SEASON_TAG : 'default-africa';

    const alreadyTagged = await this.hasDatasetTag(organizationId, targetTag);
    if (alreadyTagged) return;

    const count = await this.prisma.recruitmentProspect.count({ where: { organizationId } });
    if (count > 0) {
      if (!isMU) return;
      await this.clearScoutOrgData(organizationId);
    }

    await this.applyScoutDataset(organizationId, scoutName, dataset);
  }

  private monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  private footballSeason(now = new Date()) {
    const y = now.getFullYear();
    // Saison europe/Afrique du Nord : juillet → juin
    return now.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  }

  private computeRecruitmentScore(p: {
    potential: number;
    aiScore: number;
    injuryRisk: number;
    valueMK: number;
    priority: string;
    status: string;
    speed: number;
    passing: number;
    goals: number;
    assists: number;
  }) {
    const priorityBonus = p.priority === 'A' ? 12 : p.priority === 'B' ? 6 : 0;
    const workflowBonus =
      p.status === 'signature' ? 10 :
      p.status === 'validation' ? 8 :
      p.status === 'analysis' ? 4 :
      p.status === 'new' ? 2 : 0;
    const budgetFit = Math.max(0, Math.min(100, 100 - p.valueMK / 40));
    const production = Math.min(100, p.goals * 4 + p.assists * 3);
    const raw =
      p.potential * 0.28 +
      p.aiScore * 0.28 +
      (100 - p.injuryRisk) * 0.12 +
      budgetFit * 0.07 +
      production * 0.05 +
      (p.speed + p.passing) * 0.1 +
      priorityBonus +
      workflowBonus;
    return Math.min(98, Math.max(55, Math.round(raw)));
  }

  private buildRecommendationReasons(p: {
    potential: number;
    aiScore: number;
    speed: number;
    passing: number;
    goals: number;
    assists: number;
    status: string;
    agent?: string;
    contractEnd: string;
    injuryRisk: number;
    valueMK: number;
  }): string[] {
    const reasons: string[] = [];
    if (p.potential >= 85) reasons.push(`Potentiel ${p.potential}/100 — profil elite`);
    else if (p.potential >= 78) reasons.push(`Potentiel solide ${p.potential}/100`);
    if (p.goals >= 8) reasons.push(`${p.goals} buts · efficacité offensive`);
    else if (p.assists >= 8) reasons.push(`${p.assists} passes D · création`);
    if (p.speed >= 85) reasons.push(`Vitesse ${p.speed}/100`);
    if (p.passing >= 85) reasons.push(`Vision ${p.passing}/100`);
    if (p.status === 'validation' || p.status === 'signature') reasons.push('Pipeline avancé — prêt décision');
    if (!p.agent) reasons.push('Sans agent — négociation directe');
    if (p.valueMK <= 1000) reasons.push(`Budget maîtrisé ${p.valueMK >= 1000 ? (p.valueMK / 1000).toFixed(1) + 'M' : p.valueMK + 'K'} €`);
    if (reasons.length === 0) reasons.push(`Score IA ${p.aiScore} · contrat ${p.contractEnd}`);
    return reasons.slice(0, 3);
  }

  private buildRuleBasedRecommendations(
    formatted: {
      id: string;
      name: string;
      position: string;
      age: number;
      club: string;
      flag: string;
      marketValue: string;
      potential: number;
      aiScore: number;
      injuryRisk: number;
      valueMK: number;
      priority: string;
      status: string;
      speed: number;
      passing: number;
      goals: number;
      assists: number;
      agent?: string;
      contractEnd: string;
      photoUrl?: string;
    }[],
  ) {
    return [...formatted]
      .map((p) => ({
        id: p.id,
        name: p.name,
        pos: p.position,
        age: p.age,
        club: p.club,
        flag: p.flag,
        photoUrl: p.photoUrl,
        score: this.computeRecruitmentScore(p),
        budget: p.marketValue,
        reasons: this.buildRecommendationReasons(p),
        warn:
          p.injuryRisk > 25
            ? `Risque blessure ${p.injuryRisk}%`
            : p.status === 'new'
              ? 'Encore en phase observation'
              : undefined,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  private buildPipelineTrend(
    formatted: { addedDate: string; status: string }[],
  ) {
    const now = new Date();
    const points: { month: string; prospects: number; validated: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthLabel = this.monthLabels[monthEnd.getMonth()];
      const monthEndStr = monthEnd.toISOString().split('T')[0];
      const cumProspects = formatted.filter((p) => p.addedDate <= monthEndStr).length;
      const validated = formatted.filter(
        (p) =>
          p.addedDate <= monthEndStr &&
          (p.status === 'done' || p.status === 'signature'),
      ).length;
      points.push({ month: monthLabel, prospects: cumProspects, validated });
    }
    return points;
  }

  private buildInProgressTrend(formatted: { addedDate: string; status: string }[]) {
    const now = new Date();
    const counts: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthEndStr = monthEnd.toISOString().split('T')[0];
      counts.push(
        formatted.filter(
          (p) => p.addedDate <= monthEndStr && p.status !== 'done',
        ).length,
      );
    }
    return counts;
  }

  private countSince<T extends { createdAt: Date }>(items: T[], since: Date) {
    return items.filter((i) => i.createdAt >= since).length;
  }

  private buildMonthlyCounts<T extends { createdAt: Date }>(items: T[]) {
    const now = new Date();
    const counts: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      counts.push(items.filter((p) => p.createdAt >= monthStart && p.createdAt <= monthEnd).length);
    }
    return counts;
  }

  private buildMonthlyValidations(formatted: { addedDate: string; status: string }[]) {
    const now = new Date();
    const counts: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const startStr = monthStart.toISOString().split('T')[0];
      const endStr = monthEnd.toISOString().split('T')[0];
      counts.push(
        formatted.filter(
          (p) =>
            p.addedDate >= startStr &&
            p.addedDate <= endStr &&
            (p.status === 'done' || p.status === 'signature'),
        ).length,
      );
    }
    return counts;
  }

  async getDashboard(user: JwtPayload) {
    return this.withScoutDb(async () => {
    const organizationId = this.orgId(user);
    await this.ensureSeed(organizationId, user.fullName);
    await this.ensureProspectPhotos(organizationId);

    const [prospects, watchlist, reports, missions, org] = await Promise.all([
      this.prisma.recruitmentProspect.findMany({ where: { organizationId } }),
      this.prisma.scoutWatchlist.findMany({ where: { organizationId } }),
      this.prisma.scoutReport.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clubCalendarEvent.findMany({
        where: {
          organizationId,
          eventType: 'SCOUT',
          eventDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        orderBy: { eventDate: 'asc' },
        take: 5,
      }),
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { clubName: true },
      }),
    ]);

    const watchMap = new Map(watchlist.map((w) => [w.prospectId, w]));
    const formatted = prospects.map((p) => this.formatProspect(p, watchMap.get(p.id)));

    const byPos: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    for (const p of formatted) {
      byPos[p.position] = (byPos[p.position] ?? 0) + 1;
      byCountry[p.nationality] = (byCountry[p.nationality] ?? 0) + 1;
    }

    const workflowCounts = {
      new: formatted.filter((p) => p.status === 'new').length,
      analysis: formatted.filter((p) => p.status === 'analysis').length,
      validation: formatted.filter((p) => p.status === 'validation').length,
      signature: formatted.filter((p) => p.status === 'signature').length,
      done: formatted.filter((p) => p.status === 'done').length,
    };

    const aiRecs = this.buildRuleBasedRecommendations(formatted);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const inProgress =
      workflowCounts.new +
      workflowCounts.analysis +
      workflowCounts.validation +
      workflowCounts.signature;

    const priorityCounts = {
      A: formatted.filter((p) => p.priority === 'A').length,
      B: formatted.filter((p) => p.priority === 'B').length,
      C: formatted.filter((p) => p.priority === 'C').length,
    };

    const pipelineTrend = this.buildPipelineTrend(formatted);
    const sparkProspects = pipelineTrend.map((p) => p.prospects);
    const sparkValidated = this.buildMonthlyValidations(formatted);
    const sparkReports = this.buildMonthlyCounts(reports);
    const sparkInProgress = this.buildInProgressTrend(formatted);

    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const priorityABudgetLastMonth = formatted
      .filter((p) => p.priority === 'A' && prospects.find((pr) => pr.id === p.id && pr.createdAt <= endOfLastMonth))
      .reduce((a, p) => a + p.valueMK, 0);
    const priorityABudgetNow = formatted
      .filter((p) => p.priority === 'A')
      .reduce((a, p) => a + p.valueMK, 0);

    return {
      clubName: org?.clubName ?? 'Club',
      season: isManchesterUnitedOrg(org?.clubName)
        ? MANCHESTER_UNITED_2026_2027.season
        : this.footballSeason(now),
      kpis: {
        totalProspects: formatted.length,
        watchlistCount: watchlist.length,
        reportsCount: reports.length,
        validatedCount: workflowCounts.done + workflowCounts.signature,
        inProgress,
        prospectsThisMonth: this.countSince(prospects, startOfMonth),
        reportsThisMonth: this.countSince(reports, startOfMonth),
        validationsThisMonth: Math.max(
          reports.filter(
            (r) =>
              r.createdAt >= startOfMonth &&
              /valid|recommand|sign|short|positif|oui/i.test(r.decision ?? ''),
          ).length,
          formatted.filter(
            (p) =>
              (p.status === 'done' || p.status === 'signature') &&
              p.addedDate >= startOfMonth.toISOString().split('T')[0],
          ).length,
        ),
        avgPotential:
          formatted.length > 0
            ? Math.round((formatted.reduce((a, p) => a + p.potential, 0) / formatted.length) * 10) / 10
            : 0,
        avgAge:
          formatted.length > 0
            ? Math.round((formatted.reduce((a, p) => a + p.age, 0) / formatted.length) * 10) / 10
            : 0,
        priorityABudget: priorityABudgetNow,
        budgetDeltaMK: Math.round((priorityABudgetNow - priorityABudgetLastMonth) / 100) / 10,
      },
      sparklines: {
        prospects: sparkProspects,
        reports: sparkReports,
        validations: sparkValidated,
        inProgress: sparkInProgress,
      },
      byPosition: Object.entries(byPos)
        .map(([name, v]) => ({ name, v }))
        .sort((a, b) => b.v - a.v),
      byCountry: Object.entries(byCountry)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      workflowCounts,
      priorityCounts,
      pipelineTrend,
      aiRecs,
      recentReports: reports.slice(0, 10).map((r) => ({
        id: r.id,
        prospectName: r.prospectName,
        aiScore: r.aiScore,
        decision: r.decision,
        createdAt: r.createdAt.toISOString(),
      })),
      upcomingMissions: missions.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.eventDate.toISOString(),
        time: m.eventTime,
        location: m.location,
        notes: m.notes,
        extra: m.extraData,
      })),
    };
    });
  }

  private pickPreferredProspect<
    T extends {
      id: string;
      fullName: string;
      potential: number;
      scoutExtra: Prisma.JsonValue | null;
      createdAt: Date;
    },
  >(a: T, b: T): T {
    const exA = this.extra(a);
    const exB = this.extra(b);
    const aTagged = typeof exA.seasonTag === 'string';
    const bTagged = typeof exB.seasonTag === 'string';
    if (aTagged && !bTagged) return a;
    if (bTagged && !aTagged) return b;
    const aPhoto = typeof exA.photoUrl === 'string';
    const bPhoto = typeof exB.photoUrl === 'string';
    if (aPhoto && !bPhoto) return a;
    if (bPhoto && !aPhoto) return b;
    if (a.potential !== b.potential) return a.potential >= b.potential ? a : b;
    return a.createdAt <= b.createdAt ? a : b;
  }

  /** Supprime les fiches doublons (même nom) — garde la fiche la plus complète. */
  private async dedupeProspectsInOrg(organizationId: string) {
    const rows = await this.prisma.recruitmentProspect.findMany({
      where: { organizationId },
    });
    if (rows.length <= 1) return;

    const groups = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = normPlayerName(row.fullName);
      const group = groups.get(key) ?? [];
      group.push(row);
      groups.set(key, group);
    }

    for (const group of groups.values()) {
      if (group.length <= 1) continue;

      let keep = group[0];
      for (let i = 1; i < group.length; i++) {
        keep = this.pickPreferredProspect(keep, group[i]);
      }

      for (const dup of group) {
        if (dup.id === keep.id) continue;

        const wl = await this.prisma.scoutWatchlist.findUnique({
          where: { organizationId_prospectId: { organizationId, prospectId: dup.id } },
        });
        if (wl) {
          const keepWl = await this.prisma.scoutWatchlist.findUnique({
            where: { organizationId_prospectId: { organizationId, prospectId: keep.id } },
          });
          if (!keepWl) {
            await this.prisma.scoutWatchlist.update({
              where: { id: wl.id },
              data: { prospectId: keep.id },
            });
          } else {
            await this.prisma.scoutWatchlist.delete({ where: { id: wl.id } });
          }
        }

        await this.prisma.scoutReport.updateMany({
          where: { organizationId, prospectId: dup.id },
          data: { prospectId: keep.id },
        });

        await this.prisma.recruitmentProspect.delete({ where: { id: dup.id } });
      }
    }
  }

  private async findProspectByName(organizationId: string, fullName: string) {
    const key = normPlayerName(fullName);
    const rows = await this.prisma.recruitmentProspect.findMany({ where: { organizationId } });
    return rows.find((r) => normPlayerName(r.fullName) === key) ?? null;
  }

  private async ensureProspectPhotos(organizationId: string) {
    const rows = await this.prisma.recruitmentProspect.findMany({
      where: { organizationId },
      select: { id: true, fullName: true, scoutExtra: true },
    });

    for (const row of rows) {
      const ex = this.extra(row);
      if (typeof ex.photoUrl === 'string' && ex.photoUrl.startsWith('http')) continue;

      const photoUrl =
        resolvePlayerPhoto(row.fullName) ?? (await resolvePlayerPhotoAsync(row.fullName));
      if (!photoUrl) continue;

      await this.prisma.recruitmentProspect.update({
        where: { id: row.id },
        data: {
          scoutExtra: { ...ex, photoUrl } as Prisma.InputJsonValue,
        },
      });
    }
  }

  async listProspects(user: JwtPayload) {
    return this.withScoutDb(async () => {
      const organizationId = this.orgId(user);
      await this.ensureSeed(organizationId, user.fullName);
      await this.dedupeProspectsInOrg(organizationId);
      await this.ensureProspectPhotos(organizationId);

      const [prospects, watchlist] = await Promise.all([
        this.prisma.recruitmentProspect.findMany({
          where: { organizationId },
          orderBy: { potential: 'desc' },
        }),
        this.prisma.scoutWatchlist.findMany({ where: { organizationId } }),
      ]);

      const watchMap = new Map(watchlist.map((w) => [w.prospectId, w]));
      return prospects.map((p) => this.formatProspect(p, watchMap.get(p.id)));
    });
  }

  async getProspect(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const prospect = await this.prisma.recruitmentProspect.findFirst({
      where: { id, organizationId },
    });
    if (!prospect) throw new NotFoundException('Prospect introuvable.');

    const watch = await this.prisma.scoutWatchlist.findUnique({
      where: { organizationId_prospectId: { organizationId, prospectId: id } },
    });

    return this.formatProspect(prospect, watch);
  }

  async createProspect(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const fullName = String(data.name ?? data.fullName ?? '').trim();
    if (!fullName) throw new BadRequestException('Nom requis.');

    const existing = await this.findProspectByName(organizationId, fullName);
    if (existing) {
      const currentExtra = this.extra(existing);
      const apiSportsId = Number(data.apiSportsId ?? 0);
      const incomingLegacyId = typeof data.legacyId === 'string' ? data.legacyId : undefined;
      const shouldUpdateExtra =
        (apiSportsId > 0 && typeof currentExtra.apiSportsId !== 'number') ||
        (incomingLegacyId && typeof currentExtra.legacyId !== 'string') ||
        (typeof data.photoUrl === 'string' && typeof currentExtra.photoUrl !== 'string');

      const saved = shouldUpdateExtra
        ? await this.prisma.recruitmentProspect.update({
            where: { id: existing.id },
            data: {
              scoutExtra: {
                ...currentExtra,
                ...(apiSportsId > 0 ? { apiSportsId } : {}),
                ...(incomingLegacyId ? { legacyId: incomingLegacyId } : {}),
                ...(typeof data.photoUrl === 'string' ? { photoUrl: data.photoUrl } : {}),
              } as Prisma.InputJsonValue,
            },
          })
        : existing;
      const watch = await this.prisma.scoutWatchlist.findUnique({
        where: { organizationId_prospectId: { organizationId, prospectId: saved.id } },
      });
      return this.formatProspect(saved, watch ?? undefined);
    }

    const scoutExtra: ScoutExtra = {
      ...(typeof data.legacyId === 'string' ? { legacyId: data.legacyId } : {}),
      ...(Number(data.apiSportsId ?? 0) > 0 ? { apiSportsId: Number(data.apiSportsId) } : {}),
      flag: data.flag ?? '🏳️',
      league: data.league ?? '—',
      workflow: 'new',
      priority: data.priority ?? 'B',
      aiScore: Number(data.aiScore ?? data.potential ?? 70),
      injuryRisk: Number(data.injuryRisk ?? 15),
      marketValue: data.marketValue ?? `${Number(data.valueMK ?? 500)}K €`,
      valueMK: Number(data.valueMK ?? 500),
      currentRating: Number(data.currentRating ?? data.score ?? 65),
      foot: data.foot ?? 'Droit',
      height: Number(data.height ?? 178),
      weight: Number(data.weight ?? 72),
      goals: Number(data.goals ?? 0),
      assists: Number(data.assists ?? 0),
      matches: Number(data.matches ?? 0),
      speed: Number(data.speed ?? 70),
      dribble: Number(data.dribble ?? 70),
      passing: Number(data.passing ?? 70),
      defense: Number(data.defense ?? 60),
      physical: Number(data.physical ?? 70),
      mental: Number(data.mental ?? 70),
      contractEnd: data.contractEnd ?? '2027-06',
      ...(typeof data.photoUrl === 'string' ? { photoUrl: data.photoUrl } : {}),
    };

    const p = await this.prisma.recruitmentProspect.create({
      data: {
        organizationId,
        fullName,
        age: Number(data.age ?? 0),
        position: String(data.position ?? 'MC'),
        externalClub: String(data.club ?? data.externalClub ?? '—'),
        nationality: String(data.nationality ?? 'TN'),
        potential: Number(data.potential ?? 70),
        score: Number(data.score ?? data.currentRating ?? 65),
        status: 'NON_TRAITE',
        scoutName: user.fullName,
        scoutExtra: scoutExtra as Prisma.InputJsonValue,
      },
    });

    return this.formatProspect(p);
  }

  async updateProspect(user: JwtPayload, id: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.recruitmentProspect.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException('Prospect introuvable.');

    const ex = { ...this.extra(existing), ...(data.scoutExtra as ScoutExtra | undefined) };
    if (data.workflow) {
      ex.workflow = String(data.workflow);
    }

    const workflow = typeof ex.workflow === 'string' ? ex.workflow : STATUS_TO_WORKFLOW[existing.status];
    const status = WORKFLOW_TO_STATUS[workflow] ?? existing.status;

    const updated = await this.prisma.recruitmentProspect.update({
      where: { id },
      data: {
        fullName: data.name ? String(data.name) : undefined,
        age: data.age !== undefined ? Number(data.age) : undefined,
        position: data.position ? String(data.position) : undefined,
        externalClub: data.club ? String(data.club) : undefined,
        nationality: data.nationality ? String(data.nationality) : undefined,
        potential: data.potential !== undefined ? Number(data.potential) : undefined,
        score: data.score !== undefined ? Number(data.score) : undefined,
        status,
        notes: data.note !== undefined ? String(data.note) : undefined,
        scoutExtra: ex as Prisma.InputJsonValue,
      },
    });

    if (data.priority) {
      await this.prisma.scoutWatchlist.upsert({
        where: { organizationId_prospectId: { organizationId, prospectId: id } },
        create: {
          organizationId,
          prospectId: id,
          priority: String(data.priority),
          scoutName: user.fullName,
        },
        update: { priority: String(data.priority) },
      });
    }

    const watch = await this.prisma.scoutWatchlist.findUnique({
      where: { organizationId_prospectId: { organizationId, prospectId: id } },
    });

    return this.formatProspect(updated, watch);
  }

  async listWatchlist(user: JwtPayload) {
    const organizationId = this.orgId(user);
    try {
      await this.ensureSeed(organizationId, user.fullName);

      const entries = await this.prisma.scoutWatchlist.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      });

      const prospectIds = entries.map((e) => e.prospectId);
      const prospects = await this.prisma.recruitmentProspect.findMany({
        where: { organizationId, id: { in: prospectIds } },
      });

      const prospectMap = new Map(prospects.map((p) => [p.id, p]));
      return entries
        .map((e) => {
          const p = prospectMap.get(e.prospectId);
          if (!p) return null;
          return this.formatProspect(p, e);
        })
        .filter(Boolean);
    } catch (err) {
      this.rethrowDbError(err);
    }
  }

  async addToWatchlist(user: JwtPayload, prospectId: string, priority = 'B') {
    const organizationId = this.orgId(user);
    const prospect = await this.prisma.recruitmentProspect.findFirst({
      where: { id: prospectId, organizationId },
    });
    if (!prospect) throw new NotFoundException('Prospect introuvable.');

    await this.prisma.scoutWatchlist.upsert({
      where: { organizationId_prospectId: { organizationId, prospectId } },
      create: { organizationId, prospectId, priority, scoutName: user.fullName },
      update: { priority },
    });

    return { ok: true, prospectId };
  }

  async removeFromWatchlist(user: JwtPayload, prospectId: string) {
    const organizationId = this.orgId(user);
    await this.prisma.scoutWatchlist.deleteMany({
      where: { organizationId, prospectId },
    });
    return { ok: true };
  }

  async updateWatchlistPriority(user: JwtPayload, prospectId: string, priority: string) {
    const organizationId = this.orgId(user);
    const entry = await this.prisma.scoutWatchlist.findUnique({
      where: { organizationId_prospectId: { organizationId, prospectId } },
    });
    if (!entry) throw new NotFoundException('Entrée watchlist introuvable.');

    await this.prisma.scoutWatchlist.update({
      where: { id: entry.id },
      data: { priority },
    });
    return { ok: true };
  }

  async addWatchlistNote(user: JwtPayload, prospectId: string, text: string) {
    const organizationId = this.orgId(user);
    const entry = await this.prisma.scoutWatchlist.findUnique({
      where: { organizationId_prospectId: { organizationId, prospectId } },
    });
    if (!entry) throw new NotFoundException('Prospect non présent en watchlist.');

    const notes = Array.isArray(entry.notes) ? (entry.notes as WatchlistNote[]) : [];
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    notes.unshift({ date: today, text });

    await this.prisma.scoutWatchlist.update({
      where: { id: entry.id },
      data: { notes: notes as unknown as Prisma.InputJsonValue },
    });

    return { ok: true, notes };
  }

  async removeWatchlistNote(user: JwtPayload, prospectId: string, index: number) {
    const organizationId = this.orgId(user);
    const entry = await this.prisma.scoutWatchlist.findUnique({
      where: { organizationId_prospectId: { organizationId, prospectId } },
    });
    if (!entry) throw new NotFoundException('Entrée watchlist introuvable.');

    const notes = Array.isArray(entry.notes) ? (entry.notes as WatchlistNote[]) : [];
    notes.splice(index, 1);

    await this.prisma.scoutWatchlist.update({
      where: { id: entry.id },
      data: { notes: notes as unknown as Prisma.InputJsonValue },
    });

    return { ok: true, notes };
  }

  async listReports(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const reports = await this.prisma.scoutReport.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return reports.map((r) => ({
      id: r.id,
      prospectId: r.prospectId,
      prospectName: r.prospectName,
      scoutName: r.scoutName,
      matchDate: r.matchDate,
      matchObserved: r.matchObserved,
      opponent: r.opponent,
      technique: r.technique,
      physique: r.physique,
      mental: r.mental,
      tactique: r.tactique,
      vitesse: r.vitesse,
      strengths: r.strengths,
      weaknesses: r.weaknesses,
      recommendation: r.recommendation,
      decision: r.decision,
      aiScore: r.aiScore,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createReport(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const prospectName = String(data.prospectName ?? '').trim();
    if (!prospectName) throw new BadRequestException('Joueur requis.');

    const report = await this.prisma.scoutReport.create({
      data: {
        organizationId,
        prospectId: data.prospectId ? String(data.prospectId) : null,
        prospectName,
        scoutName: user.fullName,
        matchDate: data.matchDate ? String(data.matchDate) : null,
        matchObserved: data.matchObserved ? String(data.matchObserved) : null,
        opponent: data.opponent ? String(data.opponent) : null,
        technique: Number(data.technique ?? 0),
        physique: Number(data.physique ?? 0),
        mental: Number(data.mental ?? 0),
        tactique: Number(data.tactique ?? 0),
        vitesse: Number(data.vitesse ?? 0),
        strengths: data.strengths ? String(data.strengths) : null,
        weaknesses: data.weaknesses ? String(data.weaknesses) : null,
        recommendation: data.recommendation ? String(data.recommendation) : null,
        decision: String(data.decision ?? 'observe'),
        aiScore: data.aiScore !== undefined ? Number(data.aiScore) : null,
        status: 'submitted',
      },
    });

    if (data.prospectId && data.decision) {
      const workflowMap: Record<string, string> = {
        recruit: 'validation',
        shortlist: 'validation',
        observe: 'analysis',
        refuse: 'new',
      };
      const workflow = workflowMap[String(data.decision)] ?? 'analysis';
      await this.updateProspect(user, String(data.prospectId), { workflow });
    }

    return { id: report.id, ok: true };
  }

  async listMissions(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const events = await this.prisma.clubCalendarEvent.findMany({
      where: { organizationId, eventType: 'SCOUT' },
      orderBy: { eventDate: 'asc' },
    });
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.eventDate.toISOString(),
      time: e.eventTime,
      location: e.location,
      notes: e.notes,
      extra: e.extraData,
    }));
  }

  async createMission(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const title = String(data.title ?? '').trim();
    if (!title) throw new BadRequestException('Titre requis.');

    const eventDate = data.date ? new Date(String(data.date)) : new Date();
    const event = await this.prisma.clubCalendarEvent.create({
      data: {
        organizationId,
        title,
        eventDate,
        eventTime: data.time ? String(data.time) : null,
        eventType: CalendarEventType.SCOUT,
        location: data.location ? String(data.location) : null,
        notes: data.notes ? String(data.notes) : null,
        extraData: {
          opponent: data.opponent ?? null,
          prospectName: data.prospectName ?? null,
          prospectId: data.prospectId ?? null,
          matchType: data.matchType ?? 'live',
        } as Prisma.InputJsonValue,
      },
    });

    return {
      id: event.id,
      title: event.title,
      date: event.eventDate.toISOString(),
      time: event.eventTime,
      location: event.location,
      notes: event.notes,
      extra: event.extraData,
    };
  }

  private defaultScoutPrefs() {
    return {
      specialization: 'Attaquants & Milieux offensifs',
      regions: ['Europe', 'Afrique du Nord'] as string[],
      positions: ['BU', 'MC', 'Ailier G'] as string[],
      budgetMax: '25',
      ageMin: '16',
      ageMax: '25',
      notifyNewProspect: true,
      notifyShortlist: true,
      notifyMissionReminder: true,
      language: 'fr',
    };
  }

  async getScoutProfile(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [dbUser, org, prospects, watchlist, reports, missions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, fullName: true, email: true, phone: true, role: true },
      }),
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { clubName: true, country: true, league: true },
      }),
      this.prisma.recruitmentProspect.findMany({
        where: { organizationId },
        select: { id: true, status: true, scoutExtra: true },
      }),
      this.prisma.scoutWatchlist.count({ where: { organizationId } }),
      this.prisma.scoutReport.findMany({
        where: { organizationId },
        select: { id: true, createdAt: true, decision: true },
      }),
      this.prisma.clubCalendarEvent.findMany({
        where: { organizationId, eventType: 'SCOUT' },
        select: { id: true, eventDate: true },
      }),
    ]);

    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (settings?.extendedSettings ?? {}) as Record<string, unknown>;
    const store = (extended.scoutProfiles ?? {}) as Record<string, Record<string, unknown>>;
    const saved = store[user.sub] ?? {};
    const prefs = { ...this.defaultScoutPrefs(), ...saved };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const missionsThisMonth = missions.filter((m) => m.eventDate >= monthStart).length;
    const reportsThisMonth = reports.filter((r) => r.createdAt >= monthStart).length;
    const advanced = prospects.filter((p) => {
      const ex = (p.scoutExtra ?? {}) as ScoutExtra;
      const wf = typeof ex.workflow === 'string' ? ex.workflow : STATUS_TO_WORKFLOW[p.status];
      return wf === 'validation' || wf === 'signature' || wf === 'done';
    }).length;
    const conversion =
      prospects.length > 0 ? Math.round((advanced / prospects.length) * 100) : 0;

    return {
      fullName: dbUser?.fullName ?? user.fullName ?? 'Scout',
      email: dbUser?.email ?? user.email ?? '',
      phone: typeof saved.phone === 'string' ? saved.phone : dbUser?.phone ?? '',
      clubName: org?.clubName ?? 'Club',
      country: org?.country ?? '',
      league: org?.league ?? '',
      role: 'Scout',
      specialization: String(prefs.specialization),
      regions: Array.isArray(prefs.regions) ? (prefs.regions as string[]) : this.defaultScoutPrefs().regions,
      positions: Array.isArray(prefs.positions)
        ? (prefs.positions as string[])
        : this.defaultScoutPrefs().positions,
      budgetMax: String(prefs.budgetMax ?? '25'),
      ageMin: String(prefs.ageMin ?? '16'),
      ageMax: String(prefs.ageMax ?? '25'),
      notifyNewProspect: prefs.notifyNewProspect !== false,
      notifyShortlist: prefs.notifyShortlist !== false,
      notifyMissionReminder: prefs.notifyMissionReminder !== false,
      language: String(prefs.language ?? 'fr'),
      stats: {
        missionsThisMonth,
        reportsSubmitted: reports.length,
        reportsThisMonth,
        prospectsFollowed: watchlist,
        prospectsTotal: prospects.length,
        conversionRate: conversion,
      },
      season: '2026-2027',
    };
  }

  async updateScoutProfile(user: JwtPayload, body: Record<string, unknown>) {
    const prefs = {
      specialization: String(body.specialization ?? this.defaultScoutPrefs().specialization),
      regions: Array.isArray(body.regions) ? body.regions.map(String) : this.defaultScoutPrefs().regions,
      positions: Array.isArray(body.positions)
        ? body.positions.map(String)
        : this.defaultScoutPrefs().positions,
      budgetMax: String(body.budgetMax ?? '25'),
      ageMin: String(body.ageMin ?? '16'),
      ageMax: String(body.ageMax ?? '25'),
      notifyNewProspect: body.notifyNewProspect !== false,
      notifyShortlist: body.notifyShortlist !== false,
      notifyMissionReminder: body.notifyMissionReminder !== false,
      language: String(body.language ?? 'fr'),
      phone: body.phone !== undefined ? String(body.phone) : undefined,
      updatedAt: new Date().toISOString(),
    };

    if (typeof body.fullName === 'string' && body.fullName.trim()) {
      await this.prisma.user.update({
        where: { id: user.sub },
        data: {
          fullName: body.fullName.trim(),
          ...(prefs.phone !== undefined ? { phone: prefs.phone } : {}),
        },
      });
    } else if (prefs.phone !== undefined) {
      await this.prisma.user.update({
        where: { id: user.sub },
        data: { phone: prefs.phone },
      });
    }

    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (settings?.extendedSettings ?? {}) as Record<string, unknown>;
    const store = (extended.scoutProfiles ?? {}) as Record<string, Record<string, unknown>>;
    store[user.sub] = { ...store[user.sub], ...prefs };

    await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        extendedSettings: { ...extended, scoutProfiles: store } as never,
      },
      update: {
        extendedSettings: { ...extended, scoutProfiles: store } as never,
      },
    });

    return this.getScoutProfile(user);
  }
}
