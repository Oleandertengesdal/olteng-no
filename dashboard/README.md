# dashboard.olteng.no

Et dashbord for studenter i Norge. Verktøy, lenker og informasjon samlet på én
side — laget for å settes som startside og åpnes tjue ganger om dagen.

Alt lagres i brukerens egen nettleser. Ingen konto, ingen server, ingen
sporing, ingen informasjonskapsler.

**Status: etappe 3 av 7 — lenkekatalogen.** Dashbordet er verdt å åpne om
morgenen, og verdt å sette som startside: klokke, vær, sanntidsavganger,
timeplan, nedtellinger — og 112 lenker til systemene ved fem læresteder, med
søk fra hvor som helst.

---

## Kom i gang

```bash
npm install
npm run dev
```

Andre kommandoer:

| Kommando             | Hva den gjør                                                    |
| -------------------- | --------------------------------------------------------------- |
| `npm run themes`     | Genererer `src/design/themes.css` fra `src/design/themes.ts`      |
| `npm run contrast`   | Måler kontrast i alle fem moduser, feiler hvis noe er under kravet |
| `npm run type-check` | `vue-tsc`, inkludert alle `.vue`-filer                            |
| `npm test`           | Vitest                                                            |
| `npm run check`      | Alle fire i rekkefølge                                            |
| `npm run build`      | Kjører `themes` og `contrast` først, så typesjekk og bygg          |

Kontrastskriptet er koblet på `prebuild`. Et bygg med en farge under kravet
finnes ikke.

---

## Arkitektur

```
scripts/            byggeskript — kjøres av Node direkte, uten avhengigheter
src/
  data/             lagring, felles typer
  design/           fargemoduser, kontrastmatematikk, typografi
  layout/           rutenett, oppsett, ferdigoppsett, widget-velger
  widgets/          én mappe per widget
    <navn>/
      index.ts        definisjon: id, tittel, størrelser, kategori, ikon
      Widget.vue      visningen
      Settings.vue    innstillinger, valgfritt
      logic.ts        rene funksjoner — all logikk som kan testes uten DOM
      __tests__/
  components/       delte komponenter og ikonsettet
  views/            ruter
```

### Widgets

En widget vet ingenting om de andre. Den registreres i `widgets/registry.ts`
med en definisjon, og selve komponenten ligger bak en dynamisk import — åpner
du ikke Minesveiper, laster du den ikke.

Krav til hver widget:

- **Den feiler alene.** `WidgetFrame` fanger opp at en widget ikke lar seg
  laste og viser en rolig tilstand i den ene ruta. Datahenting skal bruke
  `Promise.allSettled`, aldri `Promise.all`.
- **Den har en tom tilstand** som forklarer hva den gjør og hva den trenger.
- **Den har en lastetilstand** som ikke hopper i layouten. Radhøyden i
  rutenettet er fast (`--row-height`), så plassen er reservert på forhånd.
- **Logikken ligger i `logic.ts`** som rene funksjoner, med tester.
- **Den virker i alle fem fargemodusene** uten særtilfeller, fordi den bare
  bruker semantiske tokens.

### Widgets så langt

| Widget           | Kategori | Nett | Kilde                             |
| ---------------- | -------- | ---- | --------------------------------- |
| Klokke og dato   | Dagen    | Nei  | —                                  |
| Vær              | Dagen    | Ja   | Open-Meteo                         |
| Neste avganger   | Dagen    | Ja   | Entur JourneyPlanner v3            |
| Timeplan i dag   | Dagen    | Nei  | .ics-fil brukeren legger inn selv  |
| Nedtellinger     | Dagen    | Nei  | —                                  |
| Lenker           | Verktøy  | Nei  | Lenkekatalogen                     |

### Lenkekatalogen

Instabart-delen av prosjektet, og halve verdien av dashbordet. Kjernegrepet:
velg lærested, og hele lenkesettet bytter. En student ved UiB skal ikke se
NTNU-lenker.

Katalogen bor på `/lenker`, og det som brukes daglig festes i en widget på
dashbordet. Søket ligger over begge og åpnes med skråstrek eller Ctrl/Cmd + K
fra hvor som helst.

