import { Injectable, NotFoundException } from '@nestjs/common';
import { NotifLevel, NotifType, Prisma } from '@prisma/client';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';

type FinanceSev = 'error' | 'warning' | 'info';
type FinanceIcon = 'contract' | 'sponsor' | 'invoice' | 'salary' | 'budget';

interface BuiltFinanceNotif {
  sourceKey: string;
  iconKey: FinanceIcon;
  sev: FinanceSev;
  title: string;
  body: string;
  path: string;
  level: NotifLevel;
  sortPriority: number;
  eventAt: Date;
}

@Injectable()
export class FinanceNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private orgId(user: JwtPayload) {
    return user.organizationId!;
  }

  private daysBetween(a: Date, b: Date) {
    return Math.ceil((a.getTime() - b.getTime()) / 86400000);
  }

  private formatRelativeTime(date: Date): string {
    const ms = Date.now() - date.getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) {
      return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  private sevToLevel(sev: FinanceSev): NotifLevel {
    if (sev === 'error') return 'CRITICAL';
    if (sev === 'warning') return 'WARNING';
    return 'INFO';
  }

  private resolvePlayerMeta(holderName: string, players: { fullName: string; position: string }[]) {
    const key = holderName.trim().toLowerCase();
    const exact = players.find((p) => p.fullName.toLowerCase() === key);
    if (exact) return exact.position;
    const partial = players.find(
      (p) => key.includes(p.fullName.toLowerCase()) || p.fullName.toLowerCase().includes(key),
    );
    return partial?.position ?? null;
  }

  private async buildNotifications(
    organizationId: string,
    clubName: string,
    seasonLabel: string,
  ): Promise<BuiltFinanceNotif[]> {
    const [contracts, sponsors, invoices, entries, players, stats] = await Promise.all([
      this.prisma.clubContract.findMany({ where: { organizationId }, orderBy: { endDate: 'asc' } }),
      this.prisma.clubSponsor.findMany({ where: { organizationId }, orderBy: { endDate: 'asc' } }),
      this.prisma.clubInvoice.findMany({ where: { organizationId }, orderBy: { updatedAt: 'desc' } }),
      this.prisma.clubFinanceEntry.findMany({ where: { organizationId }, orderBy: { entryDate: 'desc' } }),
      this.prisma.clubPlayer.findMany({ where: { organizationId }, select: { fullName: true, position: true } }),
      this.prisma.clubDashboardStats.findUnique({ where: { organizationId } }),
    ]);

    const now = new Date();
    const built: BuiltFinanceNotif[] = [];

    for (const c of contracts) {
      const daysLeft = this.daysBetween(c.endDate, now);
      if (daysLeft <= 0 || daysLeft > 120) continue;

      const position = this.resolvePlayerMeta(c.holderName, players);
      const subtitle = position
        ? `${c.holderName} — ${position} · ${clubName}`
        : `${c.holderName} · ${clubName}`;

      const urgent = daysLeft <= 14;
      const sev: FinanceSev = urgent ? 'error' : daysLeft <= 45 ? 'warning' : 'info';
      const title =
        daysLeft <= 30
          ? `Contrat expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`
          : `Contrat ${c.holderName} — ${daysLeft}j`;

      built.push({
        sourceKey: `contract:${c.id}`,
        iconKey: 'contract',
        sev,
        title,
        body:
          daysLeft > 30
            ? `Renouvellement recommandé avant le ${c.endDate.toLocaleDateString('fr-FR')}`
            : subtitle,
        path: '/finance/contrats',
        level: this.sevToLevel(sev),
        sortPriority: daysLeft,
        eventAt: c.updatedAt,
      });
    }

    for (const s of sponsors) {
      const daysLeft = this.daysBetween(s.endDate, now);
      const expiring =
        s.status === 'Expire bientot' || (daysLeft > 0 && daysLeft <= 90);
      if (!expiring) continue;

      const prob = s.renewalProbability ?? 50;
      const sev: FinanceSev =
        daysLeft <= 30 || prob < 50 ? 'warning' : prob < 70 ? 'warning' : 'info';
      const title =
        daysLeft <= 60
          ? `Sponsor ${s.nom} — ${daysLeft}j restants`
          : `Sponsor ${s.nom} à renouveler`;

      built.push({
        sourceKey: `sponsor:${s.id}`,
        iconKey: 'sponsor',
        sev,
        title,
        body:
          prob < 60
            ? `Probabilité renouvellement : ${prob}% — Action urgente`
            : `Contrat expire le ${s.endDate.toLocaleDateString('fr-FR')} — ${s.montant.toLocaleString('fr-FR')} DT/an`,
        path: '/finance/sponsors',
        level: this.sevToLevel(sev),
        sortPriority: daysLeft,
        eventAt: s.updatedAt,
      });
    }

    for (const inv of invoices.filter((i) => i.status === 'Retard')) {
      const due = inv.dueDate ?? inv.invoiceDate;
      const overdueDays = Math.max(1, this.daysBetween(now, due));
      const label = inv.description?.trim() || inv.fournisseur;

      built.push({
        sourceKey: `invoice:${inv.id}`,
        iconKey: 'invoice',
        sev: 'error',
        title: `Facture ${label} en retard`,
        body: `${inv.reference} — ${inv.montant.toLocaleString('fr-FR')} DT — En retard depuis ${overdueDays} jours`,
        path: '/finance/factures',
        level: 'CRITICAL',
        sortPriority: overdueDays,
        eventAt: inv.updatedAt,
      });
    }

    const pendingPayroll = invoices.filter(
      (i) =>
        i.status === 'En attente' &&
        /salaire|paie|payroll|staff|joueur/i.test(
          `${i.fournisseur} ${i.description ?? ''} ${i.invoiceType}`,
        ),
    );
    if (pendingPayroll.length > 0) {
      const names = pendingPayroll
        .slice(0, 2)
        .map((i) => i.fournisseur)
        .join(' · ');
      const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      built.push({
        sourceKey: `salary:pending:${now.getFullYear()}-${now.getMonth()}`,
        iconKey: 'salary',
        sev: 'warning',
        title: 'Salaire en attente de paiement',
        body: `${names} — ${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}`,
        path: '/finance/salaires',
        level: 'WARNING',
        sortPriority: 50,
        eventAt: pendingPayroll[0].updatedAt,
      });
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const salaryPaid = entries.some(
        (e) =>
          e.type === 'EXPENSE' &&
          e.category === 'Salaires' &&
          e.entryDate >= monthStart &&
          /payé|paye|validé/i.test(e.label),
      );
      if (!salaryPaid && now.getDate() >= 5 && contracts.length > 0) {
        const names = contracts
          .slice(0, 2)
          .map((c) => c.holderName)
          .join(' · ');
        const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        built.push({
          sourceKey: `salary:month:${now.getFullYear()}-${now.getMonth()}`,
          iconKey: 'salary',
          sev: 'warning',
          title: 'Salaire en attente de paiement',
          body: `${names} — ${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}`,
          path: '/finance/salaires',
          level: 'WARNING',
          sortPriority: 55,
          eventAt: monthStart,
        });
      }
    }

    const transferSpend = entries
      .filter((e) => e.type === 'EXPENSE' && e.category === 'Transferts')
      .reduce((sum, e) => sum + e.amount, 0);
    const transferCap =
      entries
        .filter((e) => e.type === 'REVENUE' && e.category === 'Transferts')
        .reduce((sum, e) => sum + e.amount, 0) || 3_000_000;
    const transferPct = transferCap > 0 ? Math.round((transferSpend / transferCap) * 100) : 0;
    if (transferPct >= 80) {
      built.push({
        sourceKey: `budget:transfers:${seasonLabel}`,
        iconKey: 'budget',
        sev: transferPct >= 90 ? 'error' : 'warning',
        title: `Budget transferts à ${transferPct}%`,
        body: `Plafond ${(transferCap / 1_000_000).toFixed(1)}M DT · Utilisé ${(transferSpend / 1_000_000).toFixed(2)}M DT — Seuil critique`,
        path: '/comptabilite',
        level: transferPct >= 90 ? 'CRITICAL' : 'WARNING',
        sortPriority: 100 - transferPct,
        eventAt: now,
      });
    }

    const budgetUsedPct = stats?.budgetUsedPct ?? 0;
    if (budgetUsedPct >= 85 && !built.some((b) => b.sourceKey.startsWith('budget:transfers'))) {
      built.push({
        sourceKey: `budget:global:${seasonLabel}`,
        iconKey: 'budget',
        sev: budgetUsedPct >= 95 ? 'error' : 'warning',
        title: `Budget club à ${budgetUsedPct}%`,
        body: `Reste ${(stats?.budgetRemaining ?? 0).toLocaleString('fr-FR')} DT — ${seasonLabel}`,
        path: '/comptabilite',
        level: budgetUsedPct >= 95 ? 'CRITICAL' : 'WARNING',
        sortPriority: 100 - budgetUsedPct,
        eventAt: now,
      });
    }

    return built.sort((a, b) => {
      const sevOrder = { error: 0, warning: 1, info: 2 };
      const sd = sevOrder[a.sev] - sevOrder[b.sev];
      if (sd !== 0) return sd;
      return a.sortPriority - b.sortPriority;
    });
  }

  private seasonLabel() {
    const y = new Date().getFullYear();
    return `Saison ${y}-${y + 1}`;
  }

  async syncAndList(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { clubName: true },
    });
    const clubName = org?.clubName ?? 'Club';
    const season = this.seasonLabel();

    const built = await this.buildNotifications(organizationId, clubName, season);
    const sourceKeys = built.map((b) => b.sourceKey);

    await this.prisma.$transaction(async (tx) => {
      if (sourceKeys.length > 0) {
        await tx.clubNotification.deleteMany({
          where: {
            organizationId,
            type: 'FINANCE',
            sourceKey: { notIn: sourceKeys },
          },
        });
      } else {
        await tx.clubNotification.deleteMany({
          where: { organizationId, type: 'FINANCE' },
        });
      }

      for (const n of built) {
        await tx.clubNotification.upsert({
          where: {
            organizationId_sourceKey: {
              organizationId,
              sourceKey: n.sourceKey,
            },
          },
          create: {
            organizationId,
            title: n.title,
            body: n.body,
            type: NotifType.FINANCE,
            level: n.level,
            sourceKey: n.sourceKey,
            path: n.path,
            iconKey: n.iconKey,
            isRead: false,
            createdAt: n.eventAt,
          },
          update: {
            title: n.title,
            body: n.body,
            level: n.level,
            path: n.path,
            iconKey: n.iconKey,
          },
        });
      }
    });

    const rows = await this.prisma.clubNotification.findMany({
      where: { organizationId, type: 'FINANCE' },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
    });

    const unread = rows.filter((r) => !r.isRead).length;

    return {
      clubName,
      season,
      unread,
      items: rows.map((r) => {
        const builtMeta = built.find((b) => b.sourceKey === r.sourceKey);
        const sev: FinanceSev = builtMeta?.sev ?? (
          r.level === 'CRITICAL' ? 'error' : r.level === 'WARNING' ? 'warning' : 'info'
        );
        return {
          id: r.id,
          iconKey: (r.iconKey ?? 'contract') as FinanceIcon,
          sev,
          title: r.title,
          body: r.body,
          time: this.formatRelativeTime(r.createdAt),
          read: r.isRead,
          path: r.path ?? '/comptabilite',
        };
      }),
    };
  }

  async markAllRead(user: JwtPayload) {
    const organizationId = this.orgId(user);
    await this.prisma.clubNotification.updateMany({
      where: { organizationId, type: 'FINANCE', isRead: false },
      data: { isRead: true },
    });
    return { message: 'Notifications finance marquées comme lues' };
  }

  async markRead(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    await this.prisma.clubNotification.updateMany({
      where: { id, organizationId, type: 'FINANCE' },
      data: { isRead: true },
    });
    return { message: 'Notification lue' };
  }

  async dismiss(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const row = await this.prisma.clubNotification.findFirst({
      where: { id, organizationId, type: 'FINANCE' },
    });
    if (!row) throw new NotFoundException('Notification introuvable.');
    await this.prisma.clubNotification.delete({ where: { id } });
    return { message: 'Notification supprimée' };
  }

  async getSearchIndex(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const [contracts, sponsors, invoices, players] = await Promise.all([
      this.prisma.clubContract.findMany({ where: { organizationId }, orderBy: { endDate: 'asc' } }),
      this.prisma.clubSponsor.findMany({ where: { organizationId }, orderBy: { montant: 'desc' } }),
      this.prisma.clubInvoice.findMany({ where: { organizationId }, orderBy: { invoiceDate: 'desc' } }),
      this.prisma.clubPlayer.findMany({
        where: { organizationId },
        select: { fullName: true, position: true, salaryMonthly: true },
        orderBy: { salaryMonthly: 'desc' },
      }),
    ]);

    const now = Date.now();

    return {
      categories: [
        {
          category: 'Joueurs',
          path: '/finance/salaires',
          items: players.map(
            (p) =>
              `${p.fullName} — ${p.position} — ${p.salaryMonthly.toLocaleString('fr-FR')} DT/mois`,
          ),
        },
        {
          category: 'Contrats',
          path: '/finance/contrats',
          items: contracts.map((c) => {
            const days = Math.ceil((c.endDate.getTime() - now) / 86400000);
            const status =
              days <= 0
                ? 'Expiré'
                : days <= 30
                  ? `Expire dans ${days} jours ⚠`
                  : `Expire dans ${days} jours`;
            return `Contrat ${c.holderName} — ${status}`;
          }),
        },
        {
          category: 'Factures',
          path: '/finance/factures',
          items: invoices.map(
            (i) =>
              `${i.reference} — ${i.fournisseur} — ${i.montant.toLocaleString('fr-FR')} DT — ${i.status}`,
          ),
        },
        {
          category: 'Sponsors',
          path: '/finance/sponsors',
          items: sponsors.map((s) => {
            const warn = s.status === 'Expire bientot' ? ' ⚠' : '';
            return `${s.nom} — ${s.montant.toLocaleString('fr-FR')} DT/an — ${s.status}${warn}`;
          }),
        },
      ],
    };
  }
}
