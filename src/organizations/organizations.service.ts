import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildDefaultDashboardSeed } from './dashboard-seed';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(organizationId: string, email: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        owner: true,
        dashboardStats: true,
      },
    });

    if (!org) {
      throw new NotFoundException('Organisation introuvable.');
    }

    if (org.owner.email !== email.trim().toLowerCase()) {
      throw new ForbiddenException('Accès refusé à cette organisation.');
    }

    let stats = org.dashboardStats;
    if (!stats) {
      const seed = buildDefaultDashboardSeed(org.clubName);
      stats = await this.prisma.clubDashboardStats.create({
        data: {
          organizationId: org.id,
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
    }

    return {
      organization: {
        id: org.id,
        clubName: org.clubName,
        country: org.country,
        league: org.league,
        logoUrl: org.logoUrl,
      },
      owner: {
        fullName: org.owner.fullName,
        email: org.owner.email,
      },
      season: String(new Date().getFullYear()),
      kpis: [
        { label: 'Joueurs', value: stats.playersCount, icon: 'users', color: '#FF6B57' },
        { label: 'Staff', value: stats.staffCount, icon: 'staff', color: '#6366F1' },
        {
          label: 'Budget restant',
          value: stats.budgetRemaining,
          icon: 'budget',
          color: '#22C55E',
          suffix: ' DT',
        },
        {
          label: 'Masse salariale',
          value: stats.payrollTotal,
          icon: 'salary',
          color: '#F59E0B',
          suffix: ' DT',
        },
        { label: 'Blessés', value: stats.injuredCount, icon: 'injured', color: '#EF4444' },
        {
          label: 'Contrats à renouveler',
          value: stats.contractsToRenew,
          icon: 'contract',
          color: '#F59E0B',
        },
      ],
      budgetChart: stats.budgetChart,
      alerts: stats.alerts,
      aiSummary: stats.aiSummary,
      budgetUsedPct: stats.budgetUsedPct,
    };
  }
}
