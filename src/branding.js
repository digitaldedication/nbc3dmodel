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

/* ------------------------------------------------------------------ *
 *  Canvas-helpers                                                     *
 * ------------------------------------------------------------------ */

/** Afbeelding cover-fit in een canvas van w×h (vult het hele vlak). */
export function coverCanvas(img, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return c;
}

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

/* ------------------------------------------------------------------ *
 *  Event Hall: decor over de volledige schermwand (4 delen)           *
 * ------------------------------------------------------------------ */

/**
 * Bouw één doorlopend decorbeeld voor de hele Event Hall-schermwand en
 * verdeel het over de 4 "Deel"-textures, zodat het beeld en de logo's
 * netjes doorlopen over de wand (in plaats van 4 losse herhalingen).
 *
 * decor: { type: 'verloop' | 'effen1' | 'effen2' | 'zwart' | 'custom',
 *          image?: geladen afbeelding (bij 'custom'),
 *          logoSpots?: aantal logo-plekken (1 of 2, standaard 2) }
 */
export function applyEventhallDecor(app, { decor = {}, colors = {}, logoImg = null }) {
  const parts = listImageAssets(app)
    .filter((a) => /event\s*hall\s*scherm/i.test(a.name))
    .map((a) => {
      const m = a.name.match(/deel\s*(\d)/i);
      return { ...a, index: m ? Number(m[1]) : 99 };
    })
    .sort((a, b) => a.index - b.index);
  if (!parts.length) return 0;

  const height = Math.max(...parts.map((p) => p.height || 850));
  const widths = parts.map((p) => Math.round((p.width || 1280) * (height / (p.height || 850))));
  const total = widths.reduce((a, b) => a + b, 0);

  // 1. achtergrond over de hele wand
  const wall = document.createElement('canvas');
  wall.width = total; wall.height = height;
  const ctx = wall.getContext('2d');
  const primary = colors.primary || '#E4032E';
  const secondary = colors.secondary || primary;
  const type = decor.type || 'verloop';
  if (type === 'custom' && decor.image) {
    // STRETCH-fit: de decors zijn orthografische renders van exact deze wand
    // (gekalibreerd: mapping ≈ identiteit). Cover-fit sneed ±2% van de randen
    // af waardoor de paneelranden verschoven en er zwarte balken op de
    // panelen vielen.
    ctx.drawImage(decor.image, 0, 0, decor.image.width, decor.image.height, 0, 0, total, height);
  } else if (type === 'zwart') {
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, total, height);
  } else if (type === 'effen1' || type === 'effen2') {
    ctx.fillStyle = type === 'effen1' ? primary : secondary;
    ctx.fillRect(0, 0, total, height);
  } else {
    const grad = ctx.createLinearGradient(0, 0, total, 0);
    grad.addColorStop(0, primary);
    grad.addColorStop(1, secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, total, height);
  }

  // 2. logo op 1 of 2 plekken op de wand — posities corresponderen met de
  //    panelen van het decor: het grote paneel links van het midden
  //    (wandfractie ±0,385) en de bol rechts (±0,865), verticaal iets onder
  //    het midden zodat het logo binnen het paneel valt.
  if (logoImg && decor.logo !== false) {
    const spots = decor.logoSpots === 1
      ? [{ fx: 0.385, fy: 0.58 }]
      : [{ fx: 0.385, fy: 0.58 }, { fx: 0.865, fy: 0.58 }];
    const maxH = height * 0.34;
    const maxW = total * 0.13;
    const s = Math.min(maxW / logoImg.width, maxH / logoImg.height);
    const lw = logoImg.width * s, lh = logoImg.height * s;
    for (const { fx, fy } of spots) {
      ctx.drawImage(logoImg, total * fx - lw / 2, height * fy - lh / 2, lw, lh);
    }
  }

  // 3. wand opdelen in de 4 delen (originele resolutie per deel)
  let x = 0;
  parts.forEach((p, i) => {
    const slice = document.createElement('canvas');
    slice.width = p.width || widths[i];
    slice.height = p.height || height;
    slice.getContext('2d').drawImage(wall, x, 0, widths[i], height, 0, 0, slice.width, slice.height);
    swapHolderImage(p.holder, slice);
    x += widths[i];
  });
  return parts.length;
}

