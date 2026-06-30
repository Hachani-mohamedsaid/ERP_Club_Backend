import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ClubAccessService } from './club-access.service';
import { PreparateurService } from './preparateur.service';

type RiskLevel = 'HIGH RISK' | 'MEDIUM RISK' | 'LOW RISK';

type RiskFactor = { label: string; impact: number };

type PlayerRow = {
  id: string;
  name: string;
  position: string;
  status: string;
  riskScore: number;
  level: RiskLevel;
};

@Injectable()
export class MedicalService {
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

  private riskLevel(score: number): RiskLevel {
    if (score >= 75) return 'HIGH RISK';
    if (score >= 50) return 'MEDIUM RISK';
    return 'LOW RISK';
  }

  private calcDaysRemaining(returnDate: Date | null): number {
    if (!returnDate) return 0;
    return Math.max(0, Math.ceil((returnDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  private async buildMedicalContext(user: JwtPayload) {
    const organizationId = this.orgId(user);

    const [org, charge, players, injuries, injuryRisks, wellness, recoverySessions, events] =
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
        }),
        this.prisma.injuryRisk.findMany({
          where: { organizationId },
          include: { player: { select: { fullName: true, position: true } } },
          orderBy: { risk: 'desc' },
        }),
        this.prisma.wellnessEntry.findMany({ where: { organizationId } }),
        this.prisma.recoverySession.findMany({
          where: { organizationId },
          include: { player: { select: { fullName: true } } },
          orderBy: { sessionDate: 'desc' },
          take: 40,
        }),
        this.prisma.clubCalendarEvent.findMany({
          where: { organizationId },
          orderBy: { eventDate: 'asc' },
          take: 10,
        }),
      ]);

    const chargeMap = new Map(charge.players.map((p) => [p.id, p]));
    const wellnessMap = new Map(wellness.map((w) => [w.playerId, w]));

    const injuryByName = new Map<string, (typeof injuries)[0]>();
    for (const injury of injuries) {
      const key = injury.playerName.trim().toLowerCase();
      if (!injuryByName.has(key)) injuryByName.set(key, injury);
    }

    const risksByPlayer = new Map<string, typeof injuryRisks>();
    for (const risk of injuryRisks) {
      const list = risksByPlayer.get(risk.playerId) ?? [];
      list.push(risk);
      risksByPlayer.set(risk.playerId, list);
    }

    const recoveryByPlayer = new Map<string, typeof recoverySessions>();
    for (const session of recoverySessions) {
      const list = recoveryByPlayer.get(session.playerId) ?? [];
      list.push(session);
      recoveryByPlayer.set(session.playerId, list);
    }

    const squad = players.map((p) => {
      const load = chargeMap.get(p.id);
      const w = wellnessMap.get(p.id);
      const activeInjury = injuryByName.get(p.fullName.trim().toLowerCase()) ?? null;
      const playerRisks = risksByPlayer.get(p.id) ?? [];
      const maxZoneRisk = playerRisks.length
        ? Math.max(...playerRisks.map((r) => r.risk))
        : 0;

      let riskScore = 18;
      if (activeInjury) {
        riskScore = Math.min(100, Math.max(0, activeInjury.riskScore * 10));
      } else if (maxZoneRisk > 0) {
        riskScore = maxZoneRisk;
      } else if (load) {
        if (load.statut === 'Critique') riskScore = 72;
        else if (load.statut === 'Attention') riskScore = 55;
        else if ((load.fatigueScore ?? 0) >= 70) riskScore = 48;
        else riskScore = 22;
      }

      if (p.status === 'BLESSE' && riskScore < 50) riskScore = 65;

      const returnDays = activeInjury ? this.calcDaysRemaining(activeInjury.returnDate) : 0;

      const reasons: RiskFactor[] = [];
      if (load && (load.fatigueScore ?? 0) >= 60) {
        reasons.push({ label: 'Fatigue accumulée', impact: Math.min(95, load.fatigueScore ?? 0) });
      }
      if (load && (load.loadScore ?? 0) >= 70) {
        reasons.push({ label: 'Charge élevée', impact: Math.min(95, load.loadScore ?? 0) });
      }
      for (const r of playerRisks.slice(0, 2)) {
        reasons.push({ label: `Historique ${r.zone}`, impact: r.risk });
      }
      if (activeInjury) {
        reasons.unshift({
          label: activeInjury.injuryType,
          impact: Math.min(95, activeInjury.riskScore * 10),
        });
      }
      if (reasons.length === 0) {
        reasons.push({ label: 'Surveillance préventive', impact: riskScore });
      }

      return {
        id: p.id,
        name: p.fullName,
        position: p.position,
        age: p.age,
        status: this.statusLabel(p.status),
        riskScore,
        level: this.riskLevel(riskScore),
        mainInjury: activeInjury
          ? {
              type: activeInjury.injuryType,
              bodyPart: activeInjury.bodyPart ?? '—',
              grade: activeInjury.riskScore >= 7 ? 'Grade II' : activeInjury.riskScore >= 4 ? 'Grade I' : 'Grade I',
              returnDate: activeInjury.returnDate?.toISOString().slice(0, 10) ?? null,
              returnDays,
              riskIA: activeInjury.riskScore,
            }
          : null,
        injuryRisks: playerRisks.map((r) => ({
          zone: r.zone,
          risk: r.risk,
          recommendation: r.recommendation,
          medicalComment: r.medicalComment,
        })),
        load: load
          ? {
              loadScore: load.loadScore,
              fatigueScore: load.fatigueScore,
              recoveryScore: load.recoveryScore,
              statut: load.statut,
            }
          : null,
        wellness: w
          ? { sommeil: w.sommeil, fatigue: w.fatigue, stress: w.stress, douleur: w.douleur }
          : null,
        recoverySessions: (recoveryByPlayer.get(p.id) ?? []).slice(0, 3).map((s) => ({
          method: s.method,
          date: s.sessionDate.toISOString().slice(0, 10),
          status: s.status,
          duration: s.duration,
        })),
        reasons: reasons.slice(0, 4),
      };
    });

    const upcomingMatches = events
      .filter((e) => e.eventType === 'MATCH' && e.eventDate >= new Date())
      .slice(0, 3)
      .map((e) => ({
        title: e.title,
        date: e.eventDate.toISOString().slice(0, 10),
      }));

    return {
      clubName: org?.clubName ?? 'Club',
      league: org?.league ?? '—',
      season: String(new Date().getFullYear()),
      medicalStaffName: user.fullName,
      summary: {
        squadSize: squad.length,
        blesses: squad.filter((p) => p.status === 'Blessé').length,
        highRisk: squad.filter((p) => p.level === 'HIGH RISK').length,
        avgRisk:
          squad.length > 0
            ? Math.round(squad.reduce((s, p) => s + p.riskScore, 0) / squad.length)
            : 0,
      },
      squad,
      upcomingMatches,
    };
  }