| Lærested | Lenker | Studiested                        |
| -------- | ------ | --------------------------------- |
| NTNU     | 30     | Trondheim, Gjøvik, Ålesund        |
| UiO      | 19     | Oslo                              |
| OsloMet  | 18     | Oslo, Lillestrøm                  |
| UiB      | 18     | Bergen                            |
| UiT      | 18     | Tromsø, Alta, Narvik, Harstad     |
| Nasjonalt| 9      | Felles for alle                   |

Én datafil per lærested under `src/data/links/`. Et nytt lærested er én fil og
én linje i `index.ts` — ingen kodeendring, som kravet var.

`note` er påkrevd i typen, ikke valgfri. Halvparten av lærestedenes systemer
heter noe som ikke sier noe — Inspera, Leganto, Oria, TP — og en lenke uten
forklaring er en lenke man ikke tør trykke på. Kravet håndheves av typen og av
en test, ikke av god vilje.

Søket folder æ, ø og å til ae, o og a, slik at «lanekassen» finner Lånekassen.
Nøkkelord gjør at «eksamen» finner Inspera og «psykolog» finner
helsetjenestene — ingen husker hva systemene heter.

### Datakilder

`src/data/remote.ts` eier all henting utenfra, og `useRemote` gjør den om til
tilstand. Tre regler gjelder alle widgets som snakker med noen andre:

Cache aggressivt. Været har en halvtimes levetid, sanntidsavganger 45 sekunder.
Ligger fanen i bakgrunnen, hentes ingenting i det hele tatt — ingen ser svaret,
og kilden er gratis.

Feil isolert. `fetchJson` og `postJson` kaster aldri; feil kommer tilbake som en
verdi med en type, og TypeScript tvinger widgeten til å håndtere den.

Feil erstatter aldri data. Har vi et halvgammelt svar og en ny forespørsel
feiler, blir det gamle stående med tidsstempel og en merknad om at det er
gammelt. Å bytte ut noe som er litt utdatert med en feilmelding gjør
situasjonen verre enn den er.

| Kilde      | Til hva    | Vilkår                                                       |
| ---------- | ---------- | ------------------------------------------------------------ |
| Open-Meteo | Vær        | Ingen nøkkel, CORS på, CC BY 4.0, ikke-kommersiell bruk      |
| Entur      | Kollektiv  | NLOD, ingen nøkkel, krever headeren `ET-Client-Name`          |

MET Norway er ikke brukt, selv om den ellers ville vært den opplagte
værkilden i Norge: MET krever en identifiserende `User-Agent`, og `User-Agent`
er en forbudt header i `fetch`. Nettleseren nekter å sette den. MET kan altså
ikke brukes klientside uten en proxy, og en proxy er en server.

### ICS

`src/data/ics.ts` leser kalenderfiler. Ingen pakke, fordi de fire vanskelige
tingene i en timeplan-ICS er alle små nok til å skrives — og alle steder man
må forstå hva som skjer for å stole på resultatet: linjebretting, tidssoner,
gjentakelser og escaping.

Tidssoner løses uten en tidssonedatabase ved å bruke `Intl` baklengs:
formater en instans i sonen, les av feltene, lat som de var UTC, og
differansen *er* forskyvningen. To runder holder for alle overganger på én
time.

Gjentakelser regnes i kalenderdager på veggklokka, ikke i millisekunder. En
forelesning tirsdag 08:15 skal være 08:15 også uken etter at klokka ble
stilt — regner man i millisekunder, flytter hele timeplanen seg en time i
slutten av mars.

`FREQ=WEEKLY` og `FREQ=DAILY` foldes ut med `INTERVAL`, `BYDAY`, `COUNT`,
`UNTIL` og `EXDATE`. Månedlige og årlige regler vises bare første gang, og
widgeten sier hvor mange det gjelder framfor å utelate dem stille.

### Fargemoduser

`src/design/themes.ts` er eneste kilde til sannhet for farge. Derfra
genereres `themes.css`, og derfra måles kontrasten. Ingen komponent skriver en
fargeverdi selv.

Tailwind-oppsettet **erstatter** fargepaletten framfor å utvide den. `bg-blue-500`
finnes ikke i dette prosjektet — den eneste veien til en farge går gjennom en
semantisk variabel. `boxShadow`, `dropShadow`, `backgroundImage` og
`gradientColorStops` er slått av av samme grunn: verktøyklasser som finnes,
blir brukt.

