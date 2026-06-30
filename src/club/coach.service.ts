import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ClubAccessService } from './club-access.service';
import { PreparateurService } from './preparateur.service';

@Injectable()
export class CoachService {
  private aiResponseTimesMs: number[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
    private readonly preparateur: PreparateurService,
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

  private statusLabel(status: string) {
    const map: Record<string, string> = {
      DISPONIBLE: 'Disponible',
      BLESSE: 'Blessé',
      LIMITE: 'Surveillance',
      FIN_CONTRAT: 'Fin contrat',
    };
    return map[status] ?? status;
  }

  private async buildCoachContext(user: JwtPayload) {
    const organizationId = this.orgId(user);

    const [org, charge, players, injuries, matchStats, events, readiness, wellness, presence] =
      await Promise.all([
        this.prisma.organization.findUnique({
          where: { id: organizationId },
          select: { clubName: true, league: true },
        }),
        this.preparateur.getChargeEquipe(user),
        this.prisma.clubPlayer.findMany({
          where: { organizationId },
          orderBy: { fullName: 'asc' },
        }),
        this.prisma.clubInjury.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
          take: 15,
        }),
        this.prisma.playerMatchStat.findMany({
          where: { organizationId },
          orderBy: { matchDate: 'desc' },
          take: 80,
        }),
        this.prisma.clubCalendarEvent.findMany({
          where: { organizationId },
          orderBy: { eventDate: 'asc' },
          take: 15,
        }),
        this.prisma.matchReadiness.findMany({
          where: { organizationId },
          include: { player: { select: { fullName: true } } },
        }),
        this.prisma.wellnessEntry.findMany({ where: { organizationId } }),
        this.prisma.sessionPresence.findMany({
          where: { organizationId },
          include: { player: { select: { fullName: true } } },
        }),
      ]);

    const chargeMap = new Map(charge.players.map((p) => [p.id, p]));
    const wellnessMap = new Map(wellness.map((w) => [w.playerId, w]));
    const readinessMap = new Map(readiness.map((r) => [r.playerId, r]));
    const presenceMap = new Map(presence.map((p) => [p.playerId, p]));

    const statsByPlayer = new Map<string, typeof matchStats>();
    for (const stat of matchStats) {
      const list = statsByPlayer.get(stat.playerId) ?? [];
      list.push(stat);
      statsByPlayer.set(stat.playerId, list);
    }

    const squad = players.map((p) => {
      const load = chargeMap.get(p.id);
      const pStats = statsByPlayer.get(p.id) ?? [];
      const avgRating =
        pStats.length > 0
          ? Math.round((pStats.reduce((s, m) => s + m.rating, 0) / pStats.length) * 10) / 10
          : null;
      const w = wellnessMap.get(p.id);
      const radar = (p.radar && typeof p.radar === 'object'
        ? p.radar
        : null) as Record<string, number> | null;

      return {
        id: p.id,
        name: p.fullName,
        position: p.position,
        age: p.age,
        ovr: p.ovr,
        goals: p.goals,
        status: this.statusLabel(p.status),
        fatigue: load?.fatigueScore ?? null,
        load: load?.loadScore ?? null,
        recovery: load?.recoveryScore ?? null,
        loadStatus: load?.statut ?? null,
        avgMatchRating: avgRating,
        recentMatches: pStats.slice(0, 5).map((m) => ({
          date: m.matchDate.toISOString().slice(0, 10),
          opponent: m.opponent,
          result: m.result,
          goals: m.goals,
          assists: m.assists,
          rating: m.rating,
        })),
        matchReadiness: readinessMap.get(p.id)?.status ?? null,
        presence: presenceMap.get(p.id)?.status ?? null,
        wellness: w
          ? { sommeil: w.sommeil, fatigue: w.fatigue, stress: w.stress, douleur: w.douleur }
          : null,
        radar,
        mental: radar?.vision ?? null,
      };
    });

    const upcomingMatches = events
      .filter((e) => e.eventType === 'MATCH' && e.eventDate >= new Date())
      .slice(0, 5)
      .map((e) => ({
        title: e.title,
        date: e.eventDate.toISOString().slice(0, 10),
        time: e.eventTime,
        location: e.location,
      }));

    const recentTeamResults = matchStats
      .slice(0, 20)
      .reduce<{ wins: number; draws: number; losses: number; totalGoals: number }>(
        (acc, m) => {
          const r = m.result.toLowerCase();
          if (r.includes('v') || r.includes('w') || r.includes('gagn')) acc.wins++;
          else if (r.includes('n') || r.includes('d')) acc.draws++;
          else if (r.includes('d') || r.includes('l') || r.includes('perd')) acc.losses++;
          acc.totalGoals += m.goals;
          return acc;
        },
        { wins: 0, draws: 0, losses: 0, totalGoals: 0 },
      );

