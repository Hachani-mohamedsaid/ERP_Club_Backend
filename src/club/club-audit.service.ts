import { Injectable } from '@nestjs/common';
import { AuditActionType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClubAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    organizationId: string,
    data: {
      userName: string;
      userRole: string;
      action: string;
      entity: string;
      details: string;
      type: AuditActionType;
      ipAddress?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.clubAuditLog.create({
      data: { organizationId, ...data },
    });
  }
}
