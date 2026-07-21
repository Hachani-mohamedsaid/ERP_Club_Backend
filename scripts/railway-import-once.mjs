#!/usr/bin/env node
/**
 * Importe le dump SQL une seule fois au démarrage (réseau Railway → postgres.railway.internal).
 */
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const MARKER = 'erp_club_2026-07-17';
const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? '';
  if (!dbUrl.includes('railway')) {
    console.log('[import] Pas sur Railway — skip.');
    return;
  }

  const check = spawnSync(
    'psql',
    [dbUrl, '-tAc', `SELECT 1 FROM "_erp_import_marker" WHERE id = '${MARKER}' LIMIT 1;`],
    { encoding: 'utf8', env: process.env },
  );

  if (check.stdout?.trim() === '1') {
    console.log('[import] Dump déjà importé — skip.');
    return;
  }

  console.log('[import] Première exécution — import du dump erp_club...');
  const imp = spawnSync('node', [join(__dirname, 'import-erp-club-sql.mjs')], {
    stdio: 'inherit',
    env: process.env,
  });

  if (imp.status !== 0) {
    console.error('[import] Échec — le serveur démarre quand même.');
    return;
  }

  spawnSync(
    'psql',
    [
      dbUrl,
      '-c',
      `CREATE TABLE IF NOT EXISTS "_erp_import_marker" (id text PRIMARY KEY, imported_at timestamptz DEFAULT now());
       INSERT INTO "_erp_import_marker" (id) VALUES ('${MARKER}') ON CONFLICT DO NOTHING;`,
    ],
    { encoding: 'utf8', env: process.env },
  );

  console.log('[import] Terminé.');
}

main().catch((err) => {
  console.error('[import]', err.message);
});
