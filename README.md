# olteng.no

Personlig portefølje og CV. Vue 3 + TypeScript + Tailwind, tospråklig (norsk / engelsk).

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # produksjonsbygg
npm run test:unit  # tester
npm run format     # prettier
```

## Hvor innholdet ligger

Nesten alt innhold ligger i to filer — du trenger sjelden å røre komponentene:

| Fil | Hva det styrer |
| --- | --- |
| `frontend/src/data/profile.ts` | Navn, kontaktinfo, forsidetekst, «Nå»-statusen, utdanning, erfaring, ferdigheter, språk |
| `frontend/src/data/projects.ts` | Alle prosjekter, inkludert de utfyllende prosjektsidene |
| `frontend/src/locales/{nb,en}.json` | Grensesnittekster (knapper, overskrifter, navigasjon) |

## Gjenstår å fylle ut

Alt som er merket `TODO` i `profile.ts` er plassholdere. De skjuler seg selv der
det går an — CV-siden skjuler dem i produksjonsbygg, og «Nå»- og «Utenfor
skjermen»-seksjonene forsvinner helt hvis alle oppføringene er tomme.

- [ ] **Portrettet.** Legg bildet i `frontend/public/portrett.jpg` — akkurat det filnavnet. Mangler filen, faller heroen tilbake til en typografisk boks i stedet for å vise et ødelagt bilde.
- [ ] Fyll inn `experience` — deltidsjobb, verv, studentassistent, frivillig arbeid. Ikke-teknisk erfaring teller også.
- [ ] Fyll inn videregående i `education`, eller slett oppføringen.
- [ ] Fyll inn `now` — hva du bygger og lærer akkurat nå. Oppdater den et par ganger i semesteret; det er det som viser at siden lever.
- [ ] Legg CV-PDF i `frontend/public/` og sett `profile.resumeUrl` — da dukker nedlastingsknappen opp.
- [ ] Bytt ut `offScreen` med noe som faktisk stemmer.
- [ ] Juster `skills` til det du faktisk kan. Du blir spurt om dette i intervju.

## Tone

Siden er skrevet om arbeidet, ikke om deg som kandidat. Ingen «søker sommerjobb»,
ingen «for arbeidsgivere» — bedrifter trekker sine egne slutninger av prosjektene.
Hold samme tone når du fyller inn resten: skriv hva du bygde og hva som var
vanskelig, ikke hva du er ute etter.

## Legge til et prosjekt

Kopier malen nederst i `projects.ts` og fyll inn. `size` styrer rekkefølgen
(`large` → `medium` → `small`), `type: 'live'` er for verktøy som kjører i
nettleseren, `type: 'showcase'` for prosjekter som beskrives på egen side.

Skriv om hva som var vanskelig og hva du lærte, ikke en funksjonsliste — det er
den delen en intervjuer faktisk spør om.

## Strømpris-verktøyet

Ligger på `/projects/strompris`. Henter spotpris fra det åpne API-et til
[hvakosterstrommen.no](https://www.hvakosterstrommen.no/strompris-api) — ingen
nøkkel, ingen backend, ingen grafpakke.

- `src/data/power.ts` — prisområder, henting, mva, landssnitt og statistikk. Alt er rene funksjoner så de kan testes uten nettverk.
- `src/data/norway.ts` — kartgeometri og Mercator-projeksjon.
- `src/components/power/PriceChart.vue` — håndtegnet SVG-graf.
- `src/components/power/NorwayMap.vue` — klikkbart kart fargelagt etter pris.
- `src/components/power/ZoneCompare.vue` — rangering av de fem områdene.
- `src/__tests__/power.spec.ts` og `norway.spec.ts` — tester på beregningene og geometrien.

**Om kartet:** omrisset er tegnet for hånd fra omtrentlige koordinater, ikke
hentet fra et kartverk. Det er gjenkjennelig som Norge, men fjorder og øyer er
utelatt og grensene mellom prisområdene er rette linjer. Vil du bytte til ekte
data, hent GeoJSON for prisområdene, konverter til `[lengdegrad, breddegrad]` og
erstatt `ZONE_RINGS` — projeksjonen og komponenten trenger ingen endring.

**Førstegangssjekk:** kjør `npm run dev`, åpne siden og se i nettleserkonsollen.
Skulle kallet bli blokkert av CORS, er den eneste endringen du trenger å peke
`API_BASE` i `power.ts` mot en proxy — resten av appen vet ikke forskjellen. En
Vite-proxy i `vite.config.ts` holder for lokal utvikling.

## Kontrastsjekkeren

Ligger på `/projects/kontrast`. WCAG-formlene er skrevet ut i `src/data/contrast.ts`,
ikke hentet fra en pakke.

Verktøyet reviderer siden det står på: det leser `--c-*`-variablene fra det
kjørende dokumentet med `getComputedStyle`, så tallene kan aldri komme i utakt
med designsystemet. Bytter du til mørk modus, måles alt på nytt.

Endrer du en farge i `main.css`, åpne siden og se på revisjonen nederst. Alle 48
kombinasjoner av tekstfarge og flate skal klare 4,5:1.

## Designsystem

Farger og typografi er definert ett sted: CSS-variabler i
`frontend/src/assets/main.css`, eksponert som Tailwind-tokens i
`tailwind.config.cjs`. Bruk de semantiske klassene (`bg-paper`, `text-ink`,
`text-muted`, `border-line`, `text-accent`) i stedet for Tailwind sine
standardfarger — da følger mørk modus av seg selv.

### Farger

Fire farger utover papir og blekk, og de betyr noe — de er ikke pynt:

| Farge | Kategori | Brukes på |
| --- | --- | --- |
| Iris (blålilla) | Språk | Java, TypeScript, Python, SQL |
| Leire (rustrød) | Rammeverk | Spring Boot, Vue, Pinia, JUnit |
| Furu (grønn) | Data og infrastruktur | PostgreSQL, Docker, JWT |
| Oker (gul) | Verktøy | Git, Vite, CI/CD |

Kategoriene ligger i `frontend/src/data/tech.ts`. Legger du til en teknologi som
ikke står der, blir brikken grå — det ser helt greit ut, men det tar ti sekunder
å plassere den riktig.

Hvert prosjekt har i tillegg en egen signaturfarge (`hue` i `projects.ts`), som
går igjen i radnummeret, hover-tilstanden og toppen av prosjektsiden.

Alle fire klarer 4,5:1 kontrast mot både papir- og kortbakgrunn i lys og mørk
modus. Endrer du en verdi, kjør kontrastsjekken på nytt før du publiserer.

Gjenbrukbare klasser: `.shell` (sidemarg), `.eyebrow` (liten monospace-etikett),
`.prose-column` (brødtekst), `.btn` + `.btn-solid` / `.btn-outline`, `.chip`,
`.link`, `.link-quiet`.

Typografi: Fraunces (overskrifter), IBM Plex Sans (brødtekst), IBM Plex Mono
(etiketter og metadata), lastet fra Google Fonts i `index.html`.
