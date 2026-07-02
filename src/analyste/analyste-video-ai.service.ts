import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessVideoDto } from './dto/process-video.dto';

export type VideoAnalysisAiResult = {
  summary: string;
  confidence: number;
  models: { openai: string | null; claude: string | null };
  aiEnabled: boolean;
  player: {
    name: string;
    detected: boolean;
    jersey?: string;
    position?: string;
  };
  speed: {
    maxKmh: number;
    avgKmh: number;
    sprints: number;
    timeline: { timeSec: number; speedKmh: number }[];
  };
  physical: {
    distanceKm: number;
    highIntensityRuns: number;
    accelerationPeaks: number;
    decelerationPeaks: number;
    workRate: string;
  };
  technical: { category: string; score: number; details: string[] }[];
  events: {
    timeSec: number;
    timeLabel: string;
    type: string;
    description: string;
    speedKmh?: number;
    confidence: number;
  }[];
  tactical: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  coachReport: string;
  durationSec: number;
  processedFrames: number;
  durationMs: number;
  /** Profil joueur RAW — PPI, attributs, prédictions */
  playerProfile: {
    ppi: number;
    ppiTrend: number[];
    form: 'rising' | 'stable' | 'falling';
    age: number;
    attributes: {
      speed: number;
      pressing: number;
      xg: number;
      dribbling: number;
      defending: number;
      stamina: number;
      vision: number;
      leadership: number;
    };
    fatigue: number;
    injuryRisk: number;
    potential: number;
    marketValue: string;
    rawAnalysis: string;
    predictions: {
      label: string;
      value: string;
      confidence: number;
      horizon: string;
    }[];
  };
  /** Prédictions synchronisées sur la timeline vidéo (overlay live) */
  videoPredictions: {
    timeSec: number;
    speedKmh: number;
    action: string;
    actionNext: string;
    fatiguePct: number;
    ppiLive: number;
    injuryRiskPct: number;
    intensity: 'low' | 'medium' | 'high' | 'max';
    confidence: number;
  }[];
};

