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

    let agents: AgentRow[] = base;
    let aiGenerated = false;

    if (base.length === 0) {
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
        },
        aiGenerated: false,
      };
    }

    if (cacheValid && cache.agents.length > 0) {
      agents = this.mergeWithCache(base, cache.agents);
    } else if (config.enabled && config.apiKey) {
      try {
        const enriched = await this.enrichWithAi(base, config);
        await this.saveCache(organizationId, enriched);
        agents = this.mergeWithCache(base, enriched);
        aiGenerated = true;
      } catch {
        agents = base;
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
      },
      aiGenerated,
      cached: cacheValid,
    };
  }

  async getAgentHistory(user: JwtPayload, agentId: string) {
    const config = await this.resolveAiConfig();
    if (!config.enabled) throw new BadRequestException('Assistant IA désactivé.');
    if (!config.apiKey) throw new BadRequestException('Clé OpenAI manquante côté serveur.');

    const data = await this.getAgents(user);
    const agent = data.agents.find((a) => a.id === agentId);
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

    const [data, org] = await Promise.all([
      this.getAgents(user),
      this.prisma.organization.findUnique({
        where: { id: this.access.requireOrganization(user) },
        select: { clubName: true },
      }),
    ]);

    const agent = data.agents.find((a) => a.id === agentId);
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
