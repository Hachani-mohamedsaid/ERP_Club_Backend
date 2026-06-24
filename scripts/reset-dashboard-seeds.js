"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dashboard_seed_1 = require("../src/organizations/dashboard-seed");
const prisma = new client_1.PrismaClient();
async function main() {
    const orgs = await prisma.organization.findMany({
        include: { dashboardStats: true },
    });
    for (const org of orgs) {
        if (!org.dashboardStats)
            continue;
        const seed = (0, dashboard_seed_1.buildDefaultDashboardSeed)(org.clubName);
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
                budgetChart: seed.budgetChart,
                alerts: seed.alerts,
                aiSummary: seed.aiSummary,
            },
        });
        console.log(`Reset: ${org.clubName}`);
    }
    console.log(`Done — ${orgs.length} organisation(s) traitée(s).`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=reset-dashboard-seeds.js.map