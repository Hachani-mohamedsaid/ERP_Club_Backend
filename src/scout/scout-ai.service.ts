import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ClubAccessService } from '../club/club-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScoutService } from './scout.service';
import { TEAMS, COUNTRIES, CONTINENTS } from './data/scout-geo-catalog';

@Injectable()
export class ScoutAiService {
  private aiResponseTimesMs: number[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly scout: ScoutService,
    private readonly access: ClubAccessService,
  ) {}

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
    maxTokens = 1600,
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

  async getScoutAi(user: JwtPayload) {
    const organizationId = this.access.requireOrganization(user);
    const [config, prospects, org] = await Promise.all([
      this.resolveAiConfig(),
      this.scout.listProspects(user),
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { clubName: true },
      }),
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
      clubName: org?.clubName ?? 'Club',
      scoutName: user.fullName,
      summary: {
        prospects: prospects.length,
        continents: CONTINENTS.length,
        countries: COUNTRIES.length,
        clubs: TEAMS.length,
        avgPotential:
          prospects.length > 0
            ? Math.round(prospects.reduce((s, p) => s + p.potential, 0) / prospects.length)
            : 0,
      },
      suggestedQueries: [
        'Cherche un BU ≤21 ans, potentiel >85, budget <1.5M',
        'Meilleur MC créateur en Afrique du Nord',
        'DC rapide avec bon jeu aérien ≤24 ans',
        'Ailier gauche technique contrat libre ou <1M',
        'Top 3 profils immédiatement disponibles',
        'Qui a le meilleur rapport potentiel / valeur ?',
      ],
      avgResponseTime: avgMs != null ? `${(avgMs / 1000).toFixed(1)}s` : '—',
    };
  }

  async searchScoutAi(user: JwtPayload, query: string) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const prospects = await this.scout.listProspects(user);
    const started = Date.now();

    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es ODIN AI Scout, assistant recrutement football.
Tu as accès à la base prospects du club ET au catalogue mondial (${TEAMS.length} clubs, ${COUNTRIES.length} pays).
Réponds UNIQUEMENT en JSON valide:
{
  "text": "synthèse en français",
  "results": [
    {
      "prospectId": "uuid si dans DB sinon null",
      "name": "Nom joueur",
      "club": "Club",
      "position": "BU",
      "age": 19,
      "potential": 88,
      "compatibility": 92,
      "reasoning": ["raison 1", "raison 2"],
      "warnings": ["alerte optionnelle"],
      "recommendation": "Action scout"
    }
  ]
}
Règles:
- Prioriser les prospects RÉELS du snapshot DB (prospectId obligatoire si match)
- Si aucun match exact, proposer les plus proches avec avertissement
- Max 5 résultats triés par compatibility
- compatibility 55-98`,
      `PROSPECTS DB:\n${JSON.stringify(prospects.slice(0, 80))}\n\nCATALOGUE:\n${JSON.stringify({ continents: CONTINENTS.length, countries: COUNTRIES.map((c) => c.name), sampleTeams: TEAMS.slice(0, 30).map((t) => t.name) })}\n\nRequête scout: ${query}`,
      1800,
    );

    let parsed: {
      text?: string;
      results?: {
        prospectId?: string | null;
        name: string;
        club: string;
        position: string;
        age: number;
        potential: number;
        compatibility: number;
        reasoning: string[];
        warnings: string[];
        recommendation: string;
      }[];
    } = {};

    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = { text: raw, results: [] };
    }

    const results = (parsed.results ?? []).map((r, i) => {
      const dbMatch = r.prospectId
        ? prospects.find((p) => p.id === r.prospectId)
        : prospects.find(
            (p) => p.name.toLowerCase() === r.name.toLowerCase() ||
              (p.name.toLowerCase().includes(r.name.toLowerCase()) && p.club === r.club),
          );
      return {
        id: dbMatch?.id ?? r.prospectId ?? `ai-${i}`,
        rank: i + 1,
        name: dbMatch?.name ?? r.name,
        club: dbMatch?.club ?? r.club,
        position: dbMatch?.position ?? r.position,
        age: dbMatch?.age ?? r.age,
        potential: dbMatch?.potential ?? r.potential,
        flag: dbMatch?.flag ?? '🏳️',
        aiScore: dbMatch?.aiScore ?? r.potential,
        compatibility: r.compatibility,
        reasoning: r.reasoning ?? [],
        warnings: r.warnings ?? [],
        recommendation: r.recommendation ?? 'À observer',
        inDatabase: Boolean(dbMatch),
      };
    });

    return {
      query,
      text: parsed.text ?? '',
      results,
      durationMs: Date.now() - started,
      model: config.model,
    };
  }
}
