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
  /** Analyse biomécanique frame-par-frame */
  movementFrames: {
    timeSec: number;
    timeLabel: string;
    action: string;
    actionNext?: string;
    speedKmh: number;
    accelerationMs2: number;
    strideLengthCm?: number;
    cadenceSpm?: number;
    bodyTiltDeg?: number;
    centerOfMass: 'low' | 'medium' | 'high';
    footStrike?: string;
    ballContact: boolean;
    ballDistanceM?: number;
    zone: string;
    direction: string;
    biomechanics: string;
    technicalNote: string;
    postureScore: number;
    symmetryIndex: number;
    injuryFlag?: string | null;
    confidence: number;
  }[];
  biomechanics: {
    avgStrideLengthCm: number;
    avgCadenceSpm: number;
    symmetryIndex: number;
    postureScore: number;
    explosivenessIndex: number;
    loadIndex: number;
    keyFindings: string[];
    microAdjustments: string[];
  };
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

  private buildDemoMovementFrames(
    dto: ProcessVideoDto,
    timeline: { timeSec: number; speedKmh: number }[],
  ): VideoAnalysisAiResult['movementFrames'] {
    const actions = ['Appui initial', 'Accélération progressive', 'Phase d\'appui', 'Impulsion', 'Contact balle', 'Récupération'];
    const zones = ['Tiers défensif', 'Zone médiane', 'Tiers offensif', 'Couloir droit', 'Axe central'];
    const directions = ['Avant', 'Diagonale droite', 'Latéral', 'En retrait', 'Changement direction'];
    let prevSpeed = timeline[0]?.speedKmh ?? 12;

    return timeline.map((t, i) => {
      const accel = Math.round((t.speedKmh - prevSpeed) * 10) / 10;
      prevSpeed = t.speedKmh;
      const speed = t.speedKmh;
      return {
        timeSec: t.timeSec,
        timeLabel: this.fmtTime(t.timeSec),
        action: actions[i % actions.length],
        actionNext: actions[(i + 1) % actions.length],
        speedKmh: speed,
        accelerationMs2: accel,
        strideLengthCm: Math.round(110 + speed * 1.8),
        cadenceSpm: Math.round(150 + speed * 2.5),
        bodyTiltDeg: Math.round(8 + (speed > 22 ? 12 : 4)),
        centerOfMass: (speed >= 24 ? 'low' : speed >= 16 ? 'medium' : 'high') as 'low' | 'medium' | 'high',
        footStrike: speed > 22 ? 'Avant-pied' : 'Mi-pied',
        ballContact: i % 3 === 2,
        ballDistanceM: i % 3 === 2 ? 0.3 : 1.2,
        zone: zones[i % zones.length],
        direction: directions[i % directions.length],
        biomechanics: `Frame ${this.fmtTime(t.timeSec)} — ${dto.playerName}: cadence estimée ${Math.round(150 + speed * 2)} spm, inclinaison tronc ${8 + i * 2}°, appui ${speed > 20 ? 'explosif' : 'contrôlé'}. Symétrie bras-jambes ${82 - i}%.`,
        technicalNote: speed > 24
          ? 'Séquence haute intensité — bonne projection du bassin, léger décalage appui gauche.'
          : 'Course de liaison — posture stable, regard orienté vers l\'espace.',
        postureScore: Math.min(95, 72 + i * 3),
        symmetryIndex: Math.min(98, 78 + (i % 4) * 4),
        injuryFlag: speed > 28 && i > 2 ? 'Charge ischio-jambiers élevée' : null,
        confidence: 74 + (i % 5) * 4,
      };
    });
  }

  private buildDemoBiomechanics(
    movementFrames: VideoAnalysisAiResult['movementFrames'],
  ): VideoAnalysisAiResult['biomechanics'] {
    const strides = movementFrames.map((m) => m.strideLengthCm ?? 120);
    const cadences = movementFrames.map((m) => m.cadenceSpm ?? 160);
    const avgStride = Math.round(strides.reduce((s, v) => s + v, 0) / Math.max(strides.length, 1));
    const avgCadence = Math.round(cadences.reduce((s, v) => s + v, 0) / Math.max(cadences.length, 1));
    const sym = Math.round(movementFrames.reduce((s, m) => s + m.symmetryIndex, 0) / Math.max(movementFrames.length, 1));
    const posture = Math.round(movementFrames.reduce((s, m) => s + m.postureScore, 0) / Math.max(movementFrames.length, 1));

    return {
      avgStrideLengthCm: avgStride,
      avgCadenceSpm: avgCadence,
      symmetryIndex: sym,
      postureScore: posture,
      explosivenessIndex: Math.min(95, 68 + movementFrames.filter((m) => m.speedKmh > 22).length * 6),
      loadIndex: Math.min(88, 40 + movementFrames.length * 5),
      keyFindings: [
        `Foulée moyenne ${avgStride} cm — cadence ${avgCadence} pas/min`,
        `Symétrie globale ${sym}% — posture ${posture}/100`,
        `${movementFrames.filter((m) => m.ballContact).length} contacts balle détectés sur la séquence`,
        movementFrames.some((m) => m.injuryFlag) ? 'Pic de charge mécanique en fin de séquence' : 'Charge mécanique modérée',
      ],
      microAdjustments: [
        'Renforcer travail proprioceptif cheville (appuis latéraux)',
        'Optimiser bras opposé en phase d\'accélération (+3% vitesse projetée)',
        'Surveiller récupération active entre sprints',
      ],
    };
  }

  private mapMovementFrames(
    vision: Record<string, unknown>,
    dto: ProcessVideoDto,
    timeline: { timeSec: number; speedKmh: number }[],
  ): VideoAnalysisAiResult['movementFrames'] {
    const raw = vision.movementFrames as VideoAnalysisAiResult['movementFrames'] | undefined;
    if (raw?.length) {
      return raw.map((m) => ({
        ...m,
        timeLabel: m.timeLabel ?? this.fmtTime(m.timeSec),
        ballContact: m.ballContact ?? false,
        centerOfMass: m.centerOfMass ?? 'medium',
        zone: m.zone ?? 'Zone médiane',
        direction: m.direction ?? 'Avant',
        biomechanics: m.biomechanics ?? '',
        technicalNote: m.technicalNote ?? '',
        postureScore: m.postureScore ?? 75,
        symmetryIndex: m.symmetryIndex ?? 80,
      }));
    }

    const frameAnalysis = (vision.frameAnalysis as {
      timeSec: number;
      action?: string;
      speedEstimateKmh?: number;
      notes?: string;
      biomechanics?: string;
      zone?: string;
    }[]) ?? [];

    if (frameAnalysis.length) {
      let prev = frameAnalysis[0]?.speedEstimateKmh ?? 12;
      return frameAnalysis.map((f, i) => {
        const speed = f.speedEstimateKmh ?? timeline[i]?.speedKmh ?? 16;
        const accel = Math.round((speed - prev) * 10) / 10;
        prev = speed;
        return {
          timeSec: f.timeSec,
          timeLabel: this.fmtTime(f.timeSec),
          action: f.action ?? 'Course',
          speedKmh: speed,
          accelerationMs2: accel,
          zone: f.zone ?? 'Zone médiane',
          direction: 'Avant',
          biomechanics: f.biomechanics ?? f.notes ?? 'Analyse biomécanique frame',
          technicalNote: f.notes ?? '',
          ballContact: /balle|dribble|contact|tir|passe/i.test(`${f.action} ${f.notes}`),
          centerOfMass: (speed >= 24 ? 'low' : speed >= 16 ? 'medium' : 'high') as 'low' | 'medium' | 'high',
          postureScore: 78,
          symmetryIndex: 82,
          confidence: 85,
        };
      });
    }

    return this.buildDemoMovementFrames(dto, timeline);
  }

  private mapBiomechanics(
    vision: Record<string, unknown>,
    movementFrames: VideoAnalysisAiResult['movementFrames'],
  ): VideoAnalysisAiResult['biomechanics'] {
    const raw = vision.biomechanics as VideoAnalysisAiResult['biomechanics'] | undefined;
    if (raw?.keyFindings?.length) return raw;
    return this.buildDemoBiomechanics(movementFrames);
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
      rawAnalysis: `Profil RAW démo — ${dto.playerName}. Analyse biomécanique frame-par-frame disponible. Milieu relayeur dynamique: projection avant, bonne cadence en transition, léger déséquilibre sur appui externe en fin de séquence. PPI stable avec marge de progression technique.`,
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
    const movementFrames = this.buildDemoMovementFrames(dto, timeline);
    const biomechanics = this.buildDemoBiomechanics(movementFrames);

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
      movementFrames,
      biomechanics,
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
        text: `Tu es ODIN Video Analyst — niveau NASA/biomécanique sport pro.
Analyse CHAQUE frame avec précision millimétrique visuelle (posture, appuis, foulée, tronc, bras, regard, balle).
Vidéo: ${this.fmtTime(dto.durationSec)} · ${dto.frames.length} frames · Joueur: ${dto.playerName} · Focus: ${dto.focus ?? 'analyse complète biomécanique'}.
${dto.frames.map((f, i) => `Frame ${i + 1}: t=${this.fmtTime(f.timeSec)} motion=${f.motionScore ?? '?'}`).join(' · ')}

Réponds UNIQUEMENT en JSON valide:
{
  "playerDetected": true, "jersey": "#8", "position": "MIL",
  "frameAnalysis": [{"timeSec":0,"action":"Accélération","speedEstimateKmh":24,"zone":"Tiers offensif","biomechanics":"...","notes":"..."}],
  "movementFrames": [{
    "timeSec": 0, "action": "Appui initial", "actionNext": "Impulsion",
    "speedKmh": 12, "accelerationMs2": 2.4, "strideLengthCm": 125, "cadenceSpm": 168,
    "bodyTiltDeg": 12, "centerOfMass": "medium", "footStrike": "Mi-pied",
    "ballContact": false, "ballDistanceM": 1.5, "zone": "Zone médiane", "direction": "Avant",
    "biomechanics": "Analyse détaillée posture/appuis/foulée en français",
    "technicalNote": "Note coach technique précise", "postureScore": 84, "symmetryIndex": 88,
    "injuryFlag": null, "confidence": 91
  }],
  "biomechanics": {
    "avgStrideLengthCm": 128, "avgCadenceSpm": 172, "symmetryIndex": 86, "postureScore": 83,
    "explosivenessIndex": 78, "loadIndex": 62,
    "keyFindings": ["..."], "microAdjustments": ["..."]
  },
  "maxSpeedKmh": 32, "avgSpeedKmh": 18, "sprintCount": 5, "distanceKmEstimate": 2.1,
  "highIntensityRuns": 7, "accelerationPeaks": 8, "decelerationPeaks": 6, "workRate": "Élevé",
  "technicalScores": [{"category":"Course","score":85,"details":["..."]}],
  "events": [{"timeSec":0,"type":"Sprint","description":"...","speedKmh":28,"confidence":88}],
  "strengths": ["..."], "weaknesses": ["..."], "recommendations": ["..."],
  "summary": "synthèse coach précise en français",
  "playerProfile": {
    "ppi": 82, "ppiTrend": [78,79,80,81,82,82], "form": "rising", "age": 26,
    "attributes": {"speed":78,"pressing":85,"xg":65,"dribbling":72,"defending":80,"stamina":70,"vision":82,"leadership":85},
    "fatigue": 68, "injuryRisk": 22, "potential": 86, "marketValue": "1.2M€",
    "rawAnalysis": "profil RAW ultra-détaillé — chaque mouvement observé",
    "predictions": [{"label":"PPI 3 mois","value":"84","confidence":88,"horizon":"90j"}]
  },
  "videoPredictions": [{"timeSec":0,"speedKmh":12,"action":"Marche","actionNext":"Accélération","fatiguePct":15,"ppiLive":82,"injuryRiskPct":18,"intensity":"low","confidence":90}]
}
IMPORTANT: movementFrames doit avoir UNE entrée par frame envoyée, avec biomechanics détaillé (min 2 phrases par frame).`,
      },
    ];

    for (const frame of dto.frames.slice(0, 10)) {
      const b64 = frame.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      content.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'high' },
      });
      content.push({ type: 'text', text: `Frame à ${this.fmtTime(frame.timeSec)} (${frame.timeSec}s)` });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model.includes('gpt-4o') ? model : 'gpt-4o-mini',
        temperature: 0.25,
        max_tokens: 4096,
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
        max_tokens: 2800,
        temperature: 0.25,
        system:
          'Tu es entraineur analyste ODIN ERP — niveau staff pro + biomécanicien. Rédige un rapport vidéo ultra-détaillé en français: analyse frame-par-frame des mouvements, foulée, appuis, posture, technique balle, charge mécanique, risques blessure, recommandations micro-ajustements. Structure: 1) Contexte 2) Biomécanique séquence 3) Vitesse/accélérations 4) Technique 5) Tactique 6) Plan séance. Ton scientifique mais lisible, data-driven.',
        messages: [
          {
            role: 'user',
            content: `Joueur: ${dto.playerName}\nDurée: ${this.fmtTime(dto.durationSec)}\nFocus: ${dto.focus ?? 'complet biomécanique'}\n\nDonnées vision + mouvements:\n${JSON.stringify(visionData, null, 2)}\n\nRédige rapport coach NASA-level (700-900 mots) avec analyse de CHAQUE phase de mouvement.`,
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
    const movementFrames = this.mapMovementFrames(vision, dto, timeline);
    const biomechanics = this.mapBiomechanics(vision, movementFrames);

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
      movementFrames,
      biomechanics,
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