  private findPlayer(ctx: Awaited<ReturnType<typeof this.buildMedicalContext>>, playerId: string) {
    const player = ctx.squad.find((p) => p.id === playerId);
    if (!player) throw new NotFoundException('Joueur introuvable.');
    return player;
  }

  private defaultRecommendation(player: Awaited<ReturnType<typeof this.buildMedicalContext>>['squad'][0]) {
    if (player.mainInjury) {
      if (player.riskScore >= 75) return 'Réduire charge 30%';
      const days = player.mainInjury?.returnDays ?? 0;
      if (days > 0 && days <= 7) return 'Reprise progressive';
      return 'Suivi médical renforcé';
    }
    if (player.load?.statut === 'Critique') return 'Repos actif 48h';
    if (player.load?.statut === 'Attention') return 'Réduire intensité séance';
    return 'Maintenir protocole préventif';
  }

  async getMedicalAi(user: JwtPayload) {
    const [config, ctx] = await Promise.all([
      this.resolveAiConfig(),
      this.buildMedicalContext(user),
    ]);

    const hasKey = config.apiKey.length > 0;
    const status = !config.enabled ? 'disabled' : hasKey ? 'available' : 'no_key';
    const avgMs =
      this.aiResponseTimesMs.length > 0
        ? Math.round(this.aiResponseTimesMs.reduce((a, b) => a + b, 0) / this.aiResponseTimesMs.length)
        : null;

    const players: PlayerRow[] = [...ctx.squad]
      .sort((a, b) => b.riskScore - a.riskScore)
      .map(({ id, name, position, status: st, riskScore, level }) => ({
        id,
        name,
        position,
        status: st,
        riskScore,
        level,
      }));

    return {
      status,
      model: config.model,
      provider: config.provider,
      hasApiKey: hasKey,
      clubName: ctx.clubName,
      medicalStaffName: ctx.medicalStaffName,
      season: ctx.season,
      summary: ctx.summary,
      players,
      suggestedQuestions: [
        'Risque de blessure cette semaine?',
        'Joueurs indisponibles pour samedi',
        'Comparer les deux joueurs les plus à risque',
        'Qui peut reprendre l\'entraînement?',
        'Protocole rééducation prioritaire',
      ],
      avgResponseTime: avgMs != null ? `${(avgMs / 1000).toFixed(1)}s` : '—',
    };
  }

