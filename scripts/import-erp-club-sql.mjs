#!/usr/bin/env node
/**
 * Prépare et importe scripts/erp_club_2026-07-17.sql dans PostgreSQL.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/import-erp-club-sql.mjs
 *   node scripts/import-erp-club-sql.mjs "postgresql://..."
 */
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE_SQL = join(__dirname, 'erp_club_2026-07-17.sql');
const PREPARED_SQL = join(__dirname, 'erp_club_2026-07-17.import.sql');

function loadDatabaseUrl(argvUrl) {
  if (argvUrl) return argvUrl;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return null;
  const line = readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('DATABASE_URL='));
  if (!line) return null;
  const raw = line.slice('DATABASE_URL='.length).trim();
  return raw.replace(/^["']|["']$/g, '');
}

function prepareSql() {
  let sql = readFileSync(SOURCE_SQL, 'utf8');
  sql = sql
    .split('\n')
    .filter((line) => !line.startsWith('\\restrict') && !line.startsWith('\\unrestrict'))
    .join('\n');

  const header = `-- Prepared import ${new Date().toISOString()}
-- Reset schema puis restauration dump erp_club

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO CURRENT_USER;

`;

  writeFileSync(PREPARED_SQL, header + sql, 'utf8');
  return PREPARED_SQL;
}

function main() {
  const dbUrl = loadDatabaseUrl(process.argv[2]);
  if (!dbUrl) {
    console.error('❌ DATABASE_URL manquante (.env ou argument).');
    process.exit(1);
  }

  if (dbUrl.includes('railway.internal') && !process.env.RAILWAY_ENVIRONMENT && !process.env.RAILWAY_SERVICE_NAME) {
    console.error('❌ URL interne Railway (postgres.railway.internal) — utilisable seulement depuis le backend Railway.');
    console.error('   → Railway → erp-club-backend → Console : npm run db:import:dump');
    console.error('   → Ou copie DATABASE_PUBLIC_URL (TCP proxy) depuis Postgres → Connect.');
    process.exit(1);
  }

  if (!existsSync(SOURCE_SQL)) {
    console.error(`❌ Fichier introuvable: ${SOURCE_SQL}`);
    process.exit(1);
  }

  const prepared = prepareSql();
  console.log(`📄 SQL préparé: ${prepared}`);

  const test = spawnSync('psql', [dbUrl, '-c', 'SELECT current_database(), current_user;'], {
    encoding: 'utf8',
    env: { ...process.env, PGSSLMODE: process.env.PGSSLMODE ?? 'require' },
  });

  if (test.status !== 0) {
    console.error('❌ Connexion PostgreSQL échouée:');
    console.error(test.stderr || test.stdout);
    process.exit(1);
  }

  console.log('✅ Connexion OK — import en cours (peut prendre 1-2 min)...');

  const imp = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', prepared], {
    encoding: 'utf8',
    env: { ...process.env, PGSSLMODE: process.env.PGSSLMODE ?? 'require' },
  });

  if (imp.stdout) process.stdout.write(imp.stdout);
  if (imp.stderr) process.stderr.write(imp.stderr);

  if (imp.status !== 0) {
    console.error('\n❌ Import échoué.');
    process.exit(imp.status ?? 1);
  }

  const verify = spawnSync(
    'psql',
    [dbUrl, '-c', `SELECT COUNT(*) AS organizations FROM "Organization"; SELECT COUNT(*) AS users FROM "User";`],
    { encoding: 'utf8', env: { ...process.env, PGSSLMODE: process.env.PGSSLMODE ?? 'require' } },
  );

  console.log('\n✅ Import terminé.');
  if (verify.stdout) console.log(verify.stdout.trim());
}

main();
