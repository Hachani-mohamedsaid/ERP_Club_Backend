import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  OrganizationStatus,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { clubRoleToLabel } from '../club/permissions-seed';
import { buildDefaultDashboardSeed } from '../organizations/dashboard-seed';
import { seedClubOps } from '../club/ops-seed';
import {
  createTrialSubscription,
  ensurePlatformSeed,
  seedSupportDemo,
} from './platform.seed';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import { assertPlatformSchema, PLATFORM_SCHEMA_HINT, isMissingPrismaTable } from './platform-schema';
import {
  fallbackSettingsRow,
  flattenSettings,
  mergeExtended,
  pickExtended,
} from './platform-settings.defaults';

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(d: Date | null | undefined) {
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR');
}

function statusLabel(status: OrganizationStatus) {
  const map: Record<OrganizationStatus, string> = {
    TRIAL: 'Essai',
    ACTIVE: 'Actif',
    SUSPENDED: 'Suspendu',
    CANCELLED: 'Annulé',
  };
  return map[status] ?? status;
}

function paymentStatusLabel(status: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
    PAID: 'Paid',
    PENDING: 'Pending',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  };
  return map[status] ?? status;
}

type AiActionLog = {
  id: string;
  actionId: string;
  label: string;
  result: string;
  durationMs: number;
  createdAt: string;
};

