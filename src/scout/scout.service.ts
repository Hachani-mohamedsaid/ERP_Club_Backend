import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class ScoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
  ) {}

  private orgId(user: JwtPayload) {
    return this.access.requireOrganization(user);
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
      addedDate: p.createdAt.toISOString().split('T')[0],
      notes: watchlistNotes,
      inWatchlist: Boolean(watchlist),
      note: p.notes ?? '',
    };
  }

  private async ensureSeed(organizationId: string, scoutName: string) {
    const count = await this.prisma.recruitmentProspect.count({ where: { organizationId } });
    if (count > 0) return;

    for (const seed of SEED_PROSPECTS) {
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
          scoutExtra: seed.scoutExtra as Prisma.InputJsonValue,
        },
      });
    }

    const prospects = await this.prisma.recruitmentProspect.findMany({ where: { organizationId } });
    const pr1 = prospects.find((p) => p.fullName === 'Youssef Ben Ali');
    const pr6 = prospects.find((p) => p.fullName === 'Ibrahim Touré');
    if (pr1) {
      await this.prisma.scoutWatchlist.create({
        data: { organizationId, prospectId: pr1.id, priority: 'A', scoutName },
      });
    }
    if (pr6) {
      await this.prisma.scoutWatchlist.create({
        data: { organizationId, prospectId: pr6.id, priority: 'A', scoutName },
      });
    }
  }

  async getDashboard(user: JwtPayload) {
    const organizationId = this.orgId(user);
    await this.ensureSeed(organizationId, user.fullName);

    const [prospects, watchlist, reports, missions] = await Promise.all([
      this.prisma.recruitmentProspect.findMany({ where: { organizationId } }),
      this.prisma.scoutWatchlist.findMany({ where: { organizationId } }),
      this.prisma.scoutReport.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.clubCalendarEvent.findMany({
        where: { organizationId, eventType: 'SCOUT' },
        orderBy: { eventDate: 'asc' },
        take: 5,
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

    const aiRecs = [...formatted]
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        name: p.name,
        pos: p.position,
        age: p.age,
        club: p.club,
        flag: p.flag,
        score: p.aiScore,
        budget: p.marketValue,
        reasons: [
          `Potentiel ${p.potential}/100`,
          `Score IA ${p.aiScore}`,
          p.agent ? `Agent: ${p.agent}` : 'Négociation directe possible',
        ],
        warn: p.injuryRisk > 25 ? `Risque blessure ${p.injuryRisk}%` : undefined,
      }));

    return {
      kpis: {
        totalProspects: formatted.length,
        watchlistCount: watchlist.length,
        reportsCount: reports.length,
        validatedCount: workflowCounts.done + workflowCounts.signature,
        avgPotential:
          formatted.length > 0
            ? Math.round((formatted.reduce((a, p) => a + p.potential, 0) / formatted.length) * 10) / 10
            : 0,
        avgAge:
          formatted.length > 0
            ? Math.round((formatted.reduce((a, p) => a + p.age, 0) / formatted.length) * 10) / 10
            : 0,
        priorityABudget: formatted
          .filter((p) => p.priority === 'A')
          .reduce((a, p) => a + p.valueMK, 0),
      },
      byPosition: Object.entries(byPos).map(([name, v]) => ({ name, v })),
      byCountry: Object.entries(byCountry).map(([name, value]) => ({ name, value })),
      workflowCounts,
      aiRecs,
      recentReports: reports.map((r) => ({
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
  }

  async listProspects(user: JwtPayload) {
    const organizationId = this.orgId(user);
    await this.ensureSeed(organizationId, user.fullName);

    const [prospects, watchlist] = await Promise.all([
      this.prisma.recruitmentProspect.findMany({
        where: { organizationId },
        orderBy: { potential: 'desc' },
      }),
      this.prisma.scoutWatchlist.findMany({ where: { organizationId } }),
    ]);

    const watchMap = new Map(watchlist.map((w) => [w.prospectId, w]));
    return prospects.map((p) => this.formatProspect(p, watchMap.get(p.id)));
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

    const scoutExtra: ScoutExtra = {
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
}
