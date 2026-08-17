/**
 * Publiceer-adres voor korte deel-links — Cloudflare Worker.
 *
 * Doel: korte links (…/viewer/?e=TOKEN) maken zonder GitHub-account en
 * zonder persoonlijk token, zodat iedereen met het adres en het gedeelde
 * wachtwoord een event kan publiceren.
 *
 *   POST /            {"key":"…","token":"…","config":{…}}  → {"ok":true}
 *   GET  /?e=TOKEN                                          → de config (JSON)
 *   OPTIONS /                                               → CORS-preflight
 *
 * Bindings (zie wrangler.toml en README.md):
 *   CONFIGS      KV-namespace waarin de configs staan
 *   PUBLISH_KEY  gedeeld wachtwoord (als secret gezet, niet in de code)
 */

const TOKEN_RE = /^[A-Za-z0-9_-]{4,64}$/;
// KV gaat tot 25 MiB per waarde; ruim onder die grens blijven met marge voor
// de rest van het verzoek. Een event met uploads is doorgaans < 1 MB.
const MAX_BYTES = 20 * 1024 * 1024;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });

/** Vergelijking in constante tijd, zodat het wachtwoord niet te raden is
 *  aan de hand van responstijden. */
function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (request.method === 'GET') {
      const token = new URL(request.url).searchParams.get('e') || '';
      if (!TOKEN_RE.test(token)) return json({ error: 'ongeldig token' }, 400);
      const config = await env.CONFIGS.get('c:' + token);
      if (config === null) return json({ error: 'niet gevonden' }, 404);
      return new Response(config, {
        headers: {
          ...CORS,
          'Content-Type': 'application/json; charset=utf-8',
          // kort cachen: een bewerkt event is binnen een minuut zichtbaar
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    if (request.method === 'POST') {
      if (!env.PUBLISH_KEY) return json({ error: 'server mist PUBLISH_KEY' }, 500);
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: 'geen geldige JSON' }, 400); }
      if (!sameSecret(body && body.key, env.PUBLISH_KEY)) return json({ error: 'wachtwoord klopt niet' }, 401);
      if (!TOKEN_RE.test(body.token || '')) return json({ error: 'ongeldig token' }, 400);
      if (!body.config || typeof body.config !== 'object') return json({ error: 'config ontbreekt' }, 400);

      const text = JSON.stringify(body.config);
      if (new TextEncoder().encode(text).length > MAX_BYTES) return json({ error: 'config te groot' }, 413);
      await env.CONFIGS.put('c:' + body.token, text);
      return json({ ok: true });
    }

    return json({ error: 'methode niet toegestaan' }, 405, { Allow: 'GET, POST, OPTIONS' });
  },
};
