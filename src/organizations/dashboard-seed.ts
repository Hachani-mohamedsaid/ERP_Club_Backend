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
  return [
    { month: 'Jan', budget: 420, spent: 0 },
    { month: 'Fév', budget: 420, spent: 0 },
    { month: 'Mar', budget: 420, spent: 0 },
    { month: 'Avr', budget: 420, spent: 0 },
    { month: 'Mai', budget: 420, spent: 0 },
    { month: 'Juin', budget: 420, spent: 0 },
    { month: 'Juil', budget: 420, spent: 0 },
    { month: 'Août', budget: 420, spent: 0 },
    { month: 'Sep', budget: 420, spent: 0 },
    { month: 'Oct', budget: 420, spent: 0 },
    { month: 'Nov', budget: 420, spent: 0 },
    { month: 'Déc', budget: 420, spent: 0 },
  ];
}

export function buildDefaultDashboardSeed(clubName: string) {
  return {
    playersCount: 0,
    staffCount: 1,
    budgetRemaining: 500000,
    payrollTotal: 0,
    injuredCount: 0,
    contractsToRenew: 0,
    budgetUsedPct: 0,
    budgetChart: buildDefaultBudgetChart(),
    alerts: [
      {
        type: 'warning' as const,
        text: `Bienvenue sur ODIN ERP — ${clubName} est prêt. Ajoutez vos joueurs et staff.`,
      },
    ],
    aiSummary: [
      `${clubName} vient d'être créé sur la plateforme.`,
      'Commencez par inviter votre staff technique.',
      'Le budget club est disponible à 100%.',
    ],
  };
}
