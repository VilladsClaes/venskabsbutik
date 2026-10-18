# 🌞 Venskabsbutikken

Villads Claes' webshop med venskaber til salg – flyttet fra Google Sites til sit eget domæne, **venskab.villadsclaes.dk**.

## Teknik

| Del | Valg | Hvorfor |
|---|---|---|
| Framework | **Next.js 16** (React, TypeScript) | Én kodebase til butik, admin og server |
| Styling | **Tailwind CSS 4** + egne CSS-animationer | Sol, skyer, regnbuer og konfetti uden tunge biblioteker |
| Database | **SQLite/libSQL** via **Drizzle ORM** | Lokalt en simpel fil; i drift en gratis Turso-database med præcis samme kode |
| Login | Signeret cookie (JWT via `jose`) | Én adgangskode til admin |

## Kom i gang lokalt

Du skal kun have **Node.js** (version 20 eller nyere) installeret – det har du allerede.

```bash
npm install
cp .env.example .env.local   # udfyld ADMIN_PASSWORD og SESSION_SECRET
npm run db:setup             # opretter databasen og fylder de 37 tjenester ind
npm run dev                  # åbn http://localhost:3000
```

Admin ligger på **http://localhost:3000/admin**.

### Nyttige kommandoer

| Kommando | Gør |
|---|---|
| `npm run dev` | Starter udviklingsserveren |
| `npm run build` | Bygger til produktion (tjekker også typer) |
| `npm run db:generate` | Laver en ny migration efter ændringer i `src/db/schema.ts` |
| `npm run db:migrate` | Kører migrationer mod databasen |
| `npm run db:seed` | Indsætter produkter der mangler (overskriver aldrig dine ændringer) |
| `npm run db:studio` | Åbner Drizzle Studio – se og ret databasen i browseren |

## Struktur

```
src/
  app/(shop)/        Butikken: forside, tjenester, kurv, ordre, om-sider
  app/admin/         Baglokalet: overblik, ordrer, produkter, kunder, anmeldelser
  app/actions.ts     Bestilling og anmeldelser (serveren genberegner altid priser)
  components/        Sol, skyer, regnbue, produktkort, kurv, galleri …
  db/schema.ts       Databasens tabeller
  db/seed-data.ts    Alt indholdet fra den gamle side
public/images/       Billeder hentet fra den gamle Google Site
```

## Databasen

- **products** – tjenesterne (pris, tagline, beskrivelse, "godt til", med småt, farve, emoji, kategori)
- **product_variants** – udgaver med egen pris (fx "Dit ansigt på pude")
- **product_media** – billeder, YouTube-videoer og eksempler fra tidligere købere
- **product_questions** – spørgsmål kunden besvarer ved bestilling (erstatter Google Forms)
- **customers** – kunder (genkendes på e-mail/telefon), dæknavn og om de må nævnes
- **orders / order_items** – ordrer med status og et øjebliksbillede af pris og svar
- **payments** – registrerede indbetalinger (klar til flere betalingsmetoder senere)
- **testimonials** – anmeldelser; nye skal godkendes i admin
- **settings** – MobilePay-nummer, telefon, intro-video

Alle beløb gemmes i øre (540 = 5,40 kr.).

## Betaling

Kunden vælger betalingsmåde i kurven. Metoderne slås til og sættes op under **Admin → Indstillinger**.

| Metode | Hvordan | Bekræftelse |
|---|---|---|
| 💙 Vipps MobilePay | Overførsel med ordrenummer i beskeden | Manuel (“Registrér betaling”) |
| 💳 Stripe | Kort, Apple Pay, Google Pay og MobilePay på Stripes betalingsside | **Automatisk** via webhook `/api/stripe/webhook` |
| 🅿️ PayPal | PayPal.Me-link med beløbet udfyldt | Manuel |
| 🏦 Bankoverførsel | Reg.nr./konto + ordrenummer | Manuel |
| 🪙 Krypto | Tegnebog + QR, beløb omregnet med dagskurs (CoinGecko) | Manuel |
| 💛 Betal med venskab | Kunden tilbyder en tjeneste tilbage | Manuel – du godkender byttet |

Kunden kan skifte betalingsmåde på ordresiden, så længe ordren afventer betaling.
Den gamle idé om at **prisen er varenummeret** (5,4 = lussing) er bevaret og vises på produkterne.

## Sæt den i drift på venskab.villadsclaes.dk

Anbefalet (gratis til en hobbybutik): **Vercel** til hjemmesiden + **Turso** til databasen.

