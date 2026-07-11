import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ClubAccessService } from '../club/club-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScoutService } from './scout.service';

type AgentStatus = 'actif' | 'négociation' | 'inactif';

type AgentPlayer = {
  id: string;
  name: string;
  flag: string;
  position: string;
  club: string;
  potential: number;
  status: string;
};

type AgentRow = {
  id: string;
  name: string;
  agency: string;
  email: string;
  phone: string;
  country: string;
  flag: string;
  players: AgentPlayer[];
  rating: number;
  deals: number;
  lastContact: string;
  status: AgentStatus;
  aiNotes?: string;
};

type AgentsCache = Record<string, { agents: Omit<AgentRow, 'players'>[]; generatedAt: string }>;
type SavedAgentsStore = Record<string, AgentRow[]>;

const AGENCY_HINTS: Record<string, { agency: string; country: string; flag: string }> = {
  'Karim Boutaïeb': { agency: 'KB Sports Management', country: 'Tunisie', flag: '🇹🇳' },
  'Karim Boutaieb': { agency: 'KB Sports Management', country: 'Tunisie', flag: '🇹🇳' },
  'Samba Diallo Agency': { agency: 'SDA International', country: 'Sénégal', flag: '🇸🇳' },
  'Ahmed Merabet': { agency: 'Merabet & Associés', country: 'Algérie', flag: '🇩🇿' },
};

