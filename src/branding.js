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

/* ------------------------------------------------------------------ *
 *  Huisstijlkleuren: NBC-verloop (teal → oranje) omzetten             *
 * ------------------------------------------------------------------ */

/** De NBC-merkkleuren zoals ze in de scènes voorkomen (genormaliseerd rgb). */
const NBC_TEAL = [0.145, 0.616, 0.588];
const NBC_ORANGE = [0.867, 0.616, 0.251];
const COLOR_TOLERANCE = 0.13;

function hexToRgb01(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const near = (a, b) =>
  Math.abs(a[0] - b[0]) < COLOR_TOLERANCE &&
  Math.abs(a[1] - b[1]) < COLOR_TOLERANCE &&
  Math.abs(a[2] - b[2]) < COLOR_TOLERANCE;

function rgbToHsl([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb([h, s, l]) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}

/**
 * Hue-gebaseerde remap voor gradient-stops: alle teal-tinten → kleur 1,
 * alle oranje-tinten → kleur 2, met behoud van de licht/donker-variatie
 * zodat het verloop zijn diepte houdt. (Alleen op gradientlagen toegepast,
 * zodat meubels e.d. met bruine/warme kleuren ongemoeid blijven.)
 */
function remapGradientStop(rgb, primaryHsl, secondaryHsl) {
  const [h, s, l] = rgbToHsl(rgb);
  if (s < 0.2) return null;
  if (h >= 150 && h <= 200) return hslToRgb([primaryHsl[0], primaryHsl[1], l]);   // teal-familie
  if (h >= 15 && h <= 55) return hslToRgb([secondaryHsl[0], secondaryHsl[1], l]); // oranje-familie
  return null;
}

/**
 * Vervang de NBC-merkkleuren (teal/oranje) door de 2 huisstijlkleuren in
 * alle materiaal-lagen: gradient-stops (verloop blijft behouden) én egale
 * kleurlagen. Werkt o.a. op de 9 LED-pilaren en het projectiescherm in de
 * Grand Hall.
 */
export function recolorBrandColors(app, primaryHex, secondaryHex) {
  const p = hexToRgb01(primaryHex);
  const s = hexToRgb01(secondaryHex || primaryHex);
  const pHsl = rgbToHsl(p);
  const sHsl = rgbToHsl(s);
  let changed = 0;

  // egale kleuren: alleen exacte NBC-kleuren (voorzichtig)
  const mapRgb = (rgb) => (near(rgb, NBC_TEAL) ? p : near(rgb, NBC_ORANGE) ? s : null);
  // gradient-stops: hele teal/oranje-familie op hue (verloop blijft)
  const mapStop = (rgb) => remapGradientStop(rgb, pHsl, sHsl) || mapRgb(rgb);

  const handleUniformValue = (val) => {
    if (!val || typeof val !== 'object') return;
    if (val.isColor) {
      const to = mapRgb([val.r, val.g, val.b]);
      if (to) { val.setRGB(to[0], to[1], to[2]); changed++; }
      return;
    }
    if (Array.isArray(val)) {
      for (const v of val) {
        if (v && typeof v === 'object' && 'x' in v && 'w' in v) {
          const to = mapStop([v.x, v.y, v.z]);
          if (to) { v.x = to[0]; v.y = to[1]; v.z = to[2]; changed++; }
        }
      }
    }
  };

  const mats = new Set();
  app._scene.traverse((o) => {
    if (o.isMesh && o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
  });

  for (const m of mats) {
    if (Array.isArray(m.layers)) {
      for (const layer of m.layers) {
        if (layer && layer.uniforms) for (const u of Object.values(layer.uniforms)) handleUniformValue(u && u.value);
        // spiegel ook de data zodat evt. shader-rebuilds dezelfde kleuren houden
        const d = layer && layer.data;
        if (d && Array.isArray(d.colors)) {
          for (const c of d.colors) {
            if (Array.isArray(c) && c.length >= 3) {
              const to = mapStop(c);
              if (to) { c[0] = to[0]; c[1] = to[1]; c[2] = to[2]; }
            }
          }
        }
        if (d && d.color && typeof d.color === 'object' && 'r' in d.color) {
          const to = mapRgb([d.color.r, d.color.g, d.color.b]);
          if (to) { d.color.r = to[0]; d.color.g = to[1]; d.color.b = to[2]; }
        }
      }
    }
    // egale kleurlagen die als node-uniform op het materiaal zelf hangen
    if (m.uniforms) {
      for (const u of Object.values(m.uniforms)) {
        const v = u && u.node && u.node.value;
        if (v && v.isColor) {
          const to = mapRgb([v.r, v.g, v.b]);
          if (to) { v.setRGB(to[0], to[1], to[2]); changed++; }
        }
      }
    }
  }
  return changed;
}

/* ------------------------------------------------------------------ *
 *  Opstellingen per hal tonen/verbergen                               *
 * ------------------------------------------------------------------ */

/**
 * Namen van de kinderen onder de "Opstellingen"-container per hal.
 * (De container heet per scène anders: Congres / Feest / Sit down dinner.)
 */
export const HALL_GROUP_NAMES = {
  eventhall: ['Event Hall', 'Sit down dinner 2'],
  grandhall: ['Grand Hall', 'GH - Feest', 'Sit down dinner'],
  hosp1: ['Hosp1', 'Hosp1 - Feest'],
  hosp2: ['Hosp2', 'Hosp2 - Feest'],
};

/**
 * Zet de opstelling (stoelen/barren/tafels) van een hal aan of uit.
 * @param visibility bijv. { eventhall: false, grandhall: true }
 */
export function setHallVisibility(app, visibility = {}) {
  if (!app || !app._scene) return {};
  let container = null;
  app._scene.traverse((o) => {
    if (!container && (o.name || '').trim() === 'Opstellingen' && o.children && o.children.length) {
      container = o.children[0]; // Congres / Feest / Sit down dinner
    }
  });
  if (!container) return {};
  const applied = {};
  for (const [hall, show] of Object.entries(visibility)) {
    const names = HALL_GROUP_NAMES[hall];
    if (!names || typeof show !== 'boolean') continue;
    for (const child of container.children) {
      if (names.includes((child.name || '').trim())) {
        child.visible = show;
        applied[hall] = show;
      }
    }
  }
  if (app.requestRender) app.requestRender();
  return applied;
}

/* ------------------------------------------------------------------ *
 *  Logo-overlay op het projectiescherm in de Grand Hall               *
 * ------------------------------------------------------------------ */

/**
 * Kloont een pilaar-logovlak (dat na de texture-swap het klantlogo toont)
 * en plaatst het midden op het Grand Hall-projectiescherm, georiënteerd
 * zoals de "Welkom"-tekst die al op dat scherm staat.
 */
/**
 * Ondiepe kloon van een Spline-mesh: zelfde prototype, gedeelde geometry en
 * material, eigen transform. (De reguliere .clone() werkt niet omdat de
 * Spline-meshclass constructor-argumenten vereist.)
 */
function shallowCloneMesh(src) {
  const c = Object.create(Object.getPrototypeOf(src));
  Object.assign(c, src);
  c.uuid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
  c.parent = null;
  c.children = [];
  c.matrix = src.matrix.clone();
  c.matrixWorld = src.matrixWorld.clone();
  c.position = src.position.clone();
  c.quaternion = src.quaternion.clone();
  c.scale = src.scale.clone();
  if (src.modelViewMatrix) c.modelViewMatrix = src.modelViewMatrix.clone();
  if (src.normalMatrix) c.normalMatrix = src.normalMatrix.clone();
  return c;
}

export function overlayLogoOnGrandHall(app, { width = 60, dx = 0, dy = 22, dz = -4, rotZ = 90, rotY = 180, debugCenter = false } = {}) {
  const scene = app._scene;
  const candidates = [];
  let welkom = null;
  scene.traverse((o) => {
    if (!welkom && o.isMesh && (o.name || '').trim() === 'Welkom') welkom = o;
    if (o.isMesh && /^Rectangle/.test(o.name || '') &&
        o.parent && /NBC logo's pilaar/i.test(o.parent.name || '')) candidates.push(o);
  });
  if (!candidates.length || !welkom) return false;

  // Nieuwe meshes toevoegen rendert Spline niet (gecachte renderlijst), dus
  // we verplaatsen een BESTAAND logovlak: van de achterste pilaar het vlak
  // dat het dichtst bij de achterwand zit (praktisch onzichtbaar).
  welkom.updateWorldMatrix(true, false);
  let logoMesh = null, bestZ = -Infinity;
  for (const c of candidates) {
    c.updateWorldMatrix(true, false);
    const z = c.matrixWorld.elements[14];
    if (z > bestZ) { bestZ = z; logoMesh = c; }
  }

  // natuurlijke wereldbreedte van het logovlak bepalen
  if (!logoMesh.geometry.boundingBox) logoMesh.geometry.computeBoundingBox();
  const bb = logoMesh.geometry.boundingBox;
  const le = logoMesh.matrixWorld.elements;
  const logoSx = Math.hypot(le[0], le[1], le[2]) || 1;
  const nativeW = Math.max((bb.max.x - bb.min.x) * logoSx, 1e-6);
  const targetScale = (width / nativeW) * logoSx;

  const mat = Array.isArray(logoMesh.material) ? logoMesh.material[0] : logoMesh.material;
  if (mat) { mat.side = 2; mat.needsUpdate = true; }

  // gewenste wereldmatrix: oriëntatie van de Welkom-tekst (staat al op het
  // scherm), uniforme schaal, positie = Welkom + wereld-offset
  const desired = welkom.matrixWorld.clone();
  const e = desired.elements;
  for (let col = 0; col < 3; col++) {
    const i = col * 4;
    const len = Math.hypot(e[i], e[i + 1], e[i + 2]) || 1;
    e[i] = (e[i] / len) * targetScale;
    e[i + 1] = (e[i + 1] / len) * targetScale;
    e[i + 2] = (e[i + 2] / len) * targetScale;
  }
  if (debugCenter) { e[12] = 400; e[13] = 60; e[14] = 500; }
  else { e[12] += dx; e[13] += dy; e[14] += dz; }
  if (rotZ) desired.multiply(desired.clone().makeRotationZ((rotZ * Math.PI) / 180));
  if (rotY) desired.multiply(desired.clone().makeRotationY((rotY * Math.PI) / 180));

  // lokale matrix t.o.v. de bestaande parent: local = parentWorld⁻¹ × desired
  logoMesh.parent.updateWorldMatrix(true, false);
  const local = logoMesh.parent.matrixWorld.clone().invert().multiply(desired);
  local.decompose(logoMesh.position, logoMesh.quaternion, logoMesh.scale);
  logoMesh.updateMatrix();
  logoMesh.updateWorldMatrix(true, false);
  logoMesh.name = 'brand-logo-grandhall';
  if (app.requestRender) app.requestRender();
  return true;
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
/** Logo op transparante achtergrond, in de beeldverhouding van het origineel. */
export function makeLogoCanvas(logoImg, width = 852, height = 382) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  const pad = 0.06;
  const s = Math.min((width * (1 - pad * 2)) / logoImg.width, (height * (1 - pad * 2)) / logoImg.height);
  const w = logoImg.width * s, h = logoImg.height * s;
  ctx.drawImage(logoImg, (width - w) / 2, (height - h) / 2, w, h);
  return c;
}

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

  const result = { swapped: [], recolored: 0, lights: 0, skipped: [], grandHallLogo: false };

  for (const asset of listImageAssets(app)) {
    if (!asset.name || PROTECTED_ASSETS.test(asset.name) || asset.isVideo) { result.skipped.push(asset.name); continue; }
    const role = roleFor(asset.name);
    if (!role) { result.skipped.push(asset.name); continue; }

    let replacement = overrides[role] || null;
    if (!replacement && role === 'pilaren') {
      // pilaren: alleen het logo vervangen (transparant), het kleurverloop
      // eronder wordt via recolorBrandColors in de huisstijl gezet
      if (logoImg) replacement = makeLogoCanvas(logoImg, asset.width || 852, asset.height || 382);
    } else if (!replacement) {
      replacement = allImg || null;
      if (!replacement && primary) {
        replacement = makeBrandCanvas({
          logoImg, primary, secondary,
          width: asset.width || 1280,
          height: asset.height || 720,
        });
      }
    }
    if (!replacement) continue;
    swapHolderImage(asset.holder, replacement);
    result.swapped.push({ asset: asset.name, role });
  }

  // NBC-verloop (pilaren, Grand Hall-scherm, LED-accenten) → huisstijlkleuren
  if (primary) result.recolored = recolorBrandColors(app, primary, secondary);

  // klantlogo op het Grand Hall-projectiescherm (op de plek van het NBC-logo)
  if (logoImg && config.grandHallLogo !== false) {
    result.grandHallLogo = overlayLogoOnGrandHall(app, config.grandHallLogoTransform || {});
  }

  // opstellingen per hal aan/uit — bijv. halls: { eventhall: false } verbergt
  // de Event Hall-opstelling (stoelen/barren/tafels)
  if (config.halls && typeof config.halls === 'object') {
    result.halls = setHallVisibility(app, config.halls);
  }

  if (primary && config.lights === true && app._scene) {
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
