import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ClubAccessService } from '../club/club-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScoutService } from '../scout/scout.service';

const POSITION_FULL: Record<string, string> = {
  BU: 'Buteur',
  AG: 'Ailier gauche',
  AD: 'Ailier droit',
  MC: 'Milieu central',
  MOC: 'Milieu offensif',
  MDC: 'Milieu défensif',
  DC: 'Défenseur central',
  DG: 'Arrière gauche',
  DD: 'Arrière droit',
  GB: 'Gardien de but',
};

const REPORT_LABELS: Record<string, { title: string; focus: string }> = {
  rep1: {
    title: 'Rapport Shortlist complète',
    focus: 'Shortlist/watchlist, scores IA, valeurs marchandes, priorités A/B/C',
  },
  rep2: {
    title: 'Synthèse Négociations',
    focus: 'Pipeline recrutement, statuts workflow, dossiers actifs, agents',
  },
  rep3: {
    title: 'Analyse Budget Transferts',
    focus: 'Budget club, dépenses transferts, valeur prospects, projection',
  },
  rep4: {
    title: 'Top Talents par poste',
    focus: 'Meilleurs prospects classés par poste avec scores et potentiel',
  },
};

@Injectable()
export class RecruteurService {
  private aiResponseTimesMs: number[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
    private readonly scout: ScoutService,
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

  private async buildRecruteurContext(user: JwtPayload) {
    const organizationId = this.orgId(user);

    const [prospects, watchlist, reports, missions, org, squad, transfers, finance] =
      await Promise.all([
        this.scout.listProspects(user),
        this.scout.listWatchlist(user),
        this.scout.listReports(user),
        this.scout.listMissions(user),
        this.prisma.organization.findUnique({
          where: { id: organizationId },
          select: { clubName: true, league: true, country: true },
        }),
        this.prisma.clubPlayer.findMany({
          where: { organizationId },
          select: { fullName: true, position: true, age: true, ovr: true, marketValue: true, status: true },
        }),
        this.prisma.playerTransfer.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        this.prisma.clubFinanceEntry.findMany({
          where: { organizationId, category: { contains: 'Transfert', mode: 'insensitive' } },
          take: 30,
        }),
      ]);

    const revenue = await this.prisma.clubFinanceEntry.aggregate({
      where: { organizationId, type: 'REVENUE' },
      _sum: { amount: true },
    });
    const transferExpenses = finance
      .filter((f) => f.type === 'EXPENSE')
      .reduce((s, f) => s + f.amount, 0);

    const watchlistItems = watchlist.filter(
      (p): p is NonNullable<(typeof watchlist)[number]> => p != null,
    );

    return {
      clubName: org?.clubName ?? 'Club',
      league: org?.league ?? '—',
      country: org?.country ?? '—',
      season: String(new Date().getFullYear()),
      totalProspects: prospects.length,
      prospects: prospects.map((p) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        position: p.position,
        club: p.club,
        league: p.league,
        nationality: p.nationality,
        flag: p.flag,
        potential: p.potential,
        aiScore: p.aiScore,
        injuryRisk: p.injuryRisk,
        marketValue: p.marketValue,
        valueMK: p.valueMK,
        priority: p.priority,
        status: p.status,
        inWatchlist: p.inWatchlist,
        foot: p.foot,
        height: p.height,
        goals: p.goals,
        assists: p.assists,
        matches: p.matches,
        speed: p.speed,
        dribble: p.dribble,
        passing: p.passing,
        defense: p.defense,
        physical: p.physical,
        mental: p.mental,
        agent: p.agent,
        contractEnd: p.contractEnd,
      })),
      watchlist: watchlistItems.map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        priority: p.priority,
        aiScore: p.aiScore,
        marketValue: p.marketValue,
      })),
      reports: reports.slice(0, 15),
      missions: missions.slice(0, 10),
      squad,
      transfers: transfers.map((t) => ({
        player: t.playerName,
        type: t.transferType,
        club: t.club,
        value: t.value,
        status: t.status,
        probability: t.probability,
      })),
      budget: {
        transferExpenses,
        totalRevenue: revenue._sum.amount ?? 0,
        watchlistBudgetMK: watchlistItems.reduce((s, p) => s + p.valueMK, 0),
      },
    };
  }

  private formatContextText(ctx: Awaited<ReturnType<RecruteurService['buildRecruteurContext']>>) {
    return [
      '=== SNAPSHOT BASE DE DONNÉES RECRUTEMENT (ODIN ERP) ===',
      'Utilise EXCLUSIVEMENT ces données réelles. Ne dis jamais que tu n\'as pas accès.',
      JSON.stringify(ctx),
    ].join('\n');
  }

  private mapProspectToPlayer(
    p: Awaited<ReturnType<ScoutService['listProspects']>>[0],
    ai: {
      matchScore: number;
      strengths: string[];
      warnings: string[];
      whyPick: string;
      teamCompat?: number;
      transferSuccess?: number;
    },
  ) {
    const technique = Math.round((p.dribble + p.passing) / 2);
    const vision = p.passing;
    const finishing = Math.min(99, Math.round(p.goals * 2 + p.potential * 0.3));
    return {
      id: p.id,
      name: p.name,
      club: p.club,
      country: p.nationality,
      countryFlag: p.flag,
      age: p.age,
      position: p.position,
      positionFull: POSITION_FULL[p.position] ?? p.position,
      foot: p.foot === 'Gauche' ? 'Gauche' : 'Droit',
      height: `${p.height} cm`,
      value: p.marketValue,
      valueNum: Math.round((p.valueMK / 1000) * 10) / 10,
      salary: '—',
      aiScore: p.aiScore,
      potential: p.potential,
      injuryRisk: p.injuryRisk,
      teamCompat: ai.teamCompat ?? Math.min(99, Math.round(p.potential * 0.95)),
      transferSuccess: ai.transferSuccess ?? Math.min(99, Math.round(70 + p.potential * 0.2)),
      speed: p.speed,
      technique,
      physical: p.physical,
      vision,
      mental: p.mental,
      finishing,
      goals: p.goals,
      assists: p.assists,
      xg: 0,
      matches: p.matches,
      league: p.league,
      similarTo: [] as { name: string; pct: number }[],
      replaces: '',
      valueHistory: [] as { month: string; value: number; predicted?: boolean }[],
      shortlisted: p.inWatchlist,
      matchScore: ai.matchScore,
      strengths: ai.strengths,
      warnings: ai.warnings,
      whyPick: ai.whyPick,
    };
  }

  async getRecruteurAi(user: JwtPayload) {
    const [config, ctx] = await Promise.all([
      this.resolveAiConfig(),
      this.buildRecruteurContext(user),
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
      season: ctx.season,
      totalProspects: ctx.totalProspects,
      suggestedQueries: [
        'Défenseur central, budget 500k, moins de 24 ans',
        'Ailier rapide, pied gauche, Afrique du Nord',
        'Buteur potentiel > 90%, moins de 20 ans',
        'Milieu créatif, vision > 85, budget 2M€',
      ],
      avgResponseTime: avgMs != null ? `${(avgMs / 1000).toFixed(1)}s` : '—',
    };
  }

  async searchRecruteurAi(user: JwtPayload, query: string) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const ctx = await this.buildRecruteurContext(user);
    const contextText = this.formatContextText(ctx);
    const started = Date.now();

    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es l'assistant IA recrutement de ${ctx.clubName} sur ODIN ERP.
Tu as accès COMPLET à la base prospects/watchlist/transferts/effectif.
Réponds UNIQUEMENT en JSON valide:
{
  "summary": "résumé court de la recherche",
  "results": [
    {
      "prospectId": "uuid du prospect",
      "matchScore": 92,
      "strengths": ["..."],
      "warnings": ["..."],
      "whyPick": "...",
      "teamCompat": 88,
      "transferSuccess": 82
    }
  ]
}
Règles:
- Classe max 10 prospects de la base correspondant à la requête
- Utilise UNIQUEMENT des prospectId existants dans le snapshot
- matchScore 0-99 selon adéquation critères
- Réponds en français`,
      `SNAPSHOT:\n${contextText}\n\nRequête recruteur: ${query}`,
      1600,
    );

    const durationMs = Date.now() - started;
    let parsed: {
      summary?: string;
      results?: {
        prospectId: string;
        matchScore: number;
        strengths: string[];
        warnings: string[];
        whyPick: string;
        teamCompat?: number;
        transferSuccess?: number;
      }[];
    };

    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      throw new BadRequestException('Réponse IA invalide. Réessayez.');
    }

    const prospectMap = new Map(
      (await this.scout.listProspects(user)).map((p) => [p.id, p]),
    );
    const results = (parsed.results ?? [])
      .filter((r) => prospectMap.has(r.prospectId))
      .slice(0, 10)
      .map((r) => this.mapProspectToPlayer(prospectMap.get(r.prospectId)!, r));

    const avgScore =
      results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.matchScore, 0) / results.length)
        : 0;

    return {
      query,
      summary: parsed.summary ?? `Analyse de ${ctx.totalProspects} profils`,
      totalScanned: ctx.totalProspects,
      avgScore,
      results,
      durationMs,
      model: config.model,
    };
  }

  async generateReport(user: JwtPayload, templateId: 'rep1' | 'rep2' | 'rep3' | 'rep4', format?: string) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const tpl = REPORT_LABELS[templateId];
    const ctx = await this.buildRecruteurContext(user);
    const started = Date.now();

    const content = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es l'assistant IA recrutement ODIN ERP. Rédige un rapport professionnel en français, structuré avec titres markdown, tableaux si pertinent, et recommandations actionnables.`,
      `SNAPSHOT:\n${this.formatContextText(ctx)}\n\nRapport demandé: ${tpl.title}\nFocus: ${tpl.focus}\nFormat sortie: ${format ?? 'pdf'} (contenu texte/markdown)`,
      1800,
    );

    return {
      templateId,
      title: tpl.title,
      format: format ?? 'pdf',
      content,
      durationMs: Date.now() - started,
      model: config.model,
      generatedAt: new Date().toISOString(),
    };
  }
}
