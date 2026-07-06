/**
 * Tooltips zoals op nbcevents.nl/3d-plattegrond — geport uit de productie-
 * bundle (zie reference/three-page.app-code.js).
 *
 * De scènes bevatten kleine anker-objecten met namen als
 * "tooltip-grand-hall-podium". De live site verbergt die objecten en
 * projecteert hun 3D-positie elk frame naar schermcoördinaten, waar een
 * klikbare pill-knop staat. Klikken opent een kaart (afbeelding, titel,
 * tekst, capaciteitsvarianten). De scheidingswand-tooltip schakelt
 * daarnaast het object "Wegneembare wand" zichtbaar/onzichtbaar.
 */

import { SPACE_TOOLTIPS as LIVE_SPACE, INFO_TOOLTIPS as LIVE_INFO } from './tooltip-content.js';

/* Oude placeholder-data hieronder blijft als fallback-documentatie, maar de
   daadwerkelijke content komt 1-op-1 uit tooltip-content.js (live CMS). */
const PLACEHOLDER_SPACE_TOOLTIPS = [
  {
    splineName: 'tooltip-event-hall', label: 'Event hall', tooltipType: 'space',
    cardTitle: 'Event hall',
    cardDescription: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur facilisis sem in risus cursus, at varius dui feugiat.',
    cardLink: 'https://nbcevents.nl/', cardLinkText: 'Bekijk ruimte',
    defaultImage: 'https://picsum.photos/seed/space-eventhall/1200/675',
    imageVariants: [
      { imageUrl: 'https://picsum.photos/seed/space-eventhall-a/1200/675', capacityLabel: '1.500' },
      { imageUrl: 'https://picsum.photos/seed/space-eventhall-b/1200/675', capacityLabel: '2.000' },
    ],
  },
  {
    splineName: 'tooltip-grand-hall', label: 'Grand hall', tooltipType: 'space',
    cardTitle: 'Grand hall',
    cardDescription: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin posuere libero ac orci varius, sed luctus enim bibendum.',
    cardLink: 'https://nbcevents.nl/', cardLinkText: 'Bekijk ruimte',
    defaultImage: 'https://picsum.photos/seed/space-grandhall/1200/675',
    imageVariants: [
      { imageUrl: 'https://picsum.photos/seed/space-grandhall-a/1200/675', capacityLabel: '1.200' },
      { imageUrl: 'https://picsum.photos/seed/space-grandhall-b/1200/675', capacityLabel: '1.700' },
    ],
  },
  {
    splineName: 'tooltip-hospitality-area-1', label: 'Hospitality area 1', tooltipType: 'space',
    cardTitle: 'Hospitality area 1',
    cardDescription: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer volutpat mi id ligula dictum, sed porta odio laoreet.',
    cardLink: 'https://nbcevents.nl/', cardLinkText: 'Bekijk ruimte',
    defaultImage: 'https://picsum.photos/seed/space-hospitality1/1200/675',
    imageVariants: [
      { imageUrl: 'https://picsum.photos/seed/space-hospitality1-a/1200/675', capacityLabel: '750' },
      { imageUrl: 'https://picsum.photos/seed/space-hospitality1-b/1200/675', capacityLabel: '900' },
    ],
  },
  {
    splineName: 'tooltip-hospitality-area-2', label: 'Hospitality area 2', tooltipType: 'space',
    cardTitle: 'Hospitality area 2',
    cardDescription: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vel dui id ligula cursus varius in non justo.',
    cardLink: 'https://nbcevents.nl/', cardLinkText: 'Bekijk ruimte',
    defaultImage: 'https://picsum.photos/seed/space-hospitality2/1200/675',
    imageVariants: [
      { imageUrl: 'https://picsum.photos/seed/space-hospitality2-a/1200/675', capacityLabel: '870' },
      { imageUrl: 'https://picsum.photos/seed/space-hospitality2-b/1200/675', capacityLabel: '1.050' },
    ],
  },
];

