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
