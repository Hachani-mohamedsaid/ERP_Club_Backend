-- Adds the RecruteurAuditLog table + enums (additive only, no other table touched).

DO $$ BEGIN
  CREATE TYPE "RecruteurAuditAction" AS ENUM ('VALIDATION', 'OFFRE', 'CONTRAT', 'TRANSFERT', 'MODIFICATION', 'CREATION', 'SUPPRESSION', 'CONNEXION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RecruteurAuditSeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "RecruteurAuditLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "userRole" TEXT NOT NULL,
  "action" "RecruteurAuditAction" NOT NULL,
  "description" TEXT NOT NULL,
  "player" TEXT,
  "ipAddress" TEXT,
  "severity" "RecruteurAuditSeverity" NOT NULL DEFAULT 'INFO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RecruteurAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RecruteurAuditLog_organizationId_idx" ON "RecruteurAuditLog"("organizationId");

DO $$ BEGIN
  ALTER TABLE "RecruteurAuditLog"
    ADD CONSTRAINT "RecruteurAuditLog_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
