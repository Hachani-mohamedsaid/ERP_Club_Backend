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
};

const runtimeCache = new Map<string, string | null>();

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
}