| Modus    | Karakter                                      | Krav  |
| -------- | --------------------------------------------- | ----- |
| Papir    | Varm off-white, blekksvart tekst. Standard.    | 4,5:1 |
| Natt     | Dyp varm mørk, ikke ren svart                  | 4,5:1 |
| Skog     | Dempet grønn-grå, for lange økter              | 4,5:1 |
| Hav      | Kjølig blågrå, høyere klarhet                  | 4,5:1 |
| Kontrast | Maksimal lesbarhet                             | 7:1   |

115 kombinasjoner måles ved hvert bygg.

### Lagring

`src/data/storage.ts` eier all lagring. Versjonen står i nøkkelen
(`dashboard.v1.layout`), ikke i verdien. Ødelagte data forkastes framfor å
kaste, og alt kan eksporteres og importeres som én JSON-fil — det er den
eneste sikkerhetskopien som finnes når det ikke er noen server.

---

## Avhengigheter

Hver av dem, forsvart i én setning:

| Pakke                          | Hvorfor                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `vue`                          | Rammeverket.                                                     |
| `vue-router`                   | To ruter i dag, flere senere.                                    |
| `vue-i18n`                     | Tospråklig fra dag én.                                           |
| `@fontsource*`                 | Skriftfiler, ikke kode — selvhostet så ingen tredjepart ser brukerens IP. |

Det er hele lista. Ingen grafbibliotek, ingen UI-bibliotek, ingen ikonpakke,
ingen datobibliotek, ingen tilstandsbibliotek. Ikonene er tegnet i
`src/components/icons.ts`, kontrastmatematikken står i `src/design/contrast.ts`,
og dato- og tidsformatering går gjennom `Intl`.

Byggeskriptene under `scripts/` kjøres av `node` direkte. Node 22 stripper
typene selv, så de koster ingen kjøretid og ingen avhengighet.

---

## Valg som avviker fra prosjektbeskrivelsen

**Rutenettet pakkes ikke tett.** Beskrivelsen ba om dra-og-slipp med et
tastaturalternativ. Tett pakking («dense») ser penere ut på en skjermdump, men
gjør at en widget hopper til et hull man ikke ser, og da er tastaturflytting
umulig å forstå. Rutenettet fyller derfor rader i rekkefølge. Både pekeren og
piltastene gjør nøyaktig det samme.

**Størrelse endres i steg, ikke fritt.** Hver widget oppgir hvilke former den
fungerer i. En bruker som kan dra en klokke til 1×5 har fått muligheten til å
ødelegge sitt eget dashbord uten å ville det.

**Skriftene er de samme som olteng.no, men selvhostet.** olteng.no henter dem
fra Google Fonts. Det går ikke her: siden lover at ingenting forlater
nettleseren, og et løfte som brytes av en fontlenke i `<head>` er ikke et
løfte. Fontfilene kommer fra npm og pakkes med bygget.

**`--c-faint` i Hav-modus ble mørknet.** Den startet på `93 109 125`, som
målte 4,3:1 mot `--c-raised`. Fargen så fin ut. `--c-faint` brukes til 11 px
etiketter, og 11 px er vanlig tekst med krav på 4,5:1 — ikke 3:1. Nøyaktig den
feilen kontrastskriptet finnes for.

**Ferdigoppsettene beskriver dashbordet slik det skal bli.** «Morgen» viser til
fem widgets; én av dem finnes. Ukjente id-er lukes bort når oppsettet bygges,
og velgeren sier hvor mange av dem som finnes ennå. Alternativet — å la
listene inneholde bare det som er ferdig — ville skjult at prosjektet er i
etappe 1, og krevd at filen ble oppdatert for hver nye widget.

**Studieuken er merket som anslag i grensesnittet.** Semesterukene er typiske
for norske læresteder, ikke fasit, og et lærested kan flytte semesterstart et
år. En studieuke som er én uke feil er verre enn ingen studieuke — med mindre
brukeren vet det og kan rette den i innstillingene.

**Klokken teller ikke ned.** Den planlegger hver oppdatering til neste
sekundskifte og leser klokka på nytt hver gang, framfor å telle fra en
starttilstand. Samme prinsipp som lesetimeren i etappe 4 skal bruke: en
`setInterval` som trekker fra ett sekund drifter, og nettlesere struper
tidtakere i bakgrunnsfaner.