  async analyzePlayer(user: JwtPayload, playerId: string) {
    const config = await this.resolveAiConfig();
    const ctx = await this.buildMedicalContext(user);
    const player = this.findPlayer(ctx, playerId);

    const base = {
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      risk: player.riskScore,
      level: player.level,
      mainInjury: player.mainInjury
        ? `${player.mainInjury.bodyPart !== '—' ? player.mainInjury.bodyPart : player.mainInjury.type}`
        : 'Aucune active',
      grade: player.mainInjury?.grade ?? '—',
      returnDays: player.mainInjury?.returnDays ?? 0,
      recommendation: this.defaultRecommendation(player),
      reasons: player.reasons,
      injuryStatus: player.mainInjury
        ? `Active — ${player.mainInjury.returnDays}j restants`
        : player.status,
    };

    if (!config.enabled || !config.apiKey) {
      return {
        ...base,
        summary: this.buildFallbackSummary(player),
        aiGenerated: false,
      };
    }

    const started = Date.now();
    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es ODIN Medical AI, assistant du staff médical de ${ctx.clubName}.
Analyse UN joueur à partir du snapshot JSON.
Réponds UNIQUEMENT en JSON valide:
{
  "recommendation": "action médicale concise",
  "summary": "paragraphe structuré en français avec puces implicites (risk, blessure, retour, statut)",
  "returnDays": 21
}
Utilise EXCLUSIVEMENT les données fournies. Ne dis jamais que tu n'as pas accès.`,
      JSON.stringify({ player, club: ctx.clubName, upcomingMatches: ctx.upcomingMatches }),
      900,
    );

