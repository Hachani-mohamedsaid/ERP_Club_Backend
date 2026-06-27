import { Prisma } from '@prisma/client';

const DEFAULT_BUDGET_CATEGORIES = [
  { name: 'Recrutement', allocated: 120_000, spent: 0 },
  { name: 'Équipement', allocated: 40_000, spent: 0 },
  { name: 'Déplacements', allocated: 30_000, spent: 0 },
  { name: 'Infrastructure', allocated: 80_000, spent: 0 },
  { name: 'Médical', allocated: 25_000, spent: 0 },
];

export async function seedResponsableDefaults(
  tx: Prisma.TransactionClient,
  organizationId: string,
  ownerName: string,
) {
  const existing = await tx.budgetCategory.count({ where: { organizationId } });
  if (existing === 0) {
    await tx.budgetCategory.createMany({
      data: DEFAULT_BUDGET_CATEGORIES.map((c) => ({ organizationId, ...c })),
    });
  }

  const validationCount = await tx.validationRequest.count({ where: { organizationId } });
  if (validationCount === 0) {
    await tx.validationRequest.createMany({
      data: [
        {
          organizationId,
          type: 'RECRUTEMENT',
          title: 'Recrutement joueur',
          detail: 'Prospect jeune — validation scouting requise',
          priority: 'HAUTE',
          status: 'EN_ATTENTE',
          requestedBy: 'Scout',
        },
        {
          organizationId,
          type: 'CONTRAT',
          title: 'Renouvellement contrat',
          detail: 'Renouvellement salarial — 2 ans',
          priority: 'HAUTE',
          status: 'EN_ATTENTE',
          requestedBy: 'Coach',
        },
        {
          organizationId,
          type: 'BUDGET',
          title: 'Achat équipement',
          detail: 'Matériel médical — 18 500 DT',
          amount: '18 500 DT',
          priority: 'NORMALE',
          status: 'EN_ATTENTE',
          requestedBy: ownerName,
        },
      ],
    });
  }
}
