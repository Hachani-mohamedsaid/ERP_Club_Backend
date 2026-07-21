/**
 * Crée / remplace le club démo Manchester United avec effectif, dataset scout et comptes par rôle.
 *
 * Usage:
 *   npx ts-node scripts/seed-manchester-united-demo.ts
 *
 * Mot de passe commun : ManUtd2026!
 */
import * as bcrypt from 'bcrypt';
import {
  CalendarEventType,
  ClubMemberRole,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { buildAnalyisteSeeds, ANALYSTE_MODULE_KEYS } from '../src/analyste/analyste-seed';
import { seedClubOps } from '../src/club/ops-seed';
import { clubRoleToLabel } from '../src/club/permissions-seed';
import { buildDefaultDashboardSeed } from '../src/organizations/dashboard-seed';
import { createTrialSubscription } from '../src/platform/platform.seed';
import { seedResponsableDefaults } from '../src/responsable/responsable-seed';
import {
  isManchesterUnitedOrg,
  MANCHESTER_UNITED_2026_2027,
  MU_SEASON_TAG,
  type ScoutDatasetBundle,
} from '../src/scout/data/manchester-united-2026-2027.dataset';
import { resolveFlashscoreSquad } from '../src/scout/data/flashscore-squads';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'ManUtd2026!';
const CLUB_NAME = 'Manchester United';
const COUNTRY = 'Angleterre';
const LEAGUE = 'Premier League';

type DemoAccount = {
  email: string;
  fullName: string;
  clubRole: ClubMemberRole;
  phone?: string;
  playerName?: string;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@manutd.demo',
    fullName: 'Erik ten Hag',
    clubRole: 'CLUB_ADMIN',
    phone: '+441612345678',
  },
  { email: 'responsable@manutd.demo', fullName: 'John Murtough', clubRole: 'RESPONSABLE' },
  { email: 'preparateur@manutd.demo', fullName: 'Richard Hartis', clubRole: 'PREPARATEUR' },
  { email: 'analyste@manutd.demo', fullName: 'Dominic Cork', clubRole: 'ANALYSTE' },
  { email: 'recruteur@manutd.demo', fullName: 'Sammy Lander', clubRole: 'RECRUTEUR' },
  { email: 'coach@manutd.demo', fullName: 'René Hake', clubRole: 'COACH' },
  { email: 'medecin@manutd.demo', fullName: 'Dr Gary O\'Driscoll', clubRole: 'MEDECIN' },
  { email: 'scout@manutd.demo', fullName: 'James Weir', clubRole: 'SCOUT' },
  { email: 'finance@manutd.demo', fullName: 'Cliff Baty', clubRole: 'RESPONSABLE_FINANCIER' },
  {
    email: 'joueur@manutd.demo',
    fullName: 'Bruno Fernandes',
    clubRole: 'JOUEUR',
    playerName: 'Bruno Fernandes',
  },
];

async function deleteExistingMuOrgs() {
  const orgs = await prisma.organization.findMany({
    select: { id: true, clubName: true, ownerId: true },
  });
  const targets = orgs.filter((o) => isManchesterUnitedOrg(o.clubName));
  for (const org of targets) {
    await prisma.organization.delete({ where: { id: org.id } });
    console.log(`Supprimé: ${org.clubName} (${org.id})`);
  }
  return targets.length;
}

async function applyScoutDataset(
  organizationId: string,
  scoutName: string,
  dataset: ScoutDatasetBundle,
) {
  for (const seed of dataset.prospects) {
    await prisma.recruitmentProspect.create({
      data: {
        organizationId,
        fullName: seed.fullName,
        age: seed.age,
        position: seed.position,
        externalClub: seed.externalClub,
        nationality: seed.nationality,
        potential: seed.potential,
        score: seed.score,
        status: seed.status,
        scoutName,
        scoutExtra: seed.scoutExtra as Prisma.InputJsonValue,
        createdAt: new Date(seed.createdAt),
      },
    });
  }

  const prospects = await prisma.recruitmentProspect.findMany({ where: { organizationId } });
  const byName = new Map(prospects.map((p) => [p.fullName, p]));

  for (const w of dataset.watchlist) {
    const p = byName.get(w.prospectName);
    if (!p) continue;
    await prisma.scoutWatchlist.create({
      data: {
        organizationId,
        prospectId: p.id,
        priority: w.priority,
        scoutName,
        notes: w.notes as Prisma.InputJsonValue,
      },
    });
  }

  for (const r of dataset.reports) {
    const p = byName.get(r.prospectName);
    await prisma.scoutReport.create({
      data: {
        organizationId,
        prospectId: p?.id,
        prospectName: r.prospectName,
        scoutName,
        matchObserved: r.matchObserved,
        opponent: r.opponent,
        decision: r.decision,
        aiScore: r.aiScore,
        recommendation: r.recommendation,
        technique: r.aiScore,
        physique: r.aiScore - 2,
        mental: r.aiScore - 1,
        tactique: r.aiScore,
        vitesse: r.aiScore,
        createdAt: new Date(r.createdAt),
      },
    });
  }

  for (const m of dataset.missions) {
    await prisma.clubCalendarEvent.create({
      data: {
        organizationId,
        title: m.title,
        eventDate: new Date(m.eventDate),
        eventTime: m.eventTime,
        eventType: CalendarEventType.SCOUT,
        location: m.location,
        notes: m.notes,
        extraData: { seasonTag: MU_SEASON_TAG } as Prisma.InputJsonValue,
      },
    });
  }
}

