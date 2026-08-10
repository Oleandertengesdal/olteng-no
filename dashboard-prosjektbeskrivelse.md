# dashboard.olteng.no — prosjektbeskrivelse

*Lim hele dette dokumentet inn i en ny Claude-økt for å starte prosjektet.*

---

## 0. Oppdraget

Du skal bygge **dashboard.olteng.no** — et dashbord for norske studenter som samler
verktøy, lenker og informasjon de trenger flere ganger om dagen.

Ikke en portefølje. Ikke en landingsside. Et **verktøy folk faktisk setter som
startside i nettleseren**, åpner tjue ganger om dagen, og savner den dagen det er
nede. Alt annet er underordnet det.

Bygges først som et testprosjekt på et subdomene. Skal kunne stå på egne bein som
en selvstendig tjeneste senere, så ikke lås arkitekturen til at det er et vedheng
til olteng.no.

**Målgruppe:** alle studenter i Norge. Ikke bare NTNU, ikke bare
dataingeniører. Instabart.no gjør dette for NTNU-studenter med lenker — dette skal
gjøre det for hele landet, og med verktøy i tillegg til lenker.

---

## 1. Absolutte krav

Disse er ikke til forhandling. Bryt dem, og prosjektet har bommet.

**Ingen emoji.** Ikke i grensesnittet, ikke i overskrifter, ikke som ikoner, ikke i
tomtilstander. Bruk typografi, form og farge i stedet. Trenger du et ikon, tegn en
enkel SVG med samme strektykkelse som resten.

**Det skal ikke se AI-generert ut.** Konkret betyr det: ikke standard
Tailwind-blått, ingen gradienter, ingen `shadow-lg` på kort, ingen `rounded-2xl`
overalt, ingen prosentbarer for ferdigheter, ingen «✨ Powered by»-formuleringer.
Bruk ekte typografi med karakter, hårfine skillelinjer framfor skygger, og et
rutenett som tåler å være asymmetrisk.

**Flere fargemoduser.** Minst fem, ikke bare lys og mørk. Alle skal være
behagelige å se på i timevis, og alle skal ha målt kontrast — ikke gjettet.

**Profesjonelt og lekent samtidig.** Det betyr rolig grunnstruktur med presise
detaljer, ikke sirkus. Leken skal ligge i bevegelse, i tall som teller opp, i
hover-tilstander med personlighet — ikke i knallfarger og runde hjørner.

**Norsk først, engelsk som alternativ.** Grensesnittet skal være tospråklig fra
dag én, med norsk som standard.

**Alt lokalt.** Ingen brukerkontoer, ingen server som lagrer noe, ingen sporing,
ingen informasjonskapsler. Alt brukeren legger inn bor i `localStorage`. Dette er
et løfte som skal stå skrevet på siden, og som arkitekturen må holde.

---

## 2. Teknisk grunnlag

Bruk **Vue 3 med `<script setup>`, TypeScript, Vite og Tailwind CSS 3**. Samme
stakk som olteng.no, slik at kode kan flyttes mellom prosjektene uten omskriving.

**Ingen tunge avhengigheter.** Ingen grafbibliotek — tegn SVG for hånd. Ingen
UI-bibliotek. Ingen ikonpakke. Ingen datobibliotek — `Intl` og `Date` holder.
Hver avhengighet du legger til skal du kunne forsvare i én setning.

**Ingen backend i første omgang.** Alt som kan kjøre i nettleseren, skal kjøre i
nettleseren. Trenger noe en server, skal det være tydelig avgrenset og kunne
skrus av uten at resten faller.

`vue-i18n` for språk. `vue-router` for ruter. Det er hele lista.

---

## 3. Arkitektur

### Widget-systemet

Dashbordet er et **rutenett av widgets** brukeren selv setter sammen. Hver widget
er selvstendig og vet ingenting om de andre.

```
src/
  widgets/
    <navn>/
      index.ts          definisjon: id, tittel, størrelser, kategori, ikon
      Widget.vue        selve visningen
      Settings.vue      innstillinger, valgfritt
      logic.ts          rene funksjoner — all logikk som kan testes uten DOM
      __tests__/
  data/                 delte datakilder og API-klienter
  design/               fargemoduser, tokens
  layout/               rutenett, dra-og-slipp, widget-velger
```

Hver widget registrerer seg med en definisjon:

