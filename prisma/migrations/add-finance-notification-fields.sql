-- Finance notification metadata on ClubNotification
ALTER TABLE "ClubNotification" ADD COLUMN IF NOT EXISTS "sourceKey" TEXT;
ALTER TABLE "ClubNotification" ADD COLUMN IF NOT EXISTS "path" TEXT;
ALTER TABLE "ClubNotification" ADD COLUMN IF NOT EXISTS "iconKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ClubNotification_organizationId_sourceKey_key"
  ON "ClubNotification"("organizationId", "sourceKey")
  WHERE "sourceKey" IS NOT NULL;
