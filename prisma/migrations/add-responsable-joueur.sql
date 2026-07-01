-- Migration additive: Responsable + Joueur modules
-- Safe to run on production — does NOT drop existing tables

-- Staff optional fields
ALTER TABLE "ClubStaff" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "ClubStaff" ADD COLUMN IF NOT EXISTS "department" TEXT;

-- Enums
DO $$ BEGIN
  CREATE TYPE "ValidationRequestType" AS ENUM ('RECRUTEMENT', 'CONTRAT', 'BUDGET', 'CONVOCATION', 'MEDICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ValidationRequestStatus" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REFUSE', 'RETOUR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ValidationPriority" AS ENUM ('CRITIQUE', 'HAUTE', 'NORMALE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentCategory" AS ENUM ('CONTRAT_PDF', 'RAPPORT_PDF', 'MEDICAL', 'LICENCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentStatus" AS ENUM ('VALIDE', 'EXPIRE', 'EN_REVISION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RecruitmentStatus" AS ENUM ('NON_TRAITE', 'EN_OBSERVATION', 'SHORTLISTE', 'CONTACTE', 'REFUSE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ExpenseRequestStatus" AS ENUM ('EN_ATTENTE', 'APPROUVEE', 'REFUSEE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ValidationRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "type" "ValidationRequestType" NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "amount" TEXT,
  "priority" "ValidationPriority" NOT NULL DEFAULT 'NORMALE',
  "status" "ValidationRequestStatus" NOT NULL DEFAULT 'EN_ATTENTE',
  "requestedBy" TEXT NOT NULL,
  "comment" TEXT,
  "sourceKind" TEXT,
  "sourceId" TEXT,
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ValidationRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ValidationRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "ClubDocument" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "DocumentCategory" NOT NULL,
  "playerName" TEXT,
  "fileUrl" TEXT,
  "sizeLabel" TEXT NOT NULL DEFAULT '—',
  "status" "DocumentStatus" NOT NULL DEFAULT 'VALIDE',
  "expiresAt" TIMESTAMP(3),
  "uploadedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClubDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClubDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "RecruitmentProspect" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "age" INTEGER NOT NULL DEFAULT 0,
  "position" TEXT NOT NULL,
  "externalClub" TEXT NOT NULL DEFAULT '—',
  "nationality" TEXT NOT NULL DEFAULT 'TN',
  "potential" INTEGER NOT NULL DEFAULT 0,
  "score" INTEGER NOT NULL DEFAULT 0,
  "status" "RecruitmentStatus" NOT NULL DEFAULT 'NON_TRAITE',
  "notes" TEXT,
  "scoutName" TEXT,
  "scoutExtra" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecruitmentProspect_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecruitmentProspect_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "BudgetCategory" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "allocated" INTEGER NOT NULL DEFAULT 0,
  "spent" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BudgetCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "BudgetCategory_organizationId_name_key" UNIQUE ("organizationId", "name")
);

CREATE TABLE IF NOT EXISTS "ExpenseRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "categoryId" TEXT,
  "label" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "requestedBy" TEXT NOT NULL,
  "status" "ExpenseRequestStatus" NOT NULL DEFAULT 'EN_ATTENTE',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExpenseRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExpenseRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "ExpenseRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BudgetCategory"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "club_player_profiles" (
  "id" TEXT NOT NULL,
  "clubPlayerId" TEXT NOT NULL,
  "career" JSONB,
  "evolution" JSONB,
  "heatmapZones" JSONB,
  "training" JSONB,
  "matchAnalysis" JSONB,
  "aiInsight" JSONB,
  "fifaAttributes" JSONB,
  "chemistry" JSONB,
  "messages" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "club_player_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "club_player_profiles_clubPlayerId_key" UNIQUE ("clubPlayerId"),
  CONSTRAINT "club_player_profiles_clubPlayerId_fkey" FOREIGN KEY ("clubPlayerId") REFERENCES "ClubPlayer"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "club_player_awards" (
  "id" TEXT NOT NULL,
  "clubPlayerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "season" TEXT,
  "awardType" TEXT NOT NULL DEFAULT 'TROPHY',
  "icon" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "club_player_awards_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "club_player_awards_clubPlayerId_fkey" FOREIGN KEY ("clubPlayerId") REFERENCES "ClubPlayer"("id") ON DELETE CASCADE
);
