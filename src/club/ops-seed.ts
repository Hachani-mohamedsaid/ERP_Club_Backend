import { Prisma } from '@prisma/client';
import { buildDefaultPermissions } from './permissions-seed';
import { seedResponsableDefaults } from '../responsable/responsable-seed';

interface SeedOpsInput {
  organizationId: string;
  clubName: string;
  country: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
  officialEmail: string;
}

export async function seedClubOps(
  tx: Prisma.TransactionClient,
  input: SeedOpsInput,
) {
  await tx.organizationProfile.create({
    data: {
      organizationId: input.organizationId,
      officialEmail: input.officialEmail,
      phone: input.ownerPhone,
      city: input.country,
    },
  });

  await tx.clubMember.create({
    data: {
      organizationId: input.organizationId,
      fullName: input.ownerFullName,
      email: input.ownerEmail,
      clubRole: 'CLUB_ADMIN',
      status: 'ACTIF',
      lastLoginAt: new Date(),
    },
  });

  const perms = buildDefaultPermissions(input.organizationId);
  await tx.clubPermission.createMany({ data: perms });

  await seedResponsableDefaults(tx, input.organizationId, input.ownerFullName);
}
