import { PrismaClient } from '@prisma/client';

const DEFAULT_PLANS = [
  {
    code: 'STARTER',
    name: 'Starter',
    priceMonthly: 590,
    features: ['Gestion clubs', 'Analytics basiques', 'Support email'],
    sortOrder: 1,
  },
  {
    code: 'PRO',
    name: 'Pro',
    priceMonthly: 1290,
    features: ['Tableaux avancés', 'Monitoring', 'Support prioritaire'],
    sortOrder: 2,
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    priceMonthly: 2990,
    features: ['API avancée', 'SLA 24/7', 'Plusieurs organisations'],
    sortOrder: 3,
  },
] as const;

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function ensurePlatformSeed(prisma: PrismaClient) {
  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });

  for (const plan of DEFAULT_PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: {
        code: plan.code,
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        features: [...plan.features],
        sortOrder: plan.sortOrder,
      },
      update: {
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        features: [...plan.features],
        sortOrder: plan.sortOrder,
      },
    });
  }

  const settings = await prisma.platformSettings.findUnique({
    where: { id: 'default' },
  });
  const trialDays = settings?.trialDays ?? 14;
  const starterPlan = await prisma.plan.findUnique({
    where: { code: 'STARTER' },
  });
  if (!starterPlan) return;

  const orgsWithoutSub = await prisma.organization.findMany({
    where: { subscription: null },
    select: { id: true, createdAt: true, status: true, trialEndsAt: true },
  });

  for (const org of orgsWithoutSub) {
    const trialEndsAt = org.trialEndsAt ?? addDays(org.createdAt, trialDays);
    const isExpired = trialEndsAt < new Date();
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        status: org.status === 'CANCELLED' ? 'CANCELLED' : isExpired ? 'SUSPENDED' : 'TRIAL',
        trialEndsAt,
      },
    });
    await prisma.organizationSubscription.create({
      data: {
        organizationId: org.id,
        planId: starterPlan.id,
        status: isExpired ? 'EXPIRED' : 'TRIALING',
        trialEndsAt,
        currentPeriodStart: org.createdAt,
        currentPeriodEnd: trialEndsAt,
      },
    });
  }

  await seedSupportDemo(prisma);
}

export async function seedSupportDemo(prisma: PrismaClient) {
  const ticketCount = await prisma.platformSupportTicket.count();
  if (ticketCount > 0) return;

  const orgs = await prisma.organization.findMany({
    take: 4,
    include: { subscription: true },
    orderBy: { createdAt: 'desc' },
  });

  const subjects = [
    'Problème de facturation récurrent',
    "Demande d'accès API étendue",
    'Incident de synchronisation données',
    'Réinitialisation mot de passe en masse',
  ];
  const priorities = ['CRITICAL', 'HIGH', 'HIGH', 'NORMAL'] as const;

  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i];
    await prisma.platformSupportTicket.create({
      data: {
        ticketNumber: `SUP-${String(i + 1).padStart(3, '0')}`,
        organizationId: org.id,
        clubName: org.clubName,
        subject: subjects[i] ?? `Support ${org.clubName}`,
        description: `Ticket auto-généré pour ${org.clubName}`,
        priority: priorities[i] ?? 'NORMAL',
        status: i === 0 ? 'OPEN' : i === 1 ? 'IN_PROGRESS' : i === 2 ? 'IN_PROGRESS' : 'RESOLVED',
        agentName: i > 0 && i < 3 ? 'Support ODIN' : null,
      },
    });
  }

  const ipCount = await prisma.platformBlockedIp.count();
  if (ipCount === 0) {
    await prisma.platformBlockedIp.createMany({
      data: [
        { ipAddress: '192.168.1.200', reason: 'Brute force (tentatives multiples)', country: 'TN' },
        { ipAddress: '45.22.178.91', reason: 'Scan de ports détecté', country: 'RU' },
      ],
    });
  }
}

export async function createTrialSubscription(
  tx: Pick<PrismaClient, 'plan' | 'organizationSubscription' | 'organization' | 'platformSettings'>,
  organizationId: string,
  createdAt = new Date(),
) {
  const settings = await tx.platformSettings.findUnique({
    where: { id: 'default' },
  });
  const trialDays = settings?.trialDays ?? 14;
  const starterPlan = await tx.plan.findUnique({ where: { code: 'STARTER' } });
  if (!starterPlan) {
    throw new Error('Plan Starter introuvable.');
  }

  const trialEndsAt = addDays(createdAt, trialDays);
  await tx.organization.update({
    where: { id: organizationId },
    data: { status: 'TRIAL', trialEndsAt },
  });
  await tx.organizationSubscription.create({
    data: {
      organizationId,
      planId: starterPlan.id,
      status: 'TRIALING',
      trialEndsAt,
      currentPeriodStart: createdAt,
      currentPeriodEnd: trialEndsAt,
    },
  });
}
