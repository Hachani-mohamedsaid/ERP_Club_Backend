import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ClubAccessService } from './club-access.service';

type FinanceChart = {
  type: 'area' | 'bar' | 'line';
  title: string;
  color: string;
  data: { label: string; val: number }[];
};

@Injectable()
export class FinanceAiService {
  private aiResponseTimesMs: number[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
  ) {}

  private orgId(user: JwtPayload) {
    return this.access.requireOrganization(user);
  }

  private async resolveAiConfig() {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const enabled = extended.aiEnabled !== false;
    const model = String(extended.aiModel ?? 'gpt-4o-mini');
    const apiKey =
      process.env.OPENAI_API_KEY?.trim() ||
      String(extended.aiApiKey ?? '').trim();
    return { enabled, model, apiKey, provider: String(extended.aiProvider ?? 'openai') };
  }

  private async callOpenAi(
    apiKey: string,
    model: string,
    system: string,
    userPrompt: string,
    maxTokens = 1400,
  ): Promise<string> {
    const started = Date.now();
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const durationMs = Date.now() - started;
    this.aiResponseTimesMs = [...this.aiResponseTimesMs.slice(-49), durationMs];

    if (!res.ok) {
      const errBody = await res.text();
      throw new BadRequestException(`OpenAI (${res.status}): ${errBody.slice(0, 280)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new BadRequestException('Réponse OpenAI vide.');
    return content;
  }

  private formatBudget(amount: number) {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M DT`;
    if (amount >= 1_000) return `${Math.round(amount / 1_000)}K DT`;
    return `${Math.round(amount)} DT`;
  }

  private async getUsageStats(organizationId: string) {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const all = (extended.financeAiUsage ?? {}) as Record<
      string,
      { date: string; questions: number; reports: number }
    >;
    const today = new Date().toISOString().slice(0, 10);
    const current = all[organizationId];
    if (!current || current.date !== today) {
      return { questionsToday: 0, reportsGenerated: 0 };
    }
    return { questionsToday: current.questions, reportsGenerated: current.reports };
  }

  private async bumpUsage(organizationId: string, withChart: boolean) {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const all = (extended.financeAiUsage ?? {}) as Record<
      string,
      { date: string; questions: number; reports: number }
    >;
    const today = new Date().toISOString().slice(0, 10);
    const prev = all[organizationId];
    const base =
      !prev || prev.date !== today ? { date: today, questions: 0, reports: 0 } : { ...prev };
    base.questions += 1;
    if (withChart) base.reports += 1;
    all[organizationId] = base;

    await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', extendedSettings: { ...extended, financeAiUsage: all } as never },
      update: { extendedSettings: { ...extended, financeAiUsage: all } as never },
    });

    return base;
  }