@Injectable()
export class AnalysteVideoAiService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveKeys() {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const openaiKey =
      process.env.OPENAI_API_KEY?.trim() ||
      String(extended.aiApiKey ?? '').trim();
    const claudeKey =
      process.env.ANTHROPIC_API_KEY?.trim() ||
      process.env.CLAUDE_API_KEY?.trim() ||
      String(extended.claudeApiKey ?? '').trim();
    const openaiModel = String(extended.aiModel ?? 'gpt-4o-mini');
    const claudeModel = String(extended.claudeModel ?? 'claude-sonnet-4-20250514');
    return { openaiKey, claudeKey, openaiModel, claudeModel };
  }

  private buildDemoProfile(dto: ProcessVideoDto) {
    return {
      ppi: 82,
      ppiTrend: [78, 79, 80, 81, 82, 83],
      form: 'rising' as const,
      age: 26,
      attributes: {
        speed: 78,
        pressing: 85,
        xg: 65,
        dribbling: 72,
        defending: 80,
        stamina: 70,
        vision: 82,
        leadership: 85,
      },
      fatigue: 68,
      injuryRisk: 22,
      potential: 86,
      marketValue: '1.2M€',
      rawAnalysis: `Profil RAW démo — ${dto.playerName}. Milieu relayeur, bon volume de course et vision. La vidéo montre une capacité à enchaîner les efforts haute intensité avec une légère baisse technique après 70% de séance.`,
      predictions: [
        { label: 'PPI projection 90j', value: '84', confidence: 86, horizon: '90 jours' },
        { label: 'Forme match suivant', value: 'Titulaire', confidence: 88, horizon: '7 jours' },
        { label: 'Risque blessure', value: 'Modéré', confidence: 79, horizon: '30 jours' },
        { label: 'xG contribution', value: '+0.18', confidence: 74, horizon: 'Prochain match' },
      ],
    };
  }

  private buildDemoVideoPredictions(
    dto: ProcessVideoDto,
    timeline: { timeSec: number; speedKmh: number }[],
  ) {
    const actions = ['Marche', 'Course', 'Accélération', 'Sprint', 'Récupération', 'Appel', 'Pressing'];
    const nextActions = ['Accélération', 'Sprint', 'Course', 'Récupération', 'Pressing', 'Passe', 'Course'];
    return timeline.map((t, i) => {
      const speed = t.speedKmh;
      const intensity: 'low' | 'medium' | 'high' | 'max' =
        speed >= 28 ? 'max' : speed >= 22 ? 'high' : speed >= 16 ? 'medium' : 'low';
      return {
        timeSec: t.timeSec,
        speedKmh: speed,
        action: actions[i % actions.length],
        actionNext: nextActions[(i + 1) % nextActions.length],
        fatiguePct: Math.min(95, 12 + i * 8 + (speed > 24 ? 10 : 0)),
        ppiLive: Math.max(70, 84 - Math.floor(i * 0.8)),
        injuryRiskPct: Math.min(45, 15 + i * 2 + (speed > 26 ? 5 : 0)),
        intensity,
        confidence: 78 + (i % 4) * 3,
      };
    });
  }

  private mapProfile(vision: Record<string, unknown>, dto: ProcessVideoDto) {
    const raw = vision.playerProfile as VideoAnalysisAiResult['playerProfile'] | undefined;
    if (raw?.ppi) return raw;
    return this.buildDemoProfile(dto);
  }

  private mapVideoPredictions(
    vision: Record<string, unknown>,
    dto: ProcessVideoDto,
    timeline: { timeSec: number; speedKmh: number }[],
  ) {
    const raw = vision.videoPredictions as VideoAnalysisAiResult['videoPredictions'] | undefined;
    if (raw?.length) return raw;
    return this.buildDemoVideoPredictions(dto, timeline);
  }

  private buildDemoResult(dto: ProcessVideoDto, started: number): VideoAnalysisAiResult {
    const dur = dto.durationSec || 90;
    const timeline = dto.frames.map((f, i) => ({
      timeSec: f.timeSec,
      speedKmh: Math.round(18 + Math.sin(i * 0.9) * 8 + (i === 3 ? 12 : 0)),
    }));
    const max = Math.max(...timeline.map((t) => t.speedKmh), 28);
    const avg = Math.round(timeline.reduce((s, t) => s + t.speedKmh, 0) / Math.max(timeline.length, 1));

    return {
      summary: `Analyse démo — ${dto.playerName}. Uploadez une vidéo et configurez OPENAI_API_KEY + ANTHROPIC_API_KEY sur Render pour l'analyse IA réelle.`,
      confidence: 72,
      models: { openai: null, claude: null },
      aiEnabled: false,
      player: { name: dto.playerName, detected: true, jersey: '#8', position: 'MIL' },
      speed: { maxKmh: max, avgKmh: avg, sprints: 4, timeline },
      physical: {
        distanceKm: 1.8,
        highIntensityRuns: 6,
        accelerationPeaks: 9,
        decelerationPeaks: 7,
        workRate: 'Élevé',
      },
      technical: [
        { category: 'Course / Vitesse', score: 82, details: ['Accélération progressive', 'Bonne posture en sprint'] },
        { category: 'Contrôle de balle', score: 76, details: ['Première touche orientée', 'Conduite en zone dense'] },
        { category: 'Prise de décision', score: 79, details: ['Choix rapide en transition', 'Appel de balle timing'] },
      ],
      events: dto.frames.slice(0, 6).map((f, i) => ({
        timeSec: f.timeSec,
        timeLabel: this.fmtTime(f.timeSec),
        type: ['Sprint', 'Accélération', 'Course', 'Appel', 'Pressing', 'Récupération'][i] ?? 'Action',
        description: `Phase ${i + 1} — mouvement détecté sur ${dto.playerName}`,
        speedKmh: timeline[i]?.speedKmh,
        confidence: 70 + i * 3,
      })),
      tactical: {
        strengths: ['Capacité à attaquer l espace en profondeur', 'Endurance sur séquences répétées'],
        weaknesses: ['Positionnement défensif à améliorer après perte de balle'],
        recommendations: ['Travail VMA 15×30m', 'Vidéo individuelle sur replis défensifs'],
      },
      coachReport:
        `Rapport démo ODIN pour ${dto.playerName}. Configurez les clés IA serveur pour un rapport complet basé sur les ${dto.frames.length} frames extraites (${this.fmtTime(dur)}).`,
      durationSec: dur,
      processedFrames: dto.frames.length,
      durationMs: Date.now() - started,
      playerProfile: this.buildDemoProfile(dto),
      videoPredictions: this.buildDemoVideoPredictions(dto, timeline),
    };
  }

  private fmtTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private parseJson<T>(raw: string): T {
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned) as T;
  }

  private async callOpenAiVision(
    apiKey: string,
    model: string,
    dto: ProcessVideoDto,
  ): Promise<Record<string, unknown>> {
    const content: Array<{ type: string; text?: string; image_url?: { url: string; detail?: string } }> = [
      {
        type: 'text',
        text: `Tu es ODIN Video Analyst, expert analyse vidéo football professionnel.
Analyse ces ${dto.frames.length} frames extraites d'une vidéo (${this.fmtTime(dto.durationSec)} total).
Joueur ciblé: ${dto.playerName}. Focus: ${dto.focus ?? 'course, vitesse, technique, tactique'}.
Réponds UNIQUEMENT en JSON valide:
{
  "playerDetected": true,
  "jersey": "#8",
  "position": "MIL",
  "frameAnalysis": [{"timeSec":0,"action":"sprint","speedEstimateKmh":24,"notes":"..."}],
  "maxSpeedKmh": 32,
  "avgSpeedKmh": 18,
  "sprintCount": 5,
  "distanceKmEstimate": 2.1,
  "highIntensityRuns": 7,
  "technicalScores": [{"category":"Course","score":85,"details":["..."]}],
  "events": [{"timeSec":12,"type":"Sprint","description":"...","speedKmh":28,"confidence":88}],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "summary": "synthèse coach en français",
  "playerProfile": {
    "ppi": 82, "ppiTrend": [78,79,80,81,82,82], "form": "rising", "age": 26,
    "attributes": {"speed":78,"pressing":85,"xg":65,"dribbling":72,"defending":80,"stamina":70,"vision":82,"leadership":85},
    "fatigue": 68, "injuryRisk": 22, "potential": 86, "marketValue": "1.2M€",
    "rawAnalysis": "profil brut détaillé en français",
    "predictions": [{"label":"PPI 3 mois","value":"84","confidence":88,"horizon":"90j"},{"label":"Risque blessure","value":"Faible","confidence":82,"horizon":"30j"}]
  },
  "videoPredictions": [{"timeSec":0,"speedKmh":12,"action":"Marche","actionNext":"Accélération","fatiguePct":15,"ppiLive":82,"injuryRiskPct":18,"intensity":"low","confidence":90}]
}`,
      },
    ];

    for (const frame of dto.frames.slice(0, 10)) {
      const b64 = frame.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      content.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' },
      });
      content.push({ type: 'text', text: `Frame à ${this.fmtTime(frame.timeSec)} (${frame.timeSec}s)` });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model.includes('gpt-4o') ? model : 'gpt-4o-mini',
        temperature: 0.25,
        max_tokens: 2200,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`OpenAI Vision (${res.status}): ${err.slice(0, 240)}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new BadRequestException('OpenAI Vision: réponse vide.');
    return this.parseJson<Record<string, unknown>>(text);
  }

  private async callClaudeReport(
    apiKey: string,
    model: string,
    dto: ProcessVideoDto,
    visionData: Record<string, unknown>,
  ): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1800,
        temperature: 0.3,
        system:
          'Tu es un entraineur analyste professionnel ODIN ERP. Rédige un rapport vidéo détaillé en français pour un staff pro (préparateur physique + coach). Structure: contexte, profil course/vitesse, technique, tactique, recommandations séance. Ton précis, data-driven.',
        messages: [
          {
            role: 'user',
            content: `Joueur: ${dto.playerName}\nDurée vidéo: ${this.fmtTime(dto.durationSec)}\nFocus: ${dto.focus ?? 'complet'}\n\nDonnées vision IA:\n${JSON.stringify(visionData, null, 2)}\n\nRédige le rapport coach complet (400-600 mots).`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Claude (${res.status}): ${err.slice(0, 240)}`);
    }

    const json = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = json.content?.find((c) => c.type === 'text')?.text?.trim();
    if (!text) throw new BadRequestException('Claude: réponse vide.');
    return text;
  }

  private mapVisionToResult(
    dto: ProcessVideoDto,
    vision: Record<string, unknown>,
    coachReport: string,
    models: { openai: string | null; claude: string | null },
    started: number,
  ): VideoAnalysisAiResult {
    const frameAnalysis = (vision.frameAnalysis as { timeSec: number; speedEstimateKmh?: number }[]) ?? [];
    const timeline =
      frameAnalysis.length > 0
        ? frameAnalysis.map((f) => ({ timeSec: f.timeSec, speedKmh: f.speedEstimateKmh ?? 0 }))
        : dto.frames.map((f, i) => ({
            timeSec: f.timeSec,
            speedKmh: Number(vision.avgSpeedKmh ?? 18) + (i % 3) * 2,
          }));

    const eventsRaw = (vision.events as VideoAnalysisAiResult['events']) ?? [];
    const events =
      eventsRaw.length > 0
        ? eventsRaw.map((e) => ({ ...e, timeLabel: e.timeLabel ?? this.fmtTime(e.timeSec) }))
        : dto.frames.slice(0, 8).map((f, i) => ({
            timeSec: f.timeSec,
            timeLabel: this.fmtTime(f.timeSec),
            type: 'Analyse frame',
            description: `Segment ${i + 1} analysé par vision IA`,
            speedKmh: timeline[i]?.speedKmh,
            confidence: 85,
          }));

    const technicalRaw = (vision.technicalScores as VideoAnalysisAiResult['technical']) ?? [];

    return {
      summary: String(vision.summary ?? `Analyse IA complète — ${dto.playerName}`),
      confidence: 91,
      models,
      aiEnabled: true,
      player: {
        name: dto.playerName,
        detected: vision.playerDetected !== false,
        jersey: String(vision.jersey ?? ''),
        position: String(vision.position ?? ''),
      },
      speed: {
        maxKmh: Number(vision.maxSpeedKmh ?? 30),
        avgKmh: Number(vision.avgSpeedKmh ?? 18),
        sprints: Number(vision.sprintCount ?? 4),
        timeline,
      },
      physical: {
        distanceKm: Number(vision.distanceKmEstimate ?? 1.9),
        highIntensityRuns: Number(vision.highIntensityRuns ?? 6),
        accelerationPeaks: Number(vision.accelerationPeaks ?? 8),
        decelerationPeaks: Number(vision.decelerationPeaks ?? 6),
        workRate: String(vision.workRate ?? 'Élevé'),
      },
      technical:
        technicalRaw.length > 0
          ? technicalRaw
          : [
              { category: 'Course', score: 84, details: ['Analyse vision IA'] },
              { category: 'Technique', score: 78, details: ['Analyse vision IA'] },
            ],
      events,
      tactical: {
        strengths: (vision.strengths as string[]) ?? [],
        weaknesses: (vision.weaknesses as string[]) ?? [],
        recommendations: (vision.recommendations as string[]) ?? [],
      },
      coachReport,
      durationSec: dto.durationSec,
      processedFrames: dto.frames.length,
      durationMs: Date.now() - started,
      playerProfile: this.mapProfile(vision, dto),
      videoPredictions: this.mapVideoPredictions(vision, dto, timeline),
    };
  }

  async processVideo(_user: JwtPayload, dto: ProcessVideoDto): Promise<VideoAnalysisAiResult> {
    const started = Date.now();

    if (!dto.playerName?.trim()) throw new BadRequestException('Nom du joueur requis.');
    if (!dto.frames?.length) throw new BadRequestException('Au moins 1 frame requise.');
    if (dto.frames.length > 12) throw new BadRequestException('Maximum 12 frames par analyse.');

    const { openaiKey, claudeKey, openaiModel, claudeModel } = await this.resolveKeys();

    if (!openaiKey) {
      return this.buildDemoResult(dto, started);
    }

    try {
      const vision = await this.callOpenAiVision(openaiKey, openaiModel, dto);
      let coachReport = String(vision.summary ?? '');

      const models = { openai: openaiModel, claude: null as string | null };

      if (claudeKey) {
        try {
          coachReport = await this.callClaudeReport(claudeKey, claudeModel, dto, vision);
          models.claude = claudeModel;
        } catch {
          coachReport = `${coachReport}\n\n(Rapport Claude indisponible — OpenAI Vision uniquement)`;
        }
      }

      return this.mapVisionToResult(dto, vision, coachReport, models, started);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      return this.buildDemoResult(dto, started);
    }
  }
}
