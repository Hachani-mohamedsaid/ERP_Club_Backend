import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SQL_MIGRATIONS = ['add-responsable-joueur.sql', 'add-scout-tables.sql'];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.runSqlMigrations();
  }

  /** Applique les migrations SQL additives (tables Responsable, Scout, etc.). */
  async runSqlMigrations() {
    const dir = join(process.cwd(), 'prisma', 'migrations');
    for (const file of SQL_MIGRATIONS) {
      const path = join(dir, file);
      if (!existsSync(path)) {
        this.logger.warn(`Fichier migration introuvable: ${path}`);
        continue;
      }
      try {
        const sql = readFileSync(path, 'utf8');
        await this.$executeRawUnsafe(sql);
        this.logger.log(`Migration SQL OK: ${file}`);
      } catch (err) {
        this.logger.error(
          `Migration SQL échouée (${file}): ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  /** @deprecated Utiliser runSqlMigrations — conservé pour retry scout. */
  async ensureScoutSchema() {
    await this.runSqlMigrations();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
