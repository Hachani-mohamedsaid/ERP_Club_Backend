#!/usr/bin/env node
/**
 * Seed Manchester United via l'API production (Railway).
 * Usage: node scripts/seed-manchester-united-via-api.mjs [BASE_URL]
 */
const BASE = (process.argv[2] ?? 'https://erp-club-backend-production.up.railway.app').replace(/\/$/, '');
const PASSWORD = 'ManUtd2026!';

const SQUAD = [
  ['André Onana', 'GB', 29, 79, '18M €'],
  ['Altay Bayındır', 'GB', 27, 75, '8M €'],
  ['Matthijs de Ligt', 'DC', 26, 82, '42M €'],
  ['Lisandro Martínez', 'DC', 27, 83, '45M €'],
  ['Harry Maguire', 'DC', 32, 76, '15M €'],
  ['Leny Yoro', 'DC', 20, 76, '55M €'],
  ['Noussair Mazraoui', 'DD', 28, 80, '28M €'],
  ['Diogo Dalot', 'DD', 26, 78, '22M €'],
  ['Luke Shaw', 'DG', 30, 77, '18M €'],
  ['Patrick Dorgu', 'DG', 21, 76, '22M €'],
  ['Casemiro', 'MDC', 33, 78, '12M €'],
  ['Bruno Fernandes', 'MC', 31, 87, '70M €'],
  ['Kobbie Mainoo', 'MC', 20, 82, '55M €'],
  ['Manuel Ugarte', 'MDC', 24, 80, '38M €'],
  ['Mason Mount', 'MC', 26, 78, '25M €'],
  ['Alejandro Garnacho', 'AG', 21, 82, '45M €'],
  ['Marcus Rashford', 'AG', 28, 81, '40M €'],
  ['Rasmus Højlund', 'BU', 22, 79, '35M €'],
  ['Joshua Zirkzee', 'BU', 24, 78, '28M €'],
  ['Amad Diallo', 'AD', 23, 78, '22M €'],
];

const MEMBERS = [
  { email: 'responsable@manutd.demo', fullName: 'John Murtough', clubRole: 'Responsable' },
  { email: 'preparateur@manutd.demo', fullName: 'Richard Hartis', clubRole: 'Préparateur Physique' },
  { email: 'analyste@manutd.demo', fullName: 'Dominic Cork', clubRole: 'Analyste Performance' },
  { email: 'recruteur@manutd.demo', fullName: 'Sammy Lander', clubRole: 'Recruteur' },
  { email: 'coach@manutd.demo', fullName: 'René Hake', clubRole: 'Coach' },
  { email: 'medecin@manutd.demo', fullName: "Dr Gary O'Driscoll", clubRole: 'Médecin' },
  { email: 'scout@manutd.demo', fullName: 'James Weir', clubRole: 'Scout' },
  { email: 'finance@manutd.demo', fullName: 'Cliff Baty', clubRole: 'Finance' },
];

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data.message ?? data.error ?? text.slice(0, 200);
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(msg)}`);
  }
  return data;
}

async function registerIfNeeded() {
  const form = new FormData();
  form.set('fullName', 'Erik ten Hag');
  form.set('clubName', 'Manchester United');
  form.set('country', 'Angleterre');
  form.set('league', 'Premier League');
  form.set('email', 'admin@manutd.demo');
  form.set('phone', '+441612345678');
  form.set('password', PASSWORD);
  form.set('confirmPassword', PASSWORD);
  form.set('acceptTerms', 'true');
  form.set('acceptPrivacy', 'true');

  const res = await fetch(`${BASE}/auth/register`, { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log('✅ Organisation Manchester United créée');
    return;
  }
  if (res.status === 409 || String(data.message ?? '').includes('existe déjà')) {
    console.log('ℹ️  Organisation déjà existante — connexion admin');
    return;
  }
  throw new Error(`Register failed: ${res.status} ${JSON.stringify(data)}`);
}

async function login(email) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: { email, password: PASSWORD },
  });
  return data.accessToken;
}

async function main() {
  console.log(`API: ${BASE}\n`);
  await registerIfNeeded();
  const adminToken = await login('admin@manutd.demo');

  const existing = await api('/club/players', { token: adminToken });
  const playerMap = new Map((existing ?? []).map((p) => [p.fullName ?? p.name, p.id]));

  if (playerMap.size === 0) {
    for (const [fullName, position, age, ovr, marketValue] of SQUAD) {
      const p = await api('/club/players', {
        method: 'POST',
        token: adminToken,
        body: { fullName, position, age, ovr, marketValue, goals: Math.floor(ovr / 15), status: 'DISPONIBLE' },
      });
      playerMap.set(fullName, p.id);
      process.stdout.write('.');
    }
    console.log(`\n✅ ${SQUAD.length} joueurs ajoutés`);
  } else {
    console.log(`ℹ️  ${playerMap.size} joueurs déjà présents`);
  }

  const brunoId = playerMap.get('Bruno Fernandes');
  for (const m of MEMBERS) {
    try {
      await api('/club/members', {
        method: 'POST',
        token: adminToken,
        body: { ...m, password: PASSWORD, status: 'Actif' },
      });
      console.log(`✅ ${m.clubRole.padEnd(24)} ${m.email}`);
    } catch (err) {
      if (String(err.message).includes('409') || String(err.message).includes('existe')) {
        console.log(`ℹ️  ${m.clubRole.padEnd(24)} ${m.email} (existe)`);
      } else {
        throw err;
      }
    }
  }

  if (brunoId) {
    try {
      await api('/club/members', {
        method: 'POST',
        token: adminToken,
        body: {
          email: 'joueur@manutd.demo',
          fullName: 'Bruno Fernandes',
          clubRole: 'Joueur',
          password: PASSWORD,
          status: 'Actif',
          clubPlayerId: brunoId,
        },
      });
      console.log(`✅ ${'Joueur'.padEnd(24)} joueur@manutd.demo`);
    } catch (err) {
      if (String(err.message).includes('409') || String(err.message).includes('existe')) {
        console.log(`ℹ️  ${'Joueur'.padEnd(24)} joueur@manutd.demo (existe)`);
      } else {
        throw err;
      }
    }
  }

  const scoutToken = await login('scout@manutd.demo');
  await api('/scout/dashboard', { token: scoutToken });
  console.log('✅ Dataset scout Manchester United chargé');

  const analysteToken = await login('analyste@manutd.demo');
  await api('/analyste/dashboard', { token: analysteToken });
  console.log('✅ Modules analyste initialisés');

  console.log('\n── Comptes Manchester United ──');
  console.log(`Mot de passe (tous) : ${PASSWORD}\n`);
  console.log(`${'Rôle'.padEnd(24)} Email`);
  console.log(`${'Club Admin'.padEnd(24)} admin@manutd.demo`);
  for (const m of MEMBERS) console.log(`${m.clubRole.padEnd(24)} ${m.email}`);
  console.log(`${'Joueur'.padEnd(24)} joueur@manutd.demo (Bruno Fernandes)`);
}

main().catch((err) => {
  console.error('\n❌', err.message);
  process.exit(1);
});