@Injectable()
export class ScoutAgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scout: ScoutService,
    private readonly access: ClubAccessService,
  ) {}

  private slug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private async resolveAiConfig() {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const enabled = extended.aiEnabled !== false;
    const model = String(extended.aiModel ?? 'gpt-4o-mini');
    const apiKey =
      process.env.OPENAI_API_KEY?.trim() ||
      String(extended.aiApiKey ?? '').trim();
    return { enabled, model, apiKey };
  }

  private async callOpenAi(apiKey: string, model: string, system: string, userPrompt: string) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 1800,
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

  private inferStatus(workflows: string[]): AgentStatus {
    if (workflows.some((s) => s === 'signature' || s === 'validation' || s === 'done')) {
      return 'négociation';
    }
    if (workflows.some((s) => s === 'analysis')) return 'négociation';
    if (workflows.every((s) => s === 'new')) return 'inactif';
    return 'actif';
  }

  private nationalityFromFlag(flag: string): string {
    const map: Record<string, string> = {
      '🇹🇳': 'Tunisie',
      '🇸🇳': 'Sénégal',
      '🇩🇿': 'Algérie',
      '🇨🇮': "Côte d'Ivoire",
      '🇲🇦': 'Maroc',
      '🇪🇬': 'Égypte',
      '🇳🇬': 'Nigeria',
      '🇫🇷': 'France',
    };
    return map[flag] ?? 'International';
  }

  private defaultAgentRow(name: string, players: AgentPlayer[]): Omit<AgentRow, 'players'> {
    const hint = AGENCY_HINTS[name];
    const flag = hint?.flag ?? players[0]?.flag ?? '🏳️';

    return {
      id: this.slug(name),
      name,
      agency: hint?.agency ?? `${name.split(' ')[0]} Sports Agency`,
      email: `${this.slug(name).replace(/-/g, '.')}@agency.com`,
      phone: '+216 00 000 000',
      country: hint?.country ?? this.nationalityFromFlag(flag),
      flag,
      rating:
        players.length > 0
          ? Math.min(5, Math.round((players.reduce((s, p) => s + p.potential, 0) / players.length / 20) * 10) / 10)
          : 3.5,
      deals: players.length,
      lastContact: new Date().toLocaleDateString('fr-FR'),
      status: this.inferStatus(players.map((p) => p.status)),
    };
  }

  private buildBaseAgents(
    prospects: Awaited<ReturnType<ScoutService['listProspects']>>,
  ): AgentRow[] {
    const byAgent = new Map<string, AgentPlayer[]>();

    for (const p of prospects) {
      if (!p.agent?.trim()) continue;
      const key = p.agent.trim();
      const list = byAgent.get(key) ?? [];
      list.push({
        id: p.id,
        name: p.name,
        flag: p.flag,
        position: p.position,
        club: p.club,
        potential: p.potential,
        status: p.status,
      });
      byAgent.set(key, list);
    }

    return [...byAgent.entries()].map(([name, players]) => {
      const base = this.defaultAgentRow(name, players);
      return { ...base, players };
    });
  }

  private async getCache(orgId: string): Promise<AgentsCache[string] | null> {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const cache = (extended.scoutAgentsCache ?? {}) as AgentsCache;
    return cache[orgId] ?? null;
  }

  private async saveCache(orgId: string, agents: Omit<AgentRow, 'players'>[]) {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const cache = (extended.scoutAgentsCache ?? {}) as AgentsCache;
    cache[orgId] = { agents, generatedAt: new Date().toISOString() };

    await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', extendedSettings: { ...extended, scoutAgentsCache: cache } as never },
      update: { extendedSettings: { ...extended, scoutAgentsCache: cache } as never },
    });
  }

  private parseAiAgents(raw: string): Omit<AgentRow, 'players'>[] {
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '')) as {
      agents?: (Omit<AgentRow, 'players'> & { representedPlayers?: string[] })[];
    };

    return (parsed.agents ?? []).map((a) => ({
      id: a.id || this.slug(a.name),
      name: a.name,
      agency: a.agency,
      email: a.email,
      phone: a.phone,
      country: a.country,
      flag: a.flag ?? '🏳️',
      rating: Math.min(5, Math.max(2, Number(a.rating) || 4)),
      deals: Number(a.deals) || 0,
      lastContact: a.lastContact ?? new Date().toLocaleDateString('fr-FR'),
      status: (['actif', 'négociation', 'inactif'].includes(a.status) ? a.status : 'actif') as AgentStatus,
      aiNotes: a.aiNotes,
    }));
  }

  private toAgentRow(meta: Omit<AgentRow, 'players'>, players: AgentPlayer[] = []): AgentRow {
    return { ...meta, players };
  }

  private async getSavedAgents(orgId: string): Promise<AgentRow[]> {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const store = (extended.scoutSavedAgents ?? {}) as SavedAgentsStore;
    return store[orgId] ?? [];
  }

  private async saveSavedAgents(orgId: string, agents: AgentRow[]) {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const extended = (row?.extendedSettings ?? {}) as Record<string, unknown>;
    const store = (extended.scoutSavedAgents ?? {}) as SavedAgentsStore;
    store[orgId] = agents;

    await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', extendedSettings: { ...extended, scoutSavedAgents: store } as never },
      update: { extendedSettings: { ...extended, scoutSavedAgents: store } as never },
    });
  }

  private mergeAgentLists(...lists: AgentRow[][]): AgentRow[] {
    const map = new Map<string, AgentRow>();
    for (const list of lists) {
      for (const agent of list) {
        const key = agent.id || this.slug(agent.name);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, agent);
          continue;
        }
        const playerIds = new Set(existing.players.map((p) => p.id));
        const mergedPlayers = [
          ...existing.players,
          ...agent.players.filter((p) => !playerIds.has(p.id)),
        ];
        map.set(key, { ...existing, ...agent, players: mergedPlayers });
      }
    }
    return [...map.values()];
  }

  private async findAgent(user: JwtPayload, agentId: string): Promise<AgentRow | null> {
    const data = await this.getAgents(user);
    return data.agents.find((a) => a.id === agentId) ?? null;
  }

  private async buildAiAgentContext(user: JwtPayload) {
    const organizationId = this.access.requireOrganization(user);
    const [prospects, org] = await Promise.all([
      this.scout.listProspects(user),
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { clubName: true, country: true, league: true },
      }),
    ]);

    return {
      clubName: org?.clubName ?? 'Club',
      country: org?.country ?? 'Tunisie',
      league: org?.league ?? 'Ligue 1',
      prospects: prospects.map((p) => ({
        name: p.name,
        position: p.position,
        club: p.club,
        nationality: p.nationality,
        potential: p.potential,
        agent: p.agent ?? null,
      })),
      withoutAgent: prospects.filter((p) => !p.agent).map((p) => p.name),
    };
  }

  private aiAgentSystemPrompt() {
    return `Tu es ODIN ERP Scout CRM, expert agents/intermédiaires football.
Propose des agents RÉELS connus (noms véritables quand possible) ou des profils crédibles pour la région demandée.
Réponds UNIQUEMENT en JSON:
{
  "text": "synthèse courte en français",
  "agents": [
    {
      "id": "slug-nom",
      "name": "Nom complet agent ou agence",
      "agency": "Nom agence",
      "email": "email@agence.com",
      "phone": "+216 ...",
      "country": "Pays",
      "flag": "emoji drapeau",
      "rating": 4.5,
      "deals": 15,
      "lastContact": "01/07/2026",
      "status": "actif",
      "aiNotes": "Spécialité: jeunes talents Maghreb",
      "representedPlayers": ["Joueur connu 1", "Joueur connu 2"]
    }
  ]
}
Règles:
- 4 à 6 agents par réponse
- rating 2.8-5.0, deals réalistes
- Prioriser Afrique du Nord, Afrique, Europe si club tunisien
- representedPlayers = joueurs réels ou plausibles représentés`;
  }

  private mergeWithCache(base: AgentRow[], cached: Omit<AgentRow, 'players'>[]): AgentRow[] {
    const cacheMap = new Map(cached.map((a) => [a.id, a]));
    return base.map((a) => {
      const c = cacheMap.get(a.id);
      if (!c) return a;
      return { ...a, ...c, players: a.players };
    });
  }

  private async enrichWithAi(base: AgentRow[], config: { apiKey: string; model: string }) {
    const raw = await this.callOpenAi(
      config.apiKey,
      config.model,
      `Tu es ODIN ERP Scout CRM. Enrichis les fiches agents/intermédiaires football.
Réponds UNIQUEMENT en JSON:
{
  "agents": [
    {
      "id": "slug-id",
      "name": "Nom agent",
      "agency": "Nom agence",
      "email": "email professionnel",
      "phone": "+216 ...",
      "country": "Pays",
      "flag": "emoji drapeau",
      "rating": 4.5,
      "deals": 12,
      "lastContact": "JJ/MM/AAAA",
      "status": "actif|négociation|inactif",
      "aiNotes": "note scout courte"
    }
  ]
}
Règles:
- Coherent avec les joueurs représentés
- status négociation si joueurs en workflow avancé
- rating 2.5-5.0
- deals >= nombre joueurs listés
- Dates récentes format fr-FR`,
      JSON.stringify(
        base.map((a) => ({
          id: a.id,
          name: a.name,
          players: a.players.map((p) => ({ name: p.name, club: p.club, status: p.status, potential: p.potential })),
        })),
      ),
    );

    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '')) as {
      agents?: Omit<AgentRow, 'players'>[];
    };

    return (parsed.agents ?? []).map((a) => ({
      ...a,
      status: (['actif', 'négociation', 'inactif'].includes(a.status) ? a.status : 'actif') as AgentStatus,
    }));
  }

  async getAgents(user: JwtPayload, refresh = false) {
    const organizationId = this.access.requireOrganization(user);
    const [config, prospects] = await Promise.all([
      this.resolveAiConfig(),
      this.scout.listProspects(user),
    ]);

    const base = this.buildBaseAgents(prospects);
    const saved = await this.getSavedAgents(organizationId);
    const withoutAgent = prospects
      .filter((p) => !p.agent?.trim())
      .map((p) => ({
        id: p.id,
        name: p.name,
        flag: p.flag,
        position: p.position,
        club: p.club,
        potential: p.potential,
      }));

    const cache = await this.getCache(organizationId);
    const cacheAge = cache ? Date.now() - new Date(cache.generatedAt).getTime() : Infinity;
    const cacheValid = !refresh && cache && cacheAge < 24 * 60 * 60 * 1000;

    let agents: AgentRow[] = this.mergeAgentLists(saved, base);
    let aiGenerated = false;

    if (agents.length === 0) {
      return {
        status: !config.enabled ? 'disabled' : config.apiKey ? 'available' : 'no_key',
        model: config.model ?? 'gpt-4o-mini',
        agents: [] as AgentRow[],
        withoutAgent,
        summary: {
          totalAgents: 0,
          active: 0,
          inNegotiation: 0,
          withoutAgent: withoutAgent.length,
          saved: saved.length,
        },
        aiGenerated: false,
      };
    }

    if (base.length > 0 && cacheValid && cache!.agents.length > 0) {
      agents = this.mergeAgentLists(saved, this.mergeWithCache(base, cache!.agents));
    } else if (base.length > 0 && config.enabled && config.apiKey) {
      try {
        const enriched = await this.enrichWithAi(base, config);
        await this.saveCache(organizationId, enriched);
        agents = this.mergeAgentLists(saved, this.mergeWithCache(base, enriched));
        aiGenerated = true;
      } catch {
        agents = this.mergeAgentLists(saved, base);
      }
    }

    return {
      status: !config.enabled ? 'disabled' : config.apiKey ? 'available' : 'no_key',
      model: config.model ?? 'gpt-4o-mini',
      agents,
      withoutAgent,
      summary: {
        totalAgents: agents.length,
        active: agents.filter((a) => a.status === 'actif').length,
        inNegotiation: agents.filter((a) => a.status === 'négociation').length,
        withoutAgent: withoutAgent.length,
        saved: saved.length,
      },
      aiGenerated,
      cached: cacheValid,
    };
  }

  async suggestAgents(user: JwtPayload) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const ctx = await this.buildAiAgentContext(user);
    const saved = await this.getSavedAgents(this.access.requireOrganization(user));
    const savedNames = saved.map((a) => a.name);

    const raw = await this.callOpenAi(
      config.apiKey,
      config.model ?? 'gpt-4o-mini',
      this.aiAgentSystemPrompt(),
      `Contexte club:\n${JSON.stringify(ctx)}\n\nPropose des agents/intermédiaires RÉELS pertinents pour ce club scout.
Exclure déjà en CRM: ${savedNames.join(', ') || 'aucun'}
Focus: négociation joueurs sans agent (${ctx.withoutAgent.join(', ') || '—'}) et marché ${ctx.country}.`,
    );

    let parsed: { text?: string; agents?: (Omit<AgentRow, 'players'> & { representedPlayers?: string[] })[] } = {};
    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = { text: raw, agents: [] };
    }

    const suggestions = (parsed.agents ?? []).map((a) =>
      this.toAgentRow(
        this.parseAiAgents(JSON.stringify({ agents: [a] }))[0],
        (a.representedPlayers ?? []).map((name, i) => ({
          id: `sug-${this.slug(a.name)}-${i}`,
          name,
          flag: a.flag ?? '🏳️',
          position: '—',
          club: '—',
          potential: 0,
          status: 'new',
        })),
      ),
    );

    return {
      text: parsed.text ?? '',
      suggestions,
      model: config.model,
    };
  }

  async searchAgents(user: JwtPayload, query: string) {
    const q = query.trim();
    if (q.length < 2) throw new BadRequestException('Requête trop courte (min 2 caractères).');

    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const ctx = await this.buildAiAgentContext(user);

    const raw = await this.callOpenAi(
      config.apiKey,
      config.model ?? 'gpt-4o-mini',
      this.aiAgentSystemPrompt(),
      `Recherche agent/intermédiaire football: "${q}"
Contexte club: ${JSON.stringify({ clubName: ctx.clubName, country: ctx.country, league: ctx.league })}
Trouve des agents RÉELS dont le nom, l'agence ou la spécialité correspond à la recherche.
Si recherche par nom partiel, retourne les meilleures correspondances.`,
    );

    let parsed: { text?: string; agents?: (Omit<AgentRow, 'players'> & { representedPlayers?: string[] })[] } = {};
    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = { text: raw, agents: [] };
    }

    const results = (parsed.agents ?? []).map((a) =>
      this.toAgentRow(
        this.parseAiAgents(JSON.stringify({ agents: [a] }))[0],
        (a.representedPlayers ?? []).map((name, i) => ({
          id: `srch-${this.slug(a.name)}-${i}`,
          name,
          flag: a.flag ?? '🏳️',
          position: '—',
          club: '—',
          potential: 0,
          status: 'new',
        })),
      ),
    );

    return {
      query: q,
      text: parsed.text ?? '',
      results,
      model: config.model,
    };
  }

  async addAgent(user: JwtPayload, body: Record<string, unknown>) {
    const organizationId = this.access.requireOrganization(user);
    const name = String(body.name ?? '').trim();
    if (!name) throw new BadRequestException('Nom agent requis.');

    const agent: AgentRow = {
      id: String(body.id ?? this.slug(name)),
      name,
      agency: String(body.agency ?? '—'),
      email: String(body.email ?? ''),
      phone: String(body.phone ?? ''),
      country: String(body.country ?? '—'),
      flag: String(body.flag ?? '🏳️'),
      rating: Number(body.rating ?? 4),
      deals: Number(body.deals ?? 0),
      lastContact: String(body.lastContact ?? new Date().toLocaleDateString('fr-FR')),
      status: (['actif', 'négociation', 'inactif'].includes(String(body.status))
        ? String(body.status)
        : 'actif') as AgentStatus,
      aiNotes: body.aiNotes ? String(body.aiNotes) : undefined,
      players: Array.isArray(body.players)
        ? (body.players as AgentPlayer[])
        : [],
    };

    const saved = await this.getSavedAgents(organizationId);
    if (saved.some((a) => a.id === agent.id || a.name.toLowerCase() === agent.name.toLowerCase())) {
      throw new BadRequestException('Agent déjà présent dans le CRM.');
    }

    saved.push(agent);
    await this.saveSavedAgents(organizationId, saved);

    return { ok: true, agent, total: saved.length };
  }

  async removeAgent(user: JwtPayload, agentId: string) {
    const organizationId = this.access.requireOrganization(user);
    const saved = await this.getSavedAgents(organizationId);
    const next = saved.filter((a) => a.id !== agentId);
    await this.saveSavedAgents(organizationId, next);
    return { ok: true, total: next.length };
  }

  async getAgentHistory(user: JwtPayload, agentId: string) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const agent = await this.findAgent(user, agentId);
    if (!agent) throw new BadRequestException('Agent introuvable.');

    const raw = await this.callOpenAi(
      config.apiKey,
      config.model ?? 'gpt-4o-mini',
      `Tu es ODIN Scout CRM. Génère un historique de négociations réaliste.
JSON uniquement:
{
  "title": "Historique — Nom agent",
  "entries": [
    { "date": "15/06/2026", "type": "Appel|Email|Réunion", "subject": "...", "outcome": "...", "player": "Nom joueur" }
  ],
  "summary": "synthèse"
}`,
      JSON.stringify(agent),
    );

    let parsed: {
      title?: string;
      entries?: { date: string; type: string; subject: string; outcome: string; player: string }[];
      summary?: string;
    } = {};

    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = { title: `Historique — ${agent.name}`, entries: [], summary: raw };
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      title: parsed.title ?? `Historique — ${agent.name}`,
      entries: parsed.entries ?? [],
      summary: parsed.summary ?? '',
    };
  }

  async getContactDraft(user: JwtPayload, agentId: string) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const [agent, org] = await Promise.all([
      this.findAgent(user, agentId),
      this.prisma.organization.findUnique({
        where: { id: this.access.requireOrganization(user) },
        select: { clubName: true },
      }),
    ]);

    if (!agent) throw new BadRequestException('Agent introuvable.');

    const raw = await this.callOpenAi(
      config.apiKey,
      config.model ?? 'gpt-4o-mini',
      `Rédige un email professionnel de scout club vers un agent/intermédiaire football.
JSON uniquement:
{
  "subject": "Objet email",
  "body": "Corps email en français, ton professionnel, 120-180 mots",
  "tips": ["conseil négociation 1", "conseil 2"]
}`,
      JSON.stringify({
        club: org?.clubName ?? 'Club',
        scout: user.fullName,
        agent,
        targetPlayers: agent.players.map((p) => p.name),
      }),
    );

    let parsed: { subject?: string; body?: string; tips?: string[] } = {};
    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = { subject: `Contact — ${agent.name}`, body: raw, tips: [] };
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      email: agent.email,
      subject: parsed.subject ?? `ODIN Scout — ${agent.players[0]?.name ?? 'Prospect'}`,
      body: parsed.body ?? '',
      tips: parsed.tips ?? [],
    };
  }
}
