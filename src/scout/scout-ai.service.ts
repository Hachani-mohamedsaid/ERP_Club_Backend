import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ClubAccessService } from '../club/club-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScoutService } from './scout.service';
import { TEAMS, COUNTRIES, CONTINENTS } from './data/scout-geo-catalog';
import {
  getFlashscoreSearchPool,
  getFlashscoreSearchPoolStats,
  normalizeSearchPosition,
  SCOUT_SEASON,
  type FlashscoreSearchPlayer,
} from './data/flashscore-search-pool';
import { resolvePlayerPhoto } from './data/player-photos';

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

    const poolStats = getFlashscoreSearchPoolStats();

    return {
      status,
      model: config.model,
      provider: config.provider,
      clubName: org?.clubName ?? 'Club',
      scoutName: user.fullName,
      season: SCOUT_SEASON,
      summary: {
        prospects: prospects.length,
        flashscorePlayers: poolStats.totalPlayers,
        continents: CONTINENTS.length,
        countries: COUNTRIES.length,
        clubs: poolStats.clubs,
        avgPotential:
          prospects.length > 0
            ? Math.round(prospects.reduce((s, p) => s + p.potential, 0) / prospects.length)
            : 0,
      },
      suggestedQueries: [
        'BU ≤21 ans potentiel >85 — Premier League 2026-27',
        'MC créateur U23 disponible <2M €',
        'DC rapide Ligue 1 saison 2026-27',
        'Ailier gauche Flashscore pot. ≥82',
        'Top 5 jeunes talents PL effectifs actuels',
        'Meilleur rapport potentiel / valeur en base scout',
      ],
      avgResponseTime: avgMs != null ? `${(avgMs / 1000).toFixed(1)}s` : '—',
    };
  }

  async searchScoutAi(user: JwtPayload, query: string) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const prospects = await this.scout.listProspects(user);
    const pool = getFlashscoreSearchPool();
    const started = Date.now();
    const today = new Date().toISOString().slice(0, 10);

    const poolSnapshot = pool
      .sort((a, b) => b.potential - a.potential)
      .slice(0, 220)
      .map((p) => ({
        poolId: p.poolId,
        name: p.name,
        club: p.club,
        league: p.league,
        position: normalizeSearchPosition(p.position),
        age: p.age,
        potential: p.potential,
        nationality: p.nationality,
        marketValue: p.marketValue,
        season: p.season,
      }));

    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es ODIN AI Scout, assistant recrutement football — saison ${SCOUT_SEASON}.
