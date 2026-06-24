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
    data: { fullName: string; email: string; clubRole: string; password?: string; status?: string },
    ip?: string,
  ) {
    const organizationId = this.orgId(user);
    const email = data.email.trim().toLowerCase();
    const password = data.password?.trim();

    if (!password || password.length < 8) {
      throw new BadRequestException('Mot de passe temporaire requis (8 caractères minimum).');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const clubRole = labelToClubRole(data.clubRole);
    if (clubRole === 'CLUB_ADMIN') {
      throw new BadRequestException('Impossible de créer un second administrateur principal.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const status = data.status ? this.labelToMemberStatus(data.status) : 'ACTIF';

    const member = await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName: data.fullName.trim(),
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
          fullName: data.fullName.trim(),
          email,
          clubRole,
          status,
        },
      });
    });

    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Club Admin',
      action: 'Ajout utilisateur',
      entity: member.fullName,
      details: `Rôle: ${data.clubRole} — compte de connexion créé`,
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
    const players = await this.prisma.clubPlayer.findMany({
      where: { organizationId },
      orderBy: { fullName: 'asc' },
    });
    return players.map((p) => this.formatPlayer(p));
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
    marketValue: string;
    salaryMonthly: number;
    status: string;
  }) {
    const statusMap: Record<string, string> = {
      DISPONIBLE: 'Disponible',
      BLESSE: 'Blessé',
      LIMITE: 'Limité',
      FIN_CONTRAT: 'Fin contrat',
    };
    return {
      id: p.id,
      name: p.fullName,
      position: p.position,
      age: p.age,
      ovr: p.ovr,
      marketValue: p.marketValue,
      contract: { salary: `${p.salaryMonthly.toLocaleString('fr-FR')} DT/mois` },
      availability: statusMap[p.status] ?? p.status,
      radar: { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 },
      performanceHistory: [],
      matches: [],
      positionFull: p.position,
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
    const staff = await this.prisma.clubStaff.create({
      data: {
        organizationId,
        fullName: String(data.fullName ?? '').trim(),
        role: String(data.role ?? 'Coach'),
        salaryMonthly: Number(data.salaryMonthly ?? 0),
        contractEnd: data.contractEnd ? new Date(String(data.contractEnd)) : null,
        isAvailable: data.isAvailable !== false,
      },
    });
    await this.syncDashboardStats(organizationId);
    return staff;
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
    const revenue = entries.filter((e) => e.type === 'REVENUE').reduce((s, e) => s + e.amount, 0);
    const expenses = entries.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);
    return {
      kpis: {
        budget: revenue,
        expenses,
        revenue,
        profit: revenue - expenses,
      },
      history: entries.map((e) => ({
        date: e.entryDate.toLocaleDateString('fr-FR'),
        amount: e.type === 'EXPENSE' ? -e.amount : e.amount,
        type: e.label,
        category: e.type === 'EXPENSE' ? 'out' : 'in',
      })),
    };
  }

  async createFinanceEntry(user: JwtPayload, data: Record<string, unknown>, ip?: string) {
    const organizationId = this.orgId(user);
    await this.prisma.clubFinanceEntry.create({
      data: {
        organizationId,
        label: String(data.label ?? ''),
        amount: Number(data.amount ?? 0),
        type: data.type === 'REVENUE' ? 'REVENUE' : 'EXPENSE',
        category: String(data.category ?? 'Général'),
        entryDate: data.entryDate ? new Date(String(data.entryDate)) : new Date(),
      },
    });
    await this.syncDashboardStats(organizationId);
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

  async createContract(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const c = await this.prisma.clubContract.create({
      data: {
        organizationId,
        holderName: String(data.holderName ?? ''),
        startDate: new Date(String(data.startDate ?? Date.now())),
        endDate: new Date(String(data.endDate ?? Date.now())),
        salaryMonthly: Number(data.salaryMonthly ?? 0),
        bonus: Number(data.bonus ?? 0),
        releaseClause: data.releaseClause ? String(data.releaseClause) : null,
        consumedPct: Number(data.consumedPct ?? 0),
      },
    });
    await this.syncDashboardStats(organizationId);
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

  // ─── Injuries ──────────────────────────────────────────────────
  async listInjuries(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const injuries = await this.prisma.clubInjury.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    const playersCount = await this.prisma.clubPlayer.count({ where: { organizationId } });
    return {
      kpis: {
        injured: injuries.length,
        available: Math.max(0, playersCount - injuries.length),
        avgRisk: injuries.length
          ? Math.round(injuries.reduce((s, i) => s + i.riskScore, 0) / injuries.length)
          : 0,
      },
      injured: injuries.map((i) => ({
        name: i.playerName,
        injury: i.injuryType,
        returnDate: i.returnDate?.toLocaleDateString('fr-FR') ?? '—',
        riskIA: i.riskScore,
      })),
    };
  }

  async createInjury(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const injury = await this.prisma.clubInjury.create({
      data: {
        organizationId,
        playerName: String(data.playerName ?? ''),
        injuryType: String(data.injuryType ?? ''),
        bodyPart: data.bodyPart ? String(data.bodyPart) : null,
        returnDate: data.returnDate ? new Date(String(data.returnDate)) : null,
        riskScore: Number(data.riskScore ?? 0),
      },
    });
    await this.syncDashboardStats(organizationId);
    return injury;
  }

  // ─── Infrastructure ────────────────────────────────────────────
  async listInfrastructures(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const items = await this.prisma.clubInfrastructure.findMany({
      where: { organizationId },
      include: { maintenances: true },
    });
    return items;
  }

  async createInfrastructure(user: JwtPayload, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    return this.prisma.clubInfrastructure.create({
      data: {
        organizationId,
        name: String(data.name ?? ''),
        infraType: String(data.infraType ?? 'Terrain'),
        status: String(data.status ?? 'Bon'),
        capacity: data.capacity ? String(data.capacity) : null,
        occupationPct: Number(data.occupationPct ?? 0),
        nextMaintenance: data.nextMaintenance ? new Date(String(data.nextMaintenance)) : null,
      },
    });
  }
}
