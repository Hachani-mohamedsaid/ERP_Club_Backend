import { Injectable } from '@nestjs/common';
import { Prisma, RecruteurAuditAction, RecruteurAuditSeverity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecruteurAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    organizationId: string,
    data: {
      userName: string;
      userRole: string;
      action: RecruteurAuditAction;
      description: string;
      player?: string;
      ipAddress?: string;
      severity?: RecruteurAuditSeverity;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.recruteurAuditLog.create({
      data: { organizationId, ...data },
    });
  }
}