const PLACEHOLDER_INFO_TOOLTIPS = [
  { splineName: 'tooltip-grand-hall-balkon', label: 'Balkon' },
  { splineName: 'tooltip-grand-hall-stoelen-in-de-zaal', label: 'Stoelen in de zaal' },
  { splineName: 'tooltip-grand-hall-podium', label: 'Podium' },
  { splineName: 'tooltip-grand-hall-projectiescherm', label: 'Projectiescherm' },
  { splineName: 'tooltip-grand-hall-ruimte-op-te-splitsen', label: 'Ruimte op te splitsen' },
  { splineName: 'tooltip-hospitality1-veel-daglicht-entree', label: 'Veel daglicht entree' },
  { splineName: 'tooltip-hospitality1-ingang', label: 'Ingang' },
  { splineName: 'tooltip-hospitality1-registratiebalies', label: 'Registratiebalies' },
  { splineName: 'tooltip-hospitality1-bewaakte-garderobe', label: 'Bewaakte garderobe' },
  { splineName: 'tooltip-hospitality2-vaste-bar', label: 'Vaste bar' },
  { splineName: 'tooltip-hospitality2-LED-wall-entree', label: 'LED wall entree' },
  { splineName: 'tooltip-hospitality2-entresol', label: 'Entresol' },
  { splineName: 'tooltip-hospitality2-wijnbar', label: 'Wijnbar' },
  { splineName: 'tooltip-hospitality2-LED-zuilen', label: 'LED zuilen' },
  { splineName: 'tooltip-eventhall-3dprojectie', label: '3D projectie' },
  { splineName: 'tooltip-eventhall-stoelen-in-de-zaal', label: 'Stoelen in de zaal' },
  { splineName: 'tooltip-eventhall-scheidingswand', label: 'Scheidingswand' },
].map((t) => ({ tooltipType: 'info', cardTitle: t.label, cardDescription: '', cardLink: '', cardLinkText: 'Meer informatie', ...t }));

export const SPACE_TOOLTIPS = LIVE_SPACE && LIVE_SPACE.length ? LIVE_SPACE : PLACEHOLDER_SPACE_TOOLTIPS;
export const INFO_TOOLTIPS = LIVE_INFO && LIVE_INFO.length ? LIVE_INFO : PLACEHOLDER_INFO_TOOLTIPS;

const FONT = "'Area Normal', system-ui, sans-serif";

const WAND_TOOLTIP = 'tooltip-eventhall-scheidingswand';
const WAND_OBJECT = 'Wegneembare wand';

function findObjectByName(app, name) {
  const t = name.trim();
  let hit = app.findObjectByName ? app.findObjectByName(t) : null;
  if (!hit && typeof app.getAllObjects === 'function') {
    hit = app.getAllObjects().find((o) => (o.name || '').trim() === t);
  }
  return hit;
}

/** Scheidingswand tonen/verbergen via de Spline-states (zoals de live site). */
function setWandVisible(app, show) {
  const obj = findObjectByName(app, WAND_OBJECT);
  if (!obj) return;
  const state = show ? 'Visible' : 'Hidden';
  if (typeof obj.transition === 'function') {
    try { obj.transition({ to: state, duration: 0 }).play(); return; } catch (e) { /* val terug op state */ }
  }
  try { obj.state = state; } catch (e) { /* geen states beschikbaar */ }
}

const PLUS_SVG = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 8V24M8 16H24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
const MIN_SVG = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 16H24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
const CROSS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';

/**
 * Start het tooltip-systeem voor een geladen Spline-app.
 * @param app        Spline Application
 * @param container  element waarin de tooltip-laag en kaart komen
 * @param options    { accent: kleur voor ruimte-dots, cards: overrides }
 * @returns { dispose } — aanroepen vóór het laden van een nieuwe scène
 */
