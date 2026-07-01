import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.ensureScoutSchema();
  }

  private async ensureScoutSchema() {
    try {
      await this.$executeRawUnsafe(`
        ALTER TABLE "RecruitmentProspect" ADD COLUMN IF NOT EXISTS "scoutExtra" JSONB;
        ALTER TABLE "RecruitmentProspect" ADD COLUMN IF NOT EXISTS "scoutName" TEXT;
      `);
      await this.$executeRawUnsafe(`
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
      `);
      await this.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "ScoutWatchlist_organizationId_prospectId_key"
          ON "ScoutWatchlist"("organizationId", "prospectId");
      `);
      await this.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ScoutWatchlist_organizationId_idx"
          ON "ScoutWatchlist"("organizationId");
      `);
      await this.$executeRawUnsafe(`
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
      `);
      await this.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ScoutReport_organizationId_idx"
          ON "ScoutReport"("organizationId");
      `);
      this.logger.log('Schéma scout vérifié.');
    } catch (err) {
      this.logger.warn(`Bootstrap scout schema: ${err instanceof Error ? err.message : err}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}