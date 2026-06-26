import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ClubAccessService } from './club-access.service';

type LoadStatus = 'Critique' | 'Attention' | 'Normal';

function computeStatus(load: number, fatigue: number): LoadStatus {
  if (load >= 85 || fatigue >= 75) return 'Critique';
  if (load >= 70 || fatigue >= 55) return 'Attention';
  return 'Normal';
}

const STATUS_ORDER: Record<LoadStatus, number> = { Critique: 0, Attention: 1, Normal: 2 };

@Injectable()
export class PreparateurService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
  ) {}

  private orgId(user: JwtPayload) {
    return this.access.requireOrganization(user);
  }

  // ─── Charge Équipe ─────────────────────────────────────────────
  async getChargeEquipe(user: JwtPayload) {
    const organizationId = this.orgId(user);

    const [players, loads] = await Promise.all([
      this.prisma.clubPlayer.findMany({
        where: { organizationId },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.playerLoad.findMany({
        where: { organizationId },
        orderBy: { sessionDate: 'desc' },
      }),
    ]);

    // Garde uniquement la charge la plus récente par joueur
    const latestByPlayer = new Map<string, (typeof loads)[0]>();
    for (const load of loads) {
      if (!latestByPlayer.has(load.playerId)) {
        latestByPlayer.set(load.playerId, load);
      }
    }

    const rows = players.map((player) => {
      const load = latestByPlayer.get(player.id);
      const { load: defLoad, fatigue: defFatigue, recovery: defRecovery } =
        this.defaultScores(player.status);

      const loadScore = load?.loadScore ?? defLoad;
      const fatigueScore = load?.fatigueScore ?? defFatigue;
      const recoveryScore = load?.recoveryScore ?? defRecovery;
      const statut = computeStatus(loadScore, fatigueScore);

      return {
        id: player.id,
        name: player.fullName,
        position: player.position,
        loadScore,
        fatigueScore,
        recoveryScore,
        statut,
        sessionDate: load?.sessionDate?.toISOString() ?? null,
        loadId: load?.id ?? null,
      };
    });

    rows.sort((a, b) => STATUS_ORDER[a.statut] - STATUS_ORDER[b.statut]);

    const critiques = rows.filter((r) => r.statut === 'Critique').length;
    const attentions = rows.filter((r) => r.statut === 'Attention').length;
    const avgLoad =
      rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + r.loadScore, 0) / rows.length)
        : 0;

    return { players: rows, summary: { critiques, attentions, avgLoad, total: rows.length } };
  }

  // ─── Ajuster la charge d'un joueur ─────────────────────────────
  async adjustPlayerLoad(user: JwtPayload, playerId: string, delta: number) {
    const organizationId = this.orgId(user);

    const player = await this.prisma.clubPlayer.findFirst({
      where: { id: playerId, organizationId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');

    const existing = await this.prisma.playerLoad.findFirst({
      where: { playerId, organizationId },
      orderBy: { sessionDate: 'desc' },
    });

    const { load: defLoad, fatigue: defFatigue, recovery: defRecovery } =
      this.defaultScores(player.status);

    const prevLoad = existing?.loadScore ?? defLoad;
    const prevFatigue = existing?.fatigueScore ?? defFatigue;

    const newLoad = Math.min(100, Math.max(0, prevLoad + delta));
    // La fatigue suit partiellement la charge
    const fatigueDelta = delta > 0 ? Math.round(delta * 0.4) : Math.round(delta * 0.25);
    const newFatigue = Math.min(100, Math.max(0, prevFatigue + fatigueDelta));
    // La récupération est inversément proportionnelle
    const newRecovery = Math.min(100, Math.max(0, Math.round(100 - newLoad * 0.45 - newFatigue * 0.25)));

    let load;
    if (existing) {
      load = await this.prisma.playerLoad.update({
        where: { id: existing.id },
        data: {
          loadScore: newLoad,
          fatigueScore: newFatigue,
          recoveryScore: newRecovery,
          sessionDate: new Date(),
        },
      });
    } else {
      load = await this.prisma.playerLoad.create({
        data: {
          organizationId,
          playerId,
          loadScore: newLoad,
          fatigueScore: newFatigue,
          recoveryScore: newRecovery,
          sessionDate: new Date(),
        },
      });
    }

    const statut = computeStatus(load.loadScore, load.fatigueScore);
    return {
      id: player.id,
      name: player.fullName,
      position: player.position,
      loadScore: load.loadScore,
      fatigueScore: load.fatigueScore,
      recoveryScore: load.recoveryScore,
      statut,
      sessionDate: load.sessionDate.toISOString(),
      loadId: load.id,
    };
  }

  // ─── Saisie manuelle des scores ────────────────────────────────
  async setPlayerLoad(
    user: JwtPayload,
    playerId: string,
    data: { loadScore: number; fatigueScore: number; recoveryScore?: number; notes?: string },
  ) {
    const organizationId = this.orgId(user);

    const player = await this.prisma.clubPlayer.findFirst({
      where: { id: playerId, organizationId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');

    const loadScore = Math.min(100, Math.max(0, data.loadScore));
    const fatigueScore = Math.min(100, Math.max(0, data.fatigueScore));
    const recoveryScore =
      data.recoveryScore != null
        ? Math.min(100, Math.max(0, data.recoveryScore))
        : Math.min(100, Math.max(0, Math.round(100 - loadScore * 0.45 - fatigueScore * 0.25)));

    const load = await this.prisma.playerLoad.create({
      data: {
        organizationId,
        playerId,
        loadScore,
        fatigueScore,
        recoveryScore,
        notes: data.notes,
        sessionDate: new Date(),
      },
    });

    const statut = computeStatus(load.loadScore, load.fatigueScore);
    return {
      id: player.id,
      name: player.fullName,
      position: player.position,
      loadScore: load.loadScore,
      fatigueScore: load.fatigueScore,
      recoveryScore: load.recoveryScore,
      statut,
      sessionDate: load.sessionDate.toISOString(),
      loadId: load.id,
    };
  }

  // ─── Historique charges d'un joueur ───────────────────────────
  async getPlayerLoadHistory(user: JwtPayload, playerId: string) {
    const organizationId = this.orgId(user);

    const player = await this.prisma.clubPlayer.findFirst({
      where: { id: playerId, organizationId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');

    const history = await this.prisma.playerLoad.findMany({
      where: { playerId, organizationId },
      orderBy: { sessionDate: 'desc' },
      take: 30,
    });

    return {
      player: { id: player.id, name: player.fullName, position: player.position },
      history: history.map((h) => ({
        id: h.id,
        sessionDate: h.sessionDate.toISOString(),
        loadScore: h.loadScore,
        fatigueScore: h.fatigueScore,
        recoveryScore: h.recoveryScore,
        sessionType: h.sessionType,
        notes: h.notes,
        statut: computeStatus(h.loadScore, h.fatigueScore),
      })),
    };
  }

  // ─── Condition Physique ────────────────────────────────────────
  async getPhysicalCondition(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const players = await this.prisma.clubPlayer.findMany({
      where: { organizationId },
      orderBy: { fullName: 'asc' },
    });

    const MONTHS = ['Mars', 'Avr', 'Mai', 'Juin'];

    return players.map((p) => {
      const r = (p.radar as Record<string, number> | null) ?? {};
      const pace       = r.pace       ?? 60;
      const shooting   = r.shooting   ?? 60;
      const passing    = r.passing    ?? 60;
      const dribbling  = r.dribbling  ?? 60;
      const defending  = r.defending  ?? 60;
      const physical   = r.physical   ?? 60;

      const speed      = pace;
      const endurance  = Math.round(physical * 0.6 + passing * 0.4);
      const force      = Math.round(physical * 0.7 + defending * 0.3);
      const explosivity = shooting;
      const agility    = dribbling;
      const recovery   = Math.min(99, Math.max(30, Math.round(100 - pace * 0.25 - physical * 0.15)));

      // Évolution progressive sur 4 mois (tendance montante vers valeurs actuelles)
      const evolution = MONTHS.map((month, i) => {
        const factor = (i + 1) / 4;
        return {
          month,
          speed:     Math.round(speed     * (0.94 + factor * 0.06)),
          endurance: Math.round(endurance * (0.94 + factor * 0.06)),
        };
      });

      return { id: p.id, name: p.fullName, position: p.position, ovr: p.ovr, speed, endurance, force, explosivity, agility, recovery, evolution };
    });
  }

  // ─── Dashboard Préparateur ─────────────────────────────────────
  async getDashboard(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [players, loads, injuryRisks, org] = await Promise.all([
      this.prisma.clubPlayer.findMany({ where: { organizationId } }),
      this.prisma.playerLoad.findMany({ where: { organizationId }, orderBy: { sessionDate: 'desc' } }),
      this.prisma.injuryRisk.findMany({ where: { organizationId }, include: { player: { select: { fullName: true } } }, orderBy: { risk: 'desc' } }),
      this.prisma.organization.findUnique({ where: { id: organizationId }, select: { clubName: true } }),
    ]);

    // Dernière charge par joueur
    const latestByPlayer = new Map<string, (typeof loads)[0]>();
    for (const load of loads) {
      if (!latestByPlayer.has(load.playerId)) latestByPlayer.set(load.playerId, load);
    }

    const playerLoads = players.map((p) => {
      const load = latestByPlayer.get(p.id);
      const { load: defLoad, fatigue: defFatigue, recovery: defRecovery } = this.defaultScores(p.status);
      const loadScore = load?.loadScore ?? defLoad;
      const fatigueScore = load?.fatigueScore ?? defFatigue;
      const recoveryScore = load?.recoveryScore ?? defRecovery;
      return { id: p.id, name: p.fullName, status: p.status, loadScore, fatigueScore, recoveryScore, statut: computeStatus(loadScore, fatigueScore) };
    });

    const disponibles = players.filter((p) => p.status === 'DISPONIBLE').length;
    const avgLoad = playerLoads.length > 0 ? Math.round(playerLoads.reduce((s, p) => s + p.loadScore, 0) / playerLoads.length) : 0;
    const fatigueHigh = playerLoads.filter((p) => p.fatigueScore >= 55).length;

    // Historique 7 jours
    const recentLoads = loads.filter((l) => l.sessionDate >= sevenDaysAgo);
    const loadHistory: { day: string; load: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const dayLoads = recentLoads.filter((l) => l.sessionDate >= date && l.sessionDate < nextDate);
      const dayAvg = dayLoads.length > 0 ? Math.round(dayLoads.reduce((s, l) => s + l.loadScore, 0) / dayLoads.length) : avgLoad;
      loadHistory.push({ day: DAYS_FR[date.getDay()], load: dayAvg });
    }

    // Alertes depuis charge + risques blessures
    const alertPlayerIds = new Set<string>();
    const alerts: { id: string; player: string; message: string; severity: 'critical' | 'warning' | 'info'; time: string }[] = [];
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    for (const p of playerLoads) {
      if (p.statut === 'Critique') {
        alerts.push({ id: p.id, player: p.name, message: p.fatigueScore >= 75 ? 'Fatigue élevée' : 'Charge critique', severity: 'critical', time: now });
        alertPlayerIds.add(p.id);
      } else if (p.statut === 'Attention') {
        alerts.push({ id: p.id, player: p.name, message: p.fatigueScore >= 55 ? 'Fatigue modérée' : 'Charge élevée', severity: 'warning', time: now });
        alertPlayerIds.add(p.id);
      }
    }
    for (const risk of injuryRisks) {
      if (risk.risk >= 60 && !alertPlayerIds.has(risk.playerId)) {
        alerts.push({ id: risk.id, player: risk.player.fullName, message: `Risque ${risk.zone}`, severity: risk.risk >= 80 ? 'critical' : 'warning', time: now });
        alertPlayerIds.add(risk.playerId);
      }
    }

    // Recommandations IA
    const aiRecommendations: string[] = [];
    const critiques = playerLoads.filter((p) => p.statut === 'Critique');
    const attentions = playerLoads.filter((p) => p.statut === 'Attention');

    if (critiques.length > 0) aiRecommendations.push(`Réduire charge — ${critiques[0].name} en état critique`);
    if (injuryRisks.length > 0) aiRecommendations.push(`Suivi médical prioritaire — ${injuryRisks[0].player.fullName} (${injuryRisks[0].zone})`);
    if (avgLoad > 75) aiRecommendations.push('Prévoir récupération active demain');
    if (attentions.length > 0 && aiRecommendations.length < 3) aiRecommendations.push(`Surveillance accrue — ${attentions.length} joueur(s) en attention`);
    if (aiRecommendations.length < 3) aiRecommendations.push('Programme récupération recommandé ce weekend');
    if (aiRecommendations.length < 3) aiRecommendations.push('Maintenir la charge actuelle — équipe stable');

    return {
      user: { name: user.fullName, club: org?.clubName ?? 'Club', season: new Date().getFullYear().toString() },
      kpis: { disponibles, avgLoad, fatigueHigh, riskCount: injuryRisks.length },
      loadHistory,
      alerts: alerts.slice(0, 5),
      aiRecommendations: aiRecommendations.slice(0, 3),
    };
  }

  // ─── Risques Blessures ─────────────────────────────────────────
  async getInjuryRisks(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const rows = await this.prisma.injuryRisk.findMany({
      where: { organizationId },
      include: { player: { select: { fullName: true } } },
      orderBy: { risk: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      playerId: r.playerId,
      name: r.player.fullName,
      zone: r.zone,
      risk: r.risk,
      recommendation: r.recommendation,
      medicalComment: r.medicalComment ?? undefined,
      medicalAuthor: r.medicalAuthor ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createInjuryRisk(
    user: JwtPayload,
    body: { playerId: string; zone: string; risk: number; recommendation: string[]; medicalComment?: string; medicalAuthor?: string },
  ) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.findFirst({ where: { id: body.playerId, organizationId } });
    if (!player) throw new NotFoundException('Joueur introuvable.');

    const row = await this.prisma.injuryRisk.create({
      data: { organizationId, playerId: body.playerId, zone: body.zone, risk: body.risk, recommendation: body.recommendation, medicalComment: body.medicalComment, medicalAuthor: body.medicalAuthor },
      include: { player: { select: { fullName: true } } },
    });
    return { id: row.id, playerId: row.playerId, name: row.player.fullName, zone: row.zone, risk: row.risk, recommendation: row.recommendation, medicalComment: row.medicalComment ?? undefined, medicalAuthor: row.medicalAuthor ?? undefined };
  }

  async updateInjuryRisk(
    user: JwtPayload,
    id: string,
    body: { zone?: string; risk?: number; recommendation?: string[]; medicalComment?: string; medicalAuthor?: string },
  ) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.injuryRisk.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundException('Risque introuvable.');

    const row = await this.prisma.injuryRisk.update({
      where: { id },
      data: { zone: body.zone, risk: body.risk, recommendation: body.recommendation, medicalComment: body.medicalComment, medicalAuthor: body.medicalAuthor },
      include: { player: { select: { fullName: true } } },
    });
    return { id: row.id, playerId: row.playerId, name: row.player.fullName, zone: row.zone, risk: row.risk, recommendation: row.recommendation, medicalComment: row.medicalComment ?? undefined, medicalAuthor: row.medicalAuthor ?? undefined };
  }

  async deleteInjuryRisk(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.injuryRisk.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundException('Risque introuvable.');
    await this.prisma.injuryRisk.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Training Sessions ──────────────────────────────────────────

  // Sessions lues/écrites dans ClubCalendarEvent (source unique avec le calendrier)
  private sessionTypeToEventType(type: string) {
    if (type === 'match') return 'MATCH';
    if (type === 'mobilite' || type === 'repos') return 'RECUPERATION';
    return 'ENTRAINEMENT';
  }

  private calendarToSession(r: { id: string; title: string; eventDate: Date; eventTime: string | null; extraData?: unknown }) {
    const d = (r.extraData ?? {}) as Record<string, string>;
    return {
      id: r.id,
      title: r.title,
      type: d.sessionType ?? 'cardio',
      date: r.eventDate.toISOString().split('T')[0],
      time: r.eventTime ?? '09:00',
      duration: d.duration ?? '60 min',
      objective: d.objective ?? '',
      exercises: d.exercises ?? '',
      intensity: d.intensity ?? 'Moyenne',
    };
  }

  async getSessions(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [rows, playerCount] = await Promise.all([
      this.prisma.clubCalendarEvent.findMany({
        where: { organizationId },
        orderBy: [{ eventDate: 'desc' }, { eventTime: 'asc' }],
      }),
      this.prisma.clubPlayer.count({ where: { organizationId } }),
    ]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return rows.map(r => ({
      ...this.calendarToSession(r),
      status: r.eventDate < today ? 'Terminé' : 'Planifié',
      playerCount,
    }));
  }

  async createSession(user: JwtPayload, body: {
    title: string; type: string; date: string; time: string;
    duration: string; objective: string; exercises?: string; intensity: string;
  }) {
    const organizationId = this.orgId(user);
    const row = await this.prisma.clubCalendarEvent.create({
      data: {
        organizationId,
        title: body.title,
        eventDate: new Date(body.date),
        eventTime: body.time,
        eventType: this.sessionTypeToEventType(body.type) as never,
        extraData: {
          sessionType: body.type,
          duration: body.duration,
          objective: body.objective,
          exercises: body.exercises ?? '',
          intensity: body.intensity,
        },
      },
    });
    return this.calendarToSession(row);
  }

  async updateSession(user: JwtPayload, id: string, body: Partial<{
    title: string; type: string; date: string; time: string;
    duration: string; objective: string; exercises: string; intensity: string;
  }>) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.clubCalendarEvent.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundException('Séance introuvable.');
    const prev = (existing.extraData ?? {}) as Record<string, string>;
    const row = await this.prisma.clubCalendarEvent.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.date  && { eventDate: new Date(body.date) }),
        ...(body.time  && { eventTime: body.time }),
        ...(body.type  && { eventType: this.sessionTypeToEventType(body.type) as never }),
        extraData: {
          sessionType: body.type      ?? prev.sessionType ?? 'cardio',
          duration:    body.duration  ?? prev.duration    ?? '60 min',
          objective:   body.objective ?? prev.objective   ?? '',
          exercises:   body.exercises ?? prev.exercises   ?? '',
          intensity:   body.intensity ?? prev.intensity   ?? 'Moyenne',
        },
      },
    });
    return this.calendarToSession(row);
  }

  async deleteSession(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.clubCalendarEvent.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundException('Séance introuvable.');
    await this.prisma.clubCalendarEvent.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Training Programs ──────────────────────────────────────────

  async getPrograms(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [rows, players] = await Promise.all([
      this.prisma.trainingProgram.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clubPlayer.findMany({
        where: { organizationId },
        select: { id: true, fullName: true },
      }),
    ]);
    const nameMap = new Map(players.map(p => [p.id, p.fullName]));
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      objective: r.objective,
      duration: r.duration,
      intensity: r.intensity,
      status: r.status,
      createdAt: r.createdAt.toISOString().split('T')[0],
      assignedPlayers: r.playerIds.map(pid => nameMap.get(pid) ?? pid),
      playerIds: r.playerIds,
    }));
  }

  async createProgram(user: JwtPayload, body: {
    name: string; objective?: string; duration?: string;
    intensity?: string; playerIds?: string[];
  }) {
    const organizationId = this.orgId(user);
    const row = await this.prisma.trainingProgram.create({
      data: {
        organizationId,
        name: body.name,
        objective: body.objective ?? '',
        duration: body.duration ?? '4 semaines',
        intensity: body.intensity ?? 'Moyenne',
        playerIds: body.playerIds ?? [],
        status: 'brouillon',
      },
    });
    const players = await this.prisma.clubPlayer.findMany({
      where: { id: { in: row.playerIds }, organizationId },
      select: { id: true, fullName: true },
    });
    const nameMap = new Map(players.map(p => [p.id, p.fullName]));
    return {
      id: row.id, name: row.name, objective: row.objective, duration: row.duration,
      intensity: row.intensity, status: row.status,
      createdAt: row.createdAt.toISOString().split('T')[0],
      assignedPlayers: row.playerIds.map(pid => nameMap.get(pid) ?? pid),
      playerIds: row.playerIds,
    };
  }

  async updateProgram(user: JwtPayload, id: string, body: Partial<{
    name: string; objective: string; duration: string;
    intensity: string; playerIds: string[]; status: string;
  }>) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.trainingProgram.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundException('Programme introuvable.');
    const row = await this.prisma.trainingProgram.update({ where: { id }, data: body });
    const players = await this.prisma.clubPlayer.findMany({
      where: { id: { in: row.playerIds }, organizationId },
      select: { id: true, fullName: true },
    });
    const nameMap = new Map(players.map(p => [p.id, p.fullName]));
    return {
      id: row.id, name: row.name, objective: row.objective, duration: row.duration,
      intensity: row.intensity, status: row.status,
      createdAt: row.createdAt.toISOString().split('T')[0],
      assignedPlayers: row.playerIds.map(pid => nameMap.get(pid) ?? pid),
      playerIds: row.playerIds,
    };
  }

  async deleteProgram(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.trainingProgram.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundException('Programme introuvable.');
    await this.prisma.trainingProgram.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Comparison ─────────────────────────────────────────────────

  async getComparisonPlayers(user: JwtPayload) {
    const organizationId = this.orgId(user);

    const [players, loads] = await Promise.all([
      this.prisma.clubPlayer.findMany({
        where: { organizationId },
        orderBy: { fullName: 'asc' },
        select: { id: true, fullName: true, position: true, age: true, weight: true },
      }),
      this.prisma.playerLoad.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        select: { playerId: true, loadScore: true, fatigueScore: true, recoveryScore: true },
      }),
    ]);

    // keep only latest load per player
    const loadMap = new Map<string, { loadScore: number; fatigueScore: number; recoveryScore: number }>();
    for (const l of loads) {
      if (!loadMap.has(l.playerId)) loadMap.set(l.playerId, l);
    }

    return players.map(p => {
      const load = loadMap.get(p.id) ?? { loadScore: 50, fatigueScore: 30, recoveryScore: 70 };
      return {
        id:       p.id,
        name:     p.fullName,
        position: p.position,
        age:      p.age,
        weight:   p.weight ?? '75 kg',
        charge:   load.loadScore,
        fatigue:  load.fatigueScore,
        recovery: load.recoveryScore,
        wellness: load.recoveryScore,
        distance: Math.round(load.loadScore / 10),
        sprints:  Math.round(load.loadScore / 3.5),
      };
    });
  }

  // ─── Match Readiness ────────────────────────────────────────────

  async getMatchReadiness(user: JwtPayload) {
    const organizationId = this.orgId(user);

    const [players, loads, risks, readiness] = await Promise.all([
      this.prisma.clubPlayer.findMany({
        where: { organizationId },
        orderBy: { fullName: 'asc' },
        select: { id: true, fullName: true, position: true, photoUrl: true },
      }),
      this.prisma.playerLoad.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        select: { playerId: true, fatigueScore: true },
      }),
      this.prisma.injuryRisk.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        select: { playerId: true, risk: true },
      }),
      this.prisma.matchReadiness.findMany({
        where: { organizationId },
        select: { playerId: true, status: true },
      }),
    ]);

    // keep only latest load per player
    const loadMap = new Map<string, number>();
    for (const l of loads) {
      if (!loadMap.has(l.playerId)) loadMap.set(l.playerId, l.fatigueScore);
    }
    // keep only highest risk per player
    const riskMap = new Map<string, number>();
    for (const r of risks) {
      if (!riskMap.has(r.playerId) || r.risk > (riskMap.get(r.playerId) ?? 0)) {
        riskMap.set(r.playerId, r.risk);
      }
    }
    const readinessMap = new Map(readiness.map(r => [r.playerId, r.status]));

    return players.map(p => {
      const fatigue = loadMap.get(p.id) ?? 30;
      const fitness = Math.max(0, Math.min(100, 100 - fatigue));
      const risk    = riskMap.get(p.id) ?? 0;
      return {
        id:              p.id,
        name:            p.fullName,
        position:        p.position,
        photoUrl:        (p as { photoUrl?: string | null }).photoUrl ?? null,
        fitness,
        fatigue,
        risk,
        readinessStatus: readinessMap.get(p.id) ?? 'pending',
      };
    });
  }

  async updateMatchReadiness(user: JwtPayload, playerId: string, status: string) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.findFirst({ where: { id: playerId, organizationId } });
    if (!player) throw new NotFoundException('Joueur introuvable.');
    const row = await this.prisma.matchReadiness.upsert({
      where: { organizationId_playerId: { organizationId, playerId } },
      create: { organizationId, playerId, status },
      update: { status },
    });
    return { id: row.id, playerId: row.playerId, readinessStatus: row.status };
  }

  // ─── Session Presence ───────────────────────────────────────────

  async getPresence(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const players = await this.prisma.clubPlayer.findMany({
      where: { organizationId },
      select: { id: true, fullName: true, position: true, status: true },
      orderBy: { fullName: 'asc' },
    });
    const presences = await this.prisma.sessionPresence.findMany({
      where: { organizationId },
    });
    const presenceMap = new Map(presences.map(p => [p.playerId, p.status]));
    const loads = await this.prisma.playerLoad.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    const loadMap = new Map<string, number>();
    for (const l of loads) {
      if (!loadMap.has(l.playerId)) loadMap.set(l.playerId, l.loadScore);
    }
    return players.map(p => {
      const defaults = this.defaultScores(p.status);
      return {
        playerId: p.id,
        name: p.fullName,
        position: p.position,
        charge: loadMap.get(p.id) ?? defaults.load,
        status: presenceMap.get(p.id) ?? 'Présent',
      };
    });
  }

  async updatePresence(user: JwtPayload, playerId: string, status: string) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.findFirst({ where: { id: playerId, organizationId } });
    if (!player) throw new NotFoundException('Joueur introuvable.');
    await this.prisma.sessionPresence.upsert({
      where: { organizationId_playerId: { organizationId, playerId } },
      create: { organizationId, playerId, status },
      update: { status },
    });
    return { playerId, status };
  }

  // ─── Wellness ──────────────────────────────────────────────────
  async getWellness(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [players, entries] = await Promise.all([
      this.prisma.clubPlayer.findMany({
        where: { organizationId },
        select: { id: true, fullName: true, position: true, photoUrl: true },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.wellnessEntry.findMany({
        where: { organizationId },
      }),
    ]);
    const entryMap = new Map(entries.map(e => [e.playerId, e]));
    return players.map(p => {
      const e = entryMap.get(p.id);
      return {
        playerId: p.id,
        name: p.fullName,
        position: p.position ?? '',
        photoUrl: p.photoUrl ?? null,
        sommeil: e?.sommeil ?? 0,
        fatigue: e?.fatigue ?? 0,
        stress:  e?.stress  ?? 0,
        douleur: e?.douleur ?? 0,
        humeur:  e?.humeur  ?? 0,
        filled:  !!e,
        filledAt: e?.filledAt ?? null,
      };
    });
  }

  async upsertWellness(user: JwtPayload, playerId: string, body: {
    sommeil: number; fatigue: number; stress: number; douleur: number; humeur: number;
  }) {
    const organizationId = this.orgId(user);
    await this.prisma.wellnessEntry.upsert({
      where: { organizationId_playerId: { organizationId, playerId } },
      create: { organizationId, playerId, ...body, filledAt: new Date() },
      update: { ...body, filledAt: new Date() },
    });
    return { playerId, ...body };
  }

  // ─── Rapports ──────────────────────────────────────────────────
  async getReports(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [players, allLoads, risks, wellnessEntries] = await Promise.all([
      this.prisma.clubPlayer.findMany({
        where: { organizationId },
        select: { id: true, fullName: true, position: true, photoUrl: true },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.playerLoad.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.injuryRisk.findMany({
        where: { organizationId },
        select: { playerId: true, risk: true },
      }),
      this.prisma.wellnessEntry.findMany({ where: { organizationId } }),
    ]);

    const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    // Group loads by player (already ordered desc → first = latest)
    const loadsByPlayer = new Map<string, typeof allLoads>();
    for (const l of allLoads) {
      if (!loadsByPlayer.has(l.playerId)) loadsByPlayer.set(l.playerId, []);
      loadsByPlayer.get(l.playerId)!.push(l);
    }

    // Max risk per player
    const riskMap = new Map<string, number>();
    for (const r of risks) {
      const prev = riskMap.get(r.playerId) ?? 0;
      if (r.risk > prev) riskMap.set(r.playerId, r.risk);
    }

    // Wellness entry per player
    const wellnessMap = new Map(wellnessEntries.map(e => [e.playerId, e]));

    // Wellness score formula: (sommeil + (10-fatigue) + (10-stress) + (10-douleur) + humeur) / 50 * 100
    const wellnessScore = (e: typeof wellnessEntries[0] | undefined) => {
      if (!e) return 0;
      return Math.round(((e.sommeil + (10 - e.fatigue) + (10 - e.stress) + (10 - e.douleur) + e.humeur) / 50) * 100);
    };

    const reports = players.map(p => {
      const loads   = loadsByPlayer.get(p.id) ?? [];
      const latest  = loads[0];
      const wellness = wellnessMap.get(p.id);

      // Charge: from PlayerLoad; fallback 0
      const charge = latest?.loadScore ?? 0;

      // Fatigue: merge PlayerLoad + Wellness (wellness.fatigue is 1-10, scale to 0-100)
      const loadFatigue    = latest?.fatigueScore ?? null;
      const wellnessFatigue = wellness ? wellness.fatigue * 10 : null;
      const fatigue = loadFatigue !== null && wellnessFatigue !== null
        ? Math.round((loadFatigue + wellnessFatigue) / 2)
        : (loadFatigue ?? wellnessFatigue ?? 0);

      // Endurance: from PlayerLoad recoveryScore; fallback wellness humeur×10
      const endurance = latest?.recoveryScore
        ? Math.round(Math.min(100, latest.recoveryScore))
        : (wellness ? wellness.humeur * 10 : 0);

      // Wellness score (0-100)
      const wScore = wellnessScore(wellness);

      const riskScore = riskMap.get(p.id) ?? 0;
      const hasData   = charge > 0 || fatigue > 0 || wScore > 0;
      const type = riskScore >= 50 || (wellness && wellness.fatigue >= 7)
        ? 'Risque blessure'
        : hasData ? 'Hebdomadaire' : 'Aucune donnée';

      const date = latest
        ? latest.createdAt.toISOString().split('T')[0]
        : wellness
          ? wellness.filledAt.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

      // Evolution: last 6 PlayerLoad records
      const evolution = [...loads].reverse().slice(-6).map(l => ({
        month: MONTHS[l.createdAt.getMonth()],
        charge: Math.round(Math.min(100, l.loadScore)),
        fatigue: Math.round(Math.min(100, l.fatigueScore)),
        endurance: Math.round(Math.min(100, l.recoveryScore)),
      }));

      return {
        id: p.id,
        playerId: p.id,
        player: p.fullName,
        position: p.position ?? '',
        photoUrl: p.photoUrl ?? null,
        date,
        type,
        charge,
        fatigue,
        endurance,
        wellness: wScore,
        evolution,
      };
    });

    // Team summary entry — include if any player has data
    const filledReports = reports.filter(r => r.charge > 0 || r.wellness > 0);
    if (filledReports.length > 0) {
      const avg = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
      reports.unshift({
        id: 'equipe',
        playerId: '',
        player: 'Équipe',
        position: '',
        photoUrl: null,
        date: new Date().toISOString().split('T')[0],
        type: 'Synthèse mensuelle',
        charge:   avg(filledReports.map(r => r.charge)),
        fatigue:  avg(filledReports.map(r => r.fatigue)),
        endurance: avg(filledReports.map(r => r.endurance)),
        wellness: avg(filledReports.map(r => r.wellness)),
        evolution: [],
      });
    }

    return reports;
  }

  // ─── Recovery ──────────────────────────────────────────────────
  async getRecoverySessions(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [sessions, players, loads, risks] = await Promise.all([
      this.prisma.recoverySession.findMany({
        where: { organizationId },
        include: { player: { select: { fullName: true } } },
        orderBy: { sessionDate: 'desc' },
      }),
      this.prisma.clubPlayer.findMany({
        where: { organizationId },
        select: { id: true, fullName: true, position: true },
      }),
      this.prisma.playerLoad.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.injuryRisk.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Build latest fatigue and max risk score per player
    const loadMap = new Map<string, number>();
    for (const l of loads) {
      if (!loadMap.has(l.playerId)) loadMap.set(l.playerId, l.fatigueScore);
    }
    const riskMap = new Map<string, number>();
    for (const r of risks) {
      const prev = riskMap.get(r.playerId) ?? 0;
      if (r.risk > prev) riskMap.set(r.playerId, r.risk);
    }

    // AI recommendations
    const recs = players
      .map(p => {
        const fatigue   = loadMap.get(p.id) ?? 0;
        const riskScore = riskMap.get(p.id) ?? 0;
        let rec: string | null = null;
        let urgency = 'low';
        if (riskScore >= 75 || fatigue >= 80) { rec = 'Cryo + repos 48h'; urgency = 'high'; }
        else if (riskScore >= 50 || fatigue >= 65) { rec = 'Massage + cryothérapie'; urgency = 'high'; }
        else if (riskScore >= 30 || fatigue >= 50) { rec = 'Repos complet + kiné'; urgency = 'medium'; }
        else if (fatigue >= 35) { rec = 'Hydratation renforcée'; urgency = 'low'; }
        return rec ? { playerId: p.id, player: p.fullName, rec, urgency } : null;
      })
      .filter(Boolean);

    return {
      sessions: sessions.map(s => ({
        id: s.id,
        playerId: s.playerId,
        playerName: s.player.fullName,
        method: s.method,
        date: s.sessionDate.toISOString().split('T')[0],
        duration: s.duration,
        status: s.status,
        notes: s.notes ?? '',
      })),
      recommendations: recs,
    };
  }

  async createRecoverySession(user: JwtPayload, body: {
    playerId: string; method: string; date: string; duration: string; notes?: string;
  }) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.findFirst({
      where: { id: body.playerId, organizationId },
      select: { fullName: true },
    });
    if (!player) throw new NotFoundException('Joueur introuvable');
    const session = await this.prisma.recoverySession.create({
      data: {
        organizationId,
        playerId: body.playerId,
        method: body.method,
        sessionDate: new Date(body.date),
        duration: body.duration,
        status: 'Planifié',
        notes: body.notes,
      },
    });
    return { ...session, playerName: player.fullName, date: session.sessionDate.toISOString().split('T')[0] };
  }

  async updateRecoverySession(user: JwtPayload, id: string, body: { status?: string; notes?: string }) {
    const organizationId = this.orgId(user);
    return this.prisma.recoverySession.update({
      where: { id, organizationId },
      data: body,
    });
  }

  async deleteRecoverySession(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    await this.prisma.recoverySession.delete({ where: { id, organizationId } });
    return { id };
  }

  // ─── Helpers ───────────────────────────────────────────────────
  private defaultScores(playerStatus: string) {
    switch (playerStatus) {
      case 'BLESSE':
        return { load: 15, fatigue: 80, recovery: 20 };
      case 'LIMITE':
        return { load: 65, fatigue: 60, recovery: 40 };
      case 'FIN_CONTRAT':
        return { load: 50, fatigue: 30, recovery: 65 };
      default:
        return { load: 55, fatigue: 30, recovery: 70 };
    }
  }
}
