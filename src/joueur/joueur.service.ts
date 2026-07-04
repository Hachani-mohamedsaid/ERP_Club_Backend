import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ClubAccessService } from '../club/club-access.service';
import { ClubService } from '../club/club.service';

const DEFAULT_RADAR = {
  pace: 70,
  shooting: 70,
  passing: 70,
  dribbling: 70,
  defending: 70,
  physical: 70,
};

@Injectable()
export class JoueurService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
    private readonly club: ClubService,
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
    maxTokens = 1800,
  ): Promise<string> {
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

  private async buildJoueurAiContext(user: JwtPayload) {
    const playerId = await this.resolvePlayerId(user);
    const organizationId = this.orgId(user);

    const [player, org, injuries, loads, matchStats, events, profileRow] = await Promise.all([
      this.prisma.clubPlayer.findUnique({
        where: { id: playerId },
        include: { clubPlayerProfile: true, PlayerAward: true },
      }),
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { clubName: true, league: true },
      }),
      this.prisma.clubInjury.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.playerLoad.findMany({
        where: { organizationId, playerId },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      this.prisma.playerMatchStat.findMany({
        where: { organizationId, playerId },
        orderBy: { matchDate: 'desc' },
        take: 10,
      }),
      this.prisma.clubCalendarEvent.findMany({
        where: { organizationId },
        orderBy: { eventDate: 'asc' },
        take: 8,
      }),
      this.prisma.clubPlayerProfile.findUnique({ where: { clubPlayerId: playerId } }),
    ]);

    if (!player) throw new NotFoundException('Joueur introuvable.');

    const playerInjuries = injuries.filter(
      (i) => i.playerName.toLowerCase() === player.fullName.toLowerCase(),
    );

    return {
      clubName: org?.clubName ?? 'Club',
      league: org?.league ?? '—',
      player: {
        id: player.id,
        name: player.fullName,
        position: player.position,
        age: player.age,
        ovr: player.ovr,
        goals: player.goals,
        status: player.status,
        marketValue: player.marketValue,
        radar: (player.radar as Record<string, number>) ?? DEFAULT_RADAR,
      },
      profile: profileRow
        ? {
            training: profileRow.training,
            matchAnalysis: profileRow.matchAnalysis,
            aiInsight: profileRow.aiInsight,
            evolution: profileRow.evolution,
          }
        : null,
      injuries: playerInjuries.map((i) => ({
        type: i.injuryType,
        bodyPart: i.bodyPart,
        riskScore: i.riskScore,
        returnDate: i.returnDate?.toISOString().slice(0, 10) ?? null,
      })),
      loads: loads.map((l) => ({
        loadScore: l.loadScore,
        fatigueScore: l.fatigueScore,
        recoveryScore: l.recoveryScore,
        date: l.createdAt.toISOString().slice(0, 10),
      })),
      recentMatches: matchStats.map((m) => ({
        opponent: m.opponent,
        result: m.result,
        goals: m.goals,
        assists: m.assists,
        rating: m.rating,
        date: m.matchDate.toISOString().slice(0, 10),
      })),
      upcomingEvents: events
        .filter((e) => e.eventDate >= new Date())
        .slice(0, 5)
        .map((e) => ({
          title: e.title,
          type: e.eventType,
          date: e.eventDate.toISOString().slice(0, 10),
        })),
      awards: player.PlayerAward.map((a) => ({ title: a.title, season: a.season })),
    };
  }

  private async getReportCache(playerId: string) {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const cache = (extended.joueurAiReportCache ?? {}) as Record<
      string,
      { report: Record<string, unknown>; generatedAt: string }
    >;
    return cache[playerId] ?? null;
  }

  private async saveReportCache(playerId: string, report: Record<string, unknown>) {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const cache = (extended.joueurAiReportCache ?? {}) as Record<
      string,
      { report: Record<string, unknown>; generatedAt: string }
    >;
    cache[playerId] = { report, generatedAt: new Date().toISOString() };

    await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', extendedSettings: { ...extended, joueurAiReportCache: cache } as never },
      update: { extendedSettings: { ...extended, joueurAiReportCache: cache } as never },
    });
  }

  private fallbackReport(ctx: Awaited<ReturnType<typeof this.buildJoueurAiContext>>) {
    const radar = ctx.player.radar;
    const strengths = Object.entries(radar)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        note: 'Basé sur le radar joueur',
      }));
    const weaknesses = Object.entries(radar)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        note: 'Axe de progression identifié',
      }));

    return {
      weeklyInsights: {
        speedChange: '+5%',
        enduranceChange: '-2%',
        fatigueRisk: 'Moyen',
        advice: 'Repos actif recommandé après charge élevée',
      },
      strengths,
      weaknesses,
      trainingPlan: [
        { day: 'Lundi', focus: 'Sprint', detail: 'Vitesse + accélération', intensity: 80, icon: '⚡' },
        { day: 'Mardi', focus: 'Finishing', detail: 'Finition en surface', intensity: 75, icon: '🎯' },
        { day: 'Mercredi', focus: 'Repos', detail: 'Récupération active', intensity: 25, icon: '😴' },
        { day: 'Jeudi', focus: 'Tactique', detail: 'Placement et appels', intensity: 60, icon: '📋' },
        { day: 'Vendredi', focus: 'Force', detail: 'Renforcement musculaire', intensity: 78, icon: '💪' },
        { day: 'Samedi', focus: 'Récupération', detail: 'Physio + étirements', intensity: 30, icon: '🧊' },
      ],
      injuryPrevention: {
        zone: ctx.injuries[0]?.bodyPart ?? 'Genou',
        risk: ctx.injuries[0]?.riskScore ? ctx.injuries[0].riskScore * 10 : 25,
        level: 'Modéré',
        advice: 'Surveiller la charge et renforcer la chaîne postérieure',
      },
      recommendations: [
        'Maintenir 7h30 de sommeil minimum avant chaque match',
        `Travailler le point faible: ${weaknesses[0]?.label ?? 'technique'}`,
        'Hydratation renforcée les jours de forte intensité',
      ],
      suggestedQuestions: [
        'Comment marquer plus ?',
        'Comment améliorer ma vitesse ?',
        'Pourquoi mon score baisse ?',
        'Comment prévenir les blessures ?',
      ],
      chatHistory: [],
      clubName: ctx.clubName,
      playerName: ctx.player.name,
    };
  }

  private normalizeReport(
    ctx: Awaited<ReturnType<typeof this.buildJoueurAiContext>>,
    partial: Record<string, unknown>,
  ) {
    const base = this.fallbackReport(ctx);
    const weekly = partial.weeklyInsights as Record<string, string> | undefined;
    const injury = partial.injuryPrevention as Record<string, unknown> | undefined;

    return {
      weeklyInsights: {
        speedChange: weekly?.speedChange ?? base.weeklyInsights.speedChange,
        enduranceChange: weekly?.enduranceChange ?? base.weeklyInsights.enduranceChange,
        fatigueRisk: weekly?.fatigueRisk ?? base.weeklyInsights.fatigueRisk,
        advice: weekly?.advice ?? base.weeklyInsights.advice,
      },
      strengths: Array.isArray(partial.strengths) && partial.strengths.length
        ? (partial.strengths as typeof base.strengths)
        : base.strengths,
      weaknesses: Array.isArray(partial.weaknesses) && partial.weaknesses.length
        ? (partial.weaknesses as typeof base.weaknesses)
        : base.weaknesses,
      trainingPlan: Array.isArray(partial.trainingPlan) && partial.trainingPlan.length
        ? (partial.trainingPlan as typeof base.trainingPlan)
        : base.trainingPlan,
      injuryPrevention: {
        zone: String(injury?.zone ?? base.injuryPrevention.zone),
        risk: typeof injury?.risk === 'number' ? injury.risk : base.injuryPrevention.risk,
        level: String(injury?.level ?? base.injuryPrevention.level),
        advice: String(injury?.advice ?? base.injuryPrevention.advice),
      },
      recommendations: Array.isArray(partial.recommendations) && partial.recommendations.length
        ? (partial.recommendations as string[])
        : base.recommendations,
      suggestedQuestions: Array.isArray(partial.suggestedQuestions) && partial.suggestedQuestions.length
        ? (partial.suggestedQuestions as string[])
        : base.suggestedQuestions,
      chatHistory: Array.isArray(partial.chatHistory)
        ? (partial.chatHistory as typeof base.chatHistory)
        : base.chatHistory,
      clubName: ctx.clubName,
      playerName: ctx.player.name,
      position: ctx.player.position,
      ovr: ctx.player.ovr,
    };
  }

  async getJoueurAi(user: JwtPayload) {
    const [config, ctx] = await Promise.all([
      this.resolveAiConfig(),
      this.buildJoueurAiContext(user),
    ]);

    const cache = await this.getReportCache(ctx.player.id);
    const hasKey = config.apiKey.length > 0;
    const status = !config.enabled ? 'disabled' : hasKey ? 'available' : 'no_key';

    return {
      status,
      model: config.model,
      provider: config.provider,
      clubName: ctx.clubName,
      playerName: ctx.player.name,
      position: ctx.player.position,
      ovr: ctx.player.ovr,
      hasReport: Boolean(cache),
      reportGeneratedAt: cache?.generatedAt ?? null,
    };
  }

  async getJoueurAiReport(user: JwtPayload, refresh = false) {
    const config = await this.resolveAiConfig();
    const ctx = await this.buildJoueurAiContext(user);

    const cache = await this.getReportCache(ctx.player.id);
    const cacheAge = cache ? Date.now() - new Date(cache.generatedAt).getTime() : Infinity;
    const cacheValid = !refresh && cache && cacheAge < 12 * 60 * 60 * 1000;

    if (cacheValid) {
      return {
        ...this.normalizeReport(ctx, cache.report),
        cached: true,
        generatedAt: cache.generatedAt,
        model: config.model,
      };
    }

    if (!config.enabled || !config.apiKey) {
      return {
        ...this.fallbackReport(ctx),
        cached: false,
        aiGenerated: false,
        model: config.model,
        generatedAt: new Date().toISOString(),
      };
    }

    const started = Date.now();
    let parsed: Record<string, unknown> = {};
    try {
      const raw = await this.callOpenAi(
        config.apiKey,
        config.model,
        `Tu es ODIN AI Coach, assistant personnel du joueur de football.
Génère un rapport hebdomadaire personnalisé UNIQUEMENT en JSON valide:
{
  "weeklyInsights": {
    "speedChange": "+8%",
    "enduranceChange": "-3%",
    "fatigueRisk": "Faible|Moyen|Élevé",
    "advice": "conseil court actionnable"
  },
  "strengths": [{ "label": "...", "value": 91, "note": "..." }],
  "weaknesses": [{ "label": "...", "value": 68, "note": "..." }],
  "trainingPlan": [
    { "day": "Lundi", "focus": "Sprint|Finishing|Repos|Tactique|Force|Récupération", "detail": "...", "intensity": 85, "icon": "⚡" }
  ],
  "injuryPrevention": { "zone": "...", "risk": 32, "level": "Faible|Modéré|Élevé", "advice": "..." },
  "recommendations": ["...", "...", "..."],
  "suggestedQuestions": ["...", "...", "..."],
  "chatHistory": [{ "id": "h1", "period": "Aujourd'hui", "question": "..." }]
}
Règles:
- Utilise EXCLUSIVEMENT les données snapshot du joueur
- 3 forces, 3 faiblesses (value 50-95)
- 6 jours trainingPlan (Lundi-Samedi)
- 3-4 recommendations concrètes
- Ton coach bienveillant en français`,
        JSON.stringify(ctx),
        1400,
      );
      try {
        parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
      } catch {
        parsed = {};
      }
    } catch {
      parsed = {};
    }

    const report = this.normalizeReport(ctx, parsed);

    await this.saveReportCache(ctx.player.id, report);

    return {
      ...report,
      cached: false,
      aiGenerated: Object.keys(parsed).length > 0,
      durationMs: Date.now() - started,
      model: config.model,
      generatedAt: new Date().toISOString(),
    };
  }

  async chatJoueurAi(user: JwtPayload, question: string) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const ctx = await this.buildJoueurAiContext(user);
    const started = Date.now();

    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es ODIN AI Coach pour ${ctx.player.name} (${ctx.player.position}, OVR ${ctx.player.ovr}).
