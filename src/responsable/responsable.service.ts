import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditActionType,
  DocumentCategory,
  DocumentStatus,
  ExpenseRequestStatus,
  RecruitmentStatus,
  ValidationPriority,
  ValidationRequestStatus,
  ValidationRequestType,
} from '@prisma/client';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ClubAccessService } from '../club/club-access.service';
import { ClubAuditService } from '../club/club-audit.service';
import { ValidationRequestService } from '../club/validation-request.service';
import { ClubService } from '../club/club.service';

const TYPE_LABEL: Record<ValidationRequestType, string> = {
  RECRUTEMENT: 'Recrutement',
  CONTRAT: 'Contrat',
  BUDGET: 'Budget',
  CONVOCATION: 'Convocation',
  MEDICAL: 'Médical',
};

const STATUS_LABEL: Record<ValidationRequestStatus, string> = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validé',
  REFUSE: 'Refusé',
  RETOUR: 'Retour',
};

const PRIORITY_LABEL: Record<ValidationPriority, string> = {
  CRITIQUE: 'Critique',
  HAUTE: 'Haute',
  NORMALE: 'Normale',
};

const DOC_CAT_LABEL: Record<DocumentCategory, string> = {
  CONTRAT_PDF: 'Contrats PDF',
  RAPPORT_PDF: 'Rapports PDF',
  MEDICAL: 'Documents médicaux',
  LICENCE: 'Licences joueurs',
};

const RECRUIT_LABEL: Record<RecruitmentStatus, string> = {
  NON_TRAITE: 'Non traité',
  EN_OBSERVATION: 'En observation',
  SHORTLISTE: 'Shortlisté',
  CONTACTE: 'Contacté',
  REFUSE: 'Refusé',
};

