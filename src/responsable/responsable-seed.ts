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
  _ownerName: string,
) {
  const existing = await tx.budgetCategory.count({ where: { organizationId } });
  if (existing === 0) {
    await tx.budgetCategory.createMany({
      data: DEFAULT_BUDGET_CATEGORIES.map((c) => ({ organizationId, ...c })),
    });
  }
}
