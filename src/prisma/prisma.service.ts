import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { runDatabaseBootstrap } from './db-bootstrap';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('PostgreSQL connecté.');
  }

  /** Conservé pour retry scout côté service. */
  async ensureScoutSchema() {
    runDatabaseBootstrap();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