```ts
export interface WidgetDefinition {
  id: string
  title: Bilingual
  description: Bilingual
  category: 'day' | 'study' | 'money' | 'life' | 'tools' | 'break'
  /** Hvilke størrelser widgeten fungerer i, i rutenettceller */
  sizes: { w: number; h: number }[]
  defaultSize: { w: number; h: number }
  /** Trenger den nett? Da må den ha en frakoblet tilstand. */
  needsNetwork: boolean
  component: () => Promise<Component>
}
```

**Krav til hver enkelt widget:**

- Den skal **feile alene**. Et API som er nede skal gi en rolig tilstand i den ene
  ruta, ikke tømme dashbordet. Bruk `Promise.allSettled`, aldri `Promise.all`.
- Den skal ha en **tom tilstand** som forklarer hva den gjør og hva den trenger.
- Den skal ha en **lastetilstand** som ikke hopper i layouten når data kommer.
- All logikk som kan skilles ut i rene funksjoner, **skal** skilles ut og testes.
- Den skal fungere i alle fargemodusene uten særtilfeller.

### Rutenett og oppsett

Responsivt rutenett med 12 kolonner på skrivebord, 6 på nettbrett, 2 på mobil.
Brukeren kan legge til, fjerne, endre størrelse på og flytte widgets. Oppsettet
lagres lokalt. Det skal finnes minst tre ferdige oppsett å starte fra — «Morgen»,
«Lesesal», «Alt» — slik at en ny bruker møter noe fornuftig og ikke en tom side.

Dra-og-slipp skal ha et tastaturalternativ. Er det for komplisert å få til godt,
lag heller opp/ned/venstre/høyre-knapper i redigeringsmodus enn å droppe det.

### Lagring

Én modul eier all lagring, med versjonsnummer i nøkkelen (`dashboard.v1.layout`).
Den skal tåle at data er ødelagt eller fra en eldre versjon uten å krasje — feiler
parsingen, start på nytt med standardoppsettet.

Legg inn **eksport og import av alt** som en JSON-fil. Det er brukerens data, de
skal kunne ta dem med seg, og det er den eneste sikkerhetskopien som finnes når
det ikke er noen server.

---

## 4. Designsystem

### Fargemoduser

Bygg alt på CSS-variabler i `:root`, byttet ut per modus via et `data-theme`-attributt.
Aldri hardkodede farger i komponenter — bare semantiske Tailwind-tokens som peker
på variablene.

Semantiske navn, ikke fargenavn:

```
--c-paper      sidebakgrunn
--c-surface    kortbakgrunn
--c-raised     hevet flate
--c-ink        brødtekst
--c-muted      sekundær tekst
--c-faint      små etiketter
--c-line       hårfine skillelinjer
--c-accent     interaktiv farge
--c-positive / --c-warning / --c-critical
```

**Minst fem moduser:**

| Modus | Karakter |
| --- | --- |
| Papir | Varm off-white, blekksvart tekst. Standard om dagen. |
| Natt | Dyp varm mørk, ikke ren svart — ren svart gir etterbilder på OLED. |
| Skog | Dempet grønn-grå, rolig, for lange økter. |
| Hav | Kjølig blågrå, høyere klarhet. |
| Kontrast | Maksimal lesbarhet, alt over 7:1. For dem som trenger det. |

La brukeren velge, og la «følg systemet» være et eget valg som veksler mellom
Papir og Natt.

**Kontrast måles, ikke gjettes.** Skriv et lite skript som går gjennom alle
kombinasjoner av tekstfarge og flate i alle moduser og feiler bygget hvis noe
ligger under kravet. Husk at 11 px-etiketter er vanlig tekst og krever 4,5:1 —
ikke 3:1. Den feilen er lett å gjøre og usynlig for øyet.

### Typografi

Tre skrifter, hver med en jobb:

- **Display** — en serif eller en sans med tydelig karakter, til overskrifter og
  store tall. Ikke Inter. Ikke systemfonten.
- **Brødtekst** — noe rolig og godt lesbart i små størrelser.
- **Monospace** — til tall, etiketter, klokkeslett og alt som skal stå i kolonne.

Tall som endrer seg (klokke, nedtelling, priser) skal bruke `font-variant-numeric:
tabular-nums`, ellers hopper de sidelengs.

### Bevegelse

Bevegelse skal betyr noe, ikke pynte.

