/**
 * Remet à zéro les stats dashboard des clubs créés avec l'ancien seed (1 staff, 500k budget).
 * Usage: npx ts-node scripts/reset-dashboard-seeds.ts
 */
import { PrismaClient } from '@prisma/client';
import { buildDefaultDashboardSeed } from '../src/organizations/dashboard-seed';

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    include: { dashboardStats: true },
  });

  for (const org of orgs) {
    if (!org.dashboardStats) continue;

    const seed = buildDefaultDashboardSeed(org.clubName);
    await prisma.clubDashboardStats.update({
      where: { organizationId: org.id },
      data: {
        playersCount: 0,
        staffCount: 0,
        budgetRemaining: 0,
        payrollTotal: 0,
        injuredCount: 0,
        contractsToRenew: 0,
        budgetUsedPct: 0,
        budgetChart: seed.budgetChart as object,
        alerts: seed.alerts as object,
        aiSummary: seed.aiSummary as object,
      },
    });
    console.log(`Reset: ${org.clubName}`);
  }

  console.log(`Done — ${orgs.length} organisation(s) traitée(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