@Injectable()
export class ResponsableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
    private readonly audit: ClubAuditService,
    private readonly validationRequests: ValidationRequestService,
    private readonly club: ClubService,
  ) {}

  private orgId(user: JwtPayload) {
    return this.access.requireOrganization(user);
  }

  // ─── Validation ────────────────────────────────────────────────
  async listValidation(user: JwtPayload) {
    const organizationId = this.orgId(user);
    await this.validationRequests.syncPendingSources(organizationId);

    const items = await this.prisma.validationRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    const requests = items.map((r) => this.formatValidation(r));
    const stats = {
      pending: items.filter((r) => r.status === 'EN_ATTENTE').length,
      approved: items.filter((r) => r.status === 'VALIDE').length,
      rejected: items.filter((r) => r.status === 'REFUSE').length,
      returned: items.filter((r) => r.status === 'RETOUR').length,
    };
    const byType = Object.keys(TYPE_LABEL).map((key) => ({
      type: TYPE_LABEL[key as ValidationRequestType],
      count: items.filter((r) => r.type === key).length,
    }));
    return { requests, stats, byType };
  }

  async decideValidation(
    user: JwtPayload,
    id: string,
    action: 'approve' | 'reject' | 'return',
    comment?: string,
    ip?: string,
  ) {
    const organizationId = this.orgId(user);
    const row = await this.prisma.validationRequest.findFirst({
      where: { id, organizationId },
    });
    if (!row) throw new NotFoundException('Demande introuvable.');

    const statusMap: Record<string, ValidationRequestStatus> = {
      approve: 'VALIDE',
      reject: 'REFUSE',
      return: 'RETOUR',
    };
    const status = statusMap[action];
    if (!status) throw new BadRequestException('Action invalide.');

    const updated = await this.prisma.validationRequest.update({
      where: { id },
      data: { status, comment: comment ?? row.comment, decidedAt: new Date() },
    });

    await this.validationRequests.applyDecision(
      organizationId,
      row.sourceKind,
      row.sourceId,
      status,
    );

    // Feedback notif for club (scout/recruteur see via shared club feed when relevant)
    if (row.sourceKind === 'committee' || row.type === 'RECRUTEMENT') {
      const sourceKey = `validation-decision:${row.id}`;
      await this.prisma.clubNotification.upsert({
        where: { organizationId_sourceKey: { organizationId, sourceKey } },
        create: {
          organizationId,
          title: `Décision comité — ${STATUS_LABEL[status]}`,
          body: `${row.detail} · par ${user.fullName}`,
          type: 'INFO',
          level: status === 'VALIDE' ? 'SUCCESS' : status === 'REFUSE' ? 'WARNING' : 'INFO',
          isRead: false,
          sourceKey,
          path: '/responsable/recrutement',
          iconKey: 'validation',
        },
        update: {
          title: `Décision comité — ${STATUS_LABEL[status]}`,
          body: `${row.detail} · par ${user.fullName}`,
          isRead: false,
          level: status === 'VALIDE' ? 'SUCCESS' : status === 'REFUSE' ? 'WARNING' : 'INFO',
        },
      });

      await this.prisma.recruteurNotification.create({
        data: {
          organizationId,
          type: 'validation',
          title: `Décision comité — ${STATUS_LABEL[status]}`,
          body: `${row.detail} · par ${user.fullName}`,
          priority: status === 'REFUSE' ? 'high' : 'medium',
          isRead: false,
          player: row.detail.split('—')[0]?.trim() || null,
        },
      });
    }

    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Responsable',
      action: `Validation ${STATUS_LABEL[status]}`,
      entity: row.title,
      details: row.detail,
      type: AuditActionType.MODIFICATION,
      ipAddress: ip,
    });

    return this.formatValidation(updated);
  }

  private formatValidation(r: {
    id: string;
    type: ValidationRequestType;
    title: string;
    detail: string;
    amount: string | null;
    priority: ValidationPriority;
    status: ValidationRequestStatus;
    requestedBy: string;
    comment: string | null;
    createdAt: Date;
  }) {
    return {
      id: r.id,
      type: TYPE_LABEL[r.type],
      title: r.title,
      from: r.requestedBy,
      detail: r.detail,
      amount: r.amount ?? undefined,
      priority: PRIORITY_LABEL[r.priority],
      status: STATUS_LABEL[r.status],
      date: r.createdAt.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      comment: r.comment,
    };
  }

  // ─── Documents ─────────────────────────────────────────────────
  async listDocuments(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const docs = await this.prisma.clubDocument.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => this.formatDocument(d));
  }

  async createDocument(user: JwtPayload, data: Record<string, unknown>, ip?: string) {
    const organizationId = this.orgId(user);
    const name = String(data.name ?? '').trim();
    if (!name) throw new BadRequestException('Nom du document requis.');

    const category = this.parseDocCategory(String(data.category ?? 'RAPPORT_PDF'));
    const doc = await this.prisma.clubDocument.create({
      data: {
        organizationId,
        name,
        category,
        playerName: data.playerName ? String(data.playerName) : null,
        fileUrl: data.fileUrl ? String(data.fileUrl) : null,
        sizeLabel: data.sizeLabel ? String(data.sizeLabel) : '—',
        status: this.parseDocStatus(String(data.status ?? 'VALIDE')),
        expiresAt: data.expiresAt ? new Date(String(data.expiresAt)) : null,
        uploadedBy: user.fullName,
      },
    });

    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Responsable',
      action: 'Import document',
      entity: name,
      details: DOC_CAT_LABEL[category],
      type: AuditActionType.CREATION,
      ipAddress: ip,
    });

    return this.formatDocument(doc);
  }

  async deleteDocument(user: JwtPayload, id: string, ip?: string) {
    const organizationId = this.orgId(user);
    const doc = await this.prisma.clubDocument.findFirst({ where: { id, organizationId } });
    if (!doc) throw new NotFoundException('Document introuvable.');
    await this.prisma.clubDocument.delete({ where: { id } });
    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Responsable',
      action: 'Suppression document',
      entity: doc.name,
      details: '—',
      type: AuditActionType.SUPPRESSION,
      ipAddress: ip,
    });
    return { message: 'Document supprimé' };
  }

  private formatDocument(d: {
    id: string;
    name: string;
    category: DocumentCategory;
    playerName: string | null;
    sizeLabel: string;
    status: DocumentStatus;
    fileUrl: string | null;
    createdAt: Date;
  }) {
    const statusLabel: Record<DocumentStatus, string> = {
      VALIDE: 'Valide',
      EXPIRE: 'Expiré',
      EN_REVISION: 'En révision',
    };
    return {
      id: d.id,
      name: d.name,
      category: DOC_CAT_LABEL[d.category],
      player: d.playerName ?? undefined,
      size: d.sizeLabel,
      date: d.createdAt.toLocaleDateString('fr-FR'),
      status: statusLabel[d.status],
      fileUrl: d.fileUrl,
    };
  }

  private parseDocCategory(raw: string): DocumentCategory {
    const map: Record<string, DocumentCategory> = {
      'Contrats PDF': 'CONTRAT_PDF',
      CONTRAT_PDF: 'CONTRAT_PDF',
      'Rapports PDF': 'RAPPORT_PDF',
      RAPPORT_PDF: 'RAPPORT_PDF',
      'Documents médicaux': 'MEDICAL',
      MEDICAL: 'MEDICAL',
      'Licences joueurs': 'LICENCE',
      LICENCE: 'LICENCE',
    };
    return map[raw] ?? 'RAPPORT_PDF';
  }

  private parseDocStatus(raw: string): DocumentStatus {
    const map: Record<string, DocumentStatus> = {
      Valide: 'VALIDE',
      VALIDE: 'VALIDE',
      Expiré: 'EXPIRE',
      EXPIRE: 'EXPIRE',
      'En révision': 'EN_REVISION',
      EN_REVISION: 'EN_REVISION',
    };
    return map[raw] ?? 'VALIDE';
  }

  // ─── Recruitment ───────────────────────────────────────────────
  async listProspects(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const prospects = await this.prisma.recruitmentProspect.findMany({
      where: { organizationId },
      orderBy: { potential: 'desc' },
    });
    return prospects.map((p) => this.formatProspect(p));
  }

  /** Org-shared scout reports (jointure scout → responsable). */
  async listRecruitmentReports(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const reports = await this.prisma.scoutReport.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return reports.map((r) => ({
      id: r.id,
      prospectId: r.prospectId,
      prospect: r.prospectName,
      scout: r.scoutName,
      date: r.createdAt.toLocaleDateString('fr-FR'),
      decision: r.decision,
      recommendation: r.recommendation,
      rating: r.aiScore != null
        ? Math.round(r.aiScore / 10)
        : Math.round(
            (r.technique + r.physique + r.mental + r.tactique + r.vitesse) / 50,
          ),
      aiScore: r.aiScore,
      status: r.status,
      strengths: r.strengths,
      weaknesses: r.weaknesses,
    }));
  }

  /** Shortlist / comité (prospects SHORTLISTE + pending committee validations). */
  async listRecruitmentShortlist(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [prospects, pending] = await Promise.all([
      this.prisma.recruitmentProspect.findMany({
        where: {
          organizationId,
          status: { in: ['SHORTLISTE', 'CONTACTE'] },
        },
        orderBy: { potential: 'desc' },
      }),
      this.prisma.validationRequest.findMany({
        where: {
          organizationId,
          type: 'RECRUTEMENT',
          status: 'EN_ATTENTE',
          sourceKind: { in: ['committee', 'prospect'] },
        },
      }),
    ]);
    const pendingBySource = new Set(
      pending.map((v) => v.sourceId).filter(Boolean) as string[],
    );
    return prospects.map((p) => ({
      ...this.formatProspect(p),
      pendingValidation: pendingBySource.has(p.id),
      validationId: pending.find((v) => v.sourceId === p.id)?.id ?? null,
      scoutName: p.scoutName,
    }));
  }

  async createProspect(user: JwtPayload, data: Record<string, unknown>, ip?: string) {
    const organizationId = this.orgId(user);
    const fullName = String(data.fullName ?? data.name ?? '').trim();
    if (!fullName) throw new BadRequestException('Nom requis.');

    const p = await this.prisma.recruitmentProspect.create({
      data: {
        organizationId,
        fullName,
        age: Number(data.age ?? 0),
        position: String(data.position ?? 'MC'),
        externalClub: String(data.externalClub ?? data.club ?? '—'),
        nationality: String(data.nationality ?? data.nat ?? 'TN'),
        potential: Number(data.potential ?? 0),
        score: Number(data.score ?? 0),
        status: this.parseRecruitStatus(String(data.status ?? 'NON_TRAITE')),
        notes: data.notes ? String(data.notes) : null,
        scoutName: data.scoutName ? String(data.scoutName) : user.fullName,
      },
    });

    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Responsable',
      action: 'Ajout prospect',
      entity: fullName,
      details: p.position,
      type: AuditActionType.CREATION,
      ipAddress: ip,
    });

    if (!this.validationRequests.canSelfValidate(user)) {
      await this.validationRequests.create(user, {
        type: 'RECRUTEMENT',
        title: 'Recrutement joueur',
        detail: `${fullName} — ${p.position} · ${p.externalClub}`,
        priority: p.potential >= 85 ? 'HAUTE' : 'NORMALE',
        sourceKind: 'prospect',
        sourceId: p.id,
      });
    }

    return this.formatProspect(p);
  }

  async updateProspect(user: JwtPayload, id: string, data: Record<string, unknown>) {
    const organizationId = this.orgId(user);
    const existing = await this.prisma.recruitmentProspect.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException('Prospect introuvable.');

    const updated = await this.prisma.recruitmentProspect.update({
      where: { id },
      data: {
        ...(data.status != null
          ? { status: this.parseRecruitStatus(String(data.status)) }
          : {}),
        ...(data.notes != null ? { notes: String(data.notes) } : {}),
        ...(data.potential != null ? { potential: Number(data.potential) } : {}),
        ...(data.score != null ? { score: Number(data.score) } : {}),
      },
    });
    return this.formatProspect(updated);
  }

  private formatProspect(p: {
    id: string;
    fullName: string;
    age: number;
    position: string;
    externalClub: string;
    nationality: string;
    potential: number;
    score: number;
    status: RecruitmentStatus;
    notes: string | null;
  }) {
    return {
      id: p.id,
      name: p.fullName,
      age: p.age,
      pos: p.position,
      club: p.externalClub,
      nat: p.nationality,
      potential: p.potential,
      score: p.score,
      status: RECRUIT_LABEL[p.status],
      note: p.notes ?? '',
    };
  }

  private parseRecruitStatus(raw: string): RecruitmentStatus {
    const map: Record<string, RecruitmentStatus> = {
      'Non traité': 'NON_TRAITE',
      NON_TRAITE: 'NON_TRAITE',
      'En observation': 'EN_OBSERVATION',
      EN_OBSERVATION: 'EN_OBSERVATION',
      Shortlisté: 'SHORTLISTE',
      SHORTLISTE: 'SHORTLISTE',
      Contacté: 'CONTACTE',
      CONTACTE: 'CONTACTE',
      Refusé: 'REFUSE',
      REFUSE: 'REFUSE',
    };
    return map[raw] ?? 'NON_TRAITE';
  }

  // ─── Budget ────────────────────────────────────────────────────
  async getBudget(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [categories, expenses] = await Promise.all([
      this.prisma.budgetCategory.findMany({ where: { organizationId }, orderBy: { name: 'asc' } }),
      this.prisma.expenseRequest.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
    ]);

    const totalAllocated = categories.reduce((s, c) => s + c.allocated, 0);
    const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
    const pending = expenses.filter((e) => e.status === 'EN_ATTENTE').length;

    return {
      summary: {
        totalAllocated,
        totalSpent,
        remaining: totalAllocated - totalSpent,
        pending,
      },
      categories: categories.map((c) => ({
        id: c.id,
        category: c.name,
        allocated: c.allocated,
        spent: c.spent,
        remaining: c.allocated - c.spent,
      })),
      expenses: expenses.map((e) => this.formatExpense(e)),
    };
  }

  async createExpense(user: JwtPayload, data: Record<string, unknown>, ip?: string) {
    const organizationId = this.orgId(user);
    const label = String(data.label ?? '').trim();
    const amount = Number(data.amount ?? 0);
    if (!label || amount <= 0) throw new BadRequestException('Libellé et montant requis.');

    const expense = await this.prisma.expenseRequest.create({
      data: {
        organizationId,
        label,
        amount,
        categoryId: data.categoryId ? String(data.categoryId) : null,
        requestedBy: user.fullName,
      },
      include: { category: true },
    });

    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Responsable',
      action: 'Demande dépense',
      entity: label,
      details: `${amount} DT`,
      type: AuditActionType.CREATION,
      ipAddress: ip,
    });

    if (!this.validationRequests.canSelfValidate(user)) {
      await this.validationRequests.create(user, {
        type: 'BUDGET',
        title: 'Demande budget',
        detail: label,
        amount: `${amount.toLocaleString('fr-FR')} DT`,
        priority: amount >= 10_000 ? 'HAUTE' : 'NORMALE',
        sourceKind: 'expense',
        sourceId: expense.id,
      });
    }

    return this.formatExpense(expense);
  }

  async decideExpense(
    user: JwtPayload,
    id: string,
    action: 'approve' | 'reject',
    ip?: string,
  ) {
    const organizationId = this.orgId(user);
    const expense = await this.prisma.expenseRequest.findFirst({
      where: { id, organizationId },
      include: { category: true },
    });
    if (!expense) throw new NotFoundException('Dépense introuvable.');

    const status: ExpenseRequestStatus = action === 'approve' ? 'APPROUVEE' : 'REFUSEE';
    const updated = await this.prisma.expenseRequest.update({
      where: { id },
      data: { status },
      include: { category: true },
    });

    if (action === 'approve' && expense.categoryId) {
      await this.prisma.budgetCategory.update({
        where: { id: expense.categoryId },
        data: { spent: { increment: expense.amount } },
      });
    }

    if (action === 'approve') {
      const financeLabel = `Dépense approuvée — ${expense.label}`;
      const existing = await this.prisma.clubFinanceEntry.findFirst({
        where: { organizationId, label: financeLabel },
      });
      if (!existing) {
        await this.prisma.clubFinanceEntry.create({
          data: {
            organizationId,
            label: financeLabel,
            amount: expense.amount,
            type: 'EXPENSE',
            category: expense.category?.name ?? 'Général',
            entryDate: new Date(),
          },
        });
        await this.club.syncDashboardStats(organizationId);
      }
    }

    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: 'Responsable',
      action: action === 'approve' ? 'Approbation dépense' : 'Refus dépense',
      entity: expense.label,
      details: `${expense.amount} DT`,
      type: AuditActionType.MODIFICATION,
      ipAddress: ip,
    });

    return this.formatExpense(updated);
  }

  private formatExpense(e: {
    id: string;
    label: string;
    amount: number;
    requestedBy: string;
    status: ExpenseRequestStatus;
    note: string | null;
    createdAt: Date;
    category: { name: string } | null;
  }) {
    const statusLabel: Record<ExpenseRequestStatus, string> = {
      EN_ATTENTE: 'En attente',
      APPROUVEE: 'Approuvée',
      REFUSEE: 'Refusée',
    };
    return {
      id: e.id,
      label: e.label,
      category: e.category?.name ?? 'Général',
      amount: e.amount,
      requestedBy: e.requestedBy,
      date: e.createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      status: statusLabel[e.status],
      note: e.note,
    };
  }
}
