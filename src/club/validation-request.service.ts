import { Injectable } from '@nestjs/common';
import {
  ValidationPriority,
  ValidationRequestStatus,
  ValidationRequestType,
} from '@prisma/client';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { clubRoleToLabel } from './permissions-seed';

export interface CreateValidationInput {
  type: ValidationRequestType;
  title: string;
  detail: string;
  amount?: string;
  priority?: ValidationPriority;
  sourceKind?: string;
  sourceId?: string;
}

@Injectable()
export class ValidationRequestService {
  constructor(private readonly prisma: PrismaService) {}

  requesterLabel(user: JwtPayload): string {
    const roleKey = user.clubMemberRole ?? 'CLUB_ADMIN';
    const roleLabel = clubRoleToLabel(roleKey as never) ?? roleKey;
    return `${user.fullName} (${roleLabel})`;
  }

  canSelfValidate(user: JwtPayload): boolean {
    const role = user.clubMemberRole ?? 'CLUB_ADMIN';
    return role === 'CLUB_ADMIN' || role === 'RESPONSABLE';
  }

  async create(user: JwtPayload, input: CreateValidationInput) {
    const organizationId = user.organizationId;
    if (!organizationId) return null;

    const existing = input.sourceKind && input.sourceId
      ? await this.prisma.validationRequest.findFirst({
          where: {
            organizationId,
            sourceKind: input.sourceKind,
            sourceId: input.sourceId,
            status: 'EN_ATTENTE',
          },
        })
      : null;
    if (existing) return existing;

    return this.prisma.validationRequest.create({
      data: {
        organizationId,
        type: input.type,
        title: input.title,
        detail: input.detail,
        amount: input.amount ?? null,
        priority: input.priority ?? 'NORMALE',
        status: 'EN_ATTENTE',
        requestedBy: this.requesterLabel(user),
        sourceKind: input.sourceKind ?? null,
        sourceId: input.sourceId ?? null,
      },
    });
  }

  async syncPendingSources(organizationId: string) {
    // Only sync finance expense requests. Recruitment validations are created
    // explicitly (scout committee submit / report recommend) — not for every prospect.
    const expenses = await this.prisma.expenseRequest.findMany({
      where: { organizationId, status: 'EN_ATTENTE' },
    });

    for (const expense of expenses) {
      const exists = await this.prisma.validationRequest.findFirst({
        where: {
          organizationId,
          sourceKind: 'expense',
          sourceId: expense.id,
        },
      });
      if (!exists) {
        await this.prisma.validationRequest.create({
          data: {
            organizationId,
            type: 'BUDGET',
            title: 'Demande budget',
            detail: expense.label,
            amount: `${expense.amount.toLocaleString('fr-FR')} DT`,
            priority: expense.amount >= 10_000 ? 'HAUTE' : 'NORMALE',
            status: 'EN_ATTENTE',
            requestedBy: expense.requestedBy,
            sourceKind: 'expense',
            sourceId: expense.id,
          },
        });
      }
    }
  }

  async applyDecision(
    organizationId: string,
    sourceKind: string | null | undefined,
    sourceId: string | null | undefined,
    status: ValidationRequestStatus,
  ) {
    if (!sourceKind || !sourceId) return;

    if (sourceKind === 'prospect' || sourceKind === 'committee') {
      if (status === 'VALIDE') {
        await this.prisma.recruitmentProspect.updateMany({
          where: { id: sourceId, organizationId },
          // Committee green-light → contact phase; plain prospect approve → shortlist
          data: { status: sourceKind === 'committee' ? 'CONTACTE' : 'SHORTLISTE' },
        });
      } else if (status === 'REFUSE') {
        await this.prisma.recruitmentProspect.updateMany({
          where: { id: sourceId, organizationId },
          data: { status: 'REFUSE' },
        });
      } else if (status === 'RETOUR') {
        await this.prisma.recruitmentProspect.updateMany({
          where: { id: sourceId, organizationId },
          data: { status: 'EN_OBSERVATION' },
        });
      }
    }

    if (sourceKind === 'expense') {
      const expenseStatus =
        status === 'VALIDE' ? 'APPROUVEE' : status === 'REFUSE' ? 'REFUSEE' : 'EN_ATTENTE';
      const expense = await this.prisma.expenseRequest.findFirst({
        where: { id: sourceId, organizationId },
        include: { category: true },
      });
      if (!expense) return;

      await this.prisma.expenseRequest.update({
        where: { id: sourceId },
        data: { status: expenseStatus },
      });

      if (status === 'VALIDE' && expense.categoryId) {
        await this.prisma.budgetCategory.update({
          where: { id: expense.categoryId },
          data: { spent: { increment: expense.amount } },
        });
      }
    }
  }
}
