import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  AuditActionType,
  ClubMemberRole,
  MemberStatus,
  NotifLevel,
  NotifType,
  Prisma,
} from '@prisma/client';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ClubAccessService } from './club-access.service';
import { ClubAuditService } from './club-audit.service';
import {
  buildDefaultPermissions,
  clubRoleToLabel,
  labelToClubRole,
  PERMISSION_MODULES,
} from './permissions-seed';
import { buildDefaultDashboardSeed } from '../organizations/dashboard-seed';
import { buildClubAnalytics } from './club-analytics.util';

@Injectable()
export class ClubService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
    private readonly audit: ClubAuditService,
  ) {}

  private orgId(user: JwtPayload) {
    return this.access.requireOrganization(user);
  }

  // ─── Profile ───────────────────────────────────────────────────
  async getProfile(user: JwtPayload) {
    const organizationId = this.orgId(user);
    let profile = await this.prisma.organizationProfile.findUnique({
      where: { organizationId },
    });
    if (!profile) {
      const org = await this.prisma.organization.findUniqueOrThrow({
        where: { id: organizationId },
      });
      profile = await this.prisma.organizationProfile.create({
        data: {
          organizationId,
          officialEmail: org.ownerId ? undefined : undefined,
        },
      });
    }
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    return { ...profile, clubName: org.clubName, country: org.country, league: org.league, logoUrl: org.logoUrl };
  }

  async updateProfile(user: JwtPayload, data: Prisma.OrganizationProfileUpdateInput, ip?: string) {
    const organizationId = this.orgId(user);
    const profile = await this.prisma.organizationProfile.upsert({
      where: { organizationId },
      create: {
        organizationId,
        officialEmail: data.officialEmail as string | undefined,
        phone: data.phone as string | undefined,
        website: data.website as string | undefined,
        stadium: data.stadium as string | undefined,
        address: data.address as string | undefined,
        city: data.city as string | undefined,
        abbreviation: data.abbreviation as string | undefined,
        primaryColor: data.primaryColor as string | undefined,
        secondaryColor: data.secondaryColor as string | undefined,
        notifyEmail: data.notifyEmail as boolean | undefined,
        notifySms: data.notifySms as boolean | undefined,
        notifyPush: data.notifyPush as boolean | undefined,
      },
      update: data,
    });
    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Club Admin',
      action: 'Modification paramètres',
      entity: 'OrganizationProfile',
      details: 'Paramètres club mis à jour',
      type: AuditActionType.MODIFICATION,
      ipAddress: ip,
    });
    return profile;
  }

  // ─── Members ───────────────────────────────────────────────────
  async listMembers(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const members = await this.prisma.clubMember.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return members.map((m) => this.formatMember(m));
  }

  async createMember(
    user: JwtPayload,
    data: {
      fullName: string;
      email: string;
      clubRole: string;
      password?: string;
      status?: string;
      clubPlayerId?: string;
    },
    ip?: string,
  ) {
    const organizationId = this.orgId(user);
    const email = data.email?.trim().toLowerCase();
    let fullName = data.fullName?.trim();
    const password = data.password?.trim();
    const clubPlayerId = data.clubPlayerId?.trim() || undefined;

    if (!email) {
      throw new BadRequestException('L\'email est requis.');
    }
    if (!password || password.length < 8) {
      throw new BadRequestException('Mot de passe temporaire requis (8 caractères minimum).');
    }

    const clubRole = labelToClubRole(data.clubRole);
    if (clubRole === 'CLUB_ADMIN') {
      throw new BadRequestException('Impossible de créer un second administrateur principal.');
    }

    if (clubRole === 'JOUEUR') {
      if (!clubPlayerId) {
        throw new BadRequestException('Sélectionnez un joueur de l\'effectif à associer au compte.');
      }
      const player = await this.prisma.clubPlayer.findFirst({
        where: { id: clubPlayerId, organizationId },
      });
      if (!player) {
        throw new BadRequestException('Joueur introuvable dans l\'effectif.');
      }
      const linked = await this.prisma.clubMember.findFirst({
        where: { organizationId, clubPlayerId },
      });
      if (linked) {
        throw new ConflictException('Ce joueur possède déjà un compte utilisateur.');
      }
      fullName = fullName || player.fullName;
    }

    if (!fullName) {
      throw new BadRequestException('Le nom complet est requis.');
    }

    const status = data.status ? this.labelToMemberStatus(data.status) : 'ACTIF';
    const passwordHash = await bcrypt.hash(password, 12);

    const existingMember = await this.prisma.clubMember.findUnique({
      where: { organizationId_email: { organizationId, email } },
    });
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    let member;

    if (existingMember) {
      // Ancien flux : ClubMember créé sans compte auth — on rattache le compte.
      member = await this.prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            email,
            passwordHash,
            fullName,
            phone: '',
            role: 'ADMIN_CLUB',
            organizationId,
            clubMemberRole: clubRole,
            isActive: status === 'ACTIF',
            acceptTerms: true,
            acceptPrivacy: true,
          },
        });

        return tx.clubMember.update({
          where: { id: existingMember.id },
          data: { fullName, clubRole, status, ...(clubPlayerId && { clubPlayerId }) },
        });
      });
    } else {
      try {
        member = await this.prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email,
              passwordHash,
              fullName,
              phone: '',
              role: 'ADMIN_CLUB',
              organizationId,
              clubMemberRole: clubRole,
              isActive: status === 'ACTIF',
              acceptTerms: true,
              acceptPrivacy: true,
            },
          });

          return tx.clubMember.create({
            data: {
              organizationId,
              fullName,
              email,
              clubRole,
              status,
              ...(clubPlayerId && { clubPlayerId }),
            },
          });
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2002') {
            throw new ConflictException('Cet email est déjà utilisé dans ce club.');
          }
          if (err.code === 'P2021' || err.message.includes('does not exist')) {
            throw new BadRequestException(
              'Base de données non à jour. Relancez le déploiement backend (prisma db push).',
            );
          }
        }
        throw err;
      }
    }

    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Club Admin',
      action: existingMember ? 'Activation compte utilisateur' : 'Ajout utilisateur',
      entity: member.fullName,
      details: `Rôle: ${data.clubRole} — compte de connexion ${existingMember ? 'activé' : 'créé'}`,
      type: AuditActionType.CREATION,
      ipAddress: ip,
    });
    return this.formatMember(member);
  }

  async updateMember(
    user: JwtPayload,
    id: string,
    data: Partial<{ fullName: string; email: string; clubRole: string; status: string }>,
    ip?: string,
  ) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.clubMember.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException('Utilisateur introuvable.');
    const nextEmail = data.email?.trim().toLowerCase();
    const nextRole = data.clubRole ? labelToClubRole(data.clubRole) : undefined;
    const nextStatus = data.status ? this.labelToMemberStatus(data.status) : undefined;

    const member = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.clubMember.update({
        where: { id },
        data: {
          ...(data.fullName && { fullName: data.fullName.trim() }),
          ...(nextEmail && { email: nextEmail }),
          ...(nextRole && { clubRole: nextRole }),
          ...(nextStatus && { status: nextStatus }),
        },
      });

      const authUser = await tx.user.findFirst({
        where: { email: existing.email, organizationId },
      });
      if (authUser) {
        await tx.user.update({
          where: { id: authUser.id },
          data: {
            ...(data.fullName && { fullName: data.fullName.trim() }),
            ...(nextEmail && { email: nextEmail }),
            ...(nextRole && { clubMemberRole: nextRole }),
            ...(nextStatus && { isActive: nextStatus === 'ACTIF' }),
          },
        });
      }

      return updated;
    });
    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Club Admin',
      action: 'Modification utilisateur',
      entity: member.fullName,
      details: 'Compte mis à jour',
      type: AuditActionType.MODIFICATION,
      ipAddress: ip,
    });
    return this.formatMember(member);
  }

  async deleteMember(user: JwtPayload, id: string, ip?: string) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.clubMember.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException('Utilisateur introuvable.');
    if (existing.clubRole === 'CLUB_ADMIN') {
      throw new ForbiddenException('Impossible de supprimer l\'administrateur principal.');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.clubMember.delete({ where: { id } });
      const authUser = await tx.user.findFirst({
        where: { email: existing.email, organizationId },
      });
      if (authUser) {
        await tx.user.delete({ where: { id: authUser.id } });
      }
    });
    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Club Admin',
      action: 'Suppression utilisateur',
      entity: existing.fullName,
      details: 'Compte supprimé',
      type: AuditActionType.SUPPRESSION,
      ipAddress: ip,
    });
    return { message: 'Utilisateur supprimé' };
  }

  private labelToMemberStatus(status: string): MemberStatus {
    const map: Record<string, MemberStatus> = {
      Actif: 'ACTIF',
      Inactif: 'INACTIF',
      Suspendu: 'SUSPENDU',
      ACTIF: 'ACTIF',
      INACTIF: 'INACTIF',
      SUSPENDU: 'SUSPENDU',
    };
    return map[status] ?? 'ACTIF';
  }

  private formatMember(m: {
    id: string;
    fullName: string;
    email: string;
    clubRole: ClubMemberRole;
    status: MemberStatus;
    clubPlayerId?: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
  }) {
    const statusMap: Record<MemberStatus, string> = {
      ACTIF: 'Actif',
      INACTIF: 'Inactif',
      SUSPENDU: 'Suspendu',
    };
    return {
      id: m.id,
      name: m.fullName,
      email: m.email,
      role: clubRoleToLabel(m.clubRole),
      status: statusMap[m.status],
      clubPlayerId: m.clubPlayerId ?? null,
      lastLogin: m.lastLoginAt
        ? m.lastLoginAt.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '—',
      createdAt: m.createdAt.toISOString().slice(0, 10),
    };
  }

  // ─── Permissions ───────────────────────────────────────────────
  async getPermissions(user: JwtPayload) {
    const organizationId = this.orgId(user);
    let rows = await this.prisma.clubPermission.findMany({
      where: { organizationId },
    });
    if (rows.length === 0) {
      await this.prisma.clubPermission.createMany({
        data: buildDefaultPermissions(organizationId),
      });
      rows = await this.prisma.clubPermission.findMany({
        where: { organizationId },
      });
    }
    const matrix: Record<string, Record<string, { lire: boolean; créer: boolean; modifier: boolean; supprimer: boolean }>> = {};
    for (const mod of PERMISSION_MODULES) {
      matrix[mod] = {};
      for (const role of Object.values(ClubMemberRole)) {
        const label = clubRoleToLabel(role);
        const row = rows.find((r) => r.module === mod && r.clubRole === role);
        matrix[mod][label] = {
          lire: row?.canRead ?? false,
          créer: row?.canCreate ?? false,
          modifier: row?.canUpdate ?? false,
          supprimer: row?.canDelete ?? false,
        };
      }
    }
    return { modules: [...PERMISSION_MODULES], matrix };
  }

  async updatePermissions(
    user: JwtPayload,
    body: {
      matrix: Record<string, Record<string, { lire: boolean; créer: boolean; modifier: boolean; supprimer: boolean }>>;
    },
    ip?: string,
  ) {
    const organizationId = this.orgId(user);
    await this.prisma.clubPermission.deleteMany({ where: { organizationId } });
    const data = Object.entries(body.matrix).flatMap(([module, roles]) =>
      Object.entries(roles).map(([roleLabel, perm]) => ({
        organizationId,
        module,
        clubRole: labelToClubRole(roleLabel),
        canRead: perm.lire,
        canCreate: perm.créer,
        canUpdate: perm.modifier,
        canDelete: perm.supprimer,
      })),
    );
    await this.prisma.clubPermission.createMany({ data });
    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Club Admin',
      action: 'Modification permissions',
      entity: 'Matrice RBAC',
      details: 'Permissions mises à jour',
      type: AuditActionType.PERMISSION,
      ipAddress: ip,
    });
    return this.getPermissions(user);
  }

  async checkPermission(
    organizationId: string,
    clubRole: ClubMemberRole,
    module: string,
    action: 'read' | 'create' | 'update' | 'delete',
  ): Promise<boolean> {
    if (clubRole === 'CLUB_ADMIN') return true;
    const row = await this.prisma.clubPermission.findUnique({
      where: {
        organizationId_module_clubRole: { organizationId, module, clubRole },
      },
    });
    if (!row) return false;
    if (action === 'read') return row.canRead;
    if (action === 'create') return row.canCreate;
    if (action === 'update') return row.canUpdate;
    return row.canDelete;
  }

  // ─── Notifications ─────────────────────────────────────────────
  async listNotifications(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const items = await this.prisma.clubNotification.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((n) => this.formatNotification(n));
  }

  async markNotificationsRead(user: JwtPayload, ids?: string[]) {
    const organizationId = this.orgId(user);
    await this.prisma.clubNotification.updateMany({
      where: {
        organizationId,
        ...(ids?.length ? { id: { in: ids } } : {}),
        isRead: false,
      },
      data: { isRead: true },
    });
    return { message: 'Notifications marquées comme lues' };
  }

  async markAllNotificationsRead(user: JwtPayload) {
    return this.markNotificationsRead(user);
  }

  async deleteReadNotifications(user: JwtPayload) {
    const organizationId = this.orgId(user);
    await this.prisma.clubNotification.deleteMany({
      where: { organizationId, isRead: true },
    });
    return { message: 'Notifications lues supprimées' };
  }

  private formatNotification(n: {
    id: string;
    title: string;
    body: string;
    type: NotifType;
    level: NotifLevel;
    isRead: boolean;
    createdAt: Date;
  }) {
    const typeMap: Record<NotifType, string> = {
      CONTRATS: 'Contrats',
      FINANCE: 'Finance',
      MEDICAL: 'Médical',
      SYSTEME: 'Système',
      INFO: 'Info',
    };
    const levelMap: Record<NotifLevel, string> = {
      CRITICAL: 'critical',
      WARNING: 'warning',
      INFO: 'info',
      SUCCESS: 'success',
    };
    return {
      id: n.id,
      title: n.title,
      description: n.body,
      type: typeMap[n.type],
      level: levelMap[n.level],
      date: n.createdAt.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      read: n.isRead,
    };
  }

  // ─── Audit logs ────────────────────────────────────────────────
  async listAuditLogs(user: JwtPayload, filters?: { type?: string; search?: string }) {
    const organizationId = this.orgId(user);
    const logs = await this.prisma.clubAuditLog.findMany({
      where: {
        organizationId,
        ...(filters?.type && filters.type !== 'Tous'
          ? {
              type:
                ({
                  Connexion: 'CONNEXION',
                  Création: 'CREATION',
                  Modification: 'MODIFICATION',
                  Suppression: 'SUPPRESSION',
                  Export: 'EXPORT',
                  Permission: 'PERMISSION',
                }[filters.type] as AuditActionType) ?? (filters.type as AuditActionType),
            }
          : {}),
        ...(filters?.search
          ? {
              OR: [
                { userName: { contains: filters.search, mode: 'insensitive' } },
                { action: { contains: filters.search, mode: 'insensitive' } },
                { entity: { contains: filters.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const typeLabel: Record<AuditActionType, string> = {
      CONNEXION: 'Connexion',
      CREATION: 'Création',
      MODIFICATION: 'Modification',
      SUPPRESSION: 'Suppression',
      EXPORT: 'Export',
      PERMISSION: 'Permission',
    };
    return logs.map((l) => ({
      id: l.id,
      user: l.userName,
      role: l.userRole,
      action: l.action,
      entity: l.entity,
      details: l.details,
      type: typeLabel[l.type],
      date: l.createdAt.toLocaleDateString('fr-FR'),
      time: l.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      ip: l.ipAddress ?? '—',
    }));
  }

  // ─── Dashboard sync ────────────────────────────────────────────
  async syncDashboardStats(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { dashboardStats: true },
    });
    if (!org) return;

    const [playersCount, staffCount, injuredCount, contractsToRenew, finance] =
      await Promise.all([
        this.prisma.clubPlayer.count({ where: { organizationId } }),
        this.prisma.clubStaff.count({ where: { organizationId } }),
        this.prisma.clubInjury.count({ where: { organizationId } }),
        this.prisma.clubContract.count({
          where: {
            organizationId,
            endDate: { lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.clubFinanceEntry.findMany({ where: { organizationId } }),
      ]);

    const revenue = finance.filter((f) => f.type === 'REVENUE').reduce((s, f) => s + f.amount, 0);
    const expenses = finance.filter((f) => f.type === 'EXPENSE').reduce((s, f) => s + f.amount, 0);
    const budgetTotal = revenue || 0;
    const budgetUsedPct = budgetTotal > 0 ? Math.round((expenses / budgetTotal) * 100) : 0;

    const seed = buildDefaultDashboardSeed(org.clubName);
    const data = {
      playersCount,
      staffCount,
      budgetRemaining: Math.max(0, revenue - expenses),
      payrollTotal: expenses,
      injuredCount,
      contractsToRenew,
      budgetUsedPct,
      budgetChart: seed.budgetChart as unknown as Prisma.InputJsonValue,
      alerts: seed.alerts as unknown as Prisma.InputJsonValue,
      aiSummary: [
        playersCount === 0 ? 'Aucun joueur enregistré.' : `${playersCount} joueur(s) dans l'effectif.`,
        staffCount === 0 ? 'Aucun staff ajouté.' : `${staffCount} membre(s) du staff.`,
        budgetTotal === 0 ? 'Budget non configuré.' : `Budget utilisé à ${budgetUsedPct}%.`,
      ] as unknown as Prisma.InputJsonValue,
    };

    if (org.dashboardStats) {
      await this.prisma.clubDashboardStats.update({
        where: { organizationId },
        data,
      });
    } else {
      await this.prisma.clubDashboardStats.create({
        data: { organizationId, ...data },
      });
    }
  }

  // ─── Players ───────────────────────────────────────────────────
  async listPlayers(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [players, joueurMembers] = await Promise.all([
      this.prisma.clubPlayer.findMany({
        where: { organizationId },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.clubMember.findMany({
        where: { organizationId, clubRole: 'JOUEUR' },
        select: { clubPlayerId: true, email: true, fullName: true },
      }),
    ]);

    const memberByPlayerId = new Map(
      joueurMembers.filter((m) => m.clubPlayerId).map((m) => [m.clubPlayerId!, m]),
    );
    const memberByName = new Map(
      joueurMembers.map((m) => [m.fullName.trim().toLowerCase(), m]),
    );

    return players.map((p) => {
      const linked =
        memberByPlayerId.get(p.id) ??
        memberByName.get(p.fullName.trim().toLowerCase());
      return {
        ...this.formatPlayer(p),
        hasAccount: Boolean(linked),
        accountEmail: linked?.email ?? null,
      };
    });
  }

  async createPlayer(user: JwtPayload, data: Record<string, unknown>, ip?: string) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.create({
      data: {
        organizationId,
        fullName: String(data.fullName ?? '').trim(),
        position: String(data.position ?? 'MC'),
        age: Number(data.age ?? 0),
        ovr: Number(data.ovr ?? 0),
        goals: Number(data.goals ?? 0),
        marketValue: String(data.marketValue ?? '0'),
        salaryMonthly: Number(data.salaryMonthly ?? 0),
        status: (data.status as never) ?? 'DISPONIBLE',
      },
    });
    await this.syncDashboardStats(organizationId);
    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Club Admin',
      action: 'Ajout joueur',
      entity: player.fullName,
      details: `Poste: ${player.position}`,
      type: AuditActionType.CREATION,
      ipAddress: ip,
    });
    return this.formatPlayer(player);
  }

  async updatePlayer(user: JwtPayload, id: string, data: Record<string, unknown>, ip?: string) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.update({
      where: { id },
      data: {
        ...(data.fullName != null ? { fullName: String(data.fullName).trim() } : {}),
        ...(data.position != null ? { position: String(data.position) } : {}),
        ...(data.age != null ? { age: Number(data.age) } : {}),
        ...(data.ovr != null ? { ovr: Number(data.ovr) } : {}),
        ...(data.goals != null ? { goals: Number(data.goals) } : {}),
        ...(data.marketValue != null ? { marketValue: String(data.marketValue) } : {}),
        ...(data.salaryMonthly != null ? { salaryMonthly: Number(data.salaryMonthly) } : {}),
        ...(data.status != null ? { status: data.status as never } : {}),
      },
    });
    await this.syncDashboardStats(organizationId);
    return this.formatPlayer(player);
  }

  async deletePlayer(user: JwtPayload, id: string, ip?: string) {
    const organizationId = this.orgId(user);
    const p = await this.prisma.clubPlayer.findFirst({ where: { id, organizationId } });
    if (!p) throw new NotFoundException('Joueur introuvable.');
    await this.prisma.clubPlayer.delete({ where: { id } });
    await this.syncDashboardStats(organizationId);
    return { message: 'Joueur supprimé' };
  }

  private formatPlayer(p: {
    id: string;
    fullName: string;
    position: string;
    age: number;
    ovr: number;
    goals?: number;
    marketValue: string;
    salaryMonthly: number;
    status: string;
    radar?: unknown;
    photoUrl?: string | null;
    stats?: unknown;
    height?: string | null;
    weight?: string | null;
    strongFoot?: string | null;
    birthDate?: string | null;
    jerseyNumber?: number | null;
    nationality?: string | null;
  }) {
    const statusMap: Record<string, string> = {
      DISPONIBLE: 'Disponible',
      BLESSE: 'Blessé',
      LIMITE: 'Limité',
      FIN_CONTRAT: 'Fin contrat',
    };
    const defaultRadar = { speed: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70, vision: 70 };
    const dbRadar = (p.radar && typeof p.radar === 'object') ? p.radar as Record<string, number> : null;
    return {
      id: p.id,
      name: p.fullName,
      position: p.position,
      positionFull: p.position,
      age: p.age,
      ovr: p.ovr,
      goals: p.goals ?? 0,
      marketValue: p.marketValue,
      contract: { salary: `${p.salaryMonthly.toLocaleString('fr-FR')} DT/mois` },
      availability: statusMap[p.status] ?? p.status,
      radar: dbRadar ?? defaultRadar,
      photoUrl: p.photoUrl ?? null,
      stats: p.stats ?? null,
      height: p.height ?? '',
      weight: p.weight ?? '',
      strongFoot: p.strongFoot ?? 'Droit',
      birthDate: p.birthDate ?? '',
      jerseyNumber: p.jerseyNumber ?? 0,
      nationality: p.nationality ?? 'Tunisie',
      performanceHistory: [],
      matches: [],
    };
  }

  // ─── Staff ─────────────────────────────────────────────────────
  async listStaff(user: JwtPayload) {
    const organizationId = this.orgId(user);
    return this.prisma.clubStaff.findMany({
      where: { organizationId },
      orderBy: { fullName: 'asc' },
    });
  }

  async createStaff(user: JwtPayload, data: Record<string, unknown>, ip?: string) {
    const organizationId = this.orgId(user);
    const fullName = String(data.fullName ?? '').trim();
    if (!fullName) {
      throw new BadRequestException('Le nom complet est requis.');
    }
    const staff = await this.prisma.clubStaff.create({
      data: {
        organizationId,
        fullName,
        role: this.normalizeStaffRole(String(data.role ?? 'Coach')),
        salaryMonthly: Number(data.salaryMonthly ?? 0),
        contractEnd: data.contractEnd ? new Date(String(data.contractEnd)) : null,
        isAvailable: data.isAvailable !== false,
      },
    });
    await this.syncDashboardStats(organizationId);
    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Club Admin',
      action: 'Ajout staff',
      entity: staff.fullName,
      details: `Rôle: ${staff.role}`,
      type: AuditActionType.CREATION,
      ipAddress: ip,
    });
    return staff;
  }

  async updateStaff(user: JwtPayload, id: string, data: Record<string, unknown>, ip?: string) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.clubStaff.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundException('Membre staff introuvable.');

    const staff = await this.prisma.clubStaff.update({
      where: { id },
      data: {
        ...(data.fullName != null ? { fullName: String(data.fullName).trim() } : {}),
        ...(data.role != null ? { role: this.normalizeStaffRole(String(data.role)) } : {}),
        ...(data.salaryMonthly != null ? { salaryMonthly: Number(data.salaryMonthly) } : {}),
        ...(data.contractEnd !== undefined
          ? { contractEnd: data.contractEnd ? new Date(String(data.contractEnd)) : null }
          : {}),
        ...(data.isAvailable != null ? { isAvailable: Boolean(data.isAvailable) } : {}),
      },
    });
    await this.syncDashboardStats(organizationId);
    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Club Admin',
      action: 'Modification staff',
      entity: staff.fullName,
      details: `Rôle: ${staff.role}`,
      type: AuditActionType.MODIFICATION,
      ipAddress: ip,
    });
    return staff;
  }

  private normalizeStaffRole(role: string): string {
    const map: Record<string, string> = {
      coach: 'Coach',
      adjoint: 'Adjoint',
      préparateur: 'Préparateur',
      preparateur: 'Préparateur',
      'préparateur physique': 'Préparateur',
      médecin: 'Médecin',
      medecin: 'Médecin',
      scout: 'Scout',
      kiné: 'Kiné',
      kine: 'Kiné',
      analyste: 'Analyste',
    };
    const key = role.trim().toLowerCase();
    return map[key] ?? role.trim();
  }

  async deleteStaff(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    await this.prisma.clubStaff.deleteMany({ where: { id, organizationId } });
    await this.syncDashboardStats(organizationId);
    return { message: 'Staff supprimé' };
  }

  // ─── Finance ───────────────────────────────────────────────────
  async listFinance(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const entries = await this.prisma.clubFinanceEntry.findMany({
      where: { organizationId },
      orderBy: { entryDate: 'desc' },
    });
    const revenue = entries
      .filter((e) => e.type === 'REVENUE')
      .reduce((s, e) => s + e.amount, 0);
    const expenses = entries
      .filter((e) => e.type === 'EXPENSE')
      .reduce((s, e) => s + e.amount, 0);
    const profit = revenue - expenses;
    const budget = revenue > 0 || expenses > 0 ? revenue + Math.max(0, profit) : 0;

    const chartColors = ['#FF6B57', '#6366F1', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4'];
    const buildBreakdown = (type: 'REVENUE' | 'EXPENSE') => {
      const filtered = entries.filter((e) => e.type === type);
      const total = filtered.reduce((s, e) => s + e.amount, 0);
      if (total === 0) return [];
      const map = new Map<string, number>();
      for (const e of filtered) {
        map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
      }
      return [...map.entries()].map(([name, amount], i) => ({
        name,
        value: Math.round((amount / total) * 100),
        amount,
        color: chartColors[i % chartColors.length],
      }));
    };

    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyMap = new Map<string, { month: string; amount: number; sortKey: string }>();
    for (const e of entries.filter((x) => x.type === 'EXPENSE')) {
      const d = e.entryDate;
      const sortKey = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const month = monthLabels[d.getMonth()] ?? '—';
      const prev = monthlyMap.get(sortKey);
      monthlyMap.set(sortKey, {
        month,
        amount: (prev?.amount ?? 0) + e.amount,
        sortKey,
      });
    }
    const monthlyExpenses = [...monthlyMap.values()]
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-6)
      .map(({ month, amount }) => ({
        month,
        amount: Math.round(amount / 1000),
      }));

    return {
      kpis: { budget, expenses, revenue, profit },
      revenueSources: buildBreakdown('REVENUE'),
      expenseBreakdown: buildBreakdown('EXPENSE'),
      monthlyExpenses,
      history: entries.map((e) => ({
        id: e.id,
        date: e.entryDate.toLocaleDateString('fr-FR'),
        amount: e.type === 'EXPENSE' ? -e.amount : e.amount,
        label: e.label,
        category: e.category,
        entryType: e.type,
      })),
    };
  }

  async createFinanceEntry(user: JwtPayload, data: Record<string, unknown>, ip?: string) {
    const organizationId = this.orgId(user);
    const label = String(data.label ?? '').trim();
    if (!label) {
      throw new BadRequestException('Le libellé est requis.');
    }
    const amount = Number(data.amount ?? 0);
    if (!amount || amount <= 0) {
      throw new BadRequestException('Le montant doit être supérieur à 0.');
    }
    await this.prisma.clubFinanceEntry.create({
      data: {
        organizationId,
        label,
        amount,
        type: data.type === 'REVENUE' ? 'REVENUE' : 'EXPENSE',
        category: String(data.category ?? 'Général'),
        entryDate: data.entryDate ? new Date(String(data.entryDate)) : new Date(),
      },
    });
    await this.syncDashboardStats(organizationId);
    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Club Admin',
      action: 'Transaction financière',
      entity: label,
      details: `${data.type === 'REVENUE' ? 'Revenu' : 'Dépense'} — ${amount.toLocaleString('fr-FR')} DT`,
      type: AuditActionType.CREATION,
      ipAddress: ip,
    });
    return this.listFinance(user);
  }

  // ─── Contracts ─────────────────────────────────────────────────
  async listContracts(user: JwtPayload) {
    const organizationId = this.orgId(user);
    return this.prisma.clubContract.findMany({
      where: { organizationId },
      orderBy: { endDate: 'asc' },
    });
  }

  async createContract(user: JwtPayload, data: Record<string, unknown>, ip?: string) {
    const organizationId = this.orgId(user);
    const holderName = String(data.holderName ?? '').trim();
    if (!holderName) {
      throw new BadRequestException('Le titulaire est requis.');
    }
    const startDate = new Date(String(data.startDate ?? Date.now()));
    const endDate = new Date(String(data.endDate ?? Date.now()));
    if (endDate <= startDate) {
      throw new BadRequestException('La date de fin doit être après la date de début.');
    }
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = Date.now() - startDate.getTime();
    const consumedPct =
      data.consumedPct != null
        ? Number(data.consumedPct)
        : Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));

    const c = await this.prisma.clubContract.create({
      data: {
        organizationId,
        holderName,
        startDate,
        endDate,
        salaryMonthly: Number(data.salaryMonthly ?? 0),
        bonus: Number(data.bonus ?? 0),
        releaseClause: data.releaseClause ? String(data.releaseClause) : null,
        consumedPct,
      },
    });
    await this.syncDashboardStats(organizationId);
    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Club Admin',
      action: 'Création contrat',
      entity: holderName,
      details: `Fin: ${endDate.toLocaleDateString('fr-FR')}`,
      type: AuditActionType.CREATION,
      ipAddress: ip,
    });
    return c;
  }

  // ─── Calendar ──────────────────────────────────────────────────
  async listCalendarEvents(user: JwtPayload) {
    const organizationId = this.orgId(user);
    return this.prisma.clubCalendarEvent.findMany({
      where: { organizationId },
      orderBy: { eventDate: 'asc' },
    });
  }

  async createCalendarEvent(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    return this.prisma.clubCalendarEvent.create({
      data: {
        organizationId,
        title: String(data.title ?? ''),
        eventDate: new Date(String(data.eventDate ?? Date.now())),
        eventTime: data.eventTime ? String(data.eventTime) : null,
        eventType: (data.eventType as never) ?? 'ENTRAINEMENT',
        location: data.location ? String(data.location) : null,
      },
    });
  }

  async bookPlayerAppointment(user: JwtPayload, playerId: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.findFirst({ where: { id: playerId, organizationId } });
    const playerName = player?.fullName ?? 'Joueur';
    const appointmentType = String(data.appointmentType ?? 'Bilan médical');
    const requestedDate = data.requestedDate ? new Date(String(data.requestedDate)) : (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d; })();
    return this.prisma.clubCalendarEvent.create({
      data: {
        organizationId,
        title: `${appointmentType} — ${playerName}`,
        eventDate: requestedDate,
        eventTime: String(data.requestedTime ?? '09:00'),
        eventType: 'MEDICAL',
        location: String(data.location ?? 'Infirmerie du club'),
      },
    });
  }

  // ─── Injuries ──────────────────────────────────────────────────
  async listInjuries(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [injuries, playersCount] = await Promise.all([
      this.prisma.clubInjury.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clubPlayer.count({ where: { organizationId } }),
    ]);
    const injuredPlayers = new Set(injuries.map((i) => i.playerName));
    const avgRiskScore = injuries.length
      ? injuries.reduce((s, i) => s + i.riskScore, 0) / injuries.length
      : 0;
    return {
      kpis: {
        injured: injuredPlayers.size,
        available: Math.max(0, playersCount - injuredPlayers.size),
        avgRisk: Math.round(avgRiskScore * 10),
      },
      injured: injuries.map((i) => ({
        id: i.id,
        name: i.playerName,
        injury: i.injuryType,
        bodyPart: i.bodyPart,
        returnDate: i.returnDate?.toLocaleDateString('fr-FR') ?? '—',
        riskIA: i.riskScore,
        createdAt: i.createdAt.toISOString(),
      })),
    };
  }

  async createInjury(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const playerName = String(data.playerName ?? '');
    const injury = await this.prisma.clubInjury.create({
      data: {
        organizationId,
        playerName,
        injuryType: String(data.injuryType ?? ''),
        bodyPart: data.bodyPart ? String(data.bodyPart) : null,
        returnDate: data.returnDate ? new Date(String(data.returnDate)) : null,
        riskScore: Math.min(10, Math.max(0, Number(data.riskScore ?? 0))),
      },
    });
    if (playerName) {
      await this.prisma.clubPlayer.updateMany({
        where: { organizationId, fullName: playerName },
        data: { status: 'BLESSE' },
      });
    }
    await this.syncDashboardStats(organizationId);
    return {
      id: injury.id,
      name: injury.playerName,
      injury: injury.injuryType,
      bodyPart: injury.bodyPart,
      returnDate: injury.returnDate?.toLocaleDateString('fr-FR') ?? '—',
      riskIA: injury.riskScore,
      createdAt: injury.createdAt.toISOString(),
    };
  }

  async updateInjury(user: JwtPayload, id: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const injury = await this.prisma.clubInjury.findFirst({
      where: { id, organizationId },
    });
    if (!injury) throw new NotFoundException('Blessure introuvable.');

    const updated = await this.prisma.clubInjury.update({
      where: { id },
      data: {
        ...(data.injuryType != null ? { injuryType: String(data.injuryType) } : {}),
        ...(data.bodyPart !== undefined ? { bodyPart: String(data.bodyPart) } : {}),
        ...(data.returnDate !== undefined
          ? { returnDate: data.returnDate ? new Date(String(data.returnDate)) : null }
          : {}),
        ...(data.riskScore !== undefined ? { riskScore: Number(data.riskScore) } : {}),
      },
    });

    return {
      id: updated.id,
      name: updated.playerName,
      injury: updated.injuryType,
      bodyPart: updated.bodyPart,
      returnDate: updated.returnDate?.toLocaleDateString('fr-FR') ?? '—',
      riskIA: updated.riskScore,
    };
  }

  async deleteInjury(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const injury = await this.prisma.clubInjury.findFirst({
      where: { id, organizationId },
    });
    if (!injury) throw new NotFoundException('Blessure introuvable.');

    await this.prisma.clubInjury.delete({ where: { id } });

    if (injury.playerName) {
      const remaining = await this.prisma.clubInjury.count({
        where: { organizationId, playerName: injury.playerName },
      });
      if (remaining === 0) {
        await this.prisma.clubPlayer.updateMany({
          where: { organizationId, fullName: injury.playerName },
          data: { status: 'DISPONIBLE' },
        });
      }
    }

    return { message: 'Blessure supprimée.' };
  }

  // ─── Analytics ─────────────────────────────────────────────────
  async getAnalytics(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [players, events] = await Promise.all([
      this.prisma.clubPlayer.findMany({
        where: { organizationId },
        orderBy: { ovr: 'desc' },
      }),
      this.prisma.clubCalendarEvent.findMany({
        where: { organizationId },
        orderBy: { eventDate: 'asc' },
      }),
    ]);

    return buildClubAnalytics(players, events);
  }

  // ─── Infrastructure ────────────────────────────────────────────
  async listInfrastructures(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const items = await this.prisma.clubInfrastructure.findMany({
      where: { organizationId },
      include: { maintenances: { orderBy: { scheduledDate: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      infraType: item.infraType,
      status: item.status,
      capacity: item.capacity,
      occupationPct: item.occupationPct,
      nextMaintenance: item.nextMaintenance?.toISOString() ?? null,
      maintenances: item.maintenances.map((m) => ({
        id: m.id,
        taskType: m.taskType,
        scheduledDate: m.scheduledDate.toISOString(),
      })),
    }));
  }

  async createInfrastructure(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const nextMaintenance = data.nextMaintenance
      ? new Date(String(data.nextMaintenance))
      : null;
    const maintenanceTask = data.maintenanceTask
      ? String(data.maintenanceTask).trim()
      : '';

    const infra = await this.prisma.clubInfrastructure.create({
      data: {
        organizationId,
        name: String(data.name ?? ''),
        infraType: String(data.infraType ?? 'Terrain'),
        status: String(data.status ?? 'Bon'),
        capacity: data.capacity ? String(data.capacity) : null,
        occupationPct: Number(data.occupationPct ?? 0),
        nextMaintenance,
        ...(maintenanceTask && nextMaintenance
          ? {
              maintenances: {
                create: {
                  taskType: maintenanceTask,
                  scheduledDate: nextMaintenance,
                },
              },
            }
          : {}),
      },
      include: { maintenances: true },
    });

    return {
      id: infra.id,
      name: infra.name,
      infraType: infra.infraType,
      status: infra.status,
      capacity: infra.capacity,
      occupationPct: infra.occupationPct,
      nextMaintenance: infra.nextMaintenance?.toISOString() ?? null,
      maintenances: infra.maintenances.map((m) => ({
        id: m.id,
        taskType: m.taskType,
        scheduledDate: m.scheduledDate.toISOString(),
      })),
    };
  }

  // ─── Player Photo ───────────────────────────────────────────────
  async updatePlayerPhoto(user: JwtPayload, playerId: string, photoUrl: string) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.findFirst({
      where: { id: playerId, organizationId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');
    return this.prisma.clubPlayer.update({
      where: { id: playerId },
      data: { photoUrl },
    });
  }

  // ─── Player Stats (aggregate) ──────────────────────────────────
  async getPlayerStats(user: JwtPayload, playerId: string) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.findFirst({
      where: { id: playerId, organizationId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');

    if (!player.stats) {
      const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
      const seeded = this.seedPlayerStats(player, org?.league ?? undefined);
      await this.prisma.clubPlayer.update({
        where: { id: playerId },
        data: { stats: seeded as never },
      });
      return seeded;
    }
    // Patch existing stats: fix 'Liga 1' positionLabel with real league if org league differs
    const statsObj = player.stats as Record<string, unknown>;
    const hero = statsObj?.dashboardHero as Record<string, unknown> | undefined;
    if (hero && hero.positionLabel === 'Liga 1') {
      const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
      if (org?.league && org.league !== 'Liga 1') {
        const patched = { ...statsObj, dashboardHero: { ...hero, positionLabel: org.league } };
        await this.prisma.clubPlayer.update({ where: { id: playerId }, data: { stats: patched as never } });
        return patched;
      }
    }
    return player.stats;
  }

  async updatePlayerStats(user: JwtPayload, playerId: string, stats: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.findFirst({
      where: { id: playerId, organizationId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');
    const existing = (player.stats as Record<string, unknown>) ?? {};
    const merged = { ...existing, ...stats };
    await this.prisma.clubPlayer.update({
      where: { id: playerId },
      data: { stats: merged as never },
    });
    return merged;
  }

  async updatePlayerPhysical(user: JwtPayload, playerId: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.findFirst({
      where: { id: playerId, organizationId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');
    const allowed: Record<string, unknown> = {};
    if (data.height !== undefined) allowed['height'] = String(data.height);
    if (data.weight !== undefined) allowed['weight'] = String(data.weight);
    if (data.strongFoot !== undefined) allowed['strongFoot'] = String(data.strongFoot);
    if (data.birthDate !== undefined) allowed['birthDate'] = String(data.birthDate);
    if (data.jerseyNumber !== undefined) allowed['jerseyNumber'] = Number(data.jerseyNumber);
    if (data.nationality !== undefined) allowed['nationality'] = String(data.nationality);
    const updated = await this.prisma.clubPlayer.update({
      where: { id: playerId },
      data: allowed as never,
    });
    return this.formatPlayer(updated);
  }

  async getPlayerContract(user: JwtPayload, playerId: string) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.findFirst({
      where: { id: playerId, organizationId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');
    const contract = await this.prisma.clubContract.findFirst({
      where: {
        organizationId,
        holderName: { contains: player.fullName, mode: 'insensitive' },
      },
      orderBy: { endDate: 'desc' },
    });
    if (!contract) return null;
    return {
      id: contract.id,
      startDate: contract.startDate.toISOString().split('T')[0],
      endDate: contract.endDate.toISOString().split('T')[0],
      salary: `${contract.salaryMonthly.toLocaleString('fr-FR')} DT/mois`,
      releaseClause: contract.releaseClause ?? '—',
      consumedPct: contract.consumedPct,
    };
  }

  private seedPlayerStats(player: { ovr: number; goals: number; fullName: string }, leagueName?: string) {
    const ovr = player.ovr || 75;
    const base = Math.max(60, ovr - 10);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    return {
      form: Math.min(100, base + Math.round(Math.random() * 15)),
      vitesse: Math.min(99, base + Math.round(Math.random() * 20)),
      technique: Math.min(99, ovr + Math.round(Math.random() * 8 - 4)),
      physique: Math.min(99, base + Math.round(Math.random() * 15)),
      mental: Math.min(99, base + Math.round(Math.random() * 18)),
      coachRating: +(7 + Math.random() * 2).toFixed(1),
      positionRanking: Math.ceil(Math.random() * 5) + 1,
      performanceEvolution: months.map((month, i) => ({
        month,
        score: Math.min(99, base + i * 2 + Math.round(Math.random() * 8)),
      })),
      goalContribution: [
        { name: 'Buts', value: Math.max(5, Math.min(60, (player.goals ?? 0) * 6 || 35)), color: '#FF6B57' },
        { name: 'Assists', value: Math.round(Math.random() * 25) + 15, color: '#3B82F6' },
        { name: 'Chances', value: Math.round(Math.random() * 20) + 10, color: '#22C55E' },
      ],
      trainingLoad: Math.round(40 + Math.random() * 50),
      trainingSessions: { completed: Math.ceil(Math.random() * 2) + 3, total: 5, intensity: 'Élevée', fatiguePredicted: Math.round(35 + Math.random() * 40) },
      seasonStats: { goals: player.goals ?? 0, assists: Math.round(Math.random() * 8) + 1, matches: Math.round(Math.random() * 10) + 10 },
      dashboardHero: {
        marketValue: `${(Math.random() * 2 + 0.5).toFixed(1)}M €`,
        coachRating: +(7 + Math.random() * 2).toFixed(1),
        positionRanking: Math.ceil(Math.random() * 5) + 1,
        positionLabel: leagueName ?? 'Ligue 1',
      },
      marketValueTrend: { change: `+${(Math.random() * 15 + 3).toFixed(0)}%` },
    };
  }

  // ─── Match Stats ────────────────────────────────────────────────
  async getMatchStats(user: JwtPayload, playerId: string) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.playerMatchStat.findMany({
      where: { organizationId, playerId },
      orderBy: { matchDate: 'desc' },
    });
    if (existing.length === 0) {
      await this.seedMatchStats(organizationId, playerId);
      return this.prisma.playerMatchStat.findMany({
        where: { organizationId, playerId },
        orderBy: { matchDate: 'desc' },
      });
    }
    return existing;
  }

  async createMatchStat(user: JwtPayload, playerId: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    return this.prisma.playerMatchStat.create({
      data: {
        organizationId,
        playerId,
        matchDate: data.matchDate ? new Date(String(data.matchDate)) : new Date(),
        opponent: String(data.opponent ?? ''),
        result: String(data.result ?? ''),
        goals: Number(data.goals ?? 0),
        assists: Number(data.assists ?? 0),
        minutes: Number(data.minutes ?? 90),
        rating: Number(data.rating ?? 6),
        distance: Number(data.distance ?? 0),
        sprints: Number(data.sprints ?? 0),
        passAccuracy: Number(data.passAccuracy ?? 0),
        topSpeed: Number(data.topSpeed ?? 0),
        keyPasses: Number(data.keyPasses ?? 0),
        yellowCards: Number(data.yellowCards ?? 0),
        redCards: Number(data.redCards ?? 0),
        heatmapData: (data.heatmapData ?? null) as never,
      },
    });
  }

  private async seedMatchStats(organizationId: string, playerId: string) {
    const opponents = ['ES Sahel', 'CS Sfaxien', 'US Monastir', 'CA Bizertin', 'Espérance ST'];
    const results = ['2-1', '1-0', '3-2', '0-1', '2-0'];
    const records = opponents.map((opponent, i) => {
      const rating = +(6.5 + Math.random() * 2.5).toFixed(1);
      const d = new Date();
      d.setDate(d.getDate() - (i + 1) * 14);
      return {
        organizationId,
        playerId,
        matchDate: d,
        opponent,
        result: results[i],
        goals: Math.round(Math.random() * 2),
        assists: Math.round(Math.random() * 1),
        minutes: Math.random() > 0.2 ? 90 : 65,
        rating,
        distance: +(9 + Math.random() * 3).toFixed(1),
        sprints: Math.round(20 + Math.random() * 25),
        passAccuracy: Math.round(72 + Math.random() * 20),
        topSpeed: +(30 + Math.random() * 5).toFixed(1),
        keyPasses: Math.round(Math.random() * 4),
        yellowCards: Math.random() > 0.7 ? 1 : 0,
        redCards: Math.random() > 0.95 ? 1 : 0,
        heatmapData: Prisma.JsonNull,
      };
    });
    await this.prisma.playerMatchStat.createMany({ data: records });
  }

  // ─── Awards ──────────────────────────────────────────────────────
  async getAwards(user: JwtPayload, playerId: string) {
    const organizationId = this.orgId(user);
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    const realClubName = org?.clubName ?? null;

    const existing = await this.prisma.playerAward.findMany({
      where: { organizationId, playerId },
      orderBy: { createdAt: 'desc' },
    });
    if (existing.length === 0) {
      await this.seedAwards(organizationId, playerId, realClubName);
      return this.prisma.playerAward.findMany({
        where: { organizationId, playerId },
        orderBy: { createdAt: 'desc' },
      });
    }
    // Patch any existing records that still have the old 'FC Carthage' placeholder
    if (realClubName && realClubName !== 'FC Carthage') {
      const stale = existing.filter((a) => a.club === 'FC Carthage');
      if (stale.length > 0) {
        await this.prisma.playerAward.updateMany({
          where: { organizationId, playerId, club: 'FC Carthage' },
          data: { club: realClubName },
        });
        return this.prisma.playerAward.findMany({
          where: { organizationId, playerId },
          orderBy: { createdAt: 'desc' },
        });
      }
    }
    return existing;
  }

  async createAward(user: JwtPayload, playerId: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    return this.prisma.playerAward.create({
      data: {
        organizationId,
        playerId,
        title: String(data.title ?? ''),
        season: String(data.season ?? '2025-26'),
        icon: String(data.icon ?? '🏆'),
        color: String(data.color ?? '#d99a1f'),
        awardType: String(data.awardType ?? 'award'),
        year: data.year ? String(data.year) : null,
        club: data.club ? String(data.club) : null,
        event: data.event ? String(data.event) : null,
      },
    });
  }

  async deleteAward(user: JwtPayload, awardId: string) {
    const organizationId = this.orgId(user);
    await this.prisma.playerAward.deleteMany({ where: { id: awardId, organizationId } });
    return { message: 'Award supprimé' };
  }

  private async seedAwards(organizationId: string, playerId: string, clubName: string | null = null) {
    const club = clubName ?? 'Mon Club';
    const season = `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(2)}`;
    const awards = [
      { title: 'Joueur du Mois', season: `Mai ${new Date().getFullYear()}`, icon: '🥇', color: '#d99a1f', awardType: 'award' },
      { title: 'Meilleur Buteur', season, icon: '⚽', color: '#FF6B57', awardType: 'award' },
      { title: 'Fair-Play Award', season: String(new Date().getFullYear() - 1), icon: '🤝', color: '#22C55E', awardType: 'award' },
    ];
    const trophies = [
      { title: 'Champion Ligue 1', season: String(new Date().getFullYear() - 1), icon: '🏆', color: '#d99a1f', awardType: 'trophy', year: String(new Date().getFullYear() - 1), club },
      { title: 'Coupe Nationale', season: String(new Date().getFullYear() - 2), icon: '🥈', color: '#9ca3af', awardType: 'trophy', year: String(new Date().getFullYear() - 2), club },
    ];
    const career = [
      { title: 'Première sélection', season: String(new Date().getFullYear() - 4), icon: '⭐', color: '#3B82F6', awardType: 'career', year: String(new Date().getFullYear() - 4), club, event: 'Première sélection' },
      { title: 'Championnat remporté', season: String(new Date().getFullYear() - 2), icon: '🏆', color: '#d99a1f', awardType: 'career', year: String(new Date().getFullYear() - 2), club, event: 'Championnat remporté' },
    ];
    const all = [...awards, ...trophies, ...career];
    await this.prisma.playerAward.createMany({
      data: all.map((a) => ({ organizationId, playerId, ...a })),
    });
  }

  // ─── Documents ───────────────────────────────────────────────────
  async getDocuments(user: JwtPayload, playerId: string) {
    const organizationId = this.orgId(user);
    const player = await this.prisma.clubPlayer.findFirst({ where: { id: playerId, organizationId } });
    const playerName = player?.fullName ?? 'Joueur';
    const existing = await this.prisma.playerDocument.findMany({
      where: { organizationId, playerId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, docType: true, docDate: true, size: true, createdAt: true },
    });
    if (existing.length === 0) {
      await this.seedDocuments(organizationId, playerId, playerName);
      return this.prisma.playerDocument.findMany({
        where: { organizationId, playerId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, docType: true, docDate: true, size: true, createdAt: true },
      });
    }
    return existing;
  }

  async getDocumentFile(user: JwtPayload, docId: string) {
    const organizationId = this.orgId(user);
    const doc = await this.prisma.playerDocument.findFirst({ where: { id: docId, organizationId } });
    if (!doc) throw new NotFoundException('Document introuvable.');
    return doc;
  }

  async createDocument(user: JwtPayload, playerId: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    return this.prisma.playerDocument.create({
      data: {
        organizationId,
        playerId,
        name: String(data.name ?? 'document'),
        docType: String(data.docType ?? 'Personnel'),
        docDate: String(data.docDate ?? new Date().toLocaleDateString('fr-FR')),
        size: String(data.size ?? '—'),
        fileData: data.fileData ? String(data.fileData) : null,
      },
    });
  }

  async deleteDocument(user: JwtPayload, docId: string) {
    const organizationId = this.orgId(user);
    await this.prisma.playerDocument.deleteMany({ where: { id: docId, organizationId } });
    return { message: 'Document supprimé' };
  }

  private async seedDocuments(organizationId: string, playerId: string, playerName: string) {
    const today = new Date().toLocaleDateString('fr-FR');
    const docs = [
      { name: 'Contrat_2024.pdf', docType: 'Contrat', docDate: '01/01/2024', size: '1.2 MB' },
      { name: 'Certificat_Medical.pdf', docType: 'Médical', docDate: today, size: '890 KB' },
      { name: 'Carte_Identite.pdf', docType: 'Identité', docDate: '10/01/2026', size: '2.4 MB' },
    ];
    await this.prisma.playerDocument.createMany({
      data: docs.map((d) => ({ organizationId, playerId, ...d })),
    });
  }

  // ─── Transfers ───────────────────────────────────────────────────
  async getTransfers(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.playerTransfer.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    if (existing.length === 0) {
      await this.seedTransfers(organizationId, user.fullName);
      return this.prisma.playerTransfer.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      });
    }
    return existing;
  }

  async createTransfer(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    return this.prisma.playerTransfer.create({
      data: {
        organizationId,
        playerName: String(data.playerName ?? ''),
        transferType: String(data.transferType ?? 'Rumeur'),
        club: String(data.club ?? ''),
        value: String(data.value ?? '0'),
        status: String(data.status ?? 'Scouting'),
        probability: Number(data.probability ?? 0),
      },
    });
  }

  async deleteTransfer(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    await this.prisma.playerTransfer.deleteMany({ where: { id, organizationId } });
    return { message: 'Transfert supprimé' };
  }

  private async seedTransfers(organizationId: string, adminName: string) {
    const players = await this.prisma.clubPlayer.findMany({ where: { organizationId }, take: 6 });
    if (players.length === 0) return;
    const clubs = ['CS Sfaxien', 'US Monastir', 'JS Kairouan', 'Espérance ST', 'Al-Ahli'];
    const statuses = ['Négociation', 'Offre reçue', 'Scouting', 'Intérêt'];
    const transfers = players.slice(0, 4).map((p, i) => ({
      organizationId,
      playerName: p.fullName,
      transferType: i < 2 ? 'Sortant' : i === 2 ? 'Entrant' : 'Rumeur',
      club: clubs[i % clubs.length],
      value: `${(0.5 + Math.random() * 3).toFixed(1)}M €`,
      status: statuses[i % statuses.length],
      probability: Math.round(20 + Math.random() * 70),
    }));
    await this.prisma.playerTransfer.createMany({ data: transfers });
  }

  // ─── Chemistry ───────────────────────────────────────────────────
  async getChemistry(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.playerChemistry.findMany({
      where: { organizationId },
      orderBy: { chemistry: 'desc' },
    });
    if (existing.length === 0) {
      await this.seedChemistry(organizationId);
      return this.prisma.playerChemistry.findMany({
        where: { organizationId },
        orderBy: { chemistry: 'desc' },
      });
    }
    return existing;
  }

  async updateChemistry(user: JwtPayload, id: string, chemistry: number) {
    const organizationId = this.orgId(user);
    return this.prisma.playerChemistry.updateMany({
      where: { id, organizationId },
      data: { chemistry: Math.min(100, Math.max(0, chemistry)) },
    });
  }

  private async seedChemistry(organizationId: string) {
    const players = await this.prisma.clubPlayer.findMany({
      where: { organizationId },
      take: 8,
      orderBy: { ovr: 'desc' },
    });
    if (players.length < 2) return;
    const pairs: Array<{ organizationId: string; player1Id: string; player1Name: string; player2Id: string; player2Name: string; chemistry: number }> = [];
    for (let i = 0; i < Math.min(players.length, 6); i++) {
      for (let j = i + 1; j < Math.min(players.length, 6); j++) {
        pairs.push({
          organizationId,
          player1Id: players[i].id,
          player1Name: players[i].fullName,
          player2Id: players[j].id,
          player2Name: players[j].fullName,
          chemistry: Math.round(55 + Math.random() * 45),
        });
      }
    }
    if (pairs.length > 0) {
      await this.prisma.playerChemistry.createMany({ data: pairs, skipDuplicates: true });
    }
  }

  // ─── Finance CRUD extensions ────────────────────────────────────
  async updateFinanceEntry(user: JwtPayload, id: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const entry = await this.prisma.clubFinanceEntry.findFirst({ where: { id, organizationId } });
    if (!entry) throw new NotFoundException('Entrée financière introuvable.');
    await this.prisma.clubFinanceEntry.update({
      where: { id },
      data: {
        label: data.label ? String(data.label) : undefined,
        amount: data.amount ? Number(data.amount) : undefined,
        type: data.type === 'REVENUE' ? 'REVENUE' : data.type === 'EXPENSE' ? 'EXPENSE' : undefined,
        category: data.category ? String(data.category) : undefined,
        entryDate: data.entryDate ? new Date(String(data.entryDate)) : undefined,
      },
    });
    return this.listFinance(user);
  }

  async deleteFinanceEntry(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const entry = await this.prisma.clubFinanceEntry.findFirst({ where: { id, organizationId } });
    if (!entry) throw new NotFoundException('Entrée financière introuvable.');
    await this.prisma.clubFinanceEntry.delete({ where: { id } });
    await this.syncDashboardStats(organizationId);
    return this.listFinance(user);
  }

  // ─── Contract CRUD extensions ────────────────────────────────────
  async updateContract(user: JwtPayload, id: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const contract = await this.prisma.clubContract.findFirst({ where: { id, organizationId } });
    if (!contract) throw new NotFoundException('Contrat introuvable.');
    const updateData: Record<string, unknown> = {};
    if (data.holderName) updateData.holderName = String(data.holderName);
    if (data.startDate) updateData.startDate = new Date(String(data.startDate));
    if (data.endDate) updateData.endDate = new Date(String(data.endDate));
    if (data.salaryMonthly != null) updateData.salaryMonthly = Number(data.salaryMonthly);
    if (data.bonus != null) updateData.bonus = Number(data.bonus);
    if (data.releaseClause !== undefined) updateData.releaseClause = data.releaseClause ? String(data.releaseClause) : null;
    await this.prisma.clubContract.update({ where: { id }, data: updateData as never });
    return this.listContracts(user);
  }

  async deleteContract(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const contract = await this.prisma.clubContract.findFirst({ where: { id, organizationId } });
    if (!contract) throw new NotFoundException('Contrat introuvable.');
    await this.prisma.clubContract.delete({ where: { id } });
    return this.listContracts(user);
  }

  // ─── Sponsors ───────────────────────────────────────────────────
  async listSponsors(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const sponsors = await this.prisma.clubSponsor.findMany({
      where: { organizationId },
      orderBy: { montant: 'desc' },
    });
    if (sponsors.length === 0) {
      await this.seedSponsors(organizationId);
      return this.prisma.clubSponsor.findMany({ where: { organizationId }, orderBy: { montant: 'desc' } });
    }
    return sponsors;
  }

  async createSponsor(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const nom = String(data.nom ?? '').trim();
    if (!nom) throw new BadRequestException('Le nom du sponsor est requis.');
    const endDate = data.endDate ? new Date(String(data.endDate)) : (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d; })();
    return this.prisma.clubSponsor.create({
      data: {
        organizationId,
        nom,
        logo: String(data.logo ?? '🤝'),
        secteur: String(data.secteur ?? 'Partenaire'),
        montant: Number(data.montant ?? 0),
        startDate: data.startDate ? new Date(String(data.startDate)) : new Date(),
        endDate,
        renewalProbability: Number(data.renewalProbability ?? 50),
        status: String(data.status ?? 'Actif'),
        contact: data.contact ? String(data.contact) : null,
        notes: data.notes ? String(data.notes) : null,
      },
    });
  }

  async updateSponsor(user: JwtPayload, id: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const sponsor = await this.prisma.clubSponsor.findFirst({ where: { id, organizationId } });
    if (!sponsor) throw new NotFoundException('Sponsor introuvable.');
    const updateData: Record<string, unknown> = {};
    if (data.nom) updateData.nom = String(data.nom);
    if (data.logo) updateData.logo = String(data.logo);
    if (data.secteur) updateData.secteur = String(data.secteur);
    if (data.montant != null) updateData.montant = Number(data.montant);
    if (data.startDate) updateData.startDate = new Date(String(data.startDate));
    if (data.endDate) updateData.endDate = new Date(String(data.endDate));
    if (data.renewalProbability != null) updateData.renewalProbability = Number(data.renewalProbability);
    if (data.status) updateData.status = String(data.status);
    if (data.contact !== undefined) updateData.contact = data.contact ? String(data.contact) : null;
    if (data.notes !== undefined) updateData.notes = data.notes ? String(data.notes) : null;
    return this.prisma.clubSponsor.update({ where: { id }, data: updateData as never });
  }

  async deleteSponsor(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const sponsor = await this.prisma.clubSponsor.findFirst({ where: { id, organizationId } });
    if (!sponsor) throw new NotFoundException('Sponsor introuvable.');
    await this.prisma.clubSponsor.delete({ where: { id } });
    return { success: true };
  }

  private async seedSponsors(organizationId: string) {
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), 1);
    const nextTwoYears = new Date(now.getFullYear() + 2, now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    await this.prisma.clubSponsor.createMany({
      data: [
        { organizationId, nom: 'Sponsor Principal', logo: '🏆', secteur: 'Équipement', montant: 450000, startDate: lastMonth, endDate: nextTwoYears, renewalProbability: 90, status: 'Actif', contact: 'Responsable commercial', notes: 'Partenaire équipementier principal' },
        { organizationId, nom: 'Sponsor Maillot', logo: '✈️', secteur: 'Services', montant: 350000, startDate: lastMonth, endDate: nextYear, renewalProbability: 75, status: 'Actif', contact: 'Directeur marketing', notes: 'Sponsor maillot domicile' },
        { organizationId, nom: 'Partenaire Télécom', logo: '📡', secteur: 'Télécom', montant: 280000, startDate: lastMonth, endDate: new Date(now.getFullYear(), now.getMonth() + 2, 1), renewalProbability: 55, status: 'Expire bientot', contact: 'Chef de partenariats', notes: 'À renouveler' },
        { organizationId, nom: 'Partenaire Financier', logo: '🏦', secteur: 'Finance', montant: 150000, startDate: new Date(now.getFullYear() - 2, 0, 1), endDate: lastMonth, renewalProbability: 20, status: 'Expire', contact: 'Directeur régional', notes: 'Négociations en cours' },
      ],
      skipDuplicates: true,
    });
  }

  // ─── Invoices ────────────────────────────────────────────────────
  async listInvoices(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const invoices = await this.prisma.clubInvoice.findMany({
      where: { organizationId },
      orderBy: { invoiceDate: 'desc' },
    });
    if (invoices.length === 0) {
      await this.seedInvoices(organizationId);
      return this.prisma.clubInvoice.findMany({ where: { organizationId }, orderBy: { invoiceDate: 'desc' } });
    }
    return invoices;
  }

  async createInvoice(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const fournisseur = String(data.fournisseur ?? '').trim();
    if (!fournisseur) throw new BadRequestException('Le fournisseur est requis.');
    const count = await this.prisma.clubInvoice.count({ where: { organizationId } });
    const reference = data.reference ? String(data.reference) : `FAC-${String(count + 1).padStart(3, '0')}`;
    return this.prisma.clubInvoice.create({
      data: {
        organizationId,
        reference,
        fournisseur,
        invoiceType: String(data.invoiceType ?? 'Fournisseur'),
        montant: Number(data.montant ?? 0),
        invoiceDate: data.invoiceDate ? new Date(String(data.invoiceDate)) : new Date(),
        dueDate: data.dueDate ? new Date(String(data.dueDate)) : null,
        status: String(data.status ?? 'En attente'),
        description: data.description ? String(data.description) : null,
      },
    });
  }

  async updateInvoice(user: JwtPayload, id: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const invoice = await this.prisma.clubInvoice.findFirst({ where: { id, organizationId } });
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    const updateData: Record<string, unknown> = {};
    if (data.fournisseur) updateData.fournisseur = String(data.fournisseur);
    if (data.invoiceType) updateData.invoiceType = String(data.invoiceType);
    if (data.montant != null) updateData.montant = Number(data.montant);
    if (data.status) updateData.status = String(data.status);
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(String(data.dueDate)) : null;
    if (data.description !== undefined) updateData.description = data.description ? String(data.description) : null;
    return this.prisma.clubInvoice.update({ where: { id }, data: updateData as never });
  }

  async deleteInvoice(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const invoice = await this.prisma.clubInvoice.findFirst({ where: { id, organizationId } });
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    await this.prisma.clubInvoice.delete({ where: { id } });
    return { success: true };
  }

  async markInvoicePaid(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const invoice = await this.prisma.clubInvoice.findFirst({ where: { id, organizationId } });
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    return this.prisma.clubInvoice.update({ where: { id }, data: { status: 'Payée' } });
  }

  private async seedInvoices(organizationId: string) {
    const now = new Date();
    await this.prisma.clubInvoice.createMany({
      data: [
        { organizationId, reference: 'FAC-001', fournisseur: 'Équipement Sport', invoiceType: 'Équipement', montant: 15000, invoiceDate: new Date(now.getFullYear(), now.getMonth(), 1), status: 'Payée', description: 'Matériel sportif saison' },
        { organizationId, reference: 'FAC-002', fournisseur: 'Maintenance Stade', invoiceType: 'Infrastructure', montant: 8500, invoiceDate: new Date(now.getFullYear(), now.getMonth(), 5), status: 'Payée', description: 'Entretien terrain' },
        { organizationId, reference: 'FAC-003', fournisseur: 'Transport Club', invoiceType: 'Transport', montant: 12000, invoiceDate: new Date(now.getFullYear(), now.getMonth(), 10), dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 10), status: 'En attente', description: 'Déplacements matchs' },
        { organizationId, reference: 'FAC-004', fournisseur: 'Assurance Joueurs', invoiceType: 'Fournisseur', montant: 25000, invoiceDate: new Date(now.getFullYear(), now.getMonth() - 1, 15), dueDate: new Date(now.getFullYear(), now.getMonth(), 15), status: 'Retard', description: 'Couverture accidents sportifs' },
        { organizationId, reference: 'FAC-005', fournisseur: 'Fournitures Médicales', invoiceType: 'Médical', montant: 6500, invoiceDate: new Date(now.getFullYear(), now.getMonth(), 12), dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 12), status: 'En attente', description: 'Matériel infirmerie' },
      ],
      skipDuplicates: true,
    });
  }

  // ─── Finance seeding check ───────────────────────────────────────
  async seedFinanceDataIfEmpty(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const count = await this.prisma.clubFinanceEntry.count({ where: { organizationId } });
    if (count > 0) return { seeded: false };
    const now = new Date();
    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const entries: {
      organizationId: string; label: string; amount: number;
      type: 'REVENUE' | 'EXPENSE'; category: string; entryDate: Date;
    }[] = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 15);
      const monthName = monthLabels[d.getMonth()];
      entries.push(
        { organizationId, label: `Droits TV — ${monthName}`, amount: 120000, type: 'REVENUE', category: 'Médias', entryDate: new Date(d.getFullYear(), d.getMonth(), 5) },
        { organizationId, label: `Billetterie — ${monthName}`, amount: 35000 + Math.floor(Math.random() * 20000), type: 'REVENUE', category: 'Billetterie', entryDate: new Date(d.getFullYear(), d.getMonth(), 10) },
        { organizationId, label: `Salaires — ${monthName}`, amount: 180000 + Math.floor(Math.random() * 30000), type: 'EXPENSE', category: 'Salaires', entryDate: new Date(d.getFullYear(), d.getMonth(), 28) },
        { organizationId, label: `Équipements — ${monthName}`, amount: 15000 + Math.floor(Math.random() * 10000), type: 'EXPENSE', category: 'Équipements', entryDate: new Date(d.getFullYear(), d.getMonth(), 15) },
      );
    }
    entries.push(
      { organizationId, label: 'Sponsor principal — Q2', amount: 250000, type: 'REVENUE', category: 'Sponsoring', entryDate: new Date(now.getFullYear(), now.getMonth(), 1) },
      { organizationId, label: 'Transfert entrant', amount: 350000, type: 'REVENUE', category: 'Transferts', entryDate: new Date(now.getFullYear(), now.getMonth() - 2, 20) },
      { organizationId, label: 'Transfert sortant', amount: 200000, type: 'EXPENSE', category: 'Transferts', entryDate: new Date(now.getFullYear(), now.getMonth() - 1, 10) },
    );
    await this.prisma.clubFinanceEntry.createMany({ data: entries });
    const contractCount = await this.prisma.clubContract.count({ where: { organizationId } });
    if (contractCount === 0) {
      await this.prisma.clubContract.createMany({
        data: [
          { organizationId, holderName: 'Joueur Attaquant', startDate: new Date('2023-01-01'), endDate: new Date('2026-06-30'), salaryMonthly: 85000, bonus: 12000, consumedPct: 90 },
          { organizationId, holderName: 'Joueur Défenseur', startDate: new Date('2022-03-15'), endDate: new Date('2026-12-31'), salaryMonthly: 75000, bonus: 10000, consumedPct: 65 },
          { organizationId, holderName: 'Milieu de terrain', startDate: new Date('2023-07-01'), endDate: new Date('2027-05-31'), salaryMonthly: 68000, bonus: 8000, consumedPct: 35 },
          { organizationId, holderName: 'Gardien de but', startDate: new Date('2023-09-01'), endDate: new Date('2026-08-31'), salaryMonthly: 55000, bonus: 6000, consumedPct: 75 },
          { organizationId, holderName: 'Coach Principal', startDate: new Date('2024-01-01'), endDate: new Date('2027-06-30'), salaryMonthly: 65000, bonus: 15000, consumedPct: 50 },
        ],
      });
    }
    return { seeded: true };
  }

  // ─── Finance Report ──────────────────────────────────────────────
  async getFinanceReport(user: JwtPayload) {
    const financeData = await this.listFinance(user);
    const contracts = await this.listContracts(user);
    const sponsors = await this.listSponsors(user);
    const invoices = await this.listInvoices(user);

    const totalSalaries = contracts.reduce((s, c) => s + (c.salaryMonthly ?? 0), 0);
    const totalSponsoring = sponsors.filter(s => s.status === 'Actif').reduce((s, sp) => s + sp.montant, 0);
    const overdueInvoices = invoices.filter(i => i.status === 'Retard');
    const pendingInvoices = invoices.filter(i => i.status === 'En attente');
    const expiringSoonContracts = contracts.filter(c => {
      const daysLeft = Math.ceil((c.endDate.getTime() - Date.now()) / 86400000);
      return daysLeft > 0 && daysLeft <= 90;
    });
    const expiringSponsors = sponsors.filter(s => s.status === 'Expire bientot');

    return {
      ...financeData,
      contracts: {
        total: contracts.length,
        active: contracts.filter(c => new Date(c.endDate) > new Date()).length,
        expiringSoon: expiringSoonContracts.length,
        expired: contracts.filter(c => new Date(c.endDate) < new Date()).length,
        totalMonthlySalary: totalSalaries,
        list: contracts,
      },
      sponsors: {
        total: sponsors.length,
        active: sponsors.filter(s => s.status === 'Actif').length,
        expiringSoon: expiringSponsors.length,
        totalAnnual: totalSponsoring,
        list: sponsors,
      },
      invoices: {
        total: invoices.length,
        overdue: overdueInvoices.length,
        pending: pendingInvoices.length,
        totalAmount: invoices.reduce((s, i) => s + i.montant, 0),
        list: invoices,
      },
      alerts: [
        ...overdueInvoices.map(i => ({ type: 'invoice', message: `Facture en retard: ${i.reference} — ${i.fournisseur}`, severity: 'error', icon: '📄' })),
        ...expiringSoonContracts.slice(0, 2).map(c => {
          const days = Math.ceil((c.endDate.getTime() - Date.now()) / 86400000);
          return { type: 'contract', message: `Contrat expire dans ${days}j: ${c.holderName}`, severity: 'warning', icon: '📋' };
        }),
        ...expiringSponsors.slice(0, 2).map(s => ({ type: 'sponsor', message: `Sponsor à renouveler: ${s.nom}`, severity: 'info', icon: '🤝' })),
      ],
    };
  }
}