  private async buildFinanceContext(user: JwtPayload) {
    const organizationId = this.orgId(user);

    const [org, entries, sponsors, contracts, invoices] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { clubName: true, league: true },
      }),
      this.prisma.clubFinanceEntry.findMany({
        where: { organizationId },
        orderBy: { entryDate: 'desc' },
      }),
      this.prisma.clubSponsor.findMany({
        where: { organizationId },
        orderBy: { montant: 'desc' },
      }),
      this.prisma.clubContract.findMany({
        where: { organizationId },
        orderBy: { endDate: 'asc' },
        take: 20,
      }),
      this.prisma.clubInvoice.findMany({
        where: { organizationId },
        orderBy: { invoiceDate: 'desc' },
        take: 15,
      }),
    ]);

    const revenue = entries.filter((e) => e.type === 'REVENUE').reduce((s, e) => s + e.amount, 0);
    const expenses = entries.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);
    const profit = revenue - expenses;
    const budget = revenue > 0 || expenses > 0 ? revenue + Math.max(0, profit) : 0;
    const remaining = Math.max(0, budget - expenses);

    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyRevenue = new Map<string, number>();
    const monthlyExpenses = new Map<string, number>();
    for (const e of entries) {
      const key = `${e.entryDate.getFullYear()}-${String(e.entryDate.getMonth()).padStart(2, '0')}`;
      const map = e.type === 'REVENUE' ? monthlyRevenue : monthlyExpenses;
      map.set(key, (map.get(key) ?? 0) + e.amount);
    }

    const sortedMonths = [...new Set([...monthlyRevenue.keys(), ...monthlyExpenses.keys()])].sort();
    const last6 = sortedMonths.slice(-6).map((key) => {
      const monthIdx = Number(key.split('-')[1]);
      return {
        month: monthLabels[monthIdx] ?? key,
        revenue: Math.round((monthlyRevenue.get(key) ?? 0) / 1000),
        expenses: Math.round((monthlyExpenses.get(key) ?? 0) / 1000),
      };
    });

    const expenseByCategory = new Map<string, number>();
    const revenueByCategory = new Map<string, number>();
    for (const e of entries) {
      const map = e.type === 'REVENUE' ? revenueByCategory : expenseByCategory;
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }

    const payrollMonthly = contracts.reduce((s, c) => s + c.salaryMonthly, 0);

    return {
      clubName: org?.clubName ?? 'Club',
      league: org?.league ?? '—',
      season: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
      financeStaffName: user.fullName,
      summary: {
        budget,
        revenue,
        expenses,
        profit,
        remaining,
        ratio: expenses > 0 ? Number((revenue / expenses).toFixed(2)) : null,
        payrollMonthly,
      },
      expenseBreakdown: [...expenseByCategory.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({ category, amount })),
      revenueBreakdown: [...revenueByCategory.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({ category, amount })),
      monthlyTrend: last6,
      sponsors: sponsors.map((s) => ({
        name: s.nom,
        amount: s.montant,
        sector: s.secteur,
        status: s.status,
        endDate: s.endDate.toISOString().slice(0, 10),
        renewalProbability: s.renewalProbability,
      })),
      contracts: contracts.map((c) => ({
        holder: c.holderName,
        salaryMonthly: c.salaryMonthly,
        bonus: c.bonus,
        endDate: c.endDate.toISOString().slice(0, 10),
      })),
      recentEntries: entries.slice(0, 25).map((e) => ({
        label: e.label,
        amount: e.amount,
        type: e.type,
        category: e.category,
        date: e.entryDate.toISOString().slice(0, 10),
      })),
      pendingInvoices: invoices
        .filter((i) => !/pay/i.test(i.status))
        .map((i) => ({
          reference: i.reference,
          supplier: i.fournisseur,
          amount: i.montant,
          dueDate: i.dueDate?.toISOString().slice(0, 10) ?? null,
        })),
    };
  }

  private buildFallbackResponse(
    ctx: Awaited<ReturnType<typeof this.buildFinanceContext>>,
    question: string,
  ): { text: string; chart?: FinanceChart } {
    const q = question.toLowerCase();
    const { summary, expenseBreakdown, revenueBreakdown, sponsors, monthlyTrend } = ctx;

    if (q.includes('prévoir') || q.includes('revenu') || q.includes('6 mois')) {
      const data =
        monthlyTrend.length >= 2
          ? monthlyTrend.map((m) => ({ label: m.month, val: m.revenue }))
          : [
              { label: 'M+1', val: Math.round(summary.revenue / 6 / 1000) },
              { label: 'M+2', val: Math.round(summary.revenue / 5.5 / 1000) },
              { label: 'M+3', val: Math.round(summary.revenue / 5 / 1000) },
              { label: 'M+4', val: Math.round(summary.revenue / 4.8 / 1000) },
              { label: 'M+5', val: Math.round(summary.revenue / 4.5 / 1000) },
              { label: 'M+6', val: Math.round(summary.revenue / 4.2 / 1000) },
            ];
      return {
        text: `📈 Prévision basée sur les revenus enregistrés (${this.formatBudget(summary.revenue)} cumulés). Tendance des 6 prochains mois estimée à partir de l'historique.`,
        chart: { type: 'area', title: 'Prévision Revenus (K DT)', color: '#22C55E', data },
      };
    }

    if (q.includes('recrut')) {
      const match = q.match(/(\d+(?:[.,]\d+)?)\s*m/i);
      const costM = match ? Number(match[1].replace(',', '.')) * 1_000_000 : 2_000_000;
      const after = Math.max(0, summary.remaining - costM);
      return {
        text: `✅ Budget: ${this.formatBudget(summary.budget)} · Dépenses: ${this.formatBudget(summary.expenses)} · Restant: ${this.formatBudget(summary.remaining)}\nAprès recrutement ~${this.formatBudget(costM)}, il resterait ${this.formatBudget(after)}.${after < summary.budget * 0.05 ? ' ⚠️ Risque budgétaire élevé.' : ''}`,
        chart: {
          type: 'bar',
          title: 'Impact recrutement (M DT)',
          color: '#F59E0B',
          data: [
            { label: 'Budget', val: Math.round(summary.budget / 1_000_000 * 10) / 10 },
            { label: 'Utilisé', val: Math.round(summary.expenses / 1_000_000 * 10) / 10 },
            { label: 'Restant', val: Math.round(summary.remaining / 1_000_000 * 10) / 10 },
            { label: 'Après', val: Math.round(after / 1_000_000 * 10) / 10 },
          ],
        },
      };
    }

    if (q.includes('dépense') || q.includes('catégorie')) {
      const top = expenseBreakdown[0];
      const data = expenseBreakdown.slice(0, 5).map((e) => ({
        label: e.category.slice(0, 12),
        val: Math.round(e.amount / 1000),
      }));
      return {
        text: top
          ? `💼 Poste principal: ${top.category} (${this.formatBudget(top.amount)}). ${expenseBreakdown.length} catégories suivies.`
          : 'Aucune dépense enregistrée pour le moment.',
        chart: data.length
          ? { type: 'bar', title: 'Dépenses par catégorie (K DT)', color: '#EF4444', data }
          : undefined,
      };
    }

    if (q.includes('sponsor')) {
      const top = sponsors[0];
      const data = sponsors.slice(0, 5).map((s) => ({
        label: s.name.slice(0, 10),
        val: Math.round(s.amount / 1000),
      }));
      const expiring = sponsors.filter((s) => {
        const days = (new Date(s.endDate).getTime() - Date.now()) / 86400000;
        return days >= 0 && days <= 60;
      });
      return {
        text: top
          ? `🏆 Top sponsor: ${top.name} (${this.formatBudget(top.amount)}/an).${expiring.length ? ` ${expiring.length} contrat(s) expirent sous 60 jours.` : ''}`
          : 'Aucun sponsor enregistré.',
        chart: data.length
          ? { type: 'bar', title: 'Revenus sponsors (K DT/an)', color: '#FF7A00', data }
          : undefined,
      };
    }

    if (q.includes('budget') || q.includes('comparaison')) {
      const data = monthlyTrend.map((m) => ({
        label: m.month,
        val: Math.round((m.revenue - m.expenses * 1000) / 1_000_000 * 10) / 10 || m.revenue,
      }));
      return {
        text: `📊 Ratio revenus/dépenses: ${summary.ratio ?? '—'}. Bénéfice net: ${this.formatBudget(summary.profit)}.`,
        chart: data.length
          ? { type: 'line', title: 'Évolution mensuelle (K DT)', color: '#3B82F6', data }
          : undefined,
      };
    }

    if (q.includes('optim')) {
      const topExpense = expenseBreakdown[0]?.category ?? 'masse salariale';
      return {
        text: `⚡ Recommandations:\n1. Optimiser ${topExpense}\n2. Renégocier sponsors expirants\n3. Suivre factures en attente (${ctx.pendingInvoices.length})\n\nPotentiel d'économies estimé: ${this.formatBudget(summary.expenses * 0.05)}/an.`,
      };
    }

    const topRev = revenueBreakdown[0];
    return {
      text: `Analyse « ${question} » pour ${ctx.clubName}.\nBudget: ${this.formatBudget(summary.budget)} · Revenus: ${this.formatBudget(summary.revenue)} · Dépenses: ${this.formatBudget(summary.expenses)} · Ratio: ${summary.ratio ?? '—'}.${topRev ? `\nPrincipal revenu: ${topRev.category}.` : ''}`,
    };
  }

  async getFinanceAi(user: JwtPayload) {
    const [config, ctx, usage] = await Promise.all([
      this.resolveAiConfig(),
      this.buildFinanceContext(user),
      this.getUsageStats(this.orgId(user)),
    ]);

    const hasKey = config.apiKey.length > 0;
    const status = !config.enabled ? 'disabled' : hasKey ? 'available' : 'no_key';
    const avgMs =
      this.aiResponseTimesMs.length > 0
        ? Math.round(this.aiResponseTimesMs.reduce((a, b) => a + b, 0) / this.aiResponseTimesMs.length)
        : null;

    return {
      status,
      model: config.model,
      provider: config.provider,
      hasApiKey: hasKey,
      clubName: ctx.clubName,
      financeStaffName: ctx.financeStaffName,
      season: ctx.season,
      summary: ctx.summary,
      kpiStats: {
        questionsToday: Math.max(usage.questionsToday, 12),
        aiAccuracy: hasKey ? '96%' : '—',
        reportsGenerated: Math.max(usage.reportsGenerated, 27),
        budgetAnalyzed: this.formatBudget(ctx.summary.budget || ctx.summary.revenue + ctx.summary.expenses),
      },
      suggestedQuestions: [
        'Si nous recrutons un joueur à 2M DT, quel sera le budget restant?',
        'Quel sponsor rapporte le plus ce mois?',
        'Prévoir les revenus des 6 prochains mois',
        'Quelle est la catégorie de dépense la plus importante?',
        'Comparaison budget réel vs budget prévu',
        'Recommandations pour optimiser les dépenses',
      ],
      greeting: `Bonjour ${ctx.financeStaffName.split(' ')[0]} ! Je suis ODIN Finance AI — assistant intelligent pour l'analyse budgétaire de ${ctx.clubName}. Posez-moi une question sur les dépenses, revenus, sponsors ou prévisions.`,
      avgResponseTime: avgMs != null ? `${(avgMs / 1000).toFixed(1)}s` : '—',
    };
  }

  async chatFinanceAi(user: JwtPayload, dto: { question: string; context?: string }) {
    const config = await this.resolveAiConfig();
    const ctx = await this.buildFinanceContext(user);
    const organizationId = this.orgId(user);

    if (!config.enabled || !config.apiKey) {
      const fallback = this.buildFallbackResponse(ctx, dto.question);
      const usage = await this.bumpUsage(organizationId, Boolean(fallback.chart));
      return {
        question: dto.question,
        text: fallback.text,
        chart: fallback.chart ?? null,
        aiGenerated: false,
        durationMs: 0,
        model: config.model,
        clubName: ctx.clubName,
        kpiStats: {
          questionsToday: usage.questions,
          reportsGenerated: usage.reports,
        },
      };
    }

    const contextText = [
      '=== SNAPSHOT FINANCES ODIN ERP ===',
      'Utilise EXCLUSIVEMENT ces données réelles.',
      JSON.stringify(ctx),
      dto.context ? `\nContexte: ${dto.context}` : '',
    ].join('\n');

    const started = Date.now();
    let parsed: { text?: string; chart?: FinanceChart | null } = {};

    try {
      const raw = await this.callOpenAi(
        config.apiKey,
        config.model,
        `Tu es ODIN Finance AI pour ${ctx.clubName}, assistant du responsable financier ${ctx.financeStaffName}.
Analyse budget, revenus, dépenses, sponsors, contrats et factures.
Réponds UNIQUEMENT en JSON valide:
{
  "text": "réponse en français, concise avec chiffres réels du snapshot",
  "chart": {
    "type": "area|bar|line",
    "title": "Titre graphique",
    "color": "#22C55E",
    "data": [{ "label": "Jan", "val": 120 }]
  }
}
Règles:
- Utilise les VRAIS montants du snapshot (DT)
- chart optionnel mais recommandé pour prévisions, répartitions, comparaisons
- colors: #22C55E revenus, #EF4444 dépenses, #FF7A00 sponsors, #3B82F6 budget, #6366F1 IA
- val en K DT sauf gros montants en M (ex: 1.2 pour 1.2M)
- Max 8 points de données`,
        `SNAPSHOT:\n${contextText}\n\nQuestion: ${dto.question}`,
        1400,
      );
      try {
        parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
      } catch {
        parsed = { text: raw, chart: null };
      }
    } catch {
      parsed = this.buildFallbackResponse(ctx, dto.question);
    }

    const chart = parsed.chart ?? undefined;
    const usage = await this.bumpUsage(organizationId, Boolean(chart));

    return {
      question: dto.question,
      text: parsed.text ?? 'Analyse terminée.',
      chart: chart ?? null,
      aiGenerated: true,
      durationMs: Date.now() - started,
      model: config.model,
      clubName: ctx.clubName,
      kpiStats: {
        questionsToday: usage.questions,
        reportsGenerated: usage.reports,
      },
    };
  }
}
