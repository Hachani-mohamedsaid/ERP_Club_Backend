-- Scout module tables (safe to re-run)
ALTER TABLE "RecruitmentProspect" ADD COLUMN IF NOT EXISTS "scoutExtra" JSONB;
ALTER TABLE "RecruitmentProspect" ADD COLUMN IF NOT EXISTS "scoutName" TEXT;

CREATE TABLE IF NOT EXISTS "ScoutWatchlist" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "prospectId" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'B',
  "notes" JSONB,
  "scoutName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoutWatchlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ScoutWatchlist_organizationId_prospectId_key"
  ON "ScoutWatchlist"("organizationId", "prospectId");
CREATE INDEX IF NOT EXISTS "ScoutWatchlist_organizationId_idx"
  ON "ScoutWatchlist"("organizationId");

CREATE TABLE IF NOT EXISTS "ScoutReport" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "prospectId" TEXT,
  "prospectName" TEXT NOT NULL,
  "scoutName" TEXT NOT NULL,
  "matchDate" TEXT,
  "matchObserved" TEXT,
  "opponent" TEXT,
  "technique" INTEGER NOT NULL DEFAULT 0,
  "physique" INTEGER NOT NULL DEFAULT 0,
  "mental" INTEGER NOT NULL DEFAULT 0,
  "tactique" INTEGER NOT NULL DEFAULT 0,
  "vitesse" INTEGER NOT NULL DEFAULT 0,
  "strengths" TEXT,
  "weaknesses" TEXT,
  "recommendation" TEXT,
  "decision" TEXT NOT NULL DEFAULT 'observe',
  "aiScore" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'submitted',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoutReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ScoutReport_organizationId_idx"
  ON "ScoutReport"("organizationId");
