# NBC Events — 3D plattegrond: technische analyse

*Gebaseerd op de live pagina `https://nbcevents.nl/3d-plattegrond` (HTML + `three-page.js` bundle, juli 2026).*

## Hoe de huidige tool in elkaar zit

### Techniek
- **React 19** applicatie, gemount op `<div id="react-three-page-root">` (en optioneel op elementen met `data-react-three-root`).
- 3D-engine: **Spline** (`@splinetool/runtime`, gebouwd op three.js). Het 3D-model is dus géén handgeschreven three.js-code maar een scène die in de **Spline editor** (spline.design) is gemaakt.
- Alles is gebundeld in één bestand `three-page.js` (~5 MB, geminificeerd): React + three.js + Spline runtime + de eigen app-code (~1.600 regels na formattering).

### De 3D-scènes
Er zijn **4 losse Spline-scènes**, één per opstelling/verdieping:

| Scène | Lokaal pad | Spline cloud fallback |
|---|---|---|
| Congres | `/assets/js/spline/congres/scene.splinecode` | `prod.spline.design/WYaImsxT39yxxRTM` |
| Feest | `/assets/js/spline/feest/scene.splinecode` | `prod.spline.design/MuaKWnAMFOVPl8N1` |
| Sit-down dinner | `/assets/js/spline/sitdown/scene.splinecode` | `prod.spline.design/FpxJYC5tSwzsTaix` |
| Lounge (verdieping 2) | `/assets/js/spline/lounge/scene.splinecode` | `prod.spline.design/dqpO8e8KKB82COmG` |

`window.REACT_THREE_CONFIG.useLocalSpline` bepaalt lokaal vs. cloud (standaard lokaal).

### Configuratie via de site (CMS)
De pagina injecteert `window.REACT_THREE_CONFIG` met o.a.:
- `sharedTooltipCards` / `loungeTooltipCards` — teksten/afbeeldingen van de info-tooltips
- `sharedSpaceTooltips` / `loungeSpaceTooltips` — de ruimte-kaarten (Event hall, Grand hall, Hospitality 1/2, Lounge, Sub-zalen) incl. capaciteitsvarianten
- `modeButtonLabels` (Congress / Party / Sit down dinner), `floorButtonLabels` (1 / 2)
- `wizard` — de uitleg-popup

### Koppeling UI ↔ 3D-model
- Tooltips worden **op naam** aan Spline-objecten gekoppeld (bijv. `tooltip-grand-hall-podium`, `tooltip-hospitality2-LED-zuilen`, `tooltip-eventhall-scheidingswand`). De app zoekt ze via `findObjectByName`, verbergt het Spline-object en projecteert de 3D-positie elk frame naar schermcoördinaten voor de HTML-tooltipknop.
- De **scheidingswand** in de Event Hall werkt via een Spline-object "Wegneembare wand" met twee states (`Visible` / `Hidden`), geschakeld met `obj.transition({ to, duration }).play()`.
- Wisselen van opstelling = een **compleet andere `.splinecode`-scène laden** (geen toggles binnen één scène).

## Belangrijkste conclusie voor de branding-wens

**Alle visuele content — de jpg's op de schermen (LED-zuilen, groot scherm Event Hall, tv-/trioschermen, LED-wall), de verlichting en de kleuren — zit ín de `.splinecode`-scènebestanden, niet in de React-code.**

De React-code regelt alleen UI (tooltips, knoppen, scène-wissel). Om per event een logo/afbeeldingen en 2 huisstijlkleuren toe te passen zijn er drie routes:

1. **Runtime texture/kleur-injectie (aanbevolen):** de Spline runtime bouwt intern een three.js-scène (`app._scene`). Na `onLoad` kunnen we de scène doorlopen, de materialen van de schermobjecten vinden en hun texture (`material.map` / texture-layer image) vervangen door een geüploade PNG, en kleuren van materialen + lichten aanpassen. Vereist dat de schermobjecten in Spline **herkenbare namen** krijgen (bijv. `brand-screen-ledzuil-1`, `brand-light-beam-3`) — eenmalige naamgevings-actie in de Spline editor.
2. **Spline Variables/states:** in de Spline editor variabelen of states definiëren voor kleuren en afbeeldingen en die via `app.setVariables()` / events aansturen. Netter, maar afhankelijk van wat Spline aan image-variabelen ondersteunt; vereist sowieso werk in de Spline editor.
3. **Scène dupliceren per event in de Spline editor:** handwerk per offerte, geen zelfbedieningstool — valt af als structurele oplossing.

## Voorgestelde architectuur salestool

```
Beheeromgeving (admin, achter login)
  ├─ per event: naam, logo-upload (png), 2 RGB-kleuren
  ├─ per ruimte: opstelling kiezen + aan/uit (opacity/weg)
  ├─ per schermgroep: eigen afbeelding uploaden (optioneel, anders logo+kleuren)
  └─ genereert config JSON + assets onder random token

Opslag
  └─ /configs/{token}.json + /uploads/{token}/*  (token = onherleidbaar, bijv. 22 tekens)

Gedeelde klant-URL
  └─ nbcevents.nl/3d/{token} (of ?e={token})
       ├─ laadt bestaande viewer + REACT_THREE_CONFIG
       ├─ laadt branding-config via token
       └─ branding-module past na onLoad toe: textures, materiaalkleuren,
          lichtkleuren, logo "NBC x {Klant}" in de header
```

Fase 1 (jouw eerste prioriteit): schermen brandbaar maken + unieke deel-URL.
Fase 2: kleuren op verlichting/LED-lijnen, opstellingen per ruimte, ruimtes aan/uit, extra opstellingen zoals in het wensendocument, beheeromgeving met alle schuifjes.

## Wat er nog nodig is om te kunnen bouwen

1. **De 4 `.splinecode`-bestanden** (paden hierboven) — om de objectnamen/materialen te inspecteren en de texture-injectie te ontwikkelen en testen. Downloadbaar vanaf de live site zodra netwerktoegang werkt, of aan te leveren door het bureau.
2. **De originele (niet-geminificeerde) broncode** van `three-page.js` van het bureau dat dit bouwde — scheelt reverse-engineering en maakt nette doorontwikkeling mogelijk. (Zonder kan het ook: de app-code is klein genoeg om te reconstrueren.)
3. **Toegang tot het Spline-project** (spline.design account) — nodig om schermobjecten te hernoemen, nieuwe LED-schermen toe te voegen en extra opstellingen te modelleren.
4. Keuze voor **opslag/backend** van de event-configs en uploads (bijv. simpele API + object storage, of het bestaande CMS van de site).