/* ------------------------------------------------------------------ *
 *  Grand Hall: middenscherm (16:9) met logo / zwart / eigen beeld     *
 * ------------------------------------------------------------------ */

function worldBox(mesh) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  mesh.updateWorldMatrix(true, false);
  const bb = mesh.geometry.boundingBox;
  const e = mesh.matrixWorld.elements;
  const corners = [];
  for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
    corners.push({
      x: e[0] * x + e[4] * y + e[8] * z + e[12],
      y: e[1] * x + e[5] * y + e[9] * z + e[13],
      z: e[2] * x + e[6] * y + e[10] * z + e[14],
    });
  }
  const min = { x: Infinity, y: Infinity, z: Infinity }, max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const c of corners) for (const k of ['x', 'y', 'z']) { min[k] = Math.min(min[k], c[k]); max[k] = Math.max(max[k], c[k]); }
  return { min, max, size: { x: max.x - min.x, y: max.y - min.y, z: max.z - min.z },
           center: { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 } };
}

function pillarLogoRects(scene) {
  const rects = [];
  scene.traverse((o) => {
    if (o.isMesh && /^Rectangle/.test(o.name || '') &&
        o.parent && /NBC logo's pilaar/i.test(o.parent.name || '')) rects.push(o);
  });
  return rects;
}

function firstMaterial(mesh) { return Array.isArray(mesh.material) ? mesh.material[0] : mesh.material; }

/**
 * Richt het Grand Hall-middenscherm in:
 *  - verbergt de "Welkom"-tekst
 *  - claimt één pilaar-logovlak + bijbehorende texture-holder exclusief
 *    (de overige pilaarvlakken met datzelfde materiaal krijgen het materiaal
 *    van een ander vlak in hun eigen groep, zodat pilaren intact blijven)
 *  - schaalt het vlak exact passend op het rechthoekige middenscherm
 *  - vult het met: logo op transparant (kleur-modus), logo op zwart, of een
 *    eigen 16:9-beeld
 */
/**
 * Zoek het vlak dat we op het Grand Hall-middenscherm plaatsen (een pilaar-
 * logovlak dat tegen de achterwand kijkt, dus vrijwel onzichtbaar) én de
 * holder die de textuur ervan levert. Zodat applyBranding die holder precies
 * één keer kan swappen (dubbele swaps breken de render).
 */
/** Maten van het Grand Hall-middenscherm (de "Cube" in "Scherm midden"). */
export function grandHallScreenSize(app) {
  const scene = app._scene;
  let cube = null, schermMidden = null;
  scene.traverse((o) => { if (!schermMidden && (o.name || '').trim() === 'Scherm midden') schermMidden = o; });
  if (schermMidden) schermMidden.traverse((o) => { if (!cube && o.isMesh && /^Cube/.test((o.name || '').trim())) cube = o; });
  if (!cube) return null;
  const cb = worldBox(cube);
  return { cube, w: Math.max(cb.size.x, cb.size.z), h: cb.size.y, center: cb.center };
}

export function findGrandHallPlane(app, pilarenAssets = []) {
  const scene = app._scene;
  const rects = pillarLogoRects(scene);
  let plane = null;
  scene.traverse((o) => { if (!plane && o.name === 'brand-logo-grandhall') plane = o; });
  if (!plane) {
    let bestZ = -Infinity;
    for (const r of rects) {
      r.updateWorldMatrix(true, false);
      const z = r.matrixWorld.elements[14];
      if (z > bestZ) { bestZ = z; plane = r; }
    }
  }
  if (!plane) return null;
  const planeMat = firstMaterial(plane);
  const holderEntry = pilarenAssets.find((a) =>
    holderTexturesOf(a.holder).some((t) => materialUsesTexture(planeMat, t))) || null;
  return { plane, planeMat, holder: holderEntry ? holderEntry.holder : null };
}

/**
 * Bouw de content-canvas voor het Grand Hall-middenscherm.
 *
 * BELANGRIJK: de canvas moet EXACT de pixelmaten van de originele holder-
 * afbeelding hebben — Spline alloceert de GPU-textuur op vaste grootte en
 * negeert uploads met andere afmetingen (de oude afbeelding blijft dan
 * zichtbaar). Omdat het vlak op schermverhouding wordt geschaald terwijl de
 * canvas de holderverhouding houdt, wordt de inhoud eerst op schermverhouding
 * gecomponeerd en daarna in de holdermaat "voorvervormd": na de UV-mapping op
 * het vlak kloppen de verhoudingen (logo dus nooit uitgerekt).
 */
function buildGrandHallContent(app, { mode, image, logoImg, aspect = 16 / 9, holderW = 426, holderH = 191 }) {
  // 1. componeer op schermverhouding
  const W = 1280;
  const H = Math.max(2, Math.round(W / Math.max(aspect, 1e-6)));
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  const tctx = tmp.getContext('2d');
  if (image) {
    const s = Math.max(W / image.width, H / image.height);
    tctx.drawImage(image, (W - image.width * s) / 2, (H - image.height * s) / 2, image.width * s, image.height * s);
  } else {
    if (mode === 'zwart') { tctx.fillStyle = '#0a0a0a'; tctx.fillRect(0, 0, W, H); }
    if (logoImg) {
      const s = Math.min((W * 0.6) / logoImg.width, (H * 0.6) / logoImg.height);
      const lw = logoImg.width * s, lh = logoImg.height * s;
      tctx.drawImage(logoImg, (W - lw) / 2, (H - lh) / 2, lw, lh);
    }
  }
  // 2. voorvervormen naar de exacte holdermaat
  const content = document.createElement('canvas');
  content.width = holderW; content.height = holderH;
  content.getContext('2d').drawImage(tmp, 0, 0, holderW, holderH);
  return content;
}

export function setupGrandHallScreen(app, { mode = 'kleur', image = null, logoImg = null, planeInfo = null }) {
  const scene = app._scene;
  let welkom = null, cube = null, schermMidden = null;
  scene.traverse((o) => {
    if (!schermMidden && (o.name || '').trim() === 'Scherm midden') schermMidden = o;
  });
  if (schermMidden) {
    schermMidden.traverse((o) => {
      if (!welkom && o.isMesh && (o.name || '').trim() === 'Welkom') welkom = o;
      if (!cube && o.isMesh && /^Cube/.test((o.name || '').trim())) cube = o;
    });
  }
  if (!welkom || !cube || !planeInfo || !planeInfo.plane) return { fail: 'welkom/cube/plane' };

  // Welkom-tekst weg
  const wparent = welkom.parent && /welkom/i.test(welkom.parent.name || '') ? welkom.parent : welkom;
  wparent.visible = false;

  // De content staat al (vroeg, in de pilaren-fase) in de geclaimde holder.
  // In plaats van het pilaarvlak te verplaatsen (transforms op instance-
  // vlakken renderen onbetrouwbaar), krijgt de scherm-CUBE een eigen
  // materiaal: materiaal-toewijzing op de cube rendert wél betrouwbaar.
  //
  // Het pilaarmateriaal zelf is onbruikbaar op de cube: de kadrering
  // (crop/projection/rotatie-90/repeat) zit in de GECOMPILEERDE shader
  // (defines) en is met uniform-wijzigingen niet te corrigeren. De Event
  // Hall-schermmaterialen mappen hun texture wél 1-op-1 op het vlak (dat is
  // getest: een hue-testbeeld verschijnt strak op de cube). Daarom: een
  // ondiepe KOPIE van zo'n Event Hall-materiaal, met eigen laag/uniform-
  // objecten en de geclaimde holder-texture als beeldbron.
  const plane = planeInfo.plane;
  if (!planeInfo.holder) return { fail: 'holder' };
  plane.visible = false;                 // het vlak zelf blijft in de pilaar; uit
  plane.name = 'brand-logo-grandhall';   // marker: nooit herbouwen/hergebruiken

  const ghTex = holderTexturesOf(planeInfo.holder)[0];
  if (!ghTex) return { fail: 'ghTex' };

  // sjabloon: een Event Hall-schermmateriaal (texture-laag met vlak-mapping)
  let template = null;
  scene.traverse((o) => {
    if (template || !o.isMesh || !o.material) return;
    if (!/^Deel/.test((o.name || '').trim())) return;
    const m = firstMaterial(o);
    const ls = (m && m.layers && (m.layers.layers || m.layers)) || [];
    if (ls.some((l) => (l.type || (l.data && l.data.type)) === 'texture')) template = m;
  });
  if (!template) return { fail: 'template' };

  // De cube krijgt via Spline's eigen data-kanaal (updateByOp + geometry-
  // rebuild, zoals app.swapGeometry doet) een VERS materiaal, opgebouwd uit
  // de laag-data van het geclaimde pilaarvlak — maar met de kadrering
  // rechtgezet naar een 1-op-1 vlak-mapping (zoals de Event Hall-schermen).
  // JS-niveau kopieën/toewijzingen delen namelijk gecompileerde bindingen;
  // alleen dit data-kanaal levert een materiaal met eigen shader-defines.
  if (!cube.data || typeof cube.updateByOp !== 'function' || !plane.data) return { fail: 'data-kanaal' };
  const srcMatData = JSON.parse(JSON.stringify(plane.data.material));
  for (const layer of srcMatData.layers || []) {
    if (!layer.data || layer.data.type !== 'texture') continue;
    layer.data.projection = 0;
    layer.data.crop = false;
    layer.data.axis = 'x';
    if (layer.data.texture) {
      layer.data.texture.repeat = [1, 1];
      layer.data.texture.offset = [0, 0];
      layer.data.texture.rotation = 0;
    }
  }
  const opCtx = { shared: app._sharedAssetsManager, scene };
  try {
    const l = { ...cube.data, material: srcMatData };
    cube.updateByOp({ type: 0, path: [], props: { material: l.material } }, l, opCtx, false);
    const l2 = { ...cube.data, geometry: { ...cube.data.geometry } };
    cube.updateByOp({ type: 0, path: [], props: { geometry: l2.geometry } }, l2, opCtx, false);
  } catch (e) {
    return { fail: 'updateByOp: ' + e.message };
  }

  // Het verse materiaal decodeert zijn beeld uit de ingebedde bytes (het
  // originele NBC-logo), niet uit de geswapte holder. Daarom wordt de
  // texture van het nieuwe cube-materiaal in-place omgezet naar de holder-
  // canvas (zelfde pixelmaat, dus de GPU accepteert de upload). Een paar
  // seconden her-asserten, omdat de asynchrone decoder er overheen kan
  // schrijven.
  const content = planeInfo.holder.img;
  const applyTex = () => {
    const m = firstMaterial(cube);
    const ls = (m && m.layers && (m.layers.layers || m.layers)) || [];
    for (const layer of ls) {
      const u = layer.uniforms || {};
      const k = Object.keys(u).find((key) => /_texture$/.test(key));
      if (!k || !u[k] || !u[k].value) continue;
      const t = u[k].value;
      if (t.image !== content) {
        t.image = content;
        if (t.source && 'data' in t.source) t.source.data = content;
        t.needsUpdate = true;
        if (t.source) t.source.needsUpdate = true;
      }
    }
    if (app.requestRender) app.requestRender();
  };
  applyTex();
  const iv = setInterval(applyTex, 400);
  setTimeout(() => clearInterval(iv), 8000);

  return { cube: true };
}

function holderTexturesOf(holder) {
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

function materialUsesTexture(material, tex) {
  let found = false;
  const seen = new Set();
  const walk = (obj, depth) => {
    if (found || !obj || typeof obj !== 'object' || depth > 8 || seen.has(obj)) return;
    seen.add(obj);
    if (obj === tex) { found = true; return; }
    if (obj instanceof Map) { for (const v of obj.values()) walk(v, depth + 1); return; }
    if (Array.isArray(obj)) { for (const v of obj) walk(v, depth + 1); return; }
    for (const k of Object.keys(obj)) {
      if (k.startsWith('__') || ['parent', 'children', 'shared', 'thisContext'].includes(k)) continue;
      const v = obj[k];
      if (v && typeof v === 'object') walk(v, depth + 1);
    }
  };
  walk(material, 0);
  return found;
}

/* ------------------------------------------------------------------ *
 *  LED-pilaren: volledig vullen met eigen (staand) beeld              *
 * ------------------------------------------------------------------ */

// Empirisch gekalibreerd (pixelmetingen op de congres-scène): de logovlakken
// worden via hun hiddenMatrix + een geometry-rebuild op volledige pilaarmaat
// gezet. hm[5] = hoogteschaal (≈10 wereld-eenheden per eenheid, doel 84,6),
// hm[13] = verticale verschuiving (≈0,62 wereld per eenheid).
const PILLAR_HM_SCALE = 8.55;
const PILLAR_HM_SHIFT = -3.0;

/**
 * Staand beeld voorvervormd + 90° CCW gedraaid in de holdermaat tekenen.
 * Op het (herbouwde) pilaarvlak loopt canvas-x verticaal (x=0 = boven) en
 * canvas-y horizontaal; het beeld wordt daarom gedraaid getekend. De cover-
 * fit gebeurt op de echte pilaarverhouding (~7,2 × 84,6 wereld-eenheden).
 */
function pillarCanvas(image, w = 426, h = 191) {
  const tall = coverCanvas(image, 384, Math.round(384 * (84.6 / 7.2)));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.translate(0, h);
  ctx.rotate(-Math.PI / 2);
  // in het gedraaide stelsel: bron-x → canvas-y (breedte h), bron-y → canvas-x (breedte w)
  ctx.drawImage(tall, 0, 0, h, w);
  return c;
}

/**
 * Vult alle LED-pilaren op alle 4 zijden met een geüpload (staand) beeld.
 *
 * BELANGRIJK (empirisch): de pilaren zijn Spline-instances. Directe three.js-
 * transforms (scale/position/updateMatrix) op deze vlakken renderen NIET —
 * de rendertransform is gebakken. Ook data.scale/position via updateByOp
 * wordt genegeerd. Wat wél werkt: data.hiddenMatrix aanpassen en daarna een
 * geometry-op sturen (zoals app.swapGeometry doet), waardoor Spline het
 * render-item opnieuw opbouwt mét de nieuwe hiddenMatrix.
 */
export function fillPillarsWithImage(app, image, pilarenAssets, skipPlane = null) {
  const scene = app._scene;
  for (const a of pilarenAssets) {
    swapHolderImage(a.holder, pillarCanvas(image, a.width || 426, a.height || 191));
  }
  const ctx = { shared: app._sharedAssetsManager, scene };
  let n = 0;
  scene.traverse((group) => {
    if (!/NBC logo's pilaar/i.test(group.name || '')) return;
    const planes = (group.children || []).filter((c) => c.isMesh);
    for (const r of planes) {
      // het Grand Hall-vlak niet herbouwen: zijn materiaal/holder is
      // geclaimd voor het middenscherm (en het vlak zelf gaat op onzichtbaar)
      if (r === skipPlane || r.name === 'brand-logo-grandhall') continue;
      if (!r.data || typeof r.updateByOp !== 'function' || !Array.isArray(r.data.hiddenMatrix)) continue;
      try {
        const hm = [...r.data.hiddenMatrix];
        hm[5] = PILLAR_HM_SCALE;
        hm[13] = PILLAR_HM_SHIFT;
        const l = { ...r.data, hiddenMatrix: hm };
        r.updateByOp({ type: 0, path: [], props: { hiddenMatrix: l.hiddenMatrix } }, l, ctx, false);
        // rebuild afdwingen via een geometry-op met ongewijzigde parameters
        const l2 = { ...r.data, geometry: { ...r.data.geometry } };
        r.updateByOp({ type: 0, path: [], props: { geometry: l2.geometry } }, l2, ctx, false);
        n++;
      } catch (e) { /* vlak overslaan; de rest gaat door */ }
    }
  });
  if (app.requestRender) app.requestRender();
  return n;
}

/* ------------------------------------------------------------------ *
 *  Hoofd-API                                                          *
 * ------------------------------------------------------------------ */

/**
 * Pas branding toe op een geladen Spline Application.
 *
 * config:
 *   colors:    { primary, secondary }
 *   logo:      URL/data-URI (png met transparantie)
 *   screens:   { pilaren?, ledwall?, narrowcasting?, tv? } — eigen beeld per groep
 *   eventhall: { decor: 'verloop'|'effen1'|'effen2'|'zwart'|'custom', image?, logoSpots? }
 *   grandhall: { mode: 'kleur'|'zwart', image? } — alleen het middenscherm (16:9)
 *   halls:     { eventhall?, grandhall?, hosp1?, hosp2? } — opstelling tonen/verbergen
 *   lights:    true om ook de lichten om te kleuren
 */
export async function applyBranding(app, config = {}) {
  const { colors = {}, logo = null, screens = {} } = config;
  const primary = colors.primary || null;
  const secondary = colors.secondary || null;

  const logoImg = logo ? await loadImage(logo) : null;
  const overrides = {};
  for (const [role, src] of Object.entries(screens)) {
    if (src) overrides[role] = await loadImage(src);
  }
  const eventhallCfg = { ...(config.eventhall || {}) };
  if (eventhallCfg.image) eventhallCfg.image = await loadImage(eventhallCfg.image);
  if (!eventhallCfg.image && overrides.eventhall) { eventhallCfg.type = 'custom'; eventhallCfg.image = overrides.eventhall; }
  const grandhallCfg = { ...(config.grandhall || {}) };
  if (grandhallCfg.image) grandhallCfg.image = await loadImage(grandhallCfg.image);
  if (!grandhallCfg.image && overrides.grandhall) grandhallCfg.image = overrides.grandhall;

  const result = { swapped: [], recolored: 0, lights: 0, skipped: [], grandhall: false, eventhallParts: 0, pillarsFilled: 0 };

  const assets = listImageAssets(app);
  const pilarenAssets = assets.filter((a) => a.name && roleFor(a.name) === 'pilaren');

  // Grand Hall-vlak + holder vooraf bepalen zodat we die holder overslaan bij
  // het pilaren-swappen (elke holder mag maar één keer geswapt worden).
  const ghInfo = findGrandHallPlane(app, pilarenAssets);
  const ghHolder = ghInfo && ghInfo.holder;
  const wantGrandhall = !!(logoImg || grandhallCfg.image || grandhallCfg.mode === 'zwart');

  const ghScreen = grandHallScreenSize(app);
  const ghAsset = ghHolder ? pilarenAssets.find((a) => a.holder === ghHolder) : null;
  // Content voor het Grand Hall-vlak. Wordt hieronder BINNEN de pilaren-lus
  // geswapt en heeft EXACT de originele holdermaat (Spline weigert uploads met
  // andere afmetingen); de inhoud is voorvervormd op de schermverhouding.
  const ghContent = (ghInfo && ghHolder && wantGrandhall) ? buildGrandHallContent(app, {
    mode: grandhallCfg.mode || 'kleur', image: grandhallCfg.image || null, logoImg,
    aspect: ghScreen ? ghScreen.w / Math.max(ghScreen.h, 1e-6) : 16 / 9,
    holderW: (ghAsset && ghAsset.width) || 426,
    holderH: (ghAsset && ghAsset.height) || 191,
  }) : null;

  // 1. losse schermgroepen (ledwall, narrowcasting, tv) — volledig element vullen
  for (const asset of assets) {
    if (!asset.name || PROTECTED_ASSETS.test(asset.name) || asset.isVideo) { result.skipped.push(asset.name); continue; }
    const role = roleFor(asset.name);
    if (!role || role === 'eventhall' || role === 'pilaren') continue;
    let replacement = null;
    if (overrides[role]) {
      replacement = coverCanvas(overrides[role], asset.width || 1600, asset.height || 900);
    } else if (primary) {
      replacement = makeBrandCanvas({ logoImg, primary, secondary, width: asset.width || 1280, height: asset.height || 720 });
    }
    if (!replacement) continue;
    swapHolderImage(asset.holder, replacement);
    result.swapped.push({ asset: asset.name, role });
  }

  // 2. pilaren + Grand Hall-vlak. Het vlak deelt een holder met de pilaren;
  //    die holder krijgt (bij zwart/eigen beeld) de Grand Hall-content, de rest
  //    het logo. Alles in deze lus, zodat de swaps zeker renderen.
  if (overrides.pilaren) {
    // zonder Grand Hall-gebruik mag óók de gh-groep herbouwd worden en krijgt
    // de gh-holder gewoon het pilaarbeeld; mét Grand Hall blijft die groep
    // intact (skipPlane) en krijgt de holder de Grand Hall-content
    const fillAssets = wantGrandhall ? pilarenAssets.filter((a) => a.holder !== ghHolder) : pilarenAssets;
    result.pillarsFilled = fillPillarsWithImage(app, overrides.pilaren, fillAssets, wantGrandhall ? (ghInfo && ghInfo.plane) : null);
    if (wantGrandhall && ghContent && ghHolder) swapHolderImage(ghHolder, ghContent); // in dezelfde fase
  } else if (logoImg) {
    for (const a of pilarenAssets) {
      if (a.holder === ghHolder && ghContent) {
        swapHolderImage(a.holder, ghContent);
      } else {
        swapHolderImage(a.holder, makeLogoCanvas(logoImg, a.width || 852, a.height || 382));
      }
      result.swapped.push({ asset: a.name, role: 'pilaren' });
    }
  } else if (ghContent && ghHolder) {
    // geen logo en geen pilaren-upload, maar wél Grand Hall-content
    // (zwart scherm of eigen beeld) — dan alleen die holder swappen
    swapHolderImage(ghHolder, ghContent);
  }

  // 3. Event Hall-decorwand (één doorlopend beeld over de 4 delen)
  if (primary || eventhallCfg.image) {
    result.eventhallParts = applyEventhallDecor(app, { decor: eventhallCfg, colors, logoImg });
  }

  // 4. NBC-verloop (pilaren, Grand Hall-scherm, LED-accenten) → huisstijlkleuren
  if (primary) result.recolored = recolorBrandColors(app, primary, secondary);

  // 5. Grand Hall-middenscherm: vlak verplaatsen/schalen op het scherm
  //    (de content is al vroeg geswapt)
  if (ghInfo && wantGrandhall) {
    result.grandhall = setupGrandHallScreen(app, {
      mode: grandhallCfg.mode || 'kleur',
      image: grandhallCfg.image || null,
      logoImg,
      planeInfo: ghInfo,
    });
  }

  // 6. opstellingen per hal aan/uit
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
