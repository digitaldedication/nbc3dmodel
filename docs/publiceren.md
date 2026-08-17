# Korte deel-links publiceren

Een deel-link met uploads erin wordt duizenden tekens lang. Korte links
(`…/viewer/?e=TOKEN`) vereisen dat de config ergens wordt opgeslagen. Dit
document beschrijft vier manieren, van snelst naar meest robuust.

Sinds de verhuizing naar de organisatie **Marketing-NBC** werkt een
fine-grained token niet meer zomaar: fine-grained tokens die bij een
organisatie horen, moeten door de organisatie zijn toegestaan én meestal door
een eigenaar zijn goedgekeurd. Classic tokens vallen daar standaard niet onder.

De repository is publiek (`https://github.com/Marketing-NBC/nbc3dmodel`) en de
site staat op `https://marketing-nbc.github.io/nbc3dmodel/`.

## 1. Classic token (snelste oplossing, één persoon)

Werkt zonder medewerking van een organisatie-eigenaar, tenzij de organisatie
classic tokens expliciet heeft geblokkeerd.

1. Ga naar **GitHub → Settings → Developer settings → Personal access tokens →
   Tokens (classic) → Generate new token (classic)**.
2. Geef een naam en een vervaldatum op.
3. Vink **alleen** `public_repo` aan. Dat is genoeg om bestanden te schrijven in
   publieke repositories, en geeft geen toegang tot privérepositories.
4. Genereer het token en kopieer het (`ghp_…`).
5. Gebruikt de organisatie SAML single sign-on? Klik dan in de tokenlijst op
   **Configure SSO → Authorize** bij Marketing-NBC.
6. Plak het token in de beheeromgeving onder **Korte deel-links**, met
   repository `Marketing-NBC/nbc3dmodel` en branch `claude/nice-bohr-ynfyso`
   (de branch die GitHub Pages serveert).

## 2. Fine-grained token laten toestaan (organisatie-eigenaar nodig)

Een eigenaar van Marketing-NBC doet het volgende:

1. **Organisatie → Settings → Personal access tokens → Settings**.
2. Zet **Allow access via fine-grained personal access tokens** aan.
3. Kies bij **Require approval of fine-grained personal access tokens** of
   goedkeuring nodig blijft. Zonder goedkeuringsplicht kan iedereen in de
   organisatie zelf een token maken.
4. Blijft goedkeuring aan staan, dan komt elk nieuw token onder
   **Personal access tokens → Pending requests** te staan en moet een eigenaar
   het daar goedkeuren.

Daarna maakt de gebruiker het token via **Settings → Developer settings →
Fine-grained tokens** met *Resource owner* = `Marketing-NBC`, alleen deze
repository, en **Repository permissions → Contents: Read and write**.

## 3. Eigen publiceer-adres (aanbevolen als meer mensen links moeten maken)

Geen GitHub-account, geen token, geen organisatie-instellingen: de
beheeromgeving zet de config op een eigen adres, beveiligd met één gedeeld
wachtwoord. Bijkomend voordeel: de link werkt meteen, terwijl GitHub Pages na
publiceren ongeveer een minuut nodig heeft.

Opzetten (gratis Cloudflare Worker, ±10 minuten): zie
[`worker/README.md`](../worker/README.md). Daarna in de beheeromgeving bij
*Publiceren via* kiezen voor **Eigen publiceer-adres** en het adres plus
wachtwoord invullen.

De korte link krijgt dan het adres mee (`?e=TOKEN&s=…workers.dev`). Wil je dat
niet, zet het adres dan één keer in `configs/endpoint.json`:

```json
{ "url": "https://nbc3d-configs.<jouw-account>.workers.dev" }
```

## 4. Handmatig uploaden (zonder sleutel, wel GitHub-toegang)

Iedereen met schrijfrechten op de repository kan zonder token publiceren:

1. Klik in de beheeromgeving bij het event op **Config downloaden +
   uploadpagina**.
2. Sleep het gedownloade `TOKEN.json` in de GitHub-uploadpagina die opent
   (map `configs/`) en commit naar de branch die Pages serveert.

Rechten geven doe je via **Organisatie → repository → Settings → Collaborators
and teams → Add people** met de rol *Write*.

## Welke kiezen?

| Situatie | Route |
|---|---|
| Ik moet nu één link maken | 1 — classic token |
| Ik ben eigenaar en wil het netjes | 2 — fine-grained toestaan |
| Meerdere collega's moeten links maken | 3 — eigen publiceer-adres |
| Eenmalig, collega heeft al GitHub-toegang | 4 — handmatig uploaden |

## Bronnen

- [Setting a personal access token policy for your organization](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization)
- [Managing requests for personal access tokens in your organization](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/managing-requests-for-personal-access-tokens-in-your-organization)
- [Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
