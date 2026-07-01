-- Direct messaging tables (idempotent)
CREATE TABLE IF NOT EXISTS "ClubDirectConversation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "participantAId" TEXT NOT NULL,
  "participantBId" TEXT NOT NULL,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClubDirectConversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClubDirectConversation_organizationId_participantAId_participantBId_key"
  ON "ClubDirectConversation"("organizationId", "participantAId", "participantBId");
CREATE INDEX IF NOT EXISTS "ClubDirectConversation_organizationId_lastMessageAt_idx"
  ON "ClubDirectConversation"("organizationId", "lastMessageAt");

CREATE TABLE IF NOT EXISTS "ClubDirectMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderMemberId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClubDirectMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ClubDirectMessage_conversationId_createdAt_idx"
  ON "ClubDirectMessage"("conversationId", "createdAt");

CREATE TABLE IF NOT EXISTS "ClubDirectMessageRead" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClubDirectMessageRead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClubDirectMessageRead_messageId_memberId_key"
  ON "ClubDirectMessageRead"("messageId", "memberId");
CREATE INDEX IF NOT EXISTS "ClubDirectMessageRead_memberId_idx"
  ON "ClubDirectMessageRead"("memberId");

DO $$ BEGIN
  ALTER TABLE "ClubDirectConversation" ADD CONSTRAINT "ClubDirectConversation_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ClubDirectMessage" ADD CONSTRAINT "ClubDirectMessage_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "ClubDirectConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ClubDirectMessageRead" ADD CONSTRAINT "ClubDirectMessageRead_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "ClubDirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
