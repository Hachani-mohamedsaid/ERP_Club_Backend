/** Résolution YouTube côté serveur (évite CORS navigateur). */

export type YoutubeResolveResult = {
  videoId: string | null;
  title?: string;
  embedUrl?: string;
  searchUrl: string;
  source?: string;
};

const ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const cache = new Map<string, { at: number; result: YoutubeResolveResult }>();
const CACHE_TTL_MS = 1000 * 60 * 30;

function searchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIYAQ%253D%253D`;
}

function embedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fetchJson(url: string, timeoutMs = 7000): Promise<unknown | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function uniqueIds(ids: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (!ID_RE.test(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Extrait des videoId depuis la page résultats YouTube. */
async function scrapeYoutubeSearchIds(query: string): Promise<string[]> {
  const html = await fetchText(searchUrl(query));
  if (!html) return [];

  const ids: string[] = [];
  for (const m of html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)) {
    ids.push(m[1]!);
  }
  // Shorts parfois sous une autre clé
  for (const m of html.matchAll(/\/shorts\/([a-zA-Z0-9_-]{11})/g)) {
    ids.push(m[1]!);
  }
  return uniqueIds(ids).slice(0, 12);
}

async function resolveViaPiped(query: string): Promise<string[]> {
  const q = encodeURIComponent(query);
  const endpoints = [
    `https://pipedapi.kavin.rocks/search?q=${q}&filter=videos`,
    `https://pipedapi.adminforge.de/search?q=${q}&filter=videos`,
    `https://pipedapi.leptons.xyz/search?q=${q}&filter=videos`,
  ];
  const ids: string[] = [];
  for (const url of endpoints) {
    const data = (await fetchJson(url)) as { items?: { type?: string; url?: string; id?: string }[] } | null;
    for (const item of data?.items ?? []) {
      if (item.type && item.type !== "stream" && item.type !== "video") continue;
      const raw = item.url ?? item.id ?? "";
      const m = String(raw).match(/([a-zA-Z0-9_-]{11})/);
      if (m?.[1]) ids.push(m[1]);
    }
    if (ids.length > 0) break;
  }
  return uniqueIds(ids).slice(0, 12);
}

async function resolveViaInvidious(query: string): Promise<string[]> {
  const q = encodeURIComponent(query);
  const endpoints = [
    `https://inv.nadeko.net/api/v1/search?q=${q}&type=video`,
    `https://invidious.nerdvpn.de/api/v1/search?q=${q}&type=video`,
  ];
  const ids: string[] = [];
  for (const url of endpoints) {
    const data = (await fetchJson(url)) as { videoId?: string; type?: string }[] | null;
    for (const item of data ?? []) {
      if (item.type && item.type !== "video") continue;
      if (item.videoId) ids.push(item.videoId);
    }
    if (ids.length > 0) break;
  }
  return uniqueIds(ids).slice(0, 12);
}

/** Vérifie qu'un ID est intégrable (oEmbed). */
async function isEmbeddable(videoId: string): Promise<boolean> {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
  const data = (await fetchJson(url, 4000)) as { title?: string } | null;
  return Boolean(data?.title);
}

export async function resolveYoutubeVideo(query: string): Promise<YoutubeResolveResult> {
  const cleaned = query.trim().replace(/\s+/g, " ");
  const key = cleaned.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.result;

  const base: YoutubeResolveResult = {
    videoId: null,
    searchUrl: searchUrl(cleaned),
  };

  if (!cleaned) {
    cache.set(key, { at: Date.now(), result: base });
    return base;
  }

  // Priorité Shorts + highlights non-officiels (FIFA bloque souvent l'embed)
  const queries = [
    `${cleaned} #shorts`,
    cleaned,
    cleaned.replace(/\bFIFA\b/gi, "").replace(/\s+/g, " ").trim(),
  ].filter(Boolean);

  let candidates: string[] = [];
  let source = "";

  for (const q of queries) {
    const scraped = await scrapeYoutubeSearchIds(q);
    if (scraped.length) {
      candidates = scraped;
      source = "youtube-scrape";
      break;
    }
  }

  if (!candidates.length) {
    candidates = await resolveViaPiped(cleaned);
    if (candidates.length) source = "piped";
  }
  if (!candidates.length) {
    candidates = await resolveViaInvidious(cleaned);
    if (candidates.length) source = "invidious";
  }

  for (const id of candidates.slice(0, 8)) {
    if (await isEmbeddable(id)) {
      const result: YoutubeResolveResult = {
        videoId: id,
        embedUrl: embedUrl(id),
        searchUrl: searchUrl(cleaned),
        source,
      };
      cache.set(key, { at: Date.now(), result });
      return result;
    }
  }

  // Dernier recours: 1er candidat même si oEmbed échoue (parfois faux négatif)
  if (candidates[0]) {
    const result: YoutubeResolveResult = {
      videoId: candidates[0],
      embedUrl: embedUrl(candidates[0]),
      searchUrl: searchUrl(cleaned),
      source: source || "fallback",
    };
    cache.set(key, { at: Date.now(), result });
    return result;
  }

  cache.set(key, { at: Date.now(), result: base });
  return base;
}
