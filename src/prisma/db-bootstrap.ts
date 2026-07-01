import { execSync } from 'child_process';
import { Logger } from '@nestjs/common';

const logger = new Logger('DbBootstrap');

const SQL_FILES = [
  'prisma/migrations/add-responsable-joueur.sql',
  'prisma/migrations/add-scout-tables.sql',
  'prisma/migrations/add-messages-tables.sql',
];

function runCmd(label: string, cmd: string) {
  try {
    execSync(cmd, { stdio: 'pipe', encoding: 'utf8', env: process.env });
    logger.log(`${label} OK`);
    return true;
  } catch (err: unknown) {
    const e = err as { stderr?: string; stdout?: string; message?: string };
    const detail = (e.stderr || e.stdout || e.message || String(err)).trim();
    logger.warn(`${label} — ${detail.slice(0, 600)}`);
    return false;
  }
}

/** Crée les tables manquantes (Responsable, Scout, etc.) avant le démarrage de l'API. */
export function runDatabaseBootstrap() {
  if (process.env.SKIP_DB_BOOTSTRAP === '1') {
    logger.log('SKIP_DB_BOOTSTRAP=1 — bootstrap ignoré.');
    return;
  }

  for (const file of SQL_FILES) {
    runCmd(
      `SQL ${file}`,
      `npx prisma db execute --file ${file} --schema prisma/schema.prisma`,
    );
  }

  runCmd('prisma db push', 'npx prisma db push --accept-data-loss');
}