    return {
      clubName: org?.clubName ?? 'Club',
      league: org?.league ?? '—',
      season: String(new Date().getFullYear()),
      coachName: user.fullName,
      summary: {
        squadSize: squad.length,
        disponibles: squad.filter((p) => p.status === 'Disponible').length,
        blesses: squad.filter((p) => p.status === 'Blessé').length,
        avgLoad: charge.summary.avgLoad,
        critiques: charge.summary.critiques,
      },
      squad,
      injuries: injuries.map((i) => ({
        player: i.playerName,
        type: i.injuryType,
        bodyPart: i.bodyPart,
        riskScore: i.riskScore,
      })),
      upcomingMatches,
      recentTeamResults,
      rankings: {
        mostFatigued: [...squad]
          .filter((p) => p.fatigue != null)
          .sort((a, b) => (b.fatigue ?? 0) - (a.fatigue ?? 0))
          .slice(0, 5)
          .map(({ name, fatigue, load, position, status }) => ({ name, fatigue, load, position, status })),
        bestForm: [...squad]
          .filter((p) => p.avgMatchRating != null)
          .sort((a, b) => (b.avgMatchRating ?? 0) - (a.avgMatchRating ?? 0))
          .slice(0, 5)
          .map(({ name, avgMatchRating, ovr, position, fatigue }) => ({
            name,
            avgMatchRating,
            ovr,
            position,
            fatigue,
          })),
        topScorers: [...squad]
          .sort((a, b) => b.goals - a.goals)
          .slice(0, 5)
          .map(({ name, goals, position, ovr }) => ({ name, goals, position, ovr })),
      },
    };
  }

  async getCoachAi(user: JwtPayload) {
    const [config, ctx] = await Promise.all([
      this.resolveAiConfig(),
      this.buildCoachContext(user),
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
      coachName: ctx.coachName,
      season: ctx.season,
      summary: ctx.summary,
      suggestedQuestions: [
        'Qui doit jouer titulaire contre EST ?',
        'Quel joueur est le plus fatigué ?',
        'Recommandation pour la composition demain',
        'Risques blessures cette semaine',
        'Qui mérite d\'être capitaine ?',
        'Performances des 6 derniers matchs',
      ],
      avgResponseTime: avgMs != null ? `${(avgMs / 1000).toFixed(1)}s` : '—',
    };
  }

  async chatCoachAi(user: JwtPayload, dto: { question: string; context?: string }) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const ctx = await this.buildCoachContext(user);
    const contextText = [
      '=== SNAPSHOT BASE DE DONNÉES COACH (ODIN ERP) ===',
      'Utilise EXCLUSIVEMENT ces données. Ne dis jamais que tu n\'as pas accès.',
      JSON.stringify(ctx),
    ].join('\n');

    const started = Date.now();
    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es ODIN AI Coach, assistant du coach ${ctx.coachName} pour ${ctx.clubName}.
Tu as accès COMPLET à l'effectif, charge/fatigue, blessures, matchs, compositions.
Réponds UNIQUEMENT en JSON valide:
{
  "text": "réponse en français, concise et actionnable",
  "cards": [
    { "title": "Nom joueur ou KPI", "value": "82%", "color": "#EF4444", "detail": "poste · info" }
  ]
}
Règles:
- Utilise les VRAIS noms de joueurs du snapshot
- colors: #EF4444 danger, #F59E0B attention, #22C55E ok, #FF7A00 accent coach, #8B5CF6 stats
- Max 6 cards pertinentes
- Pour titulaires: prioriser forme (avgMatchRating), fatigue basse, status Disponible
- Pour capitaine: mental, ovr, leadership implicite`,
      `SNAPSHOT:\n${contextText}\n${dto.context ? `\nContexte: ${dto.context}` : ''}\n\nQuestion: ${dto.question}`,
      1400,
    );

    const durationMs = Date.now() - started;
    let parsed: {
      text?: string;
      cards?: { title: string; value: string; color: string; detail: string }[];
    };

    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = { text: raw, cards: [] };
    }

    return {
      question: dto.question,
      text: parsed.text ?? raw,
      cards: parsed.cards ?? [],
      durationMs,
      model: config.model,
      clubName: ctx.clubName,
    };
  }
}
