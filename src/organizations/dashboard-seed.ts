export interface BudgetChartPoint {
  month: string;
  budget: number;
  spent: number;
}

export interface ClubAlert {
  type: 'warning' | 'danger';
  text: string;
}

export function buildDefaultBudgetChart(): BudgetChartPoint[] {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  return months.map((month) => ({ month, budget: 0, spent: 0 }));
}

export function buildDefaultDashboardSeed(clubName: string) {
  return {
    playersCount: 0,
    staffCount: 0,
    budgetRemaining: 0,
    payrollTotal: 0,
    injuredCount: 0,
    contractsToRenew: 0,
    budgetUsedPct: 0,
    budgetChart: buildDefaultBudgetChart(),
    alerts: [
      {
        type: 'warning' as const,
        text: `Bienvenue ${clubName} — commencez par ajouter vos joueurs et votre staff.`,
      },
    ],
    aiSummary: [
      'Aucun joueur enregistré pour le moment.',
      'Aucun membre du staff ajouté.',
      'Budget non configuré — définissez-le dans Finances.',
    ],
  };
}