Date: ${today}
Tu DOIS recommander UNIQUEMENT des joueurs présents dans POOL_FLASHSCORE ou PROSPECTS_DB.
Réponds UNIQUEMENT en JSON valide:
{
  "text": "synthèse en français",
  "results": [
    {
      "poolId": "id pool si Flashscore sinon null",
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
- Max 5 résultats triés par compatibility (55-98)
- INTERDIT d'inventer un joueur absent des snapshots
- Prioriser effectifs Flashscore ${SCOUT_SEASON} à jour
- prospectId ou poolId obligatoire pour chaque résultat`,
      `PROSPECTS DB (${SCOUT_SEASON}):\n${JSON.stringify(prospects.slice(0, 80))}\n\nPOOL_FLASHSCORE (${poolSnapshot.length} joueurs, ${SCOUT_SEASON}):\n${JSON.stringify(poolSnapshot)}\n\nRequête scout: ${query}`,
      2200,
    );

    let parsed: {
      text?: string;
      results?: {
        poolId?: string | null;
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

    const results = (parsed.results ?? [])
      .map((r, i) => {
        const dbMatch = r.prospectId
          ? prospects.find((p) => p.id === r.prospectId)
          : prospects.find(
              (p) =>
                p.name.toLowerCase() === r.name.toLowerCase() ||
                (p.name.toLowerCase().includes(r.name.toLowerCase()) && p.club === r.club),
            );
        const poolMatch = r.poolId
          ? pool.find((p) => p.poolId === r.poolId)
          : pool.find(
              (p) =>
                p.name.toLowerCase() === r.name.toLowerCase() &&
                p.club.toLowerCase() === r.club.toLowerCase(),
            );

        if (!dbMatch && !poolMatch) return null;

        return {
          id: dbMatch?.id ?? poolMatch?.poolId ?? r.prospectId ?? `ai-${i}`,
          rank: i + 1,
          name: dbMatch?.name ?? poolMatch?.name ?? r.name,
          club: dbMatch?.club ?? poolMatch?.club ?? r.club,
          position: dbMatch?.position ?? normalizeSearchPosition(poolMatch?.position ?? r.position),
          age: dbMatch?.age ?? poolMatch?.age ?? r.age,
          potential: dbMatch?.potential ?? poolMatch?.potential ?? r.potential,
          flag: dbMatch?.flag ?? this.nationalityFlag(poolMatch?.nationality ?? ''),
          aiScore: dbMatch?.aiScore ?? poolMatch?.potential ?? r.potential,
          compatibility: r.compatibility,
          reasoning: r.reasoning ?? [],
          warnings: r.warnings ?? [],
          recommendation: r.recommendation ?? 'À observer',
          inDatabase: Boolean(dbMatch),
          source: dbMatch ? ('database' as const) : ('flashscore' as const),
          season: SCOUT_SEASON,
        };
      })
      .filter(Boolean) as {
      id: string;
      rank: number;
      name: string;
      club: string;
      position: string;
      age: number;
      potential: number;
      flag: string;
      aiScore: number;
      compatibility: number;
      reasoning: string[];
      warnings: string[];
      recommendation: string;
      inDatabase: boolean;
      source: 'database' | 'flashscore';
      season: string;
    }[];

    const fallbackResults =
      results.length > 0
        ? results
        : this.rankPoolForQuery(pool, query)
            .slice(0, 5)
            .map((p, i) => ({
              id: p.poolId,
              rank: i + 1,
              name: p.name,
              club: p.club,
              position: normalizeSearchPosition(p.position),
              age: p.age,
              potential: p.potential,
              flag: this.nationalityFlag(p.nationality),
              aiScore: p.potential,
              compatibility: Math.min(92, p.potential + 2),
              reasoning: [`Profil ${SCOUT_SEASON} Flashscore`, `${p.league} · Pot. ${p.potential}`],
              warnings: [] as string[],
              recommendation: 'Shortlist recommandée',
              inDatabase: false,
              source: 'flashscore' as const,
              season: SCOUT_SEASON,
            }));

    return {
      query,
      text:
        parsed.text ??
        `${fallbackResults.length} profils ${SCOUT_SEASON} (Flashscore + base scout).`,
      results: fallbackResults,
      season: SCOUT_SEASON,
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

  private applyPoolFilters(
    pool: FlashscoreSearchPlayer[],
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
    return pool.filter((p) => {
      const pos = normalizeSearchPosition(p.position);
      if (q && !p.name.toLowerCase().includes(q) && !p.club.toLowerCase().includes(q) && !p.league.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.position && filters.position !== 'Tous' && pos !== filters.position) return false;
      if (filters.country && filters.country !== 'Tous' && p.nationality !== filters.country) return false;
      if (!this.matchesAge(p.age, filters.ageRange)) return false;
      if (!this.matchesPot(p.potential, filters.potRange)) return false;
      if (!this.matchesBudget(p.valueMK, filters.budgetRange)) return false;
      return true;
    });
  }

  private rankPoolForQuery(pool: FlashscoreSearchPlayer[], query: string) {
    const q = query.toLowerCase();
    const posHints: Record<string, string[]> = {
      bu: ['BU'],
      attaquant: ['BU'],
      gardien: ['GK', 'GB'],
      gb: ['GK', 'GB'],
      dc: ['DC'],
      défenseur: ['DC', 'DG', 'DD'],
      mc: ['MC', 'MDC', 'MOC'],
      milieu: ['MC', 'MDC', 'MOC'],
      ailier: ['AG', 'AD', 'Ailier G', 'Ailier D'],
    };

    return [...pool].sort((a, b) => {
      let scoreA = a.potential;
      let scoreB = b.potential;
      if (q.includes('≤21') || q.includes('<21') || q.includes('u21') || q.includes('jeune')) {
        if (a.age <= 21) scoreA += 8;
        if (b.age <= 21) scoreB += 8;
      }
      if (q.includes('>85') || q.includes('≥85') || q.includes('potentiel')) {
        if (a.potential >= 85) scoreA += 5;
        if (b.potential >= 85) scoreB += 5;
      }
      for (const [hint, positions] of Object.entries(posHints)) {
        if (!q.includes(hint)) continue;
        if (positions.includes(a.position) || positions.includes(normalizeSearchPosition(a.position))) scoreA += 10;
        if (positions.includes(b.position) || positions.includes(normalizeSearchPosition(b.position))) scoreB += 10;
      }
      if (a.name.toLowerCase().includes(q) || a.club.toLowerCase().includes(q)) scoreA += 12;
      if (b.name.toLowerCase().includes(q) || b.club.toLowerCase().includes(q)) scoreB += 12;
      return scoreB - scoreA;
    });
  }

  private mapPoolPlayerToProspect(p: FlashscoreSearchPlayer, index: number) {
    const slug = p.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);
    const attrs = Math.max(55, p.potential - 6);
    return {
      id: p.poolId || `fs-search-${slug || index}`,
      name: p.name,
      age: p.age,
      nationality: p.nationality,
      flag: this.nationalityFlag(p.nationality),
      club: p.club,
      league: p.league,
      position: normalizeSearchPosition(p.position),
      potential: p.potential,
      currentRating: p.currentRating,
      marketValue: p.marketValue,
      valueMK: p.valueMK,
      priority: p.potential >= 85 ? 'A' : p.potential >= 78 ? 'B' : 'C',
      status: 'new',
      aiScore: p.potential,
      injuryRisk: 16,
      foot: 'Droit',
      height: 178,
      weight: 72,
      goals: 0,
      assists: 0,
      matches: 0,
      speed: attrs + 4,
      dribble: attrs,
      passing: attrs,
      defense: attrs - 4,
      physical: attrs,
      mental: attrs + 2,
      contractEnd: '2027-06',
      addedDate: new Date().toISOString().split('T')[0],
      notes: [],
      inWatchlist: false,
      inDatabase: false,
      source: 'flashscore' as const,
      season: SCOUT_SEASON,
      photoUrl: resolvePlayerPhoto(p.name) ?? undefined,
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
    const pool = getFlashscoreSearchPool();

    const dbFiltered = this.applyDbFilters(allDb, filters).map((p) => ({
      ...p,
      inDatabase: true,
      source: 'database' as const,
      season: SCOUT_SEASON,
    }));

    const poolFiltered = this.applyPoolFilters(pool, filters).map((p, i) =>
      this.mapPoolPlayerToProspect(p, i),
    );

    const dbKeys = new Set(dbFiltered.map((p) => `${p.name.toLowerCase()}|${p.club.toLowerCase()}`));
    const poolUnique = poolFiltered.filter(
      (p) => !dbKeys.has(`${p.name.toLowerCase()}|${p.club.toLowerCase()}`),
    );

    let merged = [...dbFiltered, ...poolUnique].sort((a, b) => b.potential - a.potential);

    const started = Date.now();
    let summary = `Saison ${SCOUT_SEASON} · ${merged.length} joueur(s) — ${dbFiltered.length} scout · ${poolUnique.length} Flashscore`;

    if (config.enabled && config.apiKey && merged.length > 0 && merged.length <= 40) {
      try {
        const raw = await this.callOpenAi(
          config.apiKey,
          config.model,
          `Tu es ODIN AI Scout. Résume en 1-2 phrases en français les résultats de recherche football saison ${SCOUT_SEASON}.
Réponds UNIQUEMENT en JSON: {"summary":"..."}`,
          `Critères: ${this.describeFilters(filters)}\nRésultats (${merged.length}): ${JSON.stringify(merged.slice(0, 25).map((p) => ({ name: p.name, club: p.club, position: p.position, age: p.age, potential: p.potential })))}`,
          400,
        );
        const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '')) as { summary?: string };
        if (parsed.summary?.trim()) summary = `${parsed.summary.trim()} · ${SCOUT_SEASON}`;
      } catch {
        /* keep default summary */
      }
    } else if (merged.length === 0) {
      merged = this.rankPoolForQuery(pool, filters.query ?? '')
        .slice(0, 18)
        .map((p, i) => this.mapPoolPlayerToProspect(p, i));
      summary = `Aucun match exact — ${merged.length} suggestions Flashscore ${SCOUT_SEASON}`;
    }

    return {
      summary,
      results: merged.slice(0, 60),
      aiEnabled: Boolean(config.apiKey && config.enabled),
      season: SCOUT_SEASON,
      sources: { database: dbFiltered.length, flashscore: poolUnique.length, ai: 0 },
      durationMs: Date.now() - started,
      model: config.model,
    };
  }

  /** Top 3 recommandations IA pour le dashboard scout (OpenAI si clé configurée). */
  async getDashboardRecommendations(user: JwtPayload) {
    const config = await this.resolveAiConfig();
    if (!config.enabled || !config.apiKey) return null;

    const [prospects, org] = await Promise.all([
      this.scout.listProspects(user),
      this.prisma.organization.findUnique({
        where: { id: this.access.requireOrganization(user) },
        select: { clubName: true, league: true, country: true },
      }),
    ]);

    if (prospects.length === 0) return null;

    const snapshot = prospects.slice(0, 50).map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      age: p.age,
      club: p.club,
      nationality: p.nationality,
      potential: p.potential,
      aiScore: p.aiScore,
      marketValue: p.marketValue,
      valueMK: p.valueMK,
      priority: p.priority,
      status: p.status,
      injuryRisk: p.injuryRisk,
      agent: p.agent,
      speed: p.speed,
      passing: p.passing,
      goals: p.goals,
      assists: p.assists,
    }));

    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es ODIN AI Scout, directeur recrutement football.
Analyse la base prospects du club et recommande les 3 meilleurs profils à prioriser MAINTENANT.
Réponds UNIQUEMENT en JSON valide:
{
  "recommendations": [
    {
      "prospectId": "uuid obligatoire si dans DB",
      "compatibility": 92,
      "reasons": ["raison tactique 1", "raison financière 2", "raison timing 3"],
      "warn": "alerte optionnelle ou null"
    }
  ]
}
Règles STRICTES:
- Exactement 3 recommandations triées par compatibility (85-98)
- prospectId DOIT être copié EXACTEMENT depuis snapshot[].id (UUID)
- INTERDIT d'inventer un joueur absent du snapshot
- reasons: 2-3 phrases courtes en français basées UNIQUEMENT sur les stats du snapshot
- warn: concurrence, blessure, contrat, agent — ou null`,
      `Club: ${org?.clubName ?? 'Club'} (${org?.league ?? '—'}, ${org?.country ?? '—'})
Snapshot prospects DB (${snapshot.length}):
${JSON.stringify(snapshot)}

Besoins typiques: renfort offensif jeune, valeur marché optimisée, profils prêts shortlist/signature.`,
      1200,
    );

    let parsed: {
      recommendations?: {
        prospectId: string;
        compatibility: number;
        reasons: string[];
        warn?: string | null;
      }[];
    } = {};

    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      return null;
    }

    const recs = (parsed.recommendations ?? [])
      .map((r) => {
        const p = prospects.find((x) => x.id === r.prospectId);
        if (!p) return null;
        const validIds = new Set(snapshot.map((s) => s.id));
        if (!validIds.has(p.id)) return null;
        return {
          id: p.id,
          name: p.name,
          pos: p.position,
          age: p.age,
          club: p.club,
          flag: p.flag,
          score: Math.min(98, Math.max(55, r.compatibility ?? p.aiScore)),
          budget: p.marketValue,
          reasons: (r.reasons ?? []).slice(0, 3).filter(Boolean),
          warn: r.warn ?? (p.injuryRisk > 25 ? `Risque blessure ${p.injuryRisk}%` : undefined),
        };
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      pos: string;
      age: number;
      club: string;
      flag: string;
      score: number;
      budget: string;
      reasons: string[];
      warn?: string;
    }[];

    if (recs.length > 0 && recs.length < 3) {
      const picked = new Set(recs.map((r) => r.id));
      const extras = [...prospects]
        .filter((p) => !picked.has(p.id))
        .sort((a, b) => b.aiScore - a.aiScore)
        .slice(0, 3 - recs.length)
        .map((p) => ({
          id: p.id,
          name: p.name,
          pos: p.position,
          age: p.age,
          club: p.club,
          flag: p.flag,
          score: p.aiScore,
          budget: p.marketValue,
          reasons: [
            `Potentiel ${p.potential}/100`,
            `Score IA ${p.aiScore}`,
            p.agent ? `Agent: ${p.agent}` : 'Profil complémentaire',
          ],
          warn: p.injuryRisk > 25 ? `Risque blessure ${p.injuryRisk}%` : undefined,
        }));
      recs.push(...extras);
    }

    return recs.length > 0 ? recs.slice(0, 3) : null;
  }
}