- Innhold som kommer inn ved scroll: kort forskjøvet oppglidning.
- Tall som endrer seg: myk overgang, ikke hopp.
- Hover: farge og posisjon, aldri størrelse på hele kort.
- **`prefers-reduced-motion` skal respekteres overalt.** Er den på, hopper alt
  rett til sluttilstanden.

### Ikoner

Tegn dem selv som SVG med `stroke-width` 1,5 og `currentColor`. Én stil gjennom
hele siden. Trenger du mange, lag et lite sett og gjenbruk — ikke dra inn en pakke
med 5 000 ikoner for å bruke tolv.

---

## 5. Widget-katalogen

Dette er hele omfanget. Bygg i den rekkefølgen som står i avsnitt 9, ikke alt på
én gang.

### A. Dagen din

**A1 · Klokke og dato**
Klokkeslett, dato, ukenummer. Ukenummer fordi norske studieplaner og timeplaner
opererer i uker. Vis også hvilken studieuke i semesteret det er.

**A2 · Vær**
Nå, føles som, og de neste tolv timene som en liten kurve. Nedbør markert.
Stedsvalg med søk, lagres lokalt. Kilde: Open-Meteo (se avsnitt 7).

**A3 · Neste avganger**
Sanntidsavganger fra valgt holdeplass. Linje, destinasjon, minutter til, og om
den er forsinket. Kilde: Entur. Lagre to–tre favoritt-holdeplasser.

**A4 · Timeplan i dag**
Importer `.ics` fra TimeEdit eller lærestedets kalender, vis dagens forelesninger
med rom og klokkeslett. **Parse ICS selv** — formatet er enkelt, og et bibliotek
er unødvendig. Håndter gjentakende hendelser (`RRULE`) minst for ukentlige.

**A5 · Nedtellinger**
Til neste eksamen, til innleveringsfrist, til semesterslutt, til hva enn brukeren
legger inn. Dager, og timer når det er under et døgn.

**A6 · Dagens leseplan**
Henter fra eksamensplanleggeren (B1) og viser hva dagen skal brukes til. Trykk
for å starte lesetimeren.

### B. Studie

**B1 · Eksamensplanlegger**
Legg inn emner med dato og studiepoeng. Fordeler lesebolker per dag, vektet etter
`studiepoeng / dager igjen til eksamen`, slik at tyngdepunktet flytter seg av seg
selv når en eksamen nærmer seg. Del ut hele bolker og gi restene til dem som tapte
mest på avrundingen — største-rest-metoden.

**B2 · Lesetimer**
Nedtelling til neste pause med alarm. **Timeren skal ikke telle ned** — den skal
lagre tidspunktet fasen er ferdig og regne ut gjenstående tid fra klokka ved hver
oppdatering. En `setInterval` som trekker fra ett sekund drifter, og nettlesere
struper tidtakere i bakgrunnsfaner, som er nøyaktig der en lesetimer befinner seg
mens noen leser.

Alarm med Web Audio (generert tone, ingen lydfil), varsel via Notification API,
nedtelling speilet i fanetittelen. Lengder skal være konfigurerbare, og standarden
skal ikke være 25/5 — det er en konvensjon noen fant på, ikke et forskningsresultat.
45/10 er et bedre utgangspunkt for tung lesing, og si det i grensesnittet.

**B3 · Karaktersnitt**
Vektet etter studiepoeng, ikke et rent gjennomsnitt av bokstavene. A=5 til E=1,
F=0. Bestått/ikke bestått utenfor snittet, men studiepoengene teller. Målkalkulator:
«hva må jeg ha på de neste 60 studiepoengene for å ende på B». Lim-inn-import som
tolker det man får fra Studentweb eller et regneark, med feltgjenkjenning etter
form og ikke etter kolonnerekkefølge.

**B4 · Studiepoeng mot graden**
Hvor mange studiepoeng er tatt, hvor mange gjenstår, hvor mange semestre er igjen
i normert tid. En enkel framdriftsvisning som faktisk motiverer.

**B5 · Flashcards**
Med SM-2-algoritmen for spaced repetition — den er rundt femti linjer og lar seg
teste grundig. Importer kort fra markdown (`spørsmål :: svar` per linje). Vis
hvor mange kort som skal repeteres i dag.

**B6 · Kildehenvisning**
Generer referanser i APA 7, IEEE og Vancouver. Skjema for bok, artikkel, nettside
og rapport. Kopier til utklippstavla. Dette bruker studenter konstant, og de
eksisterende gratistjenestene er fulle av reklame.

