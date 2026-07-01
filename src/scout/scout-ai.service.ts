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

  private matchesAge(age: number, range?: string) {
    if (!range || range === 'Tous') return true;
    if (range === '≤18') return age <= 18;
    if (range === '19-21') return age >= 19 && age <= 21;
    if (range === '22-25') return age >= 22 && age <= 25;
    if (range === '>25') return age > 25;
    return true;
  }

  private matchesPot(pot: number, range?: string) {
    if (!range || range === 'Tous') return true;
    if (range === '≥85') return pot >= 85;
    if (range === '78-84') return pot >= 78 && pot <= 84;
    if (range === '<78') return pot < 78;
    return true;
  }

  private matchesBudget(mk: number, range?: string) {
    if (!range || range === 'Tous') return true;
    if (range === '<500K €') return mk < 500;
    if (range === '500K-1M €') return mk >= 500 && mk <= 1000;
    if (range === '1M-2M €') return mk > 1000 && mk <= 2000;
    if (range === '>2M €') return mk > 2000;
    return true;
  }

  private applyDbFilters(
    prospects: Awaited<ReturnType<ScoutService['listProspects']>>,
    filters: {
      query?: string;
      position?: string;
      country?: string;
      ageRange?: string;
      potRange?: string;
      budgetRange?: string;
    },
  ) {
    const q = filters.query?.trim().toLowerCase();
    return prospects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.club.toLowerCase().includes(q)) return false;
      if (filters.position && filters.position !== 'Tous' && p.position !== filters.position) return false;
      if (filters.country && filters.country !== 'Tous' && p.nationality !== filters.country) return false;
      if (!this.matchesAge(p.age, filters.ageRange)) return false;
      if (!this.matchesPot(p.potential, filters.potRange)) return false;
      if (!this.matchesBudget(p.valueMK, filters.budgetRange)) return false;
      return true;
    });
  }

  private describeFilters(filters: {
    query?: string;
    position?: string;
    country?: string;
    ageRange?: string;
    potRange?: string;
    budgetRange?: string;
  }) {
    const parts: string[] = [];
    if (filters.query?.trim()) parts.push(`Texte: ${filters.query.trim()}`);
    if (filters.position && filters.position !== 'Tous') parts.push(`Poste: ${filters.position}`);
    if (filters.country && filters.country !== 'Tous') parts.push(`Nationalité/Pays: ${filters.country}`);
    if (filters.ageRange && filters.ageRange !== 'Tous') parts.push(`Âge: ${filters.ageRange}`);
    if (filters.potRange && filters.potRange !== 'Tous') parts.push(`Potentiel: ${filters.potRange}`);
    if (filters.budgetRange && filters.budgetRange !== 'Tous') parts.push(`Budget: ${filters.budgetRange}`);
    return parts.length > 0 ? parts.join(' · ') : 'Tous critères — top talents actuels Afrique + Europe accessible';
  }

  private nationalityFlag(nationality: string) {
    const map: Record<string, string> = {
      Tunisie: '🇹🇳',
      Algérie: '🇩🇿',
      Maroc: '🇲🇦',
      "Côte d'Ivoire": '🇨🇮',
      Sénégal: '🇸🇳',
      Nigeria: '🇳🇬',
      Égypte: '🇪🇬',
      France: '🇫🇷',
      Espagne: '🇪🇸',
      Portugal: '🇵🇹',
      Angleterre: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      Allemagne: '🇩🇪',
      Italie: '🇮🇹',
      Brésil: '🇧🇷',
      Argentine: '🇦🇷',
      'Arabie Saoudite': '🇸🇦',
      Japon: '🇯🇵',
      'Corée du Sud': '🇰🇷',
    };
    return map[nationality] ?? '🏳️';
  }

  private mapAiPlayerToProspect(
    p: {
      name: string;
      club: string;
      nationality: string;
      position: string;
      age: number;
      potential: number;
      currentRating?: number;
      marketValue?: string;
      valueMK?: number;
      aiScore?: number;
      injuryRisk?: number;
      foot?: string;
      height?: number;
      weight?: number;
      goals?: number;
      assists?: number;
      matches?: number;
      speed?: number;
      dribble?: number;
      passing?: number;
      defense?: number;
      physical?: number;
      mental?: number;
      contractEnd?: string;
      league?: string;
      priority?: string;
    },
    index: number,
  ) {
    const slug = p.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);
    return {
      id: `ai-search-${slug || index}`,
      name: p.name,
      age: p.age,
      nationality: p.nationality,
      flag: this.nationalityFlag(p.nationality),
      club: p.club,
      league: p.league ?? '—',
      position: p.position,
      potential: p.potential,
      currentRating: p.currentRating ?? Math.max(55, p.potential - 8),
      marketValue: p.marketValue ?? `${p.valueMK ?? 500}K €`,
      valueMK: p.valueMK ?? 500,
      priority: p.priority ?? 'B',
      status: 'new',
      aiScore: p.aiScore ?? p.potential,
      injuryRisk: p.injuryRisk ?? 18,
      foot: p.foot ?? 'Droit',
      height: p.height ?? 178,
      weight: p.weight ?? 72,
      goals: p.goals ?? 0,
      assists: p.assists ?? 0,
      matches: p.matches ?? 0,
      speed: p.speed ?? 70,
      dribble: p.dribble ?? 70,
      passing: p.passing ?? 70,
      defense: p.defense ?? 60,
      physical: p.physical ?? 70,
      mental: p.mental ?? 70,
      contractEnd: p.contractEnd ?? '2027-06',
      addedDate: new Date().toISOString().split('T')[0],
      notes: [],
      inWatchlist: false,
      inDatabase: false,
      source: 'ai' as const,
    };
  }

  async searchProspects(
    user: JwtPayload,
    filters: {
      query?: string;
      position?: string;
      country?: string;
      ageRange?: string;
      potRange?: string;
      budgetRange?: string;
    },
  ) {
    const config = await this.resolveAiConfig();
    const allDb = await this.scout.listProspects(user);
    const dbFiltered = this.applyDbFilters(allDb, filters).map((p) => ({
      ...p,
      inDatabase: true,
      source: 'database' as const,
    }));

    if (!config.enabled || !config.apiKey) {
      return {
        summary: 'Recherche locale (base club). Ajoutez OPENAI_API_KEY sur Render pour découvrir de vrais joueurs.',
        results: dbFiltered,
        aiEnabled: false,
        sources: { database: dbFiltered.length, ai: 0 },
        model: config.model,
      };
    }

    const started = Date.now();
    const filterDesc = this.describeFilters(filters);
    const sampleTeams = TEAMS.slice(0, 40).map((t) => t.name).join(', ');

    let aiPlayers: ReturnType<ScoutAiService['mapAiPlayerToProspect']>[] = [];

    try {
      const raw = await this.callOpenAi(
        config.apiKey,
        config.model,
        `Tu es ODIN AI Scout, expert recrutement football mondial.
Trouve des VRAIS joueurs professionnels actuels (saison 2024-25 ou la plus récente).
Réponds UNIQUEMENT en JSON valide:
{
  "summary": "synthèse courte en français",
  "players": [
    {
      "name": "Nom complet réel",
      "club": "Club actuel réel",
      "nationality": "Pays",
      "position": "BU|MC|DC|DG|DD|Ailier G|GK",
      "age": 20,
      "potential": 82,
      "currentRating": 76,
      "marketValue": "800K €",
      "valueMK": 800,
      "aiScore": 80,
      "injuryRisk": 15,
      "foot": "Droit",
      "height": 182,
      "weight": 75,
      "goals": 5,
      "assists": 3,
      "matches": 22,
      "speed": 78,
      "dribble": 75,
      "passing": 72,
      "defense": 65,
      "physical": 74,
      "mental": 76,
      "contractEnd": "2027-06",
      "league": "Championnat",
      "priority": "A|B|C"
    }
  ]
}
RÈGLES CRITIQUES:
- UNIQUEMENT des joueurs RÉELS qui existent (pas de fiction, pas "Ali Messi")
- 10 à 18 joueurs correspondant aux filtres
- Noms officiels, clubs actuels vérifiables
- Stats cohérentes avec le poste et l'âge
- Prioriser Afrique, Maghreb, Ligue tunisienne si filtre pays africain`,
        `CRITÈRES RECHERCHE:\n${filterDesc}\n\nPAYS DISPONIBLES: ${COUNTRIES.map((c) => c.name).join(', ')}\nCLUBS RÉFÉRENCE: ${sampleTeams}\n\nDÉJÀ EN BASE (éviter doublons sauf si pertinent):\n${JSON.stringify(dbFiltered.slice(0, 15).map((p) => ({ name: p.name, club: p.club })))}`,
        3800,
      );

      const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '')) as {
        summary?: string;
        players?: {
          name: string;
          club: string;
          nationality: string;
          position: string;
          age: number;
          potential: number;
          currentRating?: number;
          marketValue?: string;
          valueMK?: number;
          aiScore?: number;
          injuryRisk?: number;
          foot?: string;
          height?: number;
          weight?: number;
          goals?: number;
          assists?: number;
          matches?: number;
          speed?: number;
          dribble?: number;
          passing?: number;
          defense?: number;
          physical?: number;
          mental?: number;
          contractEnd?: string;
          league?: string;
          priority?: string;
        }[];
      };

      aiPlayers = (parsed.players ?? []).map((p, i) => this.mapAiPlayerToProspect(p, i));
    } catch {
      aiPlayers = [];
    }

    const dbNames = new Set(dbFiltered.map((p) => p.name.toLowerCase()));
    const aiUnique = aiPlayers.filter((p) => !dbNames.has(p.name.toLowerCase()));
    const merged = [...dbFiltered, ...aiUnique].sort((a, b) => b.potential - a.potential);

    return {
      summary:
        aiUnique.length > 0
          ? `${merged.length} joueurs — ${dbFiltered.length} en base, ${aiUnique.length} découverts via OpenAI`
          : `${dbFiltered.length} joueur(s) en base correspondant aux filtres`,
      results: merged,
      aiEnabled: true,
      sources: { database: dbFiltered.length, ai: aiUnique.length },
      durationMs: Date.now() - started,
      model: config.model,
    };
  }
}