**Værkurven er tegnet med rette linjer, ikke som en myk spline.** En glattet
kurve ser bedre ut og finner opp verdier mellom målepunktene — den ville vist
en topp på 8,3 grader klokka halv tre som ingen har varslet. Temperaturaksen
har også et gulv på fire graders spenn, slik at en flat dag ikke blir tegnet
som en fjellkjede.

**Minutter til avgang rundes ned.** En buss som går om 89 sekunder står som
«1 min», ikke «2 min». Å runde til nærmeste gir et halvt minutt man ikke har.
Over en time byttes minutter mot klokkeslett, fordi «73 min» er et tall ingen
klarer å gjøre noe med.

**Nedtellinger teller kalenderdager, ikke døgn.** Mandag klokka 23 til torsdag
klokka 09 er under 58 timer, men det er tre dager til eksamen. Regningen går
via UTC-normaliserte datoer nettopp fordi UTC-døgn alltid er 24 timer — ellers
bommer nedtellingen i dagene rundt de to overgangene i året.

**Timeplan fra abonnementslenke er tilbudt, men fil er hovedveien.** De fleste
læresteder sender ikke CORS-headere, og da får ikke nettleseren lov til å lese
svaret uansett hva vi gjør. Widgeten sier det rett ut med hva man gjør i
stedet, framfor å gjette på en teknisk årsak. Alternativet — en server som
henter lenken på vegne av nettleseren — ville løst problemet og gjort
personvernløftet lengre og mindre sant.

**Lenkekatalogen bærer en gjennomgangsdato, ikke en lenkesjekk.** Hvert
lærested har en `reviewed`-dato som vises nederst på siden, og etter seks
måneder — omtrent et semester — sier siden fra at noe kan ha endret seg.
«Gjennomgått» betyr kontrollert mot lærestedets egne sider, ikke at en maskin
har pinget adressene. Det er en svakere påstand og en sannere en: en lenke kan
svare 200 og likevel peke på et system som ble lagt ned i fjor. Et
lenkesjekker-skript ble vurdert og valgt bort, fordi mange læresteder svarer
403 på forespørsler uten nettleser og skriptet dermed ville rapportert falske
feil.

**Katalogen foretrekker inngangssider framfor dype lenker.** Der jeg kunne
verifisere en dyp adresse, står den. Der jeg ikke kunne, står lærestedets egen
samleside med en merknad om hva du finner der. En inngangsside som er riktig
er bedre enn en dyplenke som var riktig i fjor — og NTNU-katalogen er den
mest komplette nettopp fordi NTNU publiserer hele sitt sidekart på ett sted.

**UiT bruker WISEflow, ikke Inspera.** Det er den vanligste feilantakelsen om
UiT i en slik katalog, og den slags feil er verre enn en manglende lenke: den
sender folk til feil sted den dagen de har det travelt. Fire av fem læresteder
bruker Inspera, og det er akkurat derfor det femte er lett å ta feil av.

**NTNU er midt i et plattformbytte, og katalogen sier det.** Blackboard stenger
1. oktober 2026, Canvas overtok høsten 2026. Begge står i katalogen med hver
sin merknad, fordi «dette systemet byttes ut» er den nyttigste opplysningen på
siden den dagen det skjer. `warning`-feltet i lenketypen finnes for dette.

**Entur-spørringen er holdt minimal.** Bare felter som har vært i v3-skjemaet
siden lansering, og ingen argumenter utover de to som trengs. Et GraphQL-API
svarer med feil på hele spørringen hvis ett felt er skrevet feil, så hvert
felt man ikke trenger er en måte hele widgeten kan slutte å virke på.

---

## Videre

| Etappe | Innhold                                                    |
| ------ | ---------------------------------------------------------- |
| 1      | Grunnmur — **ferdig**                                       |
| 2      | Vær, avganger, nedtellinger, timeplan fra ICS — **ferdig**  |
| 3      | Lenkekatalogen — lærestedsvelger, søk — **ferdig**          |
| 4      | Eksamensplanlegger, lesetimer, karaktersnitt                |
| 5      | Lånekassen, strømpris, fribeløp, spleis                     |
| 6      | Verktøy, hverdag, flere læresteder                          |
| 7      | Pauser                                                      |

Flere av widgetene i etappe 4 og 5 har allerede fungerende, testet logikk i
`../frontend/src/data/` — `lanekassen.ts`, `power.ts`, `grades.ts`, `study.ts`,
`bac.ts` og `useFocusTimer.ts`. De kopieres inn etappe for etappe.
