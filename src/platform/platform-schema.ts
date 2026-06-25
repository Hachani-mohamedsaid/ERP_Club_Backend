import { PrismaService } from '../prisma/prisma.service';

export const PLATFORM_SCHEMA_HINT =
  'Schéma base de données incomplet. Exécutez: cd erp-club-backend && npx prisma db push';

export async function assertPlatformSchema(prisma: PrismaService) {
  try {
    await prisma.organization.findFirst({
      select: { id: true, status: true },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('does not exist') || msg.includes('status')) {
      throw new Error(PLATFORM_SCHEMA_HINT);
    }
    throw err;
  }
}

export function isMissingPrismaTable(err: unknown, tableHint?: string) {
  const msg = err instanceof Error ? err.message : String(err);
  if (!msg.includes('does not exist')) return false;
  if (!tableHint) return true;
  return msg.includes(tableHint);
}