    let parsed: { recommendation?: string; summary?: string; returnDays?: number } = {};
    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = { summary: raw };
    }

    return {
      ...base,
      recommendation: parsed.recommendation ?? base.recommendation,
      returnDays: typeof parsed.returnDays === 'number' ? parsed.returnDays : base.returnDays,
      summary: parsed.summary ?? this.buildFallbackSummary(player),
      aiGenerated: true,
      durationMs: Date.now() - started,
      model: config.model,
    };
  }

  private buildFallbackSummary(player: Awaited<ReturnType<typeof this.buildMedicalContext>>['squad'][0]) {
    const lines = [
      `Analyse complète pour ${player.name}:`,
      `• Risk: ${player.riskScore}%`,
      `• Blessure principale: ${player.mainInjury ? `${player.mainInjury.bodyPart !== '—' ? player.mainInjury.bodyPart : player.mainInjury.type} (${player.mainInjury.grade})` : 'Aucune active'}`,
      `• Temps retour estimé: ${player.mainInjury?.returnDays ? `${player.mainInjury.returnDays} jours` : 'Disponible'}`,
      `• Recommandation: ${this.defaultRecommendation(player)}`,
    ];
    if (player.mainInjury) {
      lines.push(`• Statut actuel: Active — ${player.mainInjury.returnDays}j restants`);
    }
    return lines.join('\n');
  }

  async chatMedicalAi(user: JwtPayload, dto: { question: string; context?: string }) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const ctx = await this.buildMedicalContext(user);
    const playerId = dto.context?.trim();
    const focusPlayer = playerId ? ctx.squad.find((p) => p.id === playerId) : null;

    const contextText = [
      '=== SNAPSHOT BASE DE DONNÉES MÉDICAL (ODIN ERP) ===',
      'Utilise EXCLUSIVEMENT ces données. Ne dis jamais que tu n\'as pas accès.',
      JSON.stringify(ctx),
      focusPlayer ? `\nJoueur sélectionné: ${JSON.stringify(focusPlayer)}` : '',
    ].join('\n');

    const started = Date.now();
    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es ODIN Medical AI pour ${ctx.clubName}, assistant du staff médical ${ctx.medicalStaffName}.
Tu analyses blessures, risques, disponibilité et rééducation.
Réponds UNIQUEMENT en JSON valide:
{
  "text": "réponse en français, concise et médicalement prudente (pas de diagnostic définitif)",
  "cards": [
    { "title": "Joueur ou KPI", "value": "82%", "color": "#EF4444", "detail": "poste · info" }
  ]
}
Règles:
- Utilise les VRAIS noms du snapshot
- colors: #EF4444 danger, #F59E0B attention, #22C55E ok, #FF7A00 accent
- Max 6 cards
- Pour indisponibilité match: croiser blessures actives + returnDays`,
      `SNAPSHOT:\n${contextText}\n\nQuestion: ${dto.question}`,
      1400,
    );

    let parsed: {
      text?: string;
      cards?: { title: string; value: string; color: string; detail: string }[];
    } = {};
    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = { text: raw, cards: [] };
    }

    return {
      question: dto.question,
      text: parsed.text ?? raw,
      cards: parsed.cards ?? [],
      durationMs: Date.now() - started,
      model: config.model,
      clubName: ctx.clubName,
      playerName: focusPlayer?.name ?? null,
    };
  }

  async generateReport(user: JwtPayload, playerId: string) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const ctx = await this.buildMedicalContext(user);
    const player = this.findPlayer(ctx, playerId);

    const started = Date.now();
    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es ODIN Medical AI. Génère un rapport médical structuré pour le staff du club.
Réponds UNIQUEMENT en JSON:
{
  "title": "Rapport médical — Nom joueur",
  "sections": [
    { "heading": "Synthèse", "body": "..." },
    { "heading": "Blessure & statut", "body": "..." },
    { "heading": "Facteurs de risque", "body": "..." },
    { "heading": "Recommandations", "body": "..." },
    { "heading": "Plan de retour", "body": "..." }
  ],
  "markdown": "version markdown complète du rapport"
}
Données réelles uniquement. Ton professionnel, prudent.`,
      JSON.stringify({ player, club: ctx.clubName, date: new Date().toISOString().slice(0, 10) }),
      1800,
    );

    let parsed: {
      title?: string;
      sections?: { heading: string; body: string }[];
      markdown?: string;
    } = {};
    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = {
        title: `Rapport médical — ${player.name}`,
        sections: [{ heading: 'Rapport', body: raw }],
        markdown: raw,
      };
    }

    return {
      playerId: player.id,
      playerName: player.name,
      title: parsed.title ?? `Rapport médical — ${player.name}`,
      sections: parsed.sections ?? [],
      markdown: parsed.markdown ?? raw,
      durationMs: Date.now() - started,
      model: config.model,
      generatedAt: new Date().toISOString(),
    };
  }
}