Réponds en JSON: { "text": "réponse coach en français, concise et motivante" }
Utilise les données réelles du snapshot. Max 120 mots.`,
      `SNAPSHOT:\n${JSON.stringify(ctx)}\n\nQuestion: ${question}`,
      600,
    );

    let parsed: { text?: string } = {};
    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = { text: raw };
    }

    return {
      question,
      text: parsed.text ?? raw,
      durationMs: Date.now() - started,
      model: config.model,
      playerName: ctx.player.name,
    };
  }

  private async resolvePlayerId(user: JwtPayload): Promise<string> {
    const organizationId = this.orgId(user);
    const member = await this.prisma.clubMember.findFirst({
      where: {
        organizationId,
        OR: [
          { email: { equals: user.email, mode: Prisma.QueryMode.insensitive } },
          ...(user.fullName
            ? [{ fullName: { equals: user.fullName, mode: Prisma.QueryMode.insensitive }, clubRole: 'JOUEUR' as const }]
            : []),
        ],
      },
      select: { clubPlayerId: true, clubRole: true },
    });

    if (member?.clubPlayerId) {
      return member.clubPlayerId;
    }

    if (user.fullName) {
      const player = await this.prisma.clubPlayer.findFirst({
        where: {
          organizationId,
          fullName: { equals: user.fullName, mode: Prisma.QueryMode.insensitive },
        },
        select: { id: true },
      });
      if (player) return player.id;
    }

    throw new ForbiddenException('Aucun joueur lié à ce compte.');
  }

  async getMe(user: JwtPayload) {
    const playerId = await this.resolvePlayerId(user);
    const player = await this.prisma.clubPlayer.findUnique({
      where: { id: playerId },
      include: { clubPlayerProfile: true, PlayerAward: true },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');

    const contracts = await this.prisma.clubContract.findMany({
      where: { organizationId: player.organizationId, holderName: player.fullName },
      orderBy: { endDate: 'desc' },
      take: 1,
    });

    return {
      id: player.id,
      name: player.fullName,
      position: player.position,
      age: player.age,
      ovr: player.ovr,
      goals: player.goals,
      marketValue: player.marketValue,
      availability: this.mapStatus(player.status),
      contract: contracts[0]
        ? {
            salary: `${contracts[0].salaryMonthly.toLocaleString('fr-FR')} DT/mois`,
            expiration: contracts[0].endDate.toLocaleDateString('fr-FR'),
          }
        : { salary: `${player.salaryMonthly.toLocaleString('fr-FR')} DT/mois`, expiration: '—' },
      radar: (player.radar as Record<string, number>) ?? DEFAULT_RADAR,
      awardsCount: player.PlayerAward.length,
    };
  }

  async getExtended(user: JwtPayload) {
    const playerId = await this.resolvePlayerId(user);
    const player = await this.prisma.clubPlayer.findUnique({
      where: { id: playerId },
      include: { clubPlayerProfile: true, PlayerAward: true },
    });
    if (!player) throw new NotFoundException('Joueur introuvable.');

    const profile = player.clubPlayerProfile ?? (await this.ensureProfile(player));

    return {
      player: {
        id: player.id,
        name: player.fullName,
        position: player.position,
        age: player.age,
        ovr: player.ovr,
        goals: player.goals,
        marketValue: player.marketValue,
        radar: (player.radar as Record<string, number>) ?? DEFAULT_RADAR,
      },
      career: profile.career ?? [],
      evolution: profile.evolution ?? [],
      heatmapZones: profile.heatmapZones ?? [],
      training: profile.training ?? { sessions: [], loadPct: 0 },
      matchAnalysis: profile.matchAnalysis ?? { ratings: [], avgRating: 0 },
      aiInsight: profile.aiInsight ?? { summary: '', factors: [] },
      fifaAttributes: profile.fifaAttributes ?? {},
      chemistry: profile.chemistry ?? [],
      awards: player.PlayerAward.map((a) => ({
        id: a.id,
        title: a.title,
        season: a.season,
        type: a.awardType,
        icon: a.icon,
      })),
    };
  }

  async getCalendar(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const events = await this.prisma.clubCalendarEvent.findMany({
      where: { organizationId },
      orderBy: { eventDate: 'asc' },
    });
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.eventDate.toISOString().split('T')[0],
      time: e.eventTime,
      type: e.eventType,
      location: e.location,
    }));
  }

  async getInjuries(user: JwtPayload) {
    const playerId = await this.resolvePlayerId(user);
    const player = await this.prisma.clubPlayer.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Joueur introuvable.');

    const injuries = await this.prisma.clubInjury.findMany({
      where: {
        organizationId: player.organizationId,
        playerName: { equals: player.fullName, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
    });

    return injuries.map((i) => ({
      id: i.id,
      type: i.injuryType,
      bodyPart: i.bodyPart,
      returnDate: i.returnDate?.toLocaleDateString('fr-FR') ?? '—',
      riskScore: i.riskScore,
      date: i.createdAt.toLocaleDateString('fr-FR'),
      createdAt: i.createdAt.toISOString(),
    }));
  }

  async getSquad(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const players = await this.club.listPlayers(user);
    return players.filter((p) => p.id !== undefined);
  }

  private mapStatus(status: string) {
    const map: Record<string, string> = {
      DISPONIBLE: 'Disponible',
      BLESSE: 'Blessé',
      LIMITE: 'Limité',
      FIN_CONTRAT: 'Fin contrat',
    };
    return map[status] ?? status;
  }

  private async ensureProfile(player: {
    id: string;
    fullName: string;
    position: string;
    age: number;
    ovr: number;
    goals: number;
  }) {
    return this.prisma.clubPlayerProfile.create({
      data: {
        clubPlayerId: player.id,
        career: [
          { club: 'Club actuel', period: '2024–', role: player.position },
        ],
        evolution: [
          { month: 'Jan', score: Math.max(50, player.ovr - 8) },
          { month: 'Mar', score: Math.max(55, player.ovr - 5) },
          { month: 'Juin', score: player.ovr },
        ],
        heatmapZones: [],
        training: { sessions: [], loadPct: 72 },
        matchAnalysis: { ratings: [], avgRating: player.ovr / 10 },
        aiInsight: {
          summary: `${player.fullName} progresse régulièrement (OVR ${player.ovr}).`,
          factors: ['Régularité', 'Volume de jeu'],
        },
        fifaAttributes: {},
        chemistry: [],
      },
    });
  }
}
