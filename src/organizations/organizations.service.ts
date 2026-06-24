import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ClubService } from '../club/club.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly club: ClubService,
  ) {}

  async getDashboard(organizationId: string, user: JwtPayload) {
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException('Accès refusé à cette organisation.');
    }
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

    await this.club.syncDashboardStats(organizationId);

    const orgRefreshed = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { owner: true, dashboardStats: true },
    });
    if (!orgRefreshed?.dashboardStats) {
      throw new NotFoundException('Statistiques introuvables.');
    }
    const stats = orgRefreshed.dashboardStats;

    return {
      organization: {
        id: orgRefreshed.id,
        clubName: orgRefreshed.clubName,
        country: orgRefreshed.country,
        league: orgRefreshed.league,
        logoUrl: orgRefreshed.logoUrl,
      },
      owner: {
        fullName: orgRefreshed.owner.fullName,
        email: orgRefreshed.owner.email,
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
