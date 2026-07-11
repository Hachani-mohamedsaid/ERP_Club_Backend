-- Adds the RecruteurCalendarEvent table + enum (additive only, no other table touched).

DO $$ BEGIN
  CREATE TYPE "RecruteurCalendarEventType" AS ENUM ('MATCH', 'AGENT', 'VALIDATION', 'CONTRAT', 'DEPLACEMENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "RecruteurCalendarEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "eventDate" TIMESTAMP(3) NOT NULL,
  "eventTime" TEXT,
  "type" "RecruteurCalendarEventType" NOT NULL DEFAULT 'MATCH',
  "location" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RecruteurCalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RecruteurCalendarEvent_organizationId_idx" ON "RecruteurCalendarEvent"("organizationId");

DO $$ BEGIN
  ALTER TABLE "RecruteurCalendarEvent"
    ADD CONSTRAINT "RecruteurCalendarEvent_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
