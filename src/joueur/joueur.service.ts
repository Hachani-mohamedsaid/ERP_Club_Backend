import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ClubAccessService } from '../club/club-access.service';
import { ClubService } from '../club/club.service';

const DEFAULT_RADAR = {
  pace: 70,
  shooting: 70,
  passing: 70,
  dribbling: 70,
  defending: 70,
  physical: 70,
};

@Injectable()
export class JoueurService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
    private readonly club: ClubService,
  ) {}

  private orgId(user: JwtPayload) {
    return this.access.requireOrganization(user);
  }

  private async resolvePlayerId(user: JwtPayload): Promise<string> {
    const organizationId = this.orgId(user);
    const member = await this.prisma.clubMember.findFirst({
      where: { organizationId, email: user.email },
      select: { clubPlayerId: true, clubRole: true },
    });
    if (!member?.clubPlayerId) {
      throw new ForbiddenException('Aucun joueur lié à ce compte.');
    }
    return member.clubPlayerId;
  }

  async getMe(user: JwtPayload) {
    const playerId = await this.resolvePlayerId(user);
    const player = await this.prisma.clubPlayer.findUnique({
      where: { id: playerId },
      include: { profile: true, awards: true },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');

    const contracts = await this.prisma.clubContract.findMany({
      where: { organizationId: player.organizationId, holderName: player.fullName },
      orderBy: { endDate: 'desc' },
      take: 1,
    });

    return {
      id: player.id,
      name: player.fullName,
      position: player.position,
      age: player.age,
      ovr: player.ovr,
      goals: player.goals,
      marketValue: player.marketValue,
      availability: this.mapStatus(player.status),
      contract: contracts[0]
        ? {
            salary: `${contracts[0].salaryMonthly.toLocaleString('fr-FR')} DT/mois`,
            expiration: contracts[0].endDate.toLocaleDateString('fr-FR'),
          }
        : { salary: `${player.salaryMonthly.toLocaleString('fr-FR')} DT/mois`, expiration: '—' },
      radar: (player.radar as Record<string, number>) ?? DEFAULT_RADAR,
      awardsCount: player.awards.length,
    };
  }

  async getExtended(user: JwtPayload) {
    const playerId = await this.resolvePlayerId(user);
    const player = await this.prisma.clubPlayer.findUnique({
      where: { id: playerId },
      include: { profile: true, awards: true },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');

    const profile = player.profile ?? (await this.ensureProfile(player));

    return {
      player: {
        id: player.id,
        name: player.fullName,
        position: player.position,
        age: player.age,
        ovr: player.ovr,
        goals: player.goals,
        marketValue: player.marketValue,
        radar: (player.radar as Record<string, number>) ?? DEFAULT_RADAR,
      },
      career: profile.career ?? [],
      evolution: profile.evolution ?? [],
      heatmapZones: profile.heatmapZones ?? [],
      training: profile.training ?? { sessions: [], loadPct: 0 },
      matchAnalysis: profile.matchAnalysis ?? { ratings: [], avgRating: 0 },
      aiInsight: profile.aiInsight ?? { summary: '', factors: [] },
      fifaAttributes: profile.fifaAttributes ?? {},
      chemistry: profile.chemistry ?? [],
      awards: player.awards.map((a) => ({
        id: a.id,
        title: a.title,
        season: a.season,
        type: a.awardType,
        icon: a.icon,
      })),
    };
  }

  async getCalendar(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const events = await this.prisma.clubCalendarEvent.findMany({
      where: { organizationId },
      orderBy: { eventDate: 'asc' },
    });
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.eventDate.toISOString().split('T')[0],
      time: e.eventTime,
      type: e.eventType,
      location: e.location,
    }));
  }

  async getInjuries(user: JwtPayload) {
    const playerId = await this.resolvePlayerId(user);
    const player = await this.prisma.clubPlayer.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Joueur introuvable.');

    const injuries = await this.prisma.clubInjury.findMany({
      where: { organizationId: player.organizationId, playerName: player.fullName },
      orderBy: { createdAt: 'desc' },
    });

    return injuries.map((i) => ({
      id: i.id,
      type: i.injuryType,
      bodyPart: i.bodyPart,
      returnDate: i.returnDate?.toLocaleDateString('fr-FR') ?? '—',
      riskScore: i.riskScore,
      date: i.createdAt.toLocaleDateString('fr-FR'),
    }));
  }

  async getSquad(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const players = await this.club.listPlayers(user);
    return players.filter((p) => p.id !== undefined);
  }

  private mapStatus(status: string) {
    const map: Record<string, string> = {
      DISPONIBLE: 'Disponible',
      BLESSE: 'Blessé',
      LIMITE: 'Limité',
      FIN_CONTRAT: 'Fin contrat',
    };
    return map[status] ?? status;
  }

  private async ensureProfile(player: {
    id: string;
    fullName: string;
    position: string;
    age: number;
    ovr: number;
    goals: number;
  }) {
    return this.prisma.clubPlayerProfile.create({
      data: {
        clubPlayerId: player.id,
        career: [
          { club: 'Club actuel', period: '2024–', role: player.position },
        ],
        evolution: [
          { month: 'Jan', score: Math.max(50, player.ovr - 8) },
          { month: 'Mar', score: Math.max(55, player.ovr - 5) },
          { month: 'Juin', score: player.ovr },
        ],
        heatmapZones: [],
        training: { sessions: [], loadPct: 72 },
        matchAnalysis: { ratings: [], avgRating: player.ovr / 10 },
        aiInsight: {
          summary: `${player.fullName} progresse régulièrement (OVR ${player.ovr}).`,
          factors: ['Régularité', 'Volume de jeu'],
        },
        fifaAttributes: {},
        chemistry: [],
      },
    });
  }
}