1. Læg koden på GitHub.
2. Opret en database på [turso.tech](https://turso.tech) og hent URL + token.
3. Kør migrationer og seed mod Turso:
   ```bash
   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:setup
   ```
4. Importér projektet på [vercel.com](https://vercel.com) og sæt miljøvariablerne fra `.env.example`
   (`DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`).
5. Tilføj domænet `venskab.villadsclaes.dk` i Vercel og opret en CNAME-post for `venskab` hos Simply.com med den værdi, Vercel angiver.

`www.villadsclaes.dk` er reserveret til en fælles landingsside for Villads' sites.

## Oplevelser og påfund

| Hvad | Hvor |
|---|---|
| Leveringsdagbog (sted, foto, hvem) – driver kort, globus og tællere | `/admin/leverancer` |
| Bænkekortet, Himmelglobussen, Tankemåleren, Lussing-hitlisten, Fødselsdags-nedtællingen, Rutekortet, Væggen, Godhedstermometret, Gækkebrev-værkstedet, Godnathistorierne | `/oplevelser` |
| Gavetilstand med digitalt gavekort | kurven → “Det er en gave” → `/gave/<ordre>` |
| Venskabsniveauer og venskabscertifikat | ordresiden |
| Dagens venskab (gratis bonus), lykkehjul, live-ticker | forsiden |
| E-mails (Simply SMTP), billedupload (Vercel Blob), statistik (Vercel Analytics) | se status i `/admin/indstillinger` |

Ruterne på rutekortet ligger som GeoJSON i `public/routes/` (hentet fra de gamle Google My Maps).

## Kalenderen og events

`/kalender` viser en månedskalender med hvornår Villads er **ledig/optaget** (kun tidsrum – aldrig titler) og de
**events** man kan købe sig adgang til: fødselsdage, bow combat, paintball, gyserfilm, drinks i parken, cykelture …
Runde fødselsdage foreslås automatisk og linker til Fødselsdags-produktet.

| Hvad | Hvor |
|---|---|
| Opret/ret events (dato, pris, pladser, rute som GPX/GeoJSON) | `/admin/kalender` |
| Eventside med tilmelding og betaling | `/kalender/<slug>` |
| Rute fra et event | vises automatisk på `/oplevelser/ruterne` |

**Flowet:** Kunden melder sig til med sin e-mail og betaler (alle butikkens betalingsmåder virker). Når ordren er betalt –
via Stripe-webhook, “Registrér betaling” eller når du sætter ordren til *Betalt* – bliver kundens e-mail tilføjet som
deltager på kalenderposten. Google/Outlook sender selv invitationen, så eventet lander i kundens kalender og følger
med, hvis du flytter det. Annulleres ordren, fjernes kunden igen. Deltagerne kan ikke se hinandens e-mails.
Er ingen kalender tilsluttet, får kunden en `.ics`-fil på mail i stedet.

### Tilslut Google Kalender
1. Gå til [console.cloud.google.com](https://console.cloud.google.com) → nyt projekt → *APIs & Services* → slå **Google Calendar API** til.
2. *OAuth consent screen*: vælg *External*, tilføj dig selv som testbruger (eller udgiv appen).
3. *Credentials* → *Create credentials* → *OAuth client ID* → *Web application*.
   Omdirigerings-URI: `https://venskab.villadsclaes.dk/api/kalender/google/callback` (og `http://localhost:3000/api/kalender/google/callback` lokalt).
4. Sæt `GOOGLE_CLIENT_ID` og `GOOGLE_CLIENT_SECRET` i Vercel og klik **Tilslut** under `/admin/kalender`.

### Tilslut Outlook
1. Gå til [entra.microsoft.com](https://entra.microsoft.com) → *App registrations* → *New registration*.
   Kontotyper: *Accounts in any organizational directory and personal Microsoft accounts*.
2. Omdirigerings-URI (Web): `https://venskab.villadsclaes.dk/api/kalender/outlook/callback`.
3. *Certificates & secrets* → ny klienthemmelighed. *API permissions* → Microsoft Graph → delegated `Calendars.ReadWrite`, `User.Read`, `offline_access`.
4. Sæt `MICROSOFT_CLIENT_ID` og `MICROSOFT_CLIENT_SECRET` i Vercel og klik **Tilslut**.

Er begge tilsluttet, læses ledig/optaget fra begge, og eventet lægges i begge – men deltagerne inviteres kun fra
**hovedkalenderen**, så de ikke får to invitationer. Adgangsnøglerne gemmes krypteret (AES-GCM ud fra `SESSION_SECRET`).

## Næste skridt

- Flere betalingsmetoder (kort via Stripe; automatisk MobilePay kræver en erhvervsaftale med Vipps MobilePay)
- Upload af billeder direkte fra admin (fx Vercel Blob) – lige nu lægges billeder i `public/images/products/`
- E-mail til kunden når ordren skifter status
- Billeder til de 8 tjenester, der endnu bruger emoji-illustration
- Erstat eksempel-anmeldelserne med rigtige (knap i admin → Anmeldelser)
