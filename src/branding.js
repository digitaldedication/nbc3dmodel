/**
 * NBC 3D plattegrond — branding-module
 *
 * Past event-branding toe op een geladen Spline-scène (@splinetool/runtime):
 *
 *  1. Schermafbeeldingen vervangen. Alle afbeeldingen van de scène leven in
 *     `app._sharedAssetsManager.imageHolderCache`. Elke "holder" heeft een
 *     naam (bijv. "Event Hall Scherm - Deel 1_2-8.png"), de gedecodeerde
 *     afbeelding (`img`) en de daaruit gemaakte THREE-textures (cache).
 *     We vervangen de afbeelding in-place, waardoor élk scherm dat die
 *     asset gebruikt automatisch mee verandert.
 *
 *  2. Lichten omkleuren naar de 2 huisstijlkleuren.
 *
 * Rollen (schermgroepen) worden op asset-naam herkend; per rol kan een eigen
 * afbeelding worden geüpload, anders valt hij terug op een gegenereerde
 * huisstijl-afbeelding (kleurverloop + logo).
 */

/** Asset-naam → rol. Volgorde bepaalt prioriteit. */
export const SCREEN_ROLES = [
  { role: 'pilaren',       pattern: /logo\s*pilaar/i,                          label: 'LED-pilaren (logo)' },
  { role: 'eventhall',     pattern: /event\s*hall\s*scherm/i,                  label: 'Groot scherm Event Hall' },
  { role: 'ledwall',       pattern: /led\s*wall\s*entree/i,                    label: 'LED-wall entree' },
  { role: 'narrowcasting', pattern: /narrowcasting|registratie\s*schermen/i,   label: 'Registratie-/narrowcasting-schermen' },
  { role: 'tv',            pattern: /\btv\b|trio\s*scherm|presentatie/i,       label: 'TV-/presentatieschermen' },
];

/** Assets die nooit vervangen mogen worden (omgevings-textures e.d.). */
const PROTECTED_ASSETS = /matcap|tree-branch|empty|video/i;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Kan afbeelding niet laden: ' + String(src).slice(0, 80)));
    img.src = src;
  });
}

/**
 * Genereer een huisstijl-afbeelding: verloop kleur 1 → kleur 2 met
 * gecentreerd logo, in de beeldverhouding van het oorspronkelijke scherm.
 */
export function makeBrandCanvas({ logoImg = null, primary, secondary, width = 1280, height = 720 }) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, primary);
  grad.addColorStop(1, secondary || primary);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  if (logoImg) {
    const pad = 0.16;
    const s = Math.min((width * (1 - pad * 2)) / logoImg.width, (height * (1 - pad * 2)) / logoImg.height);
    const w = logoImg.width * s, h = logoImg.height * s;
    ctx.drawImage(logoImg, (width - w) / 2, (height - h) / 2, w, h);
  }
  return c;
}

/** Alle image-holders van een geladen app, met naam en formaat. */
export function listImageAssets(app) {
  const cache = app?._sharedAssetsManager?.imageHolderCache?.cache;
  if (!cache) return [];
  const entries = cache instanceof Map ? [...cache.values()] : Object.values(cache);
  return entries
    .map((holder) => ({
      holder,
      name: holder?.name || holder?.data?.name || '',
      width: holder?.img?.width || null,
      height: holder?.img?.height || null,
      isVideo: !!holder?.isVideo,
    }))
    .filter((e) => e.name || e.width);
}

/**
 * Vind alle THREE-textures die bij een holder horen.
 * De live textures zitten in `holder._cache`, een genest object met
 * numerieke sleutels (bijv. _cache[1001][1008][1006] → Texture).
 * NB: `holder.cache` is een terugverwijzing naar de volledige assets-cache
 * en moet dus NIET doorlopen worden.
 */
function holderTextures(holder) {
  const found = [];
  const seen = new Set();
  const scan = (v, depth) => {
    if (!v || typeof v !== 'object' || depth > 6 || seen.has(v)) return;
    seen.add(v);
    if (v.isTexture) { found.push(v); return; }
    if (v instanceof Map) { for (const x of v.values()) scan(x, depth + 1); return; }
    if (Array.isArray(v)) { for (const x of v) scan(x, depth + 1); return; }
    for (const k of Object.keys(v)) {
      if (k === 'shared' || k === 'thisContext') continue;
      scan(v[k], depth + 1);
    }
  };
  scan(holder._cache, 0);
  return found;
}

/** Vervang de afbeelding van een holder (en al zijn textures) in-place. */
export function swapHolderImage(holder, imageLike) {
  holder.img = imageLike;
  for (const tex of holderTextures(holder)) {
    if (tex.source && 'data' in tex.source) tex.source.data = imageLike;
    tex.image = imageLike;
    tex.needsUpdate = true;
    if (tex.source) tex.source.needsUpdate = true;
  }
}

function roleFor(name) {
  for (const r of SCREEN_ROLES) if (r.pattern.test(name)) return r.role;
  return null;
}

/**
 * Pas branding toe op een geladen Spline Application.
 *
 * @param {Application} app
 * @param {object} config
 *   colors:   { primary: '#rrggbb', secondary: '#rrggbb' }
 *   logo:     URL of data-URI van het logo (png met transparantie)
 *   screens:  { [rol]: URL/data-URI } — eigen afbeelding per schermgroep
 *   allScreens: URL/data-URI — één afbeelding voor álle schermen (optioneel)
 *   lights:   false om lichten ongemoeid te laten (standaard: omkleuren)
 * @returns overzicht van wat er is aangepast
 */
export async function applyBranding(app, config = {}) {
  const { colors = {}, logo = null, screens = {}, allScreens = null } = config;
  const primary = colors.primary || null;
  const secondary = colors.secondary || null;

  const logoImg = logo ? await loadImage(logo) : null;
  const overrides = {};
  for (const [role, src] of Object.entries(screens)) {
    if (src) overrides[role] = await loadImage(src);
  }
  const allImg = allScreens ? await loadImage(allScreens) : null;

  const result = { swapped: [], lights: 0, skipped: [] };

  for (const asset of listImageAssets(app)) {
    if (!asset.name || PROTECTED_ASSETS.test(asset.name) || asset.isVideo) { result.skipped.push(asset.name); continue; }
    const role = roleFor(asset.name);
    if (!role) { result.skipped.push(asset.name); continue; }

    let replacement = overrides[role] || allImg || null;
    if (!replacement && primary) {
      replacement = makeBrandCanvas({
        logoImg, primary, secondary,
        width: asset.width || 1280,
        height: asset.height || 720,
      });
    }
    if (!replacement) continue;
    swapHolderImage(asset.holder, replacement);
    result.swapped.push({ asset: asset.name, role });
  }

  if (primary && config.lights !== false && app._scene) {
    let i = 0;
    app._scene.traverse((o) => {
      if (o.isLight && o.color && o.color.set) {
        o.color.set(i % 2 === 0 ? primary : (secondary || primary));
        result.lights++; i++;
      }
    });
  }

  if (app.requestRender) app.requestRender();
  return result;
}