**B7 · Notatlenker**
Enkel lenkesamling til egne notater, mapper og dokumenter, med søk. Ikke et
notatprogram — bare veien inn til det du allerede har.

### C. Penger

**C1 · Lånekasse-kalkulator**
Hvor mye av basislånet blir stipend. 15 % for beståtte studiepoeng
forholdsmessig, 25 % for fullført grad, ingenting hvis man bor hjemme hos
foreldrene. Inntektstrekk over fribeløpet. **Alle satser i én blokk med årstall og
kildelenke** — de endres hvert studieår, og en kalkulator med utdaterte tall er
verre enn ingen kalkulator.

**C2 · Fribeløp-teller**
Hvor mye kan jeg tjene resten av året før stipendet reduseres. Legg inn inntekt så
langt, få igjen hvor mye som er igjen av fribeløpet og hva det koster å gå over.

**C3 · Strømpris**
Spotpris time for time i alle fem prisområder, med kart over Norge, sammenligning
mot landssnittet og markering av billigste timer. Husk: prisene er uten mva i
kilden, NO4 er fritatt for mva, morgendagens priser slippes tidligst kl. 13, og
et døgn har 23 eller 25 timer ved sommertidsovergang.

**C4 · Spleis**
Del utgifter i en gruppe. Den interessante delen er ikke summeringen, men å
**minimere antall overføringer** — «alle skylder alle» redusert til færrest mulig
betalinger. Det er et grafproblem og verdt å gjøre ordentlig.

**C5 · Månedsbudsjett**
Inn: Lånekassen, jobb, støtte. Ut: husleie, mat, transport, abonnementer. Hva står
igjen per dag resten av måneden. Enkelt, men det er tallet studenter faktisk lurer
på den 20. i måneden.

**C6 · Feriepenger**
Hva får jeg utbetalt til sommeren, gitt fjorårets inntekt og sats.

### D. Hverdag

**D1 · Handleliste**
Med kategorier som følger butikkens rekkefølge, og huking som ikke krever presisjon
på mobil.

**D2 · Kollektivoppgaver**
Vask, søppel, oppvask — med rotasjon mellom personer og hvem sin tur det er nå.
Lokal, men med delbar lenke som koder tilstanden i URL-en, siden det ikke finnes
noen server.

**D3 · Middagsplan**
Uka framover, med handleliste som faller ut av det.

**D4 · Promillekalkulator**
Widmark med opptak over tid og et ærlig usikkerhetsspenn. **Skal svare på når
alkoholen er ute av kroppen — ikke på om man kan kjøre.** Ingen «hvor mye mer
tåler jeg»-funksjon. Det er nøyaktig den bruken som gjør slike kalkulatorer
farlige, og et anslag med ±30 % usikkerhet er ubrukelig til formålet uansett.
Skriv det rett ut i grensesnittet.

**D5 · Enhetsomregner**
Vekt, volum, lengde, temperatur, og de som faktisk trengs på kjøkkenet — dl til
gram for vanlige ingredienser.

**D6 · Prosent og rabatt**
Hva er 30 % av dette, hva var det før avslaget, hvor mye sparte jeg.

### E. Verktøy

For studenter på tekniske fag, men nyttige for flere enn man skulle tro.

**E1 · JSON ↔ CSV** — konverter begge veier, alt lokalt.
**E2 · Kontrastsjekker** — WCAG-forhold mellom to farger, med forslag til nærmeste farge som består.
**E3 · Base64, URL og JWT** — kode, dekode, inspisere. Aldri send noe ut av nettleseren.
**E4 · Regex-tester** — med treff markert og forklaring av gruppene.
**E5 · Tekstdiff** — implementer Myers-algoritmen selv framfor å dra inn en pakke.
**E6 · QR-generator** — implementer spesifikasjonen, ikke et bibliotek. Reed-Solomon-feilretting er den interessante delen.
**E7 · Passordgenerator** — med entropiberegning i biter, og en ærlig forklaring av hva tallet betyr.
**E8 · Cron-forklarer** — oversett et cron-uttrykk til norsk og vis de neste kjøringene.

### F. Pauser

Små spill for de fem minuttene mellom to lesebolker. **Kvalitetskravet er det
samme som for resten av siden** — de skal se ut som de hører hjemme, ikke som
noe som er limt inn.

