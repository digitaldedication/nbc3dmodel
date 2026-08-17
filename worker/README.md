# Publiceer-adres: korte links zonder GitHub-account

Deze Worker slaat event-configs op onder een token, zodat de beheeromgeving
korte links kan maken (`…/viewer/?e=TOKEN`) **zonder GitHub-sleutel**.
Wie het adres en het gedeelde wachtwoord heeft, kan events publiceren — handig
als collega's geen toegang (of geen zin in tokens) hebben.

Voordelen ten opzichte van de GitHub-route:

- geen persoonlijk token, geen organisatie-instellingen, geen goedkeuring;
- de link werkt **meteen** (bij GitHub Pages duurt het ongeveer een minuut);
- elke collega gebruikt hetzelfde wachtwoord, dat je in één keer kunt wijzigen.

Kosten: de gratis Cloudflare-laag is ruim voldoende (100.000 verzoeken per dag).

## Eenmalig opzetten (±10 minuten)

1. Maak een gratis account op [cloudflare.com](https://dash.cloudflare.com/sign-up).
2. In een terminal, vanuit deze map:

   ```bash
   cd worker
   npx wrangler login
   npx wrangler kv namespace create CONFIGS
   ```

   Zet de `id` die je terugkrijgt in `wrangler.toml` bij `kv_namespaces`.

3. Zet het gedeelde wachtwoord (verzin iets lang en willekeurigs):

   ```bash
   npx wrangler secret put PUBLISH_KEY
   ```

4. Publiceer de Worker:

   ```bash
   npx wrangler deploy
   ```

   Je krijgt een adres terug, bijvoorbeeld
   `https://nbc3d-configs.<jouw-account>.workers.dev`.

## Instellen in de beheeromgeving

1. Open `…/admin/`, vink **Korte links gebruiken** aan.
2. Kies bij *Publiceren via*: **Eigen publiceer-adres**.
3. Vul het Worker-adres en het wachtwoord in.

Meer niet. Adres en wachtwoord blijven in de browser van die persoon staan en
komen nooit in een deel-link. Het adres zelf gaat wél mee in de korte link
(`?e=TOKEN&s=nbc3d-configs.….workers.dev`), zodat de viewer weet waar hij de
config moet ophalen.

### Het adres uit de links houden (optioneel)

Wil je links zonder `&s=…`, zet het adres dan één keer in de repository — maak
`configs/endpoint.json` aan met:

```json
{ "url": "https://nbc3d-configs.<jouw-account>.workers.dev" }
```

De viewer pakt dat adres dan automatisch voor elk token dat niet als bestand in
`configs/` staat.

## Wachtwoord wijzigen

```bash
npx wrangler secret put PUBLISH_KEY
```

Bestaande links blijven werken; alleen publiceren vereist het nieuwe wachtwoord.

## API

| Verzoek | Antwoord |
|---|---|
| `POST /` met `{"key":"…","token":"…","config":{…}}` | `{"ok":true}` |
| `GET /?e=TOKEN` | de config als JSON, of `404` |

Een ander platform (Netlify, Vercel, Supabase, een eigen server) kan dezelfde
twee routes aanbieden — de beheeromgeving en de viewer werken dan net zo goed.
Vereist zijn alleen CORS-headers (`Access-Control-Allow-Origin: *`) en een
`OPTIONS`-antwoord voor de preflight.
