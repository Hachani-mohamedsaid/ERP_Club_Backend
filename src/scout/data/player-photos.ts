/**
 * Photos joueurs réelles (TheSportsDB cutouts) — cache statique + recherche API.
 */

const PHOTO_CATALOG: Record<string, string> = {
  'liam delap': 'https://r2.thesportsdb.com/images/media/player/cutout/dxp7ym1757002801.png',
  'carlos forbs': 'https://r2.thesportsdb.com/images/media/player/cutout/ildd621767634247.png',
  'soungoutou magassa': 'https://r2.thesportsdb.com/images/media/player/cutout/czkp211772133444.png',
  'ayden heaven': 'https://r2.thesportsdb.com/images/media/player/cutout/10d8d61766826718.png',
  'patrick dorgu': 'https://r2.thesportsdb.com/images/media/player/cutout/3bm5kb1766826589.png',
  'degnand gnonto': 'https://r2.thesportsdb.com/images/media/player/cutout/dfttgz1757085689.png',
  'wilfried gnonto': 'https://r2.thesportsdb.com/images/media/player/cutout/dfttgz1757085689.png',
  'matheus franca': 'https://r2.thesportsdb.com/images/media/player/cutout/094jz81767969245.png',
  'matheus frança': 'https://r2.thesportsdb.com/images/media/player/cutout/094jz81767969245.png',
  'marc guehi': 'https://r2.thesportsdb.com/images/media/player/cutout/842bfy1771748128.png',
  'marc guéhi': 'https://r2.thesportsdb.com/images/media/player/cutout/842bfy1771748128.png',
  'ibrahim mbaye': 'https://r2.thesportsdb.com/images/media/player/cutout/aquiiw1766335383.png',
  'george evans': 'https://r2.thesportsdb.com/images/media/player/cutout/r26j8k1759591865.png',
  'josh cullen': 'https://r2.thesportsdb.com/images/media/player/cutout/54yfn71757174364.png',
  'leny yoro': 'https://r2.thesportsdb.com/images/media/player/cutout/pn8gp91766827044.png',
  'leny sombory': 'https://r2.thesportsdb.com/images/media/player/cutout/pn8gp91766827044.png',
  'andre onana': 'https://r2.thesportsdb.com/images/media/player/cutout/ha3jbx1766826944.png',
  'andré onana': 'https://r2.thesportsdb.com/images/media/player/cutout/ha3jbx1766826944.png',
  'bruno fernandes': 'https://r2.thesportsdb.com/images/media/player/cutout/jhasls1766826690.png',
  'marcus rashford': 'https://r2.thesportsdb.com/images/media/player/cutout/soi5zw1761512565.png',
  'kobbie mainoo': 'https://r2.thesportsdb.com/images/media/player/cutout/8qrveo1766826836.png',
  'matthijs de ligt': 'https://r2.thesportsdb.com/images/media/player/cutout/ag2gx31766826741.png',
  'alejandro garnacho': 'https://r2.thesportsdb.com/images/media/player/cutout/69y34j1757003249.png',
  'rasmus hojlund': 'https://r2.thesportsdb.com/images/media/player/cutout/jop7ho1762288170.png',
  'rasmus højlund': 'https://r2.thesportsdb.com/images/media/player/cutout/jop7ho1762288170.png',
  // Stars Flashscore / recherche mondiale
  'kylian mbappe': 'https://r2.thesportsdb.com/images/media/player/cutout/h9u9vz1733653583.png',
  'kylian mbappé': 'https://r2.thesportsdb.com/images/media/player/cutout/h9u9vz1733653583.png',
  'erling haaland': 'https://r2.thesportsdb.com/images/media/player/cutout/un3jr11769182465.png',
  'jude bellingham': 'https://r2.thesportsdb.com/images/media/player/cutout/trk5271750271712.png',
  'vinicius junior': 'https://r2.thesportsdb.com/images/media/player/cutout/ejuxsh1750271859.png',
  'vinicius jr': 'https://r2.thesportsdb.com/images/media/player/cutout/ejuxsh1750271859.png',
  'vinicius júnior': 'https://r2.thesportsdb.com/images/media/player/cutout/ejuxsh1750271859.png',
  'lamine yamal': 'https://r2.thesportsdb.com/images/media/player/cutout/m9n4ja1761512633.png',
  'robert lewandowski': 'https://r2.thesportsdb.com/images/media/player/cutout/xg2rl51762289740.png',
  'harry kane': 'https://r2.thesportsdb.com/images/media/player/cutout/j4ouvd1756408895.png',
  'mohamed salah': 'https://r2.thesportsdb.com/images/media/player/cutout/3blc581757088735.png',
  'kevin de bruyne': 'https://r2.thesportsdb.com/images/media/player/cutout/o4flia1764089447.png',
  'rodri': 'https://r2.thesportsdb.com/images/media/player/cutout/0ml2zi1761148957.png',
  'bukayo saka': 'https://r2.thesportsdb.com/images/media/player/cutout/xfwok41769331816.png',
  'phil foden': 'https://r2.thesportsdb.com/images/media/player/cutout/lbn4sx1769182620.png',
  'pedri': 'https://r2.thesportsdb.com/images/media/player/cutout/srwppu1424795582.png',
  'gavi': 'https://r2.thesportsdb.com/images/media/player/cutout/29005498.png',
  'antoine griezmann': 'https://r2.thesportsdb.com/images/media/player/cutout/tiqhh41762288400.png',
  'raphinha': 'https://r2.thesportsdb.com/images/media/player/cutout/w94spe1726510018.png',
  'lautaro martinez': 'https://r2.thesportsdb.com/images/media/player/cutout/vwxq811759408924.png',
  'victor osimhen': 'https://r2.thesportsdb.com/images/media/player/cutout/lw0qcf1769177786.png',
  'khvicha kvaratskhelia': 'https://r2.thesportsdb.com/images/media/player/cutout/n4iv5t1766335312.png',
  'florian wirtz': 'https://r2.thesportsdb.com/images/media/player/cutout/8t6bzo1757088899.png',
  'cristiano ronaldo': 'https://r2.thesportsdb.com/images/media/player/cutout/a19jje1761592498.png',
  'lionel messi': 'https://r2.thesportsdb.com/images/media/player/cutout/e0i2051750317027.png',
  'declan rice': 'https://r2.thesportsdb.com/images/media/player/cutout/do2pew1694204464.png',
  'william saliba': 'https://r2.thesportsdb.com/images/media/player/cutout/czasy21769331889.png',
  'virgil van dijk': 'https://r2.thesportsdb.com/images/media/player/cutout/9cxf2q1757087742.png',
  'alisson becker': 'https://r2.thesportsdb.com/images/media/player/cutout/8amq961757087569.png',
  'thibaut courtois': 'https://r2.thesportsdb.com/images/media/player/cutout/592mar1733653475.png',
  'federico valverde': 'https://r2.thesportsdb.com/images/media/player/cutout/5249151768499204.png',
  'federico chiesa': 'https://r2.thesportsdb.com/images/media/player/cutout/idecla1757087689.png',
  'kylian mbapp': 'https://r2.thesportsdb.com/images/media/player/cutout/h9u9vz1733653583.png',
};

const runtimeCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

export function normalizePlayerPhotoKey(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Résolution synchrone (catalogue local). */
export function resolvePlayerPhoto(name: string): string | null {
  const key = normalizePlayerPhotoKey(name);
  if (PHOTO_CATALOG[key]) return PHOTO_CATALOG[key];

  const parts = key.split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    for (const [catalogKey, url] of Object.entries(PHOTO_CATALOG)) {
      if (catalogKey.endsWith(` ${last}`) || catalogKey.split(' ').pop() === last) {
        const catalogParts = catalogKey.split(' ');
        if (catalogParts[0][0] === parts[0][0]) return url;
      }
    }
  }

  return null;
}

/** Recherche TheSportsDB avec cache mémoire (fallback). */
export async function resolvePlayerPhotoAsync(name: string): Promise<string | null> {
  const key = normalizePlayerPhotoKey(name);
  if (runtimeCache.has(key)) return runtimeCache.get(key) ?? null;

  const pending = inflight.get(key);
  if (pending) return pending;

  const task = (async () => {
    const sync = resolvePlayerPhoto(name);
    if (sync) {
      runtimeCache.set(key, sync);
      return sync;
    }

    try {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`,
        { signal: AbortSignal.timeout(4000) },
      );
      if (!res.ok) {
        runtimeCache.set(key, null);
        return null;
      }
      const json = (await res.json()) as {
        player?: { strCutout?: string; strThumb?: string; strRender?: string }[] | null;
      };
      const player = json.player?.[0];
      const url = player?.strCutout ?? player?.strRender ?? player?.strThumb ?? null;
      runtimeCache.set(key, url);
      if (url) PHOTO_CATALOG[key] = url;
      return url;
    } catch {
      runtimeCache.set(key, null);
      return null;
    }
  })();

  inflight.set(key, task);
  try {
    return await task;
  } finally {
    inflight.delete(key);
  }
}

/** Enrichit les résultats sans photo via TheSportsDB (par lots). */
export async function enrichWithPlayerPhotos<T extends { name: string; photoUrl?: string | null }>(
  items: T[],
  maxLookups = 48,
  concurrency = 8,
): Promise<void> {
  const names = [
    ...new Set(
      items.filter((i) => !i.photoUrl).map((i) => i.name),
    ),
  ].slice(0, maxLookups);

  for (let i = 0; i < names.length; i += concurrency) {
    const batch = names.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (name) => {
        const url = await resolvePlayerPhotoAsync(name);
        if (!url) return;
        const key = normalizePlayerPhotoKey(name);
        for (const item of items) {
          if (normalizePlayerPhotoKey(item.name) === key) {
            (item as T & { photoUrl?: string }).photoUrl = url;
          }
        }
      }),
    );
  }
}