**F1 · Minesveiper** — tre vanskelighetsgrader, tastaturstøtte, bestetid lokalt.
**F2 · Snake** — jevn bevegelse, ikke rutehopping. Piltaster og swipe.
**F3 · 2048** — med animerte forflytninger og angre-knapp.
**F4 · Ordle** — ordgjetting på norsk, ett ord om dagen, delbart resultat uten emoji (bruk tegn som `■ □ ▨`).
**F5 · Sudoku** — med generator, hintfunksjon og notatmodus.
**F6 · Tetris** — hvis du får til at det føles riktig. Gjør du ikke det, la være.

**Felles krav til spillene:**
- Samme fargesystem som resten av siden, i alle moduser.
- Tastaturet skal alltid virke. Mus og berøring i tillegg.
- Pause når fanen mister fokus.
- Bestetider lagres lokalt, ingen rangeringsliste, ingen konto.
- De skal kunne avsluttes på ti sekunder. Dette er pauser, ikke tidstyver.

---

## 6. Lenkekatalogen

Dette er instabart-delen, og den er halve verdien av dashbordet.

**Kjernegrepet: velg lærested, og hele lenkesettet bytter.** En student ved UiB
skal ikke se NTNU-lenker. Dette skal være det første man gjør, og valget lagres.

Dekk minst: NTNU, UiO, UiB, UiT, OsloMet, NMBU, UiS, Nord, HVL, USN, INN, Høyskolen
Kristiania, BI, UiA. Lag strukturen slik at flere kan legges til uten kodeendring —
en datafil per lærested.

```ts
export interface Institution {
  id: string
  name: string
  shortName: string
  city: string[]
  links: LinkGroup[]
}

export interface LinkGroup {
  label: Bilingual
  links: { label: string; url: string; note?: Bilingual }[]
}
```

**Grupper som bør finnes for hvert lærested:**

- **Studier** — læringsplattform (Blackboard, Canvas, itslearning), Studentweb, timeplan, eksamenssystem (Inspera), emnesøk
- **Praktisk** — e-post, VPN, utskrift, IT-hjelp, Feide-innlogging, wifi-oppsett
- **Bibliotek** — søk, romreservasjon, fjernlån, kildehjelp
- **Campus** — kart, kantinemeny, åpningstider, lesesaler, treningssenter
- **Studentliv** — studentsamskipnad, bolig, helsetjeneste, linjeforeninger, studentavis, idrettslag
- **Nasjonalt** — Lånekassen, Samordna opptak, Vitnemålsportalen, Studentsamskipnadene, Skatteetaten, Altinn, Helsenorge, NAV

Hver lenke skal ha en kort merknad på hva den faktisk er til, siden halvparten av
lærestedenes systemer har navn som ikke sier noe.

**Søk over alle lenker** med tastatursnarvei. Det er slik folk kommer til å bruke
det når de først har lært seg det.

Legg inn en enkel måte å foreslå manglende lenker — en forhåndsutfylt e-post eller
en GitHub-issue-lenke. Katalogen blir bare god hvis andre kan rette den.

---

## 7. Datakilder

Alle er gratis og krever ingen nøkkel. **Fallgruvene under er reelle og
verifiserte — les dem før du velger kilde.**