async function seedAnalysteModules(organizationId: string, clubName: string, analystName: string) {
  const seeds = buildAnalyisteSeeds(clubName, analystName);
  for (const moduleKey of ANALYSTE_MODULE_KEYS) {
    await prisma.analysteModuleData.upsert({
      where: { organizationId_moduleKey: { organizationId, moduleKey } },
      create: {
        organizationId,
        moduleKey,
        payload: seeds[moduleKey] as object,
      },
      update: { payload: seeds[moduleKey] as object },
    });
  }
}

async function createMemberUser(
  tx: Prisma.TransactionClient,
  organizationId: string,
  account: DemoAccount,
  passwordHash: string,
  clubPlayerId?: string,
) {
  if (account.clubRole === 'CLUB_ADMIN') return;

  await tx.user.create({
    data: {
      email: account.email,
      passwordHash,
      fullName: account.fullName,
      phone: account.phone ?? '',
      role: 'ADMIN_CLUB',
      organizationId,
      clubMemberRole: account.clubRole,
      isActive: true,
      acceptTerms: true,
      acceptPrivacy: true,
    },
  });

  await tx.clubMember.create({
    data: {
      organizationId,
      fullName: account.fullName,
      email: account.email,
      clubRole: account.clubRole,
      status: 'ACTIF',
      lastLoginAt: new Date(),
      ...(clubPlayerId ? { clubPlayerId } : {}),
    },
  });
}

async function main() {
  const removed = await deleteExistingMuOrgs();
  if (removed > 0) {
    console.log(`${removed} ancien(s) club(s) Manchester United supprimé(s).\n`);
  }

  const owner = DEMO_ACCOUNTS[0];
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const squad = resolveFlashscoreSquad('manu', CLUB_NAME, 'gb', COUNTRY, 85);

  const { organizationId } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: owner.email,
        passwordHash,
        fullName: owner.fullName,
        phone: owner.phone ?? '',
        role: 'ADMIN_CLUB',
        acceptTerms: true,
        acceptPrivacy: true,
        isActive: true,
      },
    });

    const organization = await tx.organization.create({
      data: {
        clubName: CLUB_NAME,
        country: COUNTRY,
        league: LEAGUE,
        ownerId: user.id,
      },
    });

    const seed = buildDefaultDashboardSeed(CLUB_NAME);
    await tx.clubDashboardStats.create({
      data: {
        organizationId: organization.id,
        playersCount: squad.length,
        staffCount: DEMO_ACCOUNTS.length - 1,
        budgetRemaining: 45_000_000,
        payrollTotal: 12_500_000,
        injuredCount: 1,
        contractsToRenew: 3,
        budgetUsedPct: 28,
        budgetChart: seed.budgetChart as unknown as Prisma.InputJsonValue,
        alerts: [
          { type: 'warning', text: 'Saison 2026-2027 — dataset Manchester United chargé.' },
          { type: 'danger', text: '1 joueur indisponible — centre médical à consulter.' },
        ] as Prisma.InputJsonValue,
        aiSummary: [
          'Effectif Premier League 2026-2027 synchronisé.',
          'Pipeline scout actif — 8 cibles prioritaires.',
          'Budget transferts Q3 : 45M € disponibles.',
        ] as Prisma.InputJsonValue,
      },
    });

    await seedClubOps(tx, {
      organizationId: organization.id,
      clubName: CLUB_NAME,
      country: COUNTRY,
      ownerFullName: owner.fullName,
      ownerEmail: owner.email,
      ownerPhone: owner.phone ?? '',
      officialEmail: owner.email,
    });

    await createTrialSubscription(tx, organization.id);

    await tx.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    });

    const playerIds = new Map<string, string>();
    for (const p of squad) {
      const player = await tx.clubPlayer.create({
        data: {
          organizationId: organization.id,
          fullName: p.name,
          position: p.position,
          age: p.age,
          ovr: p.currentRating,
          goals: Math.floor(p.currentRating / 15),
          marketValue: p.marketValue,
          salaryMonthly: Math.round(p.currentRating * 8_500),
          status: 'DISPONIBLE',
        },
      });
      playerIds.set(p.name, player.id);
    }

    for (const account of DEMO_ACCOUNTS.slice(1)) {
      const clubPlayerId =
        account.playerName != null ? playerIds.get(account.playerName) : undefined;
      if (account.clubRole === 'JOUEUR' && !clubPlayerId) {
        throw new Error(`Joueur introuvable pour le compte ${account.email}`);
      }
      await createMemberUser(tx, organization.id, account, passwordHash, clubPlayerId);
    }

    await seedResponsableDefaults(tx, organization.id, owner.fullName);

    return { organizationId: organization.id };
  });

  await applyScoutDataset(organizationId, 'James Weir', MANCHESTER_UNITED_2026_2027);
  await seedAnalysteModules(organizationId, CLUB_NAME, 'Dominic Cork');

  console.log('✅ Manchester United — démo prête\n');
  console.log(`Club      : ${CLUB_NAME}`);
  console.log(`Saison    : ${MANCHESTER_UNITED_2026_2027.season}`);
  console.log(`Joueurs   : ${squad.length}`);
  console.log(`Prospects : ${MANCHESTER_UNITED_2026_2027.prospects.length}`);
  console.log(`Mot de passe (tous) : ${DEMO_PASSWORD}\n`);
  console.log('Comptes :');
  console.log('─'.repeat(72));
  for (const account of DEMO_ACCOUNTS) {
    const role = clubRoleToLabel(account.clubRole);
    console.log(`${role.padEnd(24)} ${account.email.padEnd(28)} ${account.fullName}`);
  }
  console.log('─'.repeat(72));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