export function initTooltips(app, container, options = {}) {
  const accent = options.accent || '#E4032E';
  const defs = [...SPACE_TOOLTIPS, ...INFO_TOOLTIPS].map((d) => ({ ...d }));

  // ankers zoeken en verbergen (drie.js-meshes én Spline-proxyobjecten)
  const anchors = [];
  const scene = app._scene;
  for (const def of defs) {
    let obj = null;
    scene.traverse((o) => { if (!obj && (o.name || '').trim() === def.splineName) obj = o; });
    if (obj) obj.visible = false;
    anchors.push(obj ? { def, obj } : null);
  }

  // DOM-structuur
  const layer = document.createElement('div');
  layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
  container.appendChild(layer);

  const cardHost = document.createElement('div');
  cardHost.style.cssText = 'position:absolute;left:24px;top:50%;transform:translateY(-50%);z-index:60;max-width:min(360px,28vw);pointer-events:auto;display:none;';
  container.appendChild(cardHost);

  let active = null;

  const buttons = anchors.map((a, i) => {
    if (!a) return null;
    const isSpace = a.def.tooltipType === 'space';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = `position:absolute;left:0;top:0;display:none;transform:translate(-50%,-50%);pointer-events:auto;border:0;cursor:pointer;
      display:none;align-items:center;gap:8px;height:40px;border-radius:999px;padding:0 8px;
      background:${isSpace ? 'rgba(20,20,20,.92)' : 'transparent'};color:#fff;font:800 12px/1 ${FONT};white-space:nowrap;
      transition:background .2s;`;
    const dot = document.createElement('span');
    dot.style.cssText = `display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;flex:0 0 auto;
      background:${isSpace ? accent : '#fff'};color:${isSpace ? '#fff' : '#111'};`;
    dot.innerHTML = PLUS_SVG;
    dot.firstChild.style.width = '11px';
    const label = document.createElement('span');
    label.textContent = a.def.label;
    label.style.cssText = `overflow:hidden;max-width:${isSpace ? '260px' : '0'};padding-right:${isSpace ? '10px' : '0'};transition:max-width .3s,padding .3s;`;
    btn.append(dot, label);
    btn.addEventListener('click', () => select(active === i ? null : i));
    layer.appendChild(btn);
    return { btn, dot, label };
  });

  function renderCard(def) {
    const variants = (def.imageVariants || []).filter((v) => v.imageUrl);
    const hasImg = def.defaultImage || variants.length;
    cardHost.innerHTML = '';
    const card = document.createElement('div');
    card.style.cssText = `position:relative;display:flex;flex-direction:column;gap:14px;padding:22px;border-radius:24px;background:#262626;color:#fff;box-shadow:0 12px 40px rgba(0,0,0,.35);font-family:${FONT};`;
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Kaart sluiten');
    close.style.cssText = 'position:absolute;top:16px;right:16px;z-index:2;display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:999px;border:0;background:#111;color:#fff;cursor:pointer;';
    close.innerHTML = CROSS_SVG;
    close.firstChild.style.width = '13px';
    close.addEventListener('click', () => select(null));
    card.appendChild(close);

    let imgEl = null;
    if (hasImg) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'overflow:hidden;border-radius:16px;aspect-ratio:16/9;background:#1b1b1b;';
      imgEl = document.createElement('img');
      imgEl.src = def.defaultImage || variants[0].imageUrl;
      imgEl.alt = '';
      imgEl.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      wrap.appendChild(imgEl);
      card.appendChild(wrap);
    }
    if (variants.length) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
      variants.forEach((v, vi) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.style.cssText = `display:flex;align-items:center;gap:5px;border:0;border-radius:6px;padding:5px 10px;font:800 12px ${FONT};background:#f2f3f3;color:#16181a;cursor:pointer;`;
        const addIcon = (iconUrl) => {
          if (!iconUrl) return;
          const ic = document.createElement('span');
          ic.style.cssText = `width:14px;height:14px;background:#16181a;-webkit-mask:url("${iconUrl}") center/contain no-repeat;mask:url("${iconUrl}") center/contain no-repeat;`;
          chip.appendChild(ic);
        };
        addIcon(v.iconLeftUrl);
        if (v.capacityLabel) {
          const sp = document.createElement('span');
          sp.textContent = v.capacityLabel;
          chip.appendChild(sp);
        }
        addIcon(v.iconRightUrl);
        const show = () => { if (imgEl) imgEl.src = v.imageUrl; row.querySelectorAll('button').forEach((b) => (b.style.background = '#d8dbdc')); chip.style.background = '#fff'; };
        chip.addEventListener('mouseenter', show);
        chip.addEventListener('focus', show);
        chip.addEventListener('click', show);
        if (vi === 0) chip.style.background = '#fff';
        row.appendChild(chip);
      });
      card.appendChild(row);
    }
    const h = document.createElement('h3');
    h.textContent = def.cardTitle || def.label;
    h.style.cssText = 'margin:0;padding-right:36px;font-size:16px;font-weight:800;';
    card.appendChild(h);
    if (def.cardDescription) {
      const p = document.createElement('p');
      p.textContent = def.cardDescription;
      p.style.cssText = 'margin:0;font-size:13px;line-height:1.5;color:#ddd;';
      card.appendChild(p);
    }
    if (def.cardLink) {
      const aEl = document.createElement('a');
      aEl.href = def.cardLink; aEl.target = '_blank'; aEl.rel = 'noopener noreferrer';
      aEl.textContent = def.cardLinkText || 'Meer informatie';
      aEl.style.cssText = 'color:#fff;font-size:13px;font-weight:600;';
      card.appendChild(aEl);
    }
    cardHost.appendChild(card);
  }

  function select(i) {
    active = i;
    // scheidingswand-koppeling zoals op de live site
    const wandIndex = anchors.findIndex((a) => a && a.def.splineName === WAND_TOOLTIP);
    if (wandIndex !== -1) setWandVisible(app, i === wandIndex);
    buttons.forEach((b, bi) => {
      if (!b || !anchors[bi]) return;
      const isSpace = anchors[bi].def.tooltipType === 'space';
      const expanded = isSpace || bi === i;
      b.btn.style.background = expanded ? 'rgba(20,20,20,.92)' : 'transparent';
      b.label.style.maxWidth = expanded ? '260px' : '0';
      b.label.style.paddingRight = expanded ? '10px' : '0';
      b.dot.innerHTML = bi === i ? MIN_SVG : PLUS_SVG;
      b.dot.firstChild.style.width = '11px';
    });
    if (i !== null && anchors[i]) {
      renderCard(anchors[i].def);
      cardHost.style.display = 'block';
    } else {
      cardHost.style.display = 'none';
    }
  }

  // projectielus: 3D-positie → schermpositie (zelfde aanpak als de live site)
  let raf = null;
  const tick = () => {
    const cam = app.camera || app._camera;
    const canvas = app.canvas;
    if (cam && canvas) {
      const rect = canvas.getBoundingClientRect();
      const host = container.getBoundingClientRect();
      for (let i = 0; i < anchors.length; i++) {
        const a = anchors[i], b = buttons[i];
        if (!b) continue;
        if (!a) { b.btn.style.display = 'none'; continue; }
        const o = a.obj;
        o.updateWorldMatrix(true, false);
        const e = o.matrixWorld.elements;
        // project: clip = P * V * wereldpositie
        const v = { x: e[12], y: e[13], z: e[14] };
        const mv = cam.matrixWorldInverse.elements;
        const pr = cam.projectionMatrix.elements;
        const cx = mv[0] * v.x + mv[4] * v.y + mv[8] * v.z + mv[12];
        const cy = mv[1] * v.x + mv[5] * v.y + mv[9] * v.z + mv[13];
        const cz = mv[2] * v.x + mv[6] * v.y + mv[10] * v.z + mv[14];
        const px = pr[0] * cx + pr[4] * cy + pr[8] * cz + pr[12];
        const py = pr[1] * cx + pr[5] * cy + pr[9] * cz + pr[13];
        const pw = pr[3] * cx + pr[7] * cy + pr[11] * cz + pr[15];
        const ndcX = px / pw, ndcY = py / pw, ndcZ = (pr[2] * cx + pr[6] * cy + pr[10] * cz + pr[14]) / pw;
        const visible = Math.abs(ndcZ) <= 1 && pw > 0;
        if (!visible) { b.btn.style.display = 'none'; continue; }
        const sx = rect.left - host.left + (ndcX * 0.5 + 0.5) * rect.width;
        const sy = rect.top - host.top + (-(ndcY * 0.5) + 0.5) * rect.height;
        b.btn.style.display = 'flex';
        b.btn.style.transform = `translate(${sx}px, ${sy}px) translate(-50%,-50%)`;
      }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      layer.remove();
      cardHost.remove();
    },
  };
}
