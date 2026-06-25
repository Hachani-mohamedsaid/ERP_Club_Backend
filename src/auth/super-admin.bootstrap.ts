import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

export async function ensureSuperAdmin(
  prisma: PrismaService,
  config: ConfigService,
) {
  const existingCount = await prisma.user.count({
    where: { role: 'SUPER_ADMIN' },
  });
  if (existingCount > 0) return;

  const email = config
    .get<string>('SUPER_ADMIN_EMAIL', 'superadmin@odin-erp.com')
    .trim()
    .toLowerCase();
  const password = config.get<string>(
    'SUPER_ADMIN_PASSWORD',
    'Odin@SuperAdmin2026!',
  );
  const fullName = config.get<string>('SUPER_ADMIN_NAME', 'Super Admin ODIN');

  const emailTaken = await prisma.user.findUnique({ where: { email } });
  if (emailTaken) {
    console.warn(
      `[bootstrap] Super Admin non créé : l'email ${email} est déjà utilisé.`,
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      phone: '',
      role: 'SUPER_ADMIN',
      isActive: true,
      acceptTerms: true,
      acceptPrivacy: true,
    },
  });

  console.log(`[bootstrap] Compte Super Admin unique créé (${email}).`);
}