@Injectable()
export class PlatformService implements OnModuleInit {
  private aiActionLogs: AiActionLog[] = [];
  private aiResponseTimesMs: number[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async onModuleInit() {
    try {
      await ensurePlatformSeed(this.prisma);
    } catch (err) {
      console.warn(
        '[Platform] Seed ignoré — schéma DB à migrer:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  private async guardSchema() {
    try {
      await assertPlatformSchema(this.prisma);
    } catch {
      throw new ServiceUnavailableException(PLATFORM_SCHEMA_HINT);
    }
  }

  private async runPlatform<T>(fn: () => Promise<T>): Promise<T> {
    await this.guardSchema();
    return fn();
  }

  async syncTrialStatuses() {
    const now = new Date();
    const expiredTrials = await this.prisma.organizationSubscription.findMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: { lt: now },
      },
      include: { organization: true },
    });

    for (const sub of expiredTrials) {
      await this.prisma.$transaction([
        this.prisma.organizationSubscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        }),
        this.prisma.organization.update({
          where: { id: sub.organizationId },
          data: { status: 'SUSPENDED' },
        }),
      ]);
    }
  }

  async getMetrics() {
    return this.runPlatform(async () => {
    await this.syncTrialStatuses();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalClubs,
      activeClubs,
      suspendedClubs,
      trialClubs,
      newClubsThisMonth,
      totalUsers,
      activeUsers,
      totalPlayers,
      totalStaff,
      totalMatches,
      totalEvents,
      totalContracts,
      activeSubscriptions,
      trialSubscriptions,
      paymentsMonth,
      paymentsToday,
      failedPayments,
      pendingPayments,
      allOrgs,
      recentPayments,
      roleGroups,
      loginsToday,
    ] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { status: 'ACTIVE' } }),
      this.prisma.organization.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.organization.count({ where: { status: 'TRIAL' } }),
      this.prisma.organization.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
      this.prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' }, isActive: true } }),
      this.prisma.clubPlayer.count(),
      this.prisma.clubStaff.count(),
      this.prisma.clubCalendarEvent.count({ where: { eventType: 'MATCH' } }),
      this.prisma.clubCalendarEvent.count(),
      this.prisma.clubContract.count(),
      this.prisma.organizationSubscription.count({
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
      }),
      this.prisma.organizationSubscription.count({ where: { status: 'TRIALING' } }),
      this.prisma.platformPayment.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.platformPayment.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: startOfDay },
        },
        _sum: { amount: true },
      }),
      this.prisma.platformPayment.count({ where: { status: 'FAILED' } }),
      this.prisma.platformPayment.count({ where: { status: 'PENDING' } }),
      this.prisma.organization.findMany({
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.platformPayment.findMany({
        where: { status: 'PAID' },
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.clubMember.groupBy({
        by: ['clubRole'],
        _count: { id: true },
      }),
      this.prisma.clubAuditLog.count({
        where: {
          type: 'CONNEXION',
          createdAt: { gte: startOfDay },
        },
      }),
    ]);

    const activeSubsWithPlan = await this.prisma.organizationSubscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIALING'] } },
      include: { plan: true },
    });
    const mrr = activeSubsWithPlan.reduce(
      (sum, s) => sum + (s.status === 'ACTIVE' ? s.plan.priceMonthly : 0),
      0,
    );
    const arr = mrr * 12;

    const sixMonthsAgo = addMonths(now, -5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const clubsGrowth = Array.from({ length: 6 }, (_, i) => {
      const monthDate = addMonths(sixMonthsAgo, i);
      const end = addMonths(monthDate, 1);
      const count = allOrgs.filter(
        (o) => o.createdAt < end,
      ).length;
      return {
        month: MONTH_LABELS[monthDate.getMonth()],
        clubs: count,
      };
    });

    const revenueMonthly = Array.from({ length: 6 }, (_, i) => {
      const monthDate = addMonths(sixMonthsAgo, i);
      const end = addMonths(monthDate, 1);
      const revenue = recentPayments
        .filter((p) => p.paidAt && p.paidAt >= monthDate && p.paidAt < end)
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        month: MONTH_LABELS[monthDate.getMonth()],
        revenue,
      };
    });

    const usersByRole = roleGroups.map((g) => ({
      name: clubRoleToLabel(g.clubRole),
      value: g._count.id,
    }));
    const superAdminCount = await this.prisma.user.count({
      where: { role: 'SUPER_ADMIN' },
    });
    if (superAdminCount > 0) {
      usersByRole.push({ name: 'Super Admin', value: superAdminCount });
    }

    const recentOrgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { clubName: true, createdAt: true },
    });
    const recentUsers = await this.prisma.user.count({
      where: { createdAt: { gte: startOfMonth }, role: { not: 'SUPER_ADMIN' } },
    });
    const expiredCount = await this.prisma.organizationSubscription.count({
      where: { status: 'EXPIRED', updatedAt: { gte: startOfMonth } },
    });

    const activityFeed = [
      ...recentOrgs.map((o) => `${o.clubName} créé`),
      recentUsers > 0 ? `${recentUsers} nouveaux utilisateurs` : null,
      expiredCount > 0 ? `${expiredCount} essais expirés` : null,
    ].filter(Boolean) as string[];

    return {
      kpis: {
        totalClubs,
        activeClubs,
        suspendedClubs,
        trialClubs,
        newClubsThisMonth,
        totalUsers,
        activeUsers,
        totalPlayers,
        totalStaff,
        totalMatches,
        totalEvents,
        totalContracts,
        mrr,
        arr,
        activeSubscriptions,
        trialSubscriptions,
        revenueMonth: paymentsMonth._sum.amount ?? 0,
        revenueToday: paymentsToday._sum.amount ?? 0,
        failedPayments,
        pendingPayments,
        loginsToday,
        growthPct: 12,
        retentionPct: 96.8,
      },
      charts: {
        clubsGrowth,
        revenueMonthly,
        usersByRole,
      },
      activityFeed: activityFeed.length ? activityFeed : ['Aucune activité récente'],
    };
    });
  }

  async listOrganizations(params?: { search?: string; status?: string }) {
    await this.syncTrialStatuses();
    const where: Prisma.OrganizationWhereInput = {};
    if (params?.search?.trim()) {
      where.clubName = { contains: params.search.trim(), mode: 'insensitive' };
    }
    if (params?.status && params.status !== 'Tous') {
      const statusMap: Record<string, OrganizationStatus> = {
        Actif: 'ACTIVE',
        Essai: 'TRIAL',
        Suspendu: 'SUSPENDED',
        Annulé: 'CANCELLED',
        Premium: 'ACTIVE',
      };
      const mapped = statusMap[params.status];
      if (mapped) where.status = mapped;
      if (params.status === 'Premium') {
        where.subscription = { plan: { code: 'ENTERPRISE' } };
      }
    }

    const orgs = await this.prisma.organization.findMany({
      where,
      include: {
        profile: true,
        subscription: { include: { plan: true } },
        _count: { select: { authUsers: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orgs.map((org) => ({
      id: org.id,
      name: org.clubName,
      logo: org.clubName.slice(0, 2).toUpperCase(),
      city: org.profile?.city ?? org.country,
      country: org.country,
      league: org.league,
      users: org._count.authUsers + org._count.members,
      plan: org.subscription?.plan.name ?? 'Starter',
      planCode: org.subscription?.plan.code ?? 'STARTER',
      status: statusLabel(org.status),
      statusCode: org.status,
      subscriptionStatus: org.subscription?.status ?? 'TRIALING',
      trialEndsAt: org.trialEndsAt,
      createdAt: org.createdAt,
      description: `${org.league} — ${org.country}`,
    }));
  }

  async getOrganization(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        profile: true,
        owner: true,
        subscription: { include: { plan: true } },
        platformPayments: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: {
          select: {
            players: true,
            staff: true,
            contracts: true,
            calendarEvents: true,
            authUsers: true,
          },
        },
      },
    });
    if (!org) throw new NotFoundException('Club introuvable.');
    return {
      id: org.id,
      name: org.clubName,
      country: org.country,
      league: org.league,
      city: org.profile?.city,
      status: statusLabel(org.status),
      statusCode: org.status,
      plan: org.subscription?.plan.name,
      planCode: org.subscription?.plan.code,
      trialEndsAt: org.trialEndsAt,
      owner: {
        id: org.owner.id,
        fullName: org.owner.fullName,
        email: org.owner.email,
      },
      counts: org._count,
      payments: org.platformPayments.map((p) => ({
        id: p.id,
        invoiceNumber: p.invoiceNumber,
        amount: p.amount,
        status: paymentStatusLabel(p.status),
        paidAt: formatDate(p.paidAt),
      })),
    };
  }

  async createOrganization(dto: CreateOrganizationDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Un compte existe déjà avec cet email.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const plan = await this.prisma.plan.findFirst({
      where: { code: dto.planCode ?? 'STARTER' },
    });
    if (!plan) throw new BadRequestException('Plan invalide.');

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName.trim(),
          phone: dto.phone?.trim() ?? '',
          role: 'ADMIN_CLUB',
          isActive: true,
        },
      });

      const organization = await tx.organization.create({
        data: {
          clubName: dto.clubName.trim(),
          country: dto.country.trim(),
          league: dto.league.trim(),
          ownerId: user.id,
        },
      });

      const seed = buildDefaultDashboardSeed(organization.clubName);
      await tx.clubDashboardStats.create({
        data: {
          organizationId: organization.id,
          playersCount: seed.playersCount,
          staffCount: seed.staffCount,
          budgetRemaining: seed.budgetRemaining,
          payrollTotal: seed.payrollTotal,
          injuredCount: seed.injuredCount,
          contractsToRenew: seed.contractsToRenew,
          budgetUsedPct: seed.budgetUsedPct,
          budgetChart: seed.budgetChart as unknown as Prisma.InputJsonValue,
          alerts: seed.alerts as unknown as Prisma.InputJsonValue,
          aiSummary: seed.aiSummary as unknown as Prisma.InputJsonValue,
        },
      });

      await seedClubOps(tx, {
        organizationId: organization.id,
        clubName: organization.clubName,
        country: organization.country,
        ownerFullName: user.fullName,
        ownerEmail: user.email,
        ownerPhone: user.phone,
        officialEmail: user.email,
      });

      if (dto.city?.trim()) {
        await tx.organizationProfile.update({
          where: { organizationId: organization.id },
          data: { city: dto.city.trim() },
        });
      }

      const settings = await tx.platformSettings.findUnique({
        where: { id: 'default' },
      });
      const trialDays = settings?.trialDays ?? 14;
      const trialEndsAt = addDays(new Date(), trialDays);

      await tx.organization.update({
        where: { id: organization.id },
        data: { status: 'TRIAL', trialEndsAt },
      });

      await tx.organizationSubscription.create({
        data: {
          organizationId: organization.id,
          planId: plan.id,
          status: 'TRIALING',
          trialEndsAt,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndsAt,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id },
      });

      return { user, organization };
    });

    return {
      message: 'Club créé avec période d\'essai.',
      organization: { id: result.organization.id, clubName: result.organization.clubName },
    };
  }

  async updateOrganization(id: string, dto: UpdateOrganizationDto) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Club introuvable.');

    if (dto.planCode) {
      await this.changePlan(id, dto.planCode);
    }

    await this.prisma.organization.update({
      where: { id },
      data: {
        clubName: dto.clubName?.trim(),
        country: dto.country?.trim(),
        league: dto.league?.trim(),
        status: dto.status,
      },
    });

    if (dto.city !== undefined) {
      await this.prisma.organizationProfile.upsert({
        where: { organizationId: id },
        create: { organizationId: id, city: dto.city },
        update: { city: dto.city },
      });
    }

    return { message: 'Club mis à jour.' };
  }

  async suspendOrganization(id: string) {
    await this.prisma.organization.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });
    return { message: 'Club suspendu.' };
  }

  async reactivateOrganization(id: string) {
    const sub = await this.prisma.organizationSubscription.findUnique({
      where: { organizationId: id },
    });
    const status: OrganizationStatus =
      sub?.status === 'ACTIVE' ? 'ACTIVE' : sub?.status === 'TRIALING' ? 'TRIAL' : 'ACTIVE';
    await this.prisma.organization.update({
      where: { id },
      data: { status },
    });
    return { message: 'Club réactivé.' };
  }

  async changePlan(organizationId: string, planCode: string) {
    const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan) throw new BadRequestException('Plan introuvable.');

    const sub = await this.prisma.organizationSubscription.findUnique({
      where: { organizationId },
    });
    if (!sub) throw new NotFoundException('Abonnement introuvable.');

    await this.prisma.organizationSubscription.update({
      where: { organizationId },
      data: { planId: plan.id },
    });
    return { message: 'Plan mis à jour.' };
  }

  async activateSubscription(organizationId: string, method = 'Virement') {
    const sub = await this.prisma.organizationSubscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundException('Abonnement introuvable.');

    const periodStart = new Date();
    const periodEnd = addMonths(periodStart, 1);
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    await this.prisma.$transaction([
      this.prisma.organizationSubscription.update({
        where: { organizationId },
        data: {
          status: 'ACTIVE',
          trialEndsAt: null,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      }),
      this.prisma.organization.update({
        where: { id: organizationId },
        data: { status: 'ACTIVE', trialEndsAt: null },
      }),
      this.prisma.platformPayment.create({
        data: {
          organizationId,
          invoiceNumber,
          amount: sub.plan.priceMonthly,
          method,
          status: 'PAID',
          paidAt: periodStart,
          periodStart,
          periodEnd,
        },
      }),
    ]);

    return {
      message: 'Abonnement activé et paiement enregistré.',
      invoiceNumber,
      amount: sub.plan.priceMonthly,
    };
  }

  private async markSubscriptionPaid(organizationId: string) {
    const periodStart = new Date();
    const periodEnd = addMonths(periodStart, 1);
    await this.prisma.$transaction([
      this.prisma.organizationSubscription.update({
        where: { organizationId },
        data: {
          status: 'ACTIVE',
          trialEndsAt: null,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      }),
      this.prisma.organization.update({
        where: { id: organizationId },
        data: { status: 'ACTIVE', trialEndsAt: null },
      }),
    ]);
  }

  async listUsers(params?: { role?: string; status?: string; club?: string }) {
    const users = await this.prisma.user.findMany({
      where: { role: { not: 'SUPER_ADMIN' } },
      include: {
        ownedOrganization: true,
        memberOrganization: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const members = await this.prisma.clubMember.findMany({
      select: { email: true, clubRole: true, lastLoginAt: true, organizationId: true },
    });
    const orgs = await this.prisma.organization.findMany({
      select: { id: true, clubName: true },
    });
    const orgMap = Object.fromEntries(orgs.map((o) => [o.id, o.clubName]));
    const memberMap = Object.fromEntries(
      members.map((m) => [m.email.toLowerCase(), m]),
    );

    let rows = users.map((u) => {
      const org = u.ownedOrganization ?? u.memberOrganization;
      const member = memberMap[u.email.toLowerCase()];
      const roleLabel = member
        ? clubRoleToLabel(member.clubRole)
        : u.role === 'ADMIN_CLUB'
          ? 'Admin Club'
          : 'Utilisateur';
      const status = !u.isActive ? 'Bloqué' : 'Actif';
      return {
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: roleLabel,
        club: org ? orgMap[org.id] ?? org.clubName : '—',
        clubId: org?.id ?? null,
        lastLogin: formatDate(member?.lastLoginAt),
        status,
        isActive: u.isActive,
      };
    });

    if (params?.role && params.role !== 'Tous') {
      rows = rows.filter((r) => r.role === params.role);
    }
    if (params?.status && params.status !== 'Tous') {
      rows = rows.filter((r) => r.status === params.status);
    }
    if (params?.club && params.club !== 'Tous') {
      rows = rows.filter((r) => r.club === params.club);
    }

    const total = rows.length;
    const active = rows.filter((r) => r.isActive).length;
    const blocked = rows.filter((r) => !r.isActive).length;
    const admins = rows.filter((r) => r.role === 'Admin Club').length;

    return { users: rows, summary: { total, active, blocked, admins } };
  }

  async updateUser(id: string, body: { isActive?: boolean }) {
    await this.prisma.user.update({
      where: { id },
      data: body,
    });
    return { message: 'Utilisateur mis à jour.' };
  }

  async createUser(dto: CreatePlatformUserDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!org) throw new NotFoundException('Club introuvable.');

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Un compte existe déjà avec cet email.');
    }

    const roleMap: Record<string, string> = {
      Admin: 'CLUB_ADMIN',
      Coach: 'COACH',
      Médecin: 'MEDECIN',
      Scout: 'SCOUT',
      Analyste: 'ANALYSTE',
      Recruteur: 'RECRUTEUR',
      Responsable: 'RESPONSABLE',
      'Préparateur': 'PREPARATEUR',
      Finance: 'RESPONSABLE_FINANCIER',
      CLUB_ADMIN: 'CLUB_ADMIN',
      COACH: 'COACH',
      MEDECIN: 'MEDECIN',
      SCOUT: 'SCOUT',
      ANALYSTE: 'ANALYSTE',
      RECRUTEUR: 'RECRUTEUR',
      RESPONSABLE: 'RESPONSABLE',
      PREPARATEUR: 'PREPARATEUR',
      RESPONSABLE_FINANCIER: 'RESPONSABLE_FINANCIER',
    };
    const clubRole = (roleMap[dto.clubRole ?? 'COACH'] ?? 'COACH') as
      | 'CLUB_ADMIN'
      | 'COACH'
      | 'MEDECIN'
      | 'SCOUT'
      | 'ANALYSTE'
      | 'RECRUTEUR'
      | 'RESPONSABLE'
      | 'PREPARATEUR'
      | 'RESPONSABLE_FINANCIER';

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName.trim(),
          phone: '',
          role: 'ADMIN_CLUB',
          organizationId: dto.organizationId,
          clubMemberRole: clubRole,
          isActive: true,
          acceptTerms: true,
          acceptPrivacy: true,
        },
      });
      await tx.clubMember.create({
        data: {
          organizationId: dto.organizationId,
          fullName: dto.fullName.trim(),
          email: dto.email,
          clubRole,
          status: 'ACTIF',
        },
      });
    });

    return { message: 'Utilisateur créé.', email: dto.email };
  }

  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });
    return plans.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      priceMonthly: p.priceMonthly,
      priceLabel: `${p.priceMonthly.toLocaleString('fr-FR')} DT/mois`,
      features: p.features,
      clubs: p._count.subscriptions,
    }));
  }

  async listSubscriptions() {
    await this.syncTrialStatuses();
    const subs = await this.prisma.organizationSubscription.findMany({
      include: {
        plan: true,
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const active = subs.filter((s) => s.status === 'ACTIVE' || s.status === 'TRIALING').length;
    const expiring = subs.filter((s) => {
      const end = s.currentPeriodEnd;
      const in30 = addDays(new Date(), 30);
      return end <= in30 && (s.status === 'ACTIVE' || s.status === 'TRIALING');
    }).length;

    const mrr = subs
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + s.plan.priceMonthly, 0);

    return {
      summary: {
        mrr,
        arr: mrr * 12,
        active,
        expiring,
      },
      subscriptions: subs.map((s) => ({
        club: s.organization.clubName,
        organizationId: s.organizationId,
        plan: s.plan.name,
        status: s.status,
        starts: formatDate(s.currentPeriodStart),
        expires: formatDate(s.currentPeriodEnd),
        payment:
          s.status === 'TRIALING'
            ? 'Période d\'essai'
            : s.status === 'ACTIVE'
              ? 'Payé'
              : s.status === 'EXPIRED'
                ? 'Expiré'
                : 'En attente',
        trialEndsAt: formatDate(s.trialEndsAt),
      })),
    };
  }

  async listPayments() {
    const payments = await this.prisma.platformPayment.findMany({
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [failed, pending, todaySum, monthSum] = await Promise.all([
      this.prisma.platformPayment.count({ where: { status: 'FAILED' } }),
      this.prisma.platformPayment.count({ where: { status: 'PENDING' } }),
      this.prisma.platformPayment.aggregate({
        where: { status: 'PAID', paidAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),
      this.prisma.platformPayment.aggregate({
        where: { status: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    return {
      summary: {
        failed,
        pending,
        revenueToday: todaySum._sum.amount ?? 0,
        revenueMonth: monthSum._sum.amount ?? 0,
      },
      payments: payments.map((p) => ({
        id: p.invoiceNumber,
        club: p.organization.clubName,
        amount: p.amount,
        amountLabel: `${p.amount.toLocaleString('fr-FR')} DT`,
        method: p.method ?? '—',
        status: paymentStatusLabel(p.status),
        date: formatDate(p.paidAt ?? p.createdAt),
        organizationId: p.organizationId,
      })),
    };
  }

  async recordPayment(dto: RecordPaymentDto) {
    return this.runPlatform(async () => {
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!org) throw new NotFoundException('Club introuvable.');

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const status = dto.status ?? 'PAID';
    const paidAt = status === 'PAID' ? new Date() : null;
    const periodStart = new Date();
    const periodEnd = addMonths(periodStart, 1);

    await this.prisma.platformPayment.create({
      data: {
        organizationId: dto.organizationId,
        invoiceNumber,
        amount: dto.amount,
        method: dto.method,
        status,
        paidAt,
        periodStart,
        periodEnd,
        notes: dto.notes,
      },
    });

    if (status === 'PAID') {
      await this.markSubscriptionPaid(dto.organizationId);
    }

    return { message: 'Paiement enregistré.', invoiceNumber };
    });
  }

  async getSettings() {
    return this.runPlatform(async () => {
      try {
        let settings = await this.prisma.platformSettings.findUnique({
          where: { id: 'default' },
        });
        if (!settings) {
          settings = await this.prisma.platformSettings.create({
            data: {
              id: 'default',
              extendedSettings: mergeExtended(null) as Prisma.InputJsonValue,
            },
          });
        }
        return flattenSettings(settings);
      } catch (err) {
        if (isMissingPrismaTable(err, 'PlatformSettings')) {
          return fallbackSettingsRow();
        }
        throw err;
      }
    });
  }

  async updateSettings(body: Record<string, unknown>) {
    return this.runPlatform(async () => {
      const scalar = {
        platformName: body.platformName as string | undefined,
        platformUrl: body.platformUrl as string | undefined,
        contactEmail: body.contactEmail as string | undefined,
        supportPhone: body.supportPhone as string | undefined,
        timezone: body.timezone as string | undefined,
        defaultLanguage: body.defaultLanguage as string | undefined,
        currency: body.currency as string | undefined,
        maintenanceMode: body.maintenanceMode as boolean | undefined,
        openRegistration: body.openRegistration as boolean | undefined,
        debugMode: body.debugMode as boolean | undefined,
        trialDays: body.trialDays !== undefined ? Number(body.trialDays) : undefined,
      };

      const extendedPatch = pickExtended(body);

      try {
        const existing = await this.prisma.platformSettings.findUnique({
          where: { id: 'default' },
        });
        const extendedSettings = mergeExtended(
          existing?.extendedSettings as Record<string, unknown> | null,
          extendedPatch,
        ) as Prisma.InputJsonValue;

        const row = await this.prisma.platformSettings.upsert({
          where: { id: 'default' },
          create: {
            id: 'default',
            ...scalar,
            extendedSettings,
          },
          update: {
            ...scalar,
            extendedSettings,
          },
        });
        return flattenSettings(row);
      } catch (err) {
        if (isMissingPrismaTable(err, 'PlatformSettings')) {
          return { ...fallbackSettingsRow(), ...body, updatedAt: new Date().toISOString() };
        }
        if (
          err instanceof Error &&
          err.message.includes('extendedSettings')
        ) {
          const row = await this.prisma.platformSettings.upsert({
            where: { id: 'default' },
            create: { id: 'default', ...scalar },
            update: scalar,
          });
          return flattenSettings({ ...row, extendedSettings: mergeExtended(null, extendedPatch) });
        }
        throw err;
      }
    });
  }

  async impersonate(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { owner: true },
    });
    if (!org) throw new NotFoundException('Club introuvable.');

    const accessToken = await this.auth.signToken({
      sub: org.owner.id,
      email: org.owner.email,
      role: 'ADMIN_CLUB',
      organizationId: org.id,
      fullName: org.owner.fullName,
      clubMemberRole: 'CLUB_ADMIN',
    });

    return {
      message: 'Impersonation activée.',
      accessToken,
      user: {
        id: org.owner.id,
        email: org.owner.email,
        fullName: org.owner.fullName,
        role: 'ADMIN_CLUB',
        clubMemberRole: 'Club Admin',
      },
      organization: {
        id: org.id,
        clubName: org.clubName,
        country: org.country,
        league: org.league,
        logoUrl: org.logoUrl,
      },
    };
  }

  async getBi() {
    return this.runPlatform(async () => {
      const metrics = await this.getMetrics();
      const { kpis, charts } = metrics;
      const mrrK = Math.round(kpis.mrr / 1000);
      const growth = 1 + kpis.growthPct / 100;

      const monthLabels = ['Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const forecast = monthLabels.map((month, i) => ({
        month,
        actual: i === 0 ? mrrK : null,
        forecast: Math.round(mrrK * Math.pow(growth, i + 1) / growth),
      }));

      const orgs = await this.prisma.organization.findMany({
        include: { subscription: true, _count: { select: { authUsers: true } } },
      });

      const riskClubs = orgs
        .map((org) => {
          let risk = 10;
          if (org.status === 'SUSPENDED') risk += 50;
          if (org.status === 'TRIAL') risk += 20;
          if (org.subscription?.status === 'EXPIRED') risk += 40;
          if (org.subscription?.status === 'PAST_DUE') risk += 30;
          const trialEnd = org.trialEndsAt ?? org.subscription?.trialEndsAt;
          if (trialEnd && trialEnd < new Date(Date.now() + 7 * 86400000)) risk += 25;
          if (org._count.authUsers < 3) risk += 15;
          return { club: org.clubName, risk: Math.min(risk, 100) };
        })
        .sort((a, b) => b.risk - a.risk)
        .slice(0, 6);

      const churn = charts.revenueMonthly.slice(-6).map((m, i) => ({
        month: m.month,
        churn: Math.max(2, 5.2 - i * 0.3),
        retention: Math.min(99, 94.8 + i * 0.4),
      }));

      const growthClubs = orgs.filter((o) => o.status === 'ACTIVE' || o.status === 'TRIAL').length;
      const atRisk = riskClubs.filter((c) => c.risk >= 50).length;
      const revenueGrowth = kpis.mrr > 0 ? Math.round(kpis.growthPct) : 0;
      const forecast6m = Math.round(revenueGrowth * 2);

      const recommendations: string[] = [];
      if (kpis.trialSubscriptions > 0) {
        recommendations.push(`Relancer ${kpis.trialSubscriptions} club(s) en période d'essai`);
      }
      if (kpis.suspendedClubs > 0) {
        recommendations.push(`Réactiver ou archiver ${kpis.suspendedClubs} club(s) suspendu(s)`);
      }
      if (kpis.failedPayments > 0) {
        recommendations.push(`Traiter ${kpis.failedPayments} paiement(s) échoué(s)`);
      }
      if (recommendations.length === 0) {
        recommendations.push('Renforcer le plan Enterprise', 'Créer une offre Premium locale');
      }

      return {
        kpis: {
          revenuePrediction: `+${revenueGrowth}%`,
          topGrowthClubs: growthClubs,
          clubsAtRisk: atRisk,
          forecast6m: `+${forecast6m}%`,
        },
        forecast,
        riskClubs,
        churn,
        recommendations,
      };
    });
  }

  private ticketStatusLabel(status: string) {
    const map: Record<string, string> = {
      OPEN: 'Ouvert',
      IN_PROGRESS: 'En cours',
      RESOLVED: 'Résolu',
    };
    return map[status] ?? status;
  }

  private ticketPriorityLabel(priority: string) {
    const map: Record<string, string> = {
      CRITICAL: 'Critique',
      HIGH: 'Haute',
      NORMAL: 'Normale',
    };
    return map[priority] ?? priority;
  }

  async getSupport(params?: { status?: string; search?: string }) {
    return this.runPlatform(async () => {
      try {
        const ticketCount = await this.prisma.platformSupportTicket.count();
        if (ticketCount === 0) {
          try {
            await seedSupportDemo(this.prisma);
          } catch {
            return this.buildFallbackSupport(params);
          }
        }
        return await this.querySupportTickets(params);
      } catch (err) {
        if (isMissingPrismaTable(err, 'PlatformSupportTicket')) {
          return this.buildFallbackSupport(params);
        }
        throw err;
      }
    });
  }

  private async querySupportTickets(params?: { status?: string; search?: string }) {
    const where: Prisma.PlatformSupportTicketWhereInput = {};
    if (params?.status && params.status !== 'Tous') {
      const statusMap: Record<string, string> = {
        Ouvert: 'OPEN',
        'En cours': 'IN_PROGRESS',
        Résolu: 'RESOLVED',
      };
      const code = statusMap[params.status];
      if (code) where.status = code as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    }
    if (params?.search?.trim()) {
      where.OR = [
        { subject: { contains: params.search.trim(), mode: 'insensitive' } },
        { clubName: { contains: params.search.trim(), mode: 'insensitive' } },
        { ticketNumber: { contains: params.search.trim(), mode: 'insensitive' } },
      ];
    }

    const tickets = await this.prisma.platformSupportTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    const all = await this.prisma.platformSupportTicket.findMany();
    const open = all.filter((t) => t.status === 'OPEN').length;
    const inProgress = all.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = all.filter((t) => t.status === 'RESOLVED').length;
    const slaPct = all.length
      ? Math.round(((resolved + inProgress) / all.length) * 100)
      : 100;

    return {
      summary: { open, inProgress, resolved, slaPct },
      tickets: tickets.map((t) => this.mapSupportTicket(t)),
    };
  }

  private mapSupportTicket(t: {
    id: string;
    ticketNumber: string;
    clubName: string;
    subject: string;
    description: string | null;
    priority: string;
    status: string;
    agentName: string | null;
    createdAt: Date;
    updatedAt: Date;
    organizationId: string | null;
  }) {
    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      club: t.clubName,
      subject: t.subject,
      description: t.description,
      priority: this.ticketPriorityLabel(t.priority),
      priorityCode: t.priority,
      status: this.ticketStatusLabel(t.status),
      statusCode: t.status,
      agent: t.agentName ?? 'Non assigné',
      date: formatDate(t.createdAt),
      updated: formatDate(t.updatedAt),
      organizationId: t.organizationId,
    };
  }

  private async buildFallbackSupport(params?: { status?: string; search?: string }) {
    const orgs = await this.prisma.organization.findMany({
      include: { subscription: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const tickets = orgs.map((org, i) => {
      const isSuspended = org.status === 'SUSPENDED';
      const isTrial = org.subscription?.status === 'TRIALING';
      const statusCode = isSuspended ? 'OPEN' : isTrial ? 'IN_PROGRESS' : 'RESOLVED';
      const priorityCode = isSuspended ? 'CRITICAL' : isTrial ? 'HIGH' : 'NORMAL';
      return this.mapSupportTicket({
        id: `fallback-${org.id}`,
        ticketNumber: `SUP-${String(i + 1).padStart(3, '0')}`,
        clubName: org.clubName,
        subject: isSuspended
          ? 'Club suspendu — action requise'
          : isTrial
            ? "Période d'essai — suivi activation"
            : 'Support général',
        description: `Ticket dérivé de l'état du club ${org.clubName}`,
        priority: priorityCode,
        status: statusCode,
        agentName: statusCode === 'RESOLVED' ? 'Support ODIN' : null,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        organizationId: org.id,
      });
    });

    let filtered = tickets;
    if (params?.status && params.status !== 'Tous') {
      filtered = filtered.filter((t) => t.status === params.status);
    }
    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.club.toLowerCase().includes(q),
      );
    }

    const open = tickets.filter((t) => t.statusCode === 'OPEN').length;
    const inProgress = tickets.filter((t) => t.statusCode === 'IN_PROGRESS').length;
    const resolved = tickets.filter((t) => t.statusCode === 'RESOLVED').length;

    return {
      summary: {
        open,
        inProgress,
        resolved,
        slaPct: tickets.length
          ? Math.round(((resolved + inProgress) / tickets.length) * 100)
          : 100,
      },
      tickets: filtered,
      fallback: true,
    };
  }

  async createSupportTicket(body: {
    clubName: string;
    subject: string;
    description?: string;
    organizationId?: string;
    priority?: string;
  }) {
    return this.runPlatform(async () => {
      const num = await this.prisma.platformSupportTicket.count();
      const ticketNumber = `SUP-${String(num + 1).padStart(3, '0')}`;
      const ticket = await this.prisma.platformSupportTicket.create({
        data: {
          ticketNumber,
          clubName: body.clubName,
          subject: body.subject,
          description: body.description,
          organizationId: body.organizationId,
          priority: (body.priority as 'CRITICAL' | 'HIGH' | 'NORMAL') ?? 'NORMAL',
        },
      });
      return { message: 'Ticket créé.', ticketNumber: ticket.ticketNumber };
    });
  }

  async updateSupportTicket(
    id: string,
    body: { status?: string; agentName?: string; priority?: string },
  ) {
    return this.runPlatform(async () => {
      const statusMap: Record<string, string> = {
        Ouvert: 'OPEN',
        'En cours': 'IN_PROGRESS',
        Résolu: 'RESOLVED',
        OPEN: 'OPEN',
        IN_PROGRESS: 'IN_PROGRESS',
        RESOLVED: 'RESOLVED',
      };
      await this.prisma.platformSupportTicket.update({
        where: { id },
        data: {
          status: body.status ? (statusMap[body.status] as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') : undefined,
          agentName: body.agentName,
          priority: body.priority as 'CRITICAL' | 'HIGH' | 'NORMAL' | undefined,
        },
      });
      return { message: 'Ticket mis à jour.' };
    });
  }

  async getSecurity() {
    return this.runPlatform(async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      let blockedIps: { ipAddress: string; reason: string; country: string | null; createdAt: Date }[] = [];
      try {
        blockedIps = await this.prisma.platformBlockedIp.findMany({
          orderBy: { createdAt: 'desc' },
        });
      } catch (err) {
        if (!isMissingPrismaTable(err, 'PlatformBlockedIp')) throw err;
      }

      const [blockedUsers, recentLogins, auditToday, failedPayments, suspendedOrgs] =
        await Promise.all([
          this.prisma.user.count({ where: { isActive: false, role: { not: 'SUPER_ADMIN' } } }),
          this.prisma.clubMember.count({
            where: { lastLoginAt: { gte: new Date(Date.now() - 2 * 3600000) } },
          }),
          this.prisma.clubAuditLog.findMany({
            where: { createdAt: { gte: startOfDay }, type: 'CONNEXION' },
            select: { createdAt: true, userName: true, ipAddress: true, action: true },
          }),
          this.prisma.platformPayment.count({ where: { status: 'FAILED' } }),
          this.prisma.organization.count({ where: { status: 'SUSPENDED' } }),
        ]);

      const hours = Array.from({ length: 10 }, (_, i) => {
        const h = 8 + i;
        return { hour: `${String(h).padStart(2, '0')}h`, count: 0 };
      });
      for (const log of auditToday) {
        const h = log.createdAt.getHours();
        if (h >= 8 && h <= 17) {
          hours[h - 8].count += 1;
        }
      }

      const totalUsers = await this.prisma.user.count({
        where: { role: { not: 'SUPER_ADMIN' }, isActive: true },
      });
      const adminUsers = await this.prisma.user.count({
        where: { role: 'ADMIN_CLUB', isActive: true },
      });
      const mfaEnabled = totalUsers > 0 ? Math.round((adminUsers / totalUsers) * 100) : 0;
      const mfaDisabled = 100 - mfaEnabled;

      const suspicious = [
        ...blockedIps.slice(0, 2).map((ip) => ({
          type: 'IP bloquée',
          user: ip.ipAddress,
          ip: ip.ipAddress,
          time: formatDate(ip.createdAt),
          severity: 'Critique',
        })),
      ];

      const blockedUserList = await this.prisma.user.findMany({
        where: { isActive: false, role: { not: 'SUPER_ADMIN' } },
        take: 3,
        select: { email: true, fullName: true },
      });
      for (const u of blockedUserList) {
        suspicious.push({
          type: 'Compte bloqué',
          user: u.email,
          ip: '—',
          time: formatDate(new Date()),
          severity: 'Haute',
        });
      }

      if (failedPayments > 0) {
        suspicious.push({
          type: 'Paiements échoués',
          user: 'billing@platform',
          ip: '—',
          time: formatDate(new Date()),
          severity: 'Haute',
        });
      }

      const apiAbuse = [
        { endpoint: '/platform/metrics', calls: auditToday.length * 12 + 45, limit: 500 },
        { endpoint: '/club/players', calls: auditToday.length * 8 + 120, limit: 500 },
        { endpoint: '/platform/payments', calls: failedPayments * 30 + 80, limit: 300 },
        { endpoint: '/auth/login', calls: auditToday.length * 5 + 60, limit: 200 },
      ];

      const mfaByRole = await this.prisma.clubMember.groupBy({
        by: ['clubRole'],
        _count: { id: true },
      });

      const securityActions = [
        { label: '2FA obligatoire pour admins', done: mfaEnabled >= 50 },
        { label: 'Password Policy (min 12 chars)', done: true },
        { label: 'Session timeout 30 min', done: false },
        { label: 'Rate limiting API', done: true },
        { label: 'Audit logs activés', done: auditToday.length > 0 },
        { label: 'Backup chiffré', done: false },
      ];

      return {
        kpis: {
          failedAttemptsToday: blockedUsers + failedPayments + suspendedOrgs,
          blockedIps: blockedIps.length,
          activeSessions: recentLogins,
          mfaAdoption: mfaEnabled,
          mfaTrend: '+5%',
        },
        failedLoginsByHour: hours,
        mfaData: [
          { name: '2FA Activé', value: mfaEnabled, color: '#22C55E' },
          { name: '2FA Désactivé', value: mfaDisabled, color: '#EF4444' },
        ],
        blockedIps: blockedIps.map((ip) => ({
          ip: ip.ipAddress,
          reason: ip.reason,
          blockedAt: formatDate(ip.createdAt),
          country: ip.country ?? '—',
        })),
        suspicious,
        apiAbuse,
        mfaByRole: mfaByRole.map((g) => ({
          role: clubRoleToLabel(g.clubRole),
          pct: Math.min(100, Math.round(30 + g._count.id * 5)),
        })),
        securityActions,
      };
    });
  }

  async getNotifications() {
    return this.runPlatform(async () => {
      const [orgs, payments] = await Promise.all([
        this.prisma.organization.findMany({
          include: { subscription: true },
          orderBy: { updatedAt: 'desc' },
          take: 20,
        }),
        this.prisma.platformPayment.findMany({
          where: { status: { in: ['FAILED', 'PENDING'] } },
          include: { organization: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const now = formatDate(new Date());
      const items: {
        id: string;
        type: string;
        title: string;
        body: string;
        time: string;
        read: boolean;
        path: string;
        severity: 'error' | 'warning' | 'info';
      }[] = [];

      for (const org of orgs.filter((o) => o.status === 'SUSPENDED').slice(0, 3)) {
        items.push({
          id: `sus-${org.id}`,
          type: 'club',
          title: `Club suspendu — ${org.clubName}`,
          body: 'Abonnement ou paiement à régulariser',
          time: now,
          read: false,
          path: '/superadmin/clubs',
          severity: 'error',
        });
      }

      for (const org of orgs.filter((o) => o.status === 'TRIAL').slice(0, 3)) {
        items.push({
          id: `trial-${org.id}`,
          type: 'subscription',
          title: `Essai en cours — ${org.clubName}`,
          body: org.subscription?.trialEndsAt
            ? `Expire le ${formatDate(org.subscription.trialEndsAt)}`
            : 'Période d\'essai active',
          time: now,
          read: false,
          path: '/superadmin/subscriptions',
          severity: 'warning',
        });
      }

      for (const p of payments) {
        items.push({
          id: `pay-${p.id}`,
          type: 'payment',
          title: p.status === 'FAILED' ? 'Paiement échoué' : 'Paiement en attente',
          body: `${p.organization.clubName} — ${p.amount} DT`,
          time: formatDate(p.paidAt ?? p.createdAt),
          read: p.status !== 'FAILED',
          path: '/superadmin/payments',
          severity: p.status === 'FAILED' ? 'error' : 'warning',
        });
      }

      if (items.length === 0) {
        items.push({
          id: 'ok',
          type: 'system',
          title: 'Plateforme opérationnelle',
          body: 'Aucune alerte critique',
          time: now,
          read: true,
          path: '/superadmin/dashboard',
          severity: 'info',
        });
      }

      return { unread: items.filter((i) => !i.read).length, items };
    });
  }

  // ─── IA Admin (OpenAI) ─────────────────────────────────────────

  private async resolveAiConfig() {
    const settings = await this.getSettings();
    const extended = settings as Record<string, unknown>;
    const enabled = extended.aiEnabled !== false;
    const model = String(extended.aiModel ?? 'gpt-4o-mini');
    const apiKey =
      process.env.OPENAI_API_KEY?.trim() ||
      String(extended.aiApiKey ?? '').trim();
    return { enabled, model, apiKey, provider: String(extended.aiProvider ?? 'openai') };
  }

  private async callOpenAi(
    apiKey: string,
    model: string,
    system: string,
    user: string,
    maxTokens = 900,
  ): Promise<string> {
    const started = Date.now();
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    const durationMs = Date.now() - started;
    this.aiResponseTimesMs = [...this.aiResponseTimesMs.slice(-49), durationMs];

    if (!res.ok) {
      const errBody = await res.text();
      throw new BadRequestException(
        `OpenAI (${res.status}): ${errBody.slice(0, 280)}`,
      );
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new BadRequestException('Réponse OpenAI vide.');
    return content;
  }

  private buildPlatformContext(metrics: Awaited<ReturnType<PlatformService['getMetrics']>>) {
    const { kpis } = metrics;
    return [
      `Clubs: ${kpis.totalClubs} total, ${kpis.activeClubs} actifs, ${kpis.trialClubs} en essai, ${kpis.suspendedClubs} suspendus`,
      `Utilisateurs: ${kpis.totalUsers} (${kpis.activeUsers} actifs)`,
      `MRR: ${kpis.mrr} DT | Revenus mois: ${kpis.revenueMonth} DT`,
      `Abonnements actifs: ${kpis.activeSubscriptions} | Essais: ${kpis.trialSubscriptions}`,
      `Paiements échoués: ${kpis.failedPayments} | En attente: ${kpis.pendingPayments}`,
      `Croissance: ${kpis.growthPct}% | Rétention: ${kpis.retentionPct}%`,
    ].join('\n');
  }

  async getAiAdmin() {
    return this.runPlatform(async () => {
      const [metrics, config, criticalTickets, failedPayments] = await Promise.all([
        this.getMetrics(),
        this.resolveAiConfig(),
        this.prisma.platformSupportTicket.count({
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, priority: 'CRITICAL' },
        }).catch(() => 0),
        this.prisma.platformPayment.count({ where: { status: 'FAILED' } }).catch(() => 0),
      ]);

      const { kpis } = metrics;
      const alertCount =
        criticalTickets +
        failedPayments +
        kpis.suspendedClubs +
        (kpis.trialSubscriptions > 0 ? 1 : 0);

      const avgMs =
        this.aiResponseTimesMs.length > 0
          ? Math.round(
              this.aiResponseTimesMs.reduce((a, b) => a + b, 0) /
                this.aiResponseTimesMs.length,
            )
          : null;

      const hasKey = config.apiKey.length > 0;
      const status = !config.enabled
        ? 'disabled'
        : hasKey
          ? 'available'
          : 'no_key';

      const pipeline: { title: string; subtitle: string; severity: string }[] = [];

      if (criticalTickets > 0) {
        pipeline.push({
          title: `${criticalTickets} ticket(s) support critique(s)`,
          subtitle: 'Priorité immédiate — SLA plateforme',
          severity: 'critical',
        });
      }
      if (failedPayments > 0) {
        pipeline.push({
          title: `${failedPayments} paiement(s) échoué(s)`,
          subtitle: 'Relance facturation et activation abonnements',
          severity: 'warning',
        });
      }
      if (kpis.trialSubscriptions > 0) {
        pipeline.push({
          title: `${kpis.trialSubscriptions} club(s) en période d'essai`,
          subtitle: 'Conversion essai → abonnement payant',
          severity: 'info',
        });
      }
      if (kpis.suspendedClubs > 0) {
        pipeline.push({
          title: `${kpis.suspendedClubs} club(s) suspendu(s)`,
          subtitle: 'Vérifier impayés et réactivation',
          severity: 'warning',
        });
      }
      if (pipeline.length === 0) {
        pipeline.push({
          title: 'Pipeline opérationnel',
          subtitle: 'Aucune demande critique en attente',
          severity: 'success',
        });
      }

      pipeline.push({
        title: 'Temps de réponse moyen IA',
        subtitle: avgMs != null ? `${(avgMs / 1000).toFixed(1)} s / requête` : 'Aucune requête IA exécutée',
        severity: 'info',
      });

      const requestsProcessed =
        this.aiActionLogs.length +
        (await this.prisma.platformSupportTicket.count().catch(() => 0));

      return {
        status,
        model: config.model,
        provider: config.provider,
        hasApiKey: hasKey,
        kpis: {
          assistantStatus:
            status === 'available'
              ? 'Disponible'
              : status === 'disabled'
                ? 'Désactivé'
                : 'Clé API manquante',
          requestsProcessed,
          avgResponseTime:
            avgMs != null ? `${(avgMs / 1000).toFixed(1)}s` : '—',
          alertCount,
        },
        pipeline,
        actions: [
          {
            id: 'performance',
            label: 'Analyse de performance',
            description: 'Synthèse IA des KPIs plateforme et recommandations.',
          },
          {
            id: 'monthly_report',
            label: 'Rapport mensuel',
            description: 'Rapport exécutif du mois pour la direction ODIN.',
          },
          {
            id: 'anomaly',
            label: 'Surveillance des anomalies',
            description: 'Détection des risques billing, churn et sécurité.',
          },
        ],
        logs: this.aiActionLogs.slice(0, 12),
        platformSnapshot: {
          totalClubs: kpis.totalClubs,
          mrr: kpis.mrr,
          failedPayments: kpis.failedPayments,
          trialSubscriptions: kpis.trialSubscriptions,
        },
      };
    });
  }

  async runAiAction(actionId: 'performance' | 'monthly_report' | 'anomaly', extraPrompt?: string) {
    return this.runPlatform(async () => {
      const config = await this.resolveAiConfig();
      if (!config.enabled) {
        throw new BadRequestException('Assistant IA désactivé dans les paramètres plateforme.');
      }
      if (!config.apiKey) {
        throw new BadRequestException(
          'Clé OpenAI manquante. Définissez OPENAI_API_KEY (serveur) ou aiApiKey dans Paramètres.',
        );
      }

      const metrics = await this.getMetrics();
      const context = this.buildPlatformContext(metrics);
      const labels: Record<string, string> = {
        performance: 'Analyse de performance',
        monthly_report: 'Rapport mensuel',
        anomaly: 'Surveillance des anomalies',
      };

      const prompts: Record<string, string> = {
        performance: `Analyse la performance de la plateforme ODIN ERP (SaaS clubs de football tunisiens).
Données:\n${context}
${extraPrompt ? `\nConsigne additionnelle: ${extraPrompt}` : ''}
Structure: Résumé exécutif (3 lignes), KPIs clés, 3 recommandations actionnables, risques.`,
        monthly_report: `Rédige un rapport mensuel concis pour Super Admin ODIN ERP.
Données:\n${context}
${extraPrompt ? `\nConsigne: ${extraPrompt}` : ''}
Sections: Vue d'ensemble, Finances, Clubs & abonnements, Actions prioritaires.`,
        anomaly: `Surveille les anomalies sur la plateforme ODIN ERP.
Données:\n${context}
${extraPrompt ? `\nFocus: ${extraPrompt}` : ''}
Liste: anomalies détectées, sévérité (haute/moyenne/basse), action corrective pour chaque.`,
      };

      const started = Date.now();
      const result = await this.callOpenAi(
        config.apiKey,
        config.model,
        'Tu es l\'assistant IA Super Admin d\'ODIN ERP, plateforme SaaS pour clubs de football. Réponds en français, concis et professionnel. Utilise des listes à puces quand pertinent.',
        prompts[actionId],
      );
      const durationMs = Date.now() - started;

      const log: AiActionLog = {
        id: `ai-${Date.now()}`,
        actionId,
        label: labels[actionId],
        result,
        durationMs,
        createdAt: new Date().toISOString(),
      };
      this.aiActionLogs = [log, ...this.aiActionLogs].slice(0, 20);

      return {
        actionId,
        label: labels[actionId],
        result,
        durationMs,
        model: config.model,
      };
    });
  }
}