| Kilde | Til hva | Vilkår og fallgruver |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com/) | Vær | CORS er på, ingen nøkkel, gratis til ikke-kommersiell bruk, CC BY 4.0. **Bruk denne til vær.** |
| [MET Norway](https://api.met.no/) | Vær | Gratis under CC, men **krever en identifiserende `User-Agent`**. Den kan ikke settes fra en nettleser — det er en forbudt header i `fetch`. Kan altså ikke brukes klientside uten proxy. |
| [Entur](https://developer.entur.no/apis/open) | Kollektiv | Åpent GraphQL-API under NLOD. **Krever `ET-Client-Name`-header** — den er tillatt fra nettleser. Bruk `olteng-dashboard`. |
| [Hva koster strømmen](https://www.hvakosterstrommen.no/strompris-api) | Strømpris | Statisk JSON per døgn og prisområde, ingen nøkkel. Priser uten mva, NO4 fritatt, morgendagen først kl. 13, 404 er en forventet tilstand. Be om å få kreditere dem. |

**Regler for all datahenting:**

- **Cache aggressivt.** Vær og strømpris endrer seg ikke hvert sekund. Lagre svar
  med tidsstempel og gjenbruk. Disse tjenestene er gratis — vær grei.
- **Feil isolert.** Én kilde nede skal aldri påvirke andre widgets.
- **Frakoblet tilstand.** Vis sist kjente data med tidsstempel framfor en tom rute.
- **Krediter kilden** der de ber om det.

---

## 8. Kvalitetskrav

**Tester.** All logikk som kan skilles fra DOM-en skal ligge i rene funksjoner med
tester. Fordelingsalgoritmer, kontrastberegning, ICS-parsing, gjeldsforenkling,
SM-2, spillregler. Tester på komponenter er valgfritt; tester på regnestykker er det ikke.

**Tilgjengelighet.**
- Alt skal kunne betjenes med tastatur, inkludert spillene og widget-flyttingen.
- Synlig fokusmarkering overalt.
- `prefers-reduced-motion` respekteres.
- Målt kontrast i alle moduser, som skript i byggesteget.
- Skjermlesertekst der informasjon bare formidles visuelt — grafer, kart, farger.

**Ytelse.**
- Hver widget lastes dynamisk. Åpner du ikke Minesveiper, laster du den ikke.
- Ingen widget skal blokkere første tegning.
- Rutenettet skal ikke hoppe når data kommer inn — reserver plassen.

**Ærlighet i tallene.**
- Er noe et anslag, si det.
- Endres satser årlig, vis hvilket år tallene gjelder for.
- Er en kilde forenklet eller skjematisk, skriv det i klartekst.
- Rund aldri opp slik at noe ser ut til å bestå en grense det ikke består.

---

## 9. Byggerekkefølge

Ikke bygg alt på én gang. Rekkefølgen er valgt slik at det er noe brukbart etter
hver etappe.

**Etappe 1 — grunnmur**
Prosjektoppsett, fargemodusene med kontrastskript, typografi, rutenett, widget-registeret,
lagring med eksport/import, språkbytte. Én enkel widget (klokke) for å bevise at
alt henger sammen.

**Etappe 2 — dagen**
Vær, avganger, nedtellinger, timeplan fra ICS. Nå er dashbordet verdt å åpne om
morgenen.

**Etappe 3 — lenkekatalogen**
Lærestedsvelger, lenkegrupper for de fem største, søk. Nå er det verdt å sette som
startside.

**Etappe 4 — studie**
Eksamensplanlegger, lesetimer, karaktersnitt. Nå er det verdt å åpne i
eksamensperioden.

**Etappe 5 — penger**
Lånekassen, strømpris, fribeløp, spleis.

**Etappe 6 — resten**
Verktøy, hverdag, flere læresteder.

**Etappe 7 — pauser**
Spillene. Til slutt, fordi de er det morsomste å bygge og derfor det som stjeler
tid fra alt annet hvis de kommer først.

---

## 10. Slik skal det ikke se ut

En kort liste over feil som er lette å gjøre og vanskelige å angre.

- Kort med skygge på farget bakgrunn med avrundede hjørner og et emoji-ikon øverst
- Standard Tailwind-blått som aksentfarge
- Gradienter i overskrifter
- «Velkommen tilbake, bruker!» som hilsen
- Ferdighetsbarer, prosentringer og annen pynt som ser ut som data uten å være det
- Widgets som viser en tom firkant når API-et er nede
- Animasjoner som kjører selv om brukeren har bedt om mindre bevegelse
- Tekst i 11 px med 3:1 kontrast fordi noen trodde små etiketter teller som grafikk
- Et bibliotek dratt inn for noe som er femti linjer
- Tall med to desimaler på noe som egentlig er et grovt anslag

---

## 11. Første leveranse

Start med etappe 1. Når den er ferdig, vil jeg se:

1. Dashbordet med klokke-widgeten i alle fem fargemodusene
2. Kontrastskriptet som kjører og rapporterer
3. Widget-registeret med én widget registrert, og en tom widget-velger som viser
   hvordan flere legges til
4. Eksport og import av oppsettet
5. En kort beskrivelse av hva du valgte og hvorfor, særlig der du gjorde noe
   annerledes enn beskrivelsen her

Still spørsmål underveis der beskrivelsen er uklar eller der du mener et annet
valg er bedre. Beskrivelsen er utgangspunktet, ikke fasit — men avvik skal være
bevisste og begrunnet, ikke tilfeldige.
