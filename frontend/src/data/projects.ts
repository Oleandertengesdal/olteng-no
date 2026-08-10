import type { Hue } from './tech'

export interface ProjectTranslations {
  en: string
  nb: string
}

export interface TranslatedArray {
  en: string[]
  nb: string[]
}

export interface ShowcaseDetails {
  overview?: ProjectTranslations
  features?: TranslatedArray
  technicalDetails?: ProjectTranslations
  challenges?: TranslatedArray
  outcomes?: TranslatedArray
  futureImprovements?: TranslatedArray
}

export interface Project {
  id: string
  title: ProjectTranslations
  description: ProjectTranslations
  type: 'live' | 'showcase' // live = interactive tool, showcase = readme-style page
  size: 'large' | 'medium' | 'small' // for sorting
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  component?: string // component name for live projects
  image?: string
  featured?: boolean
  /** Signature colour for the row number, hover tint and project page rule */
  hue?: Hue
  showcase?: ShowcaseDetails
  details?: {
    year?: string
    duration?: string
    role?: string
    team?: string
    status?: string
  }
}

export const projects: Project[] = [
  // Large projects
  {
    id: 'biddingwars',
    title: {
      en: 'Budbørsen - Auction Application',
      nb: 'Budbørsen - Auksjonsapplikasjon',
    },
    description: {
      en: 'An auction site where you list an item with photos and other users bid on it. Spring Boot and SQLite underneath, Vue 3 on top, JWT auth in between — and a lot of time spent on what happens when two bids arrive at the same moment.',
      nb: 'En auksjonsside der du legger ut en gjenstand med bilder og andre brukere byr på den. Spring Boot og SQLite i bunnen, Vue 3 på toppen, JWT-innlogging imellom — og mye tid brukt på hva som skjer når to bud kommer inn samtidig.',
    },
    type: 'showcase',
    size: 'large',
    technologies: [
      'Java 21',
      'Spring Boot 3',
      'Vue 3',
      'TypeScript',
      'Pinia',
      'SQLite',
      'Spring Security',
      'JWT',
    ],
    githubUrl: 'https://github.com/Oleandertengesdal/biddingwars',
    featured: true,
    hue: 'clay',
    showcase: {
      overview: {
        en: 'I wanted a project big enough that the easy answers stopped working. An auction turned out to be a good choice: it needs accounts, file uploads, an admin view, and a bidding flow where correctness actually matters. A bid that gets accepted twice is not a cosmetic bug.',
        nb: 'Jeg ville ha et prosjekt som var stort nok til at de enkle løsningene sluttet å holde. En auksjon viste seg å være et godt valg: den trenger brukerkontoer, filopplasting, en adminvisning, og en budflyt der det faktisk betyr noe at ting blir riktig. Et bud som blir godtatt to ganger er ikke en kosmetisk feil.',
      },
      features: {
        en: [
          'User authentication and authorization with JWT tokens',
          'Real-time bid placement and tracking',
          'Image upload and management for auction items',
          'Admin panel for user and auction management',
          'Category-based auction organization',
          'Secure payment integration ready',
          'RESTful API with Swagger documentation',
        ],
        nb: [
          'Brukerautentisering og autorisasjon med JWT-tokens',
          'Sanntids budplassering og sporing',
          'Bildeopplasting og håndtering for auksjonsobjekter',
          'Adminpanel for bruker- og auksjonsstyring',
          'Kategori-basert auksjonsorganisering',
          'Sikker betalingsintegrasjon klar',
          'RESTful API med Swagger-dokumentasjon',
        ],
      },
      technicalDetails: {
        en: 'Built with a modern tech stack featuring Spring Boot 3 backend with Spring Security for authentication, SQLite database for data persistence, and Vue 3 with Composition API and TypeScript for a reactive frontend. The application follows clean architecture principles with proper separation of concerns, comprehensive exception handling, and extensive test coverage using JUnit 5 and Mockito.',
        nb: 'Bygget med en moderne teknologistakk med Spring Boot 3 backend med Spring Security for autentisering, SQLite database for datalagring, og Vue 3 med Composition API og TypeScript for et reaktivt grensesnitt. Applikasjonen følger rene arkitekturprinsipper med korrekt separasjon av bekymringer, omfattende unntakshåndtering, og omfattende testdekning ved bruk av JUnit 5 og Mockito.',
      },
      challenges: {
        en: [
          'Implementing secure JWT-based authentication flow',
          'Managing real-time bid updates across multiple users',
          'Handling concurrent bid submissions to prevent race conditions',
          'Designing a flexible category system for diverse auction types',
          'Creating an intuitive admin interface for content moderation',
        ],
        nb: [
          'Implementering av sikker JWT-basert autentiseringsflyt',
          'Håndtering av sanntids budoppdateringer på tvers av flere brukere',
          'Håndtering av samtidige budinnsendinger for å forhindre race conditions',
          'Utforming av et fleksibelt kategorisystem for ulike auksjonstyper',
          'Oppretting av et intuitivt admin-grensesnitt for innholdsmoderering',
        ],
      },
      outcomes: {
        en: [
          'Learned why you validate the bid amount on the server even though the form already does it',
          'Ended up with one exception handler instead of try/catch scattered through every controller',
          'Wrote tests for the bidding logic specifically — the rest of the app I could check by clicking around, that part I could not',
          'Swagger docs meant I stopped guessing my own endpoint signatures',
          'Reworked the layout for mobile after testing it on my phone and finding it unusable',
        ],
        nb: [
          'Lærte hvorfor man validerer budbeløpet på serveren selv om skjemaet allerede gjør det',
          'Endte opp med én felles unntakshåndterer i stedet for try/catch spredt utover hver eneste kontroller',
          'Skrev tester spesifikt for budlogikken — resten av appen kunne jeg klikke meg gjennom, den delen kunne jeg ikke',
          'Swagger-dokumentasjonen gjorde at jeg sluttet å gjette på mine egne endepunkter',
          'Bygde om layouten for mobil etter å ha testet den på telefonen og funnet den ubrukelig',
        ],
      },
      futureImprovements: {
        en: [
          'Add Docker Compose for simplified deployment',
          'Implement WebSocket support for live bid notifications',
          'Integrate payment gateway for automated transactions',
          'Add email notifications for auction events',
          'Implement auction scheduling and auto-close functionality',
        ],
        nb: [
          'Legge til Docker Compose for forenklede distribusjoner',
          'Implementere WebSocket-støtte for live budvarsler',
          'Integrere betalingsgateway for automatiserte transaksjoner',
          'Legge til e-postvarsler for auksjonshendelser',
          'Implementere auksjonsplanlegging og auto-lukke funksjonalitet',
        ],
      },
    },
    details: {
      year: '2026',
      duration: '3 weeks',
      role: 'Full-stack Developer',
      team: 'Solo Project',
      status: 'In Development',
    },
  },

  {
    id: 'strompris',
    title: {
      en: 'Power prices in Norway',
      nb: 'Strømpris i Norge',
    },
    description: {
      en: 'What you actually pay for electricity, hour by hour — spot price, government support, grid rent, electricity tax and VAT in one figure, in øre. Compares the spot scheme against the fixed Norgespris rate and computes the break-even between them. Runs entirely in the browser against an open API — no backend, no key, no chart library.',
      nb: 'Hva du faktisk betaler for strømmen, time for time — spotpris, strømstøtte, nettleie, elavgift og mva samlet i ett tall, i øre. Sammenligner spot mot Norgespris og regner ut vippepunktet mellom dem. Kjører helt i nettleseren mot et åpent API — ingen backend, ingen nøkkel, ingen grafpakke.',
    },
    type: 'live',
    size: 'medium',
    technologies: ['Vue 3', 'TypeScript', 'SVG', 'REST'],
    githubUrl: 'https://github.com/Oleandertengesdal/olteng-no',
    component: 'ProjectStrompris',
    featured: true,
    hue: 'pine',
    details: {
      year: '2026',
      role: 'Solo',
      status: 'Live',
    },
    showcase: {
      overview: {
        en: 'A tool I actually check. Norwegian electricity is priced hourly and differs by a factor of three between the north and the south on a bad day, so "what does power cost" has no single answer — it depends on the hour and on which of five price areas you are standing in.',
        nb: 'Et verktøy jeg faktisk sjekker selv. Norsk strøm prises time for time og kan skille en faktor tre mellom nord og sør på en dårlig dag, så «hva koster strømmen» har ikke ett svar — det avhenger av timen og av hvilket av fem prisområder du står i.',
      },
      technicalDetails: {
        en: 'Data comes from the open API at hvakosterstrommen.no, which serves one static JSON file per day and price area. All five areas are fetched in parallel with Promise.allSettled so a single failing request degrades the comparison instead of blanking the page, and responses are cached per day so switching between areas costs nothing. The chart is hand-drawn SVG rather than a charting library — 24 bars and one dashed line is less code than configuring Chart.js, and it inherits the site colours for free.',
        nb: 'Dataene kommer fra det åpne API-et til hvakosterstrommen.no, som leverer én statisk JSON-fil per døgn og prisområde. Alle fem områder hentes parallelt med Promise.allSettled, slik at ett kall som feiler svekker sammenligningen i stedet for å tømme siden, og svarene mellomlagres per døgn så det koster ingenting å bytte område. Grafen er håndtegnet SVG framfor et grafbibliotek — 24 søyler og én stiplet linje er mindre kode enn å konfigurere Chart.js, og den arver sidens farger gratis.',
      },
      challenges: {
        en: [
          'Prices arrive without VAT, and Northern Norway is exempt from it entirely — so VAT is a per-area rule, not a global toggle',
          'Tomorrow is published no earlier than 13:00 and returns 404 before that: an expected state, not an error, and the interface says so',
          'A day is not always 24 hours. Daylight saving gives 23 or 25, so the national average aligns areas by timestamp rather than by array index',
          'Times must render in Norwegian time regardless of where the visitor is reading from',
          'Colouring hours by an absolute price threshold would make the whole chart one colour for half the year, so the scale is relative to the day itself',
        ],
        nb: [
          'Prisene kommer uten mva, og Nord-Norge er helt fritatt — så mva er en regel per område, ikke en global bryter',
          'Morgendagens pris slippes tidligst kl. 13 og gir 404 før det: en forventet tilstand, ikke en feil, og grensesnittet sier det rett ut',
          'Et døgn har ikke alltid 24 timer. Sommertid gir 23 eller 25, så landssnittet stiller områdene på linje etter tidsstempel og ikke etter posisjon i lista',
          'Klokkeslett må vises i norsk tid uansett hvor i verden den som leser sitter',
          'Å fargelegge timer etter en fast kronegrense ville gjort hele grafen ensfarget halve året, så skalaen er relativ til døgnet selv',
        ],
      },
      futureImprovements: {
        en: [
          'Store history so you can look further back than the current day',
          'Notify when tomorrow is unusually cheap — that needs a backend and a scheduled job',
          'Consumption-weighted national average instead of a plain mean of five areas',
        ],
        nb: [
          'Lagre historikk så man kan se lenger tilbake enn inneværende døgn',
          'Varsle når morgendagen er uvanlig billig — det krever backend og en planlagt jobb',
          'Forbruksvektet landssnitt i stedet for et rent gjennomsnitt av fem områder',
        ],
      },
    },
  },

  {
    id: 'eksamen',
    title: { en: 'Exam planner', nb: 'Eksamensplanlegger' },
    description: {
      en: 'A daily study plan weighted by credits and by how close each exam is, with a drift-free study timer built in. The plan shifts its own centre of gravity as an exam approaches, so you never have to replan.',
      nb: 'Dagsplan for eksamenslesing vektet etter studiepoeng og hvor nær hver eksamen er, med en lesetimer innebygd. Planen flytter tyngdepunktet sitt selv etter hvert som en eksamen nærmer seg, så du slipper å planlegge om.',
    },
    type: 'live',
    size: 'medium',
    technologies: ['TypeScript', 'Vue 3', 'SVG'],
    githubUrl: 'https://github.com/Oleandertengesdal/olteng-no',
    component: 'ProjectExam',
    featured: false,
    hue: 'clay',
    details: { year: '2026', role: 'Solo', status: 'Live' },
    showcase: {
      technicalDetails: {
        en: 'Two pieces of engineering carry this one. The allocation weights each course daily by credits divided by days until its exam, then hands out whole blocks and distributes the remainders to whoever lost most to rounding — the same largest-remainder method used to allocate parliamentary seats from vote counts. The timer never counts down: it stores the timestamp the phase ends and derives the remaining time from the clock on every repaint.',
        nb: 'To tekniske grep bærer dette prosjektet. Fordelingen vekter hvert emne daglig etter studiepoeng delt på dager igjen til eksamen, deler så ut hele bolker og gir restene til dem som tapte mest på avrundingen — samme største-rest-metode som brukes når mandater fordeles etter stemmetall. Timeren teller aldri ned: den lagrer tidspunktet fasen er ferdig og utleder gjenstående tid fra klokka ved hver oppdatering.',
      },
      challenges: {
        en: [
          'A setInterval that subtracts a second at a time accumulates drift over a 45 minute block, and browsers throttle or freeze timers in background tabs — which is exactly where a study timer lives while you study',
          'Storing the end timestamp instead means the answer is correct no matter how few times the clock actually got to run, and it is right the instant you switch back to the tab',
          'Blocks must be whole numbers: "1.4 blocks on maths" is not something a person can do',
          'The alarm is generated with Web Audio rather than shipping an audio file, and the context is created on the first click because browsers require a gesture before playing sound',
        ],
        nb: [
          'En setInterval som trekker fra ett sekund av gangen samler opp drift over en trekvarters bolk, og nettlesere struper eller fryser tidtakere i bakgrunnsfaner — som er nøyaktig der en lesetimer befinner seg mens du leser',
          'Å lagre sluttidspunktet gjør at svaret blir riktig uansett hvor få ganger klokka faktisk fikk kjøre, og det stemmer i det sekundet du bytter tilbake til fanen',
          'Bolker må være hele tall: «1,4 bolker på matte» er ikke noe et menneske kan gjøre',
          'Alarmen lages med Web Audio i stedet for å laste ned en lydfil, og konteksten opprettes ved første trykk fordi nettlesere krever et brukertrykk før de spiller lyd',
        ],
      },
    },
  },
  {
    id: 'lanekassen',
    title: { en: 'Student loan calculator', nb: 'Lånekasse-kalkulator' },
    description: {
      en: 'How much of the Norwegian student loan becomes a grant, what living at home costs you, and what is left as debt. Every rate sits in one block with its academic year and source, because the rates change annually and a calculator with stale figures is worse than none.',
      nb: 'Hvor mye av studielånet som blir stipend, hva det koster å bo hjemme, og hva som står igjen som gjeld. Hver eneste sats står i én blokk med studieår og kilde, fordi satsene endres årlig og en kalkulator med utdaterte tall er verre enn ingen.',
    },
    type: 'live',
    size: 'small',
    technologies: ['TypeScript', 'Vue 3'],
    githubUrl: 'https://github.com/Oleandertengesdal/olteng-no',
    component: 'ProjectLoan',
    featured: false,
    hue: 'ochre',
    details: { year: '2026', role: 'Solo', status: 'Live' },
    showcase: {
      challenges: {
        en: [
          'The rates change every academic year, so they live in one array with the year and a source link attached — it is deliberately impossible to edit a figure without seeing which year it belongs to',
          'Credit conversion is proportional while degree conversion is all or nothing, and the two are easy to conflate',
          'The income deduction can never exceed the grant: you do not owe Lånekassen money for having had a summer job',
          'The tool states which academic year it is calculating for and links to the source, because being confidently out of date is the failure mode that matters here',
        ],
        nb: [
          'Satsene endres hvert studieår, så de bor i én liste med årstall og kildelenke festet til seg — det er bevisst umulig å endre et tall uten å se hvilket år det gjelder',
          'Studiepoengomgjøringen er forholdsmessig mens gradsomgjøringen er alt eller ingenting, og de to er lette å blande sammen',
          'Inntektstrekket kan aldri overstige stipendet: man skylder ikke Lånekassen penger for å ha hatt sommerjobb',
          'Verktøyet sier hvilket studieår det regner for og lenker til kilden, fordi det å være selvsikkert utdatert er den feilen som betyr noe her',
        ],
      },
    },
  },
  {
    id: 'karakter',
    title: {
      en: 'Grade average calculator',
      nb: 'Karaktersnitt',
    },
    description: {
      en: 'Weighted grade average by credits, with a spread, a target calculator, and a paste importer that handles whatever Studentweb or a spreadsheet throws at it. The weighting is the point — a plain mean of the letters is the common mistake.',
      nb: 'Vektet karaktersnitt etter studiepoeng, med fordeling, målkalkulator og en lim-inn-import som tåler det Studentweb eller et regneark kaster på den. Vektingen er hele poenget — et rent gjennomsnitt av bokstavene er den vanlige feilen.',
    },
    type: 'live',
    size: 'small',
    technologies: ['TypeScript', 'Vue 3'],
    githubUrl: 'https://github.com/Oleandertengesdal/olteng-no',
    component: 'ProjectGrades',
    featured: false,
    hue: 'pine',
    details: { year: '2026', role: 'Solo', status: 'Live' },
    showcase: {
      technicalDetails: {
        en: 'NTNU has no documented public API for courses, so rather than depend on an undocumented internal endpoint that could disappear without warning, the import parses whatever you paste. Fields are identified by shape rather than position: a course code is letters followed by digits, credits are a small decimal number, and a grade is a single letter or the word "bestått". That means column order does not matter and the same parser handles tabs from a spreadsheet, semicolons from a CSV export and plain typed text.',
        nb: 'NTNU har ikke noe dokumentert offentlig API for emner, så i stedet for å bygge på en udokumentert intern URL som kan forsvinne uten varsel, tolker importen det du limer inn. Feltene kjennes igjen på formen framfor plasseringen: en emnekode er bokstaver etterfulgt av tall, studiepoeng er et lite desimaltall, og karakteren er én bokstav eller ordet «bestått». Dermed spiller kolonnerekkefølgen ingen rolle, og samme parser takler tabulator fra et regneark, semikolon fra en CSV-eksport og ren håndskrevet tekst.',
      },
      challenges: {
        en: [
          'Weighting by credits is the whole point: a 15-credit course counts twice as much as a 7.5-credit one, and a plain mean quietly works against you when the heavy courses went well',
          'Pass/fail courses must stay out of the average while their credits still count, which is how institutions calculate it',
          'The parser has to tell 7,5 credits from a 2024 term code — both are numbers on the same line, so credits are capped at 60',
          'Converting an average back to a letter has no official table, so the page says so rather than pretending otherwise',
        ],
        nb: [
          'Vekting etter studiepoeng er hele poenget: et emne på 15 sp teller dobbelt så mye som ett på 7,5, og et rent gjennomsnitt jobber stille imot deg når de tunge emnene gikk bra',
          'Bestått/ikke bestått må holdes utenfor snittet mens studiepoengene fortsatt teller, slik lærestedene selv regner',
          'Parseren må skille 7,5 studiepoeng fra en terminkode som 2024 — begge er tall på samme linje, så studiepoeng har et tak på 60',
          'Omregning fra snitt tilbake til bokstav har ingen offisiell tabell, så siden sier det i stedet for å late som noe annet',
        ],
      },
    },
  },
  {
    id: 'promille',
    title: {
      en: 'Blood alcohol estimator',
      nb: 'Promillekalkulator',
    },
    description: {
      en: 'Widmark with an absorption ramp and an honest uncertainty band, answering one question only: when is the alcohol likely to be gone. Deliberately has no "can I drive" button and no way to calculate how much more you could have.',
      nb: 'Widmark med opptaksrampe og et ærlig usikkerhetsspenn, som svarer på ett spørsmål: når er alkoholen sannsynligvis ute av kroppen. Har bevisst ingen «kan jeg kjøre»-knapp og ingen måte å regne ut hvor mye mer man tåler.',
    },
    type: 'live',
    size: 'small',
    technologies: ['TypeScript', 'Vue 3', 'SVG'],
    githubUrl: 'https://github.com/Oleandertengesdal/olteng-no',
    component: 'ProjectBac',
    featured: false,
    hue: 'iris',
    details: { year: '2026', role: 'Solo', status: 'Live' },
    showcase: {
      technicalDetails: {
        en: 'Widmark divides grams of alcohol by body weight times a distribution factor, then subtracts a linear elimination rate. Textbook Widmark assumes instant absorption, which overstates the first quarter of an hour badly, so each unit is absorbed evenly over 30 minutes instead. Since elimination genuinely varies from 0.10 to 0.20 per mille per hour between people, the result is shown as a band rather than a single figure — a number with two decimals would claim a precision that does not exist.',
        nb: 'Widmark deler gram alkohol på kroppsvekt ganger en fordelingsfaktor, og trekker så fra en lineær forbrenning. Lærebok-Widmark antar momentant opptak, noe som overdriver det første kvarteret kraftig, så hver enhet tas i stedet opp jevnt over 30 minutter. Siden forbrenningen faktisk varierer fra 0,10 til 0,20 promille i timen mellom personer, vises resultatet som et spenn framfor ett tall — to desimaler ville påstått en presisjon som ikke finnes.',
      },
      challenges: {
        en: [
          'The ethical design decision came first: no "can I drive" answer and no "how much more" feature, because that is exactly the use that makes these calculators dangerous',
          'A drink consumed this second reads as zero because it has not been absorbed — a naive "first moment below the limit" check therefore told someone who had just downed five beers that they were sober',
          'Fixing it meant looking for the last time the curve is above the threshold rather than the first time it is below',
          'The distribution factor is labelled as body water rather than sex, because that is what it actually measures',
        ],
        nb: [
          'Den etiske designbeslutningen kom først: ingen «kan jeg kjøre»-svar og ingen «hvor mye mer»-funksjon, fordi det er nøyaktig den bruken som gjør slike kalkulatorer farlige',
          'En enhet drukket akkurat nå måler null fordi den ikke er absorbert ennå — en naiv «første gang under grensa»-sjekk fortalte derfor noen som nettopp hadde tømt fem halvlitere at de var edru',
          'Rettingen besto i å lete etter siste gang kurven ligger over terskelen i stedet for første gang den er under',
          'Fordelingsfaktoren er merket som kroppsvann og ikke som kjønn, fordi det er det den faktisk måler',
        ],
      },
    },
  },
  {
    id: 'kontrast',
    title: {
      en: 'Contrast checker',
      nb: 'Kontrastsjekker',
    },
    description: {
      en: 'Paste two colours, get the WCAG contrast ratio and which grades it clears. Built after a measurement of this very site found a colour sitting below the minimum — a bug that had been there since the design system was made, and that the eye could not see.',
      nb: 'Lim inn to farger, få kontrastforholdet etter WCAG og hva det klarer. Bygget etter at en måling av denne siden fant en farge som lå under minstekravet — en feil som hadde ligget der siden designsystemet ble laget, og som øyet ikke kunne se.',
    },
    type: 'live',
    size: 'small',
    technologies: ['TypeScript', 'Vue 3'],
    githubUrl: 'https://github.com/Oleandertengesdal/olteng-no',
    component: 'ProjectContrast',
    featured: false,
    hue: 'ochre',
    details: {
      year: '2026',
      role: 'Solo',
      status: 'Live',
    },
    showcase: {
      overview: {
        en: "A contrast checker that audits the page it is running on. It reads the site's own custom properties from the live document, so the numbers can never drift from the design system — switch to dark mode and every figure changes with it.",
        nb: 'En kontrastsjekker som reviderer siden den kjører på. Den leser sidens egne CSS-variabler fra det levende dokumentet, så tallene kan aldri komme i utakt med designsystemet — bytt til mørk modus, og hvert eneste tall endrer seg.',
      },
      technicalDetails: {
        en: 'The WCAG formulas are written out rather than pulled from a package: sRGB channels are linearised, weighted 0.2126 / 0.7152 / 0.0722 for red, green and blue, and the ratio is taken between the lighter and darker luminance plus 0.05. Three lines of maths, and writing them yourself is what makes it obvious why green counts almost ten times more than blue. The suggestion feature converts to HSL, holds hue and saturation still and scans lightness in both directions, since contrast is V-shaped around the background: move far enough either way and it improves.',
        nb: 'WCAG-formlene er skrevet ut i stedet for hentet fra en pakke: sRGB-kanalene lineariseres, vektes 0,2126 / 0,7152 / 0,0722 for rød, grønn og blå, og forholdet tas mellom lyseste og mørkeste luminans pluss 0,05. Tre linjer matematikk, og det å skrive dem selv er det som gjør det åpenbart hvorfor grønt teller nesten ti ganger mer enn blått. Forslagsfunksjonen går veien om HSL, holder kulør og metning i ro og skanner lysheten i begge retninger — kontrasten er V-formet rundt bakgrunnen, så den blir bedre uansett hvilken vei du går, bare du går langt nok.',
      },
      challenges: {
        en: [
          'Rounding must never round up: 4,499 shown as "4,50" next to a green tick would be a lie, so the displayed figure is floored while the verdict uses the raw value',
          'Parsing has to accept the format this site stores colours in — bare "26 22 18" triplets, because Tailwind needs the channels separately to apply opacity',
          'Contrast is not monotonic in lightness, so the suggestion scans away from the background in both directions and keeps whichever moved least',
          'The audit re-runs on a MutationObserver watching the theme class, otherwise the figures would be stale the moment someone toggles dark mode',
        ],
        nb: [
          'Avrunding må aldri runde opp: 4,499 vist som «4,50» ved siden av et grønt merke ville vært en løgn, så tallet avrundes nedover mens vurderingen bruker råverdien',
          'Parsingen må godta formatet denne siden lagrer farger i — nakne «26 22 18»-tripler, fordi Tailwind trenger kanalene hver for seg for å kunne sette gjennomsikt',
          'Kontrast er ikke monoton i lyshet, så forslaget skanner bort fra bakgrunnen i begge retninger og beholder den som flyttet seg minst',
          'Revisjonen kjøres på nytt av en MutationObserver som følger tema-klassen, ellers ville tallene vært utdaterte i samme øyeblikk noen bytter til mørk modus',
        ],
      },
      outcomes: {
        en: [
          'Found a real bug: --c-faint sat at 2,86:1 against the card surface, below the 3:1 floor for small labels',
          'The fix was measured, not guessed — the colour was darkened until it cleared, and it now sits at 3,47:1',
          'Found a second fault while building it: 3.44:1 clears 3:1, but --c-faint is used for 11px text, where the requirement is 4.5:1 — the colour had to be darkened again',
          'All 48 combinations of text colour and surface now clear 4.5:1 in both light and dark mode',
        ],
        nb: [
          'Fant en ekte feil: --c-faint lå på 2,86:1 mot kortbakgrunnen, under gulvet på 3:1 for små etiketter',
          'Rettingen ble målt, ikke gjettet — fargen ble mørknet til den klarte kravet, og ligger nå på 3,47:1',
          'Fant en feil til under bygging: 3,44:1 klarer 3:1, men --c-faint brukes til tekst i 11 px, og da er kravet 4,5:1 — fargen måtte mørknes en gang til',
          'Alle 48 kombinasjoner av tekstfarge og flate klarer nå 4,5:1 i både lys og mørk modus',
        ],
      },
      futureImprovements: {
        en: [
          'Add APCA, the contrast model drafted for WCAG 3, alongside the current figures',
          'Check a whole palette at once and mark every combination that fails',
          'Simulate the common types of colour vision deficiency',
        ],
        nb: [
          'Legge til APCA, kontrastmodellen som er utkast til WCAG 3, ved siden av dagens tall',
          'Sjekke en hel palett på én gang og markere alle kombinasjoner som stryker',
          'Simulere de vanligste formene for fargesynssvakhet',
        ],
      },
    },
  },

  // Small projects
  {
    id: 'json2csv',
    title: {
      en: 'JSON to CSV Converter',
      nb: 'JSON til CSV-konverterer',
    },
    description: {
      en: 'A converter that runs entirely in the browser — nothing is uploaded anywhere. Built because I kept pasting work data into random online converters and realised I had no idea where it was going.',
      nb: 'En konverterer som kjører helt i nettleseren — ingenting lastes opp noe sted. Bygget fordi jeg stadig limte inn data i tilfeldige nettkonvertere og innså at jeg ikke hadde peiling på hvor de tok veien.',
    },
    type: 'live',
    size: 'small',
    technologies: ['TypeScript', 'Vue 3'],
    githubUrl: 'https://github.com/Oleandertengesdal/Json2CSV',
    component: 'ProjectJson2CSV',
    featured: false,
    hue: 'iris',
    details: {
      year: '2025',
      role: 'Solo',
      status: 'Live',
    },
  },

  /* ───────────────────────────────────────────────────────────────────────
   * MAL FOR NYTT PROSJEKT — kopier blokken under, fjern kommentartegnene og
   * fyll inn. `size` styrer rekkefølgen: 'large' først, så 'medium', så
   * 'small'. Bruk type 'showcase' for prosjekter som beskrives på en egen
   * side, og 'live' for verktøy som kjører i nettleseren.
   *
   * Tips til teksten: skriv hva du støtte på og hva du lærte, ikke en
   * funksjonsliste. Det er den delen en intervjuer faktisk spør om.
   *
   * ,{
   *   id: 'kort-id-uten-mellomrom',
   *   title: { en: 'English title', nb: 'Norsk tittel' },
   *   description: {
   *     en: 'Two or three sentences: what it does, and what was hard about it.',
   *     nb: 'To–tre setninger: hva det gjør, og hva som var vanskelig med det.'
   *   },
   *   type: 'showcase',
   *   size: 'medium',
   *   technologies: ['Java', 'PostgreSQL'],
   *   githubUrl: 'https://github.com/Oleandertengesdal/repo-navn',
   *   featured: false,
   *   details: { year: '2026', role: 'Solo', status: 'Ferdig' }
   * }
   * ─────────────────────────────────────────────────────────────────────── */
]

// Sort a copy — sorting in place would reorder `projects` for every importer
export const sortedProjects = [...projects].sort((a, b) => {
  const sizeOrder = { large: 0, medium: 1, small: 2 }
  return sizeOrder[a.size] - sizeOrder[b.size]
})
