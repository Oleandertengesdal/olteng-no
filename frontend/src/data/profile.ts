/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PROFILDATA — dette er den ENESTE filen du trenger å endre for å oppdatere
 *  CV, kontaktinfo, ferdigheter og teksten på forsiden.
 *
 *  Alt som er markert med « TODO » nedenfor er plassholdere jeg ikke kunne
 *  vite noe om. Bytt dem ut med dine egne opplysninger, eller slett hele
 *  oppføringen om den ikke er relevant.
 *
 *  Tonen gjennom hele filen: skriv om arbeidet, ikke om deg selv som kandidat.
 *  «Jeg bygde X og støtte på Y» leser bedre enn «jeg er en engasjert student
 *  som søker utfordringer». Bedrifter trekker sine egne slutninger.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Bilingual {
  en: string
  nb: string
}

export interface BilingualList {
  en: string[]
  nb: string[]
}

/* ── Grunnleggende ─────────────────────────────────────────────────────────── */

export const profile = {
  name: 'Oleander Tengesdal',

  /** Alderen på siden regnes ut fra denne datoen ved hvert sidelast. */
  birthDate: '2003-09-09',

  location: {
    en: 'Trondheim, Norway',
    nb: 'Trondheim, Norge',
  } as Bilingual,

  email: 'oleander.tengesdal@icloud.com',
  github: 'https://github.com/Oleandertengesdal',
  linkedin: 'https://www.linkedin.com/in/oleander-tengesdal-215bba333/',

  /**
   * Legg CV-PDF-en i frontend/public/ og skriv stien her (f.eks. '/cv.pdf').
   * Er den null, skjules nedlastingsknappen helt.
   */
  resumeUrl: null as string | null,

  /**
   * Portrettet skal ligge i frontend/public/ og hete akkurat dette.
   * Mangler filen, faller siden pent tilbake til en typografisk boks — den
   * viser aldri et ødelagt bilde.
   */
  portraitUrl: '/portrett.jpg' as string | null,
}

/* ── Forsidetekst ──────────────────────────────────────────────────────────── */

export const intro = {
  /** Liten etikett øverst i heroen. */
  role: {
    en: 'Computer engineering student at NTNU Trondheim',
    nb: 'Dataingeniørstudent ved NTNU i Trondheim',
  } as Bilingual,

  /** Kort variant til faktastripen. */
  field: {
    en: 'Computer engineering',
    nb: 'Dataingeniør',
  } as Bilingual,

  /**
   * Den store overskriften. Hold den under åtte ord — den settes i svært stor
   * grad, og alt lengre brekker stygt. Si hva du bygger, ikke hvem du er.
   */
  headline: {
    en: 'Full stack, from database to interface.',
    nb: 'Fullstack, fra database til grensesnitt.',
  } as Bilingual,

  /** Serif-ingressen rett under overskriften. Én setning. */
  lead: {
    en: 'Java and Spring Boot underneath, Vue and TypeScript on top — and a fair amount of time spent on the parts in between.',
    nb: 'Java og Spring Boot i bunnen, Vue og TypeScript på toppen — og en god del tid brukt på delene imellom.',
  } as Bilingual,

  /** To korte avsnitt lenger ned. Skriv som deg selv. */
  paragraphs: {
    en: [
      'Most of what I know comes from building things end to end and running into the parts nobody warns you about: race conditions when two bids arrive at once, auth flows that look fine until someone opens a second tab, migrations that worked perfectly on my machine.',
      'I care about code other people can read six months later, and I would rather finish something small that works than leave something large that almost does.',
    ],
    nb: [
      'Det meste jeg kan har jeg lært av å bygge ting fra ende til ende, og av å gå på de problemene ingen advarer deg om: race conditions når to bud kommer samtidig, innloggingsflyt som ser riktig ut helt til noen åpner en fane til, migreringer som fungerte helt fint på min maskin.',
      'Jeg er opptatt av kode som andre kan lese om et halvt år, og gjør heller ferdig noe lite som virker enn å legge fra meg noe stort som nesten gjør det.',
    ],
  } as BilingualList,
}

/* ── Hva som skjer nå ──────────────────────────────────────────────────────── */

/**
 * Kort statusliste på forsiden. Dette er den delen som viser at siden lever —
 * oppdater den et par ganger i semesteret. Oppføringer som fremdeles begynner
 * med «TODO» skjules automatisk, så det er trygt å la dem stå til du kommer
 * tilbake til dem.
 */
export const now = {
  /** Vises som «Sist oppdatert». Formatet er fritt. */
  updated: '2026-08',
  items: [
    {
      label: { en: 'Building', nb: 'Bygger' } as Bilingual,
      text: {
        en: 'Budbørsen — moving live bidding onto WebSockets so the page stops polling, and putting the whole thing behind Docker Compose.',
        nb: 'Budbørsen — flytter live budgivning over på WebSocket så siden slutter å polle, og pakker hele greia i Docker Compose.',
      } as Bilingual,
    },
    {
      label: { en: 'Learning', nb: 'Lærer' } as Bilingual,
      text: {
        // TODO: bytt til det du faktisk holder på med akkurat nå
        en: 'TODO: what you are actually working through at the moment — a book, a course, a technology.',
        nb: 'TODO: hva du faktisk jobber deg gjennom for tiden — en bok, et emne, en teknologi.',
      } as Bilingual,
    },
    {
      label: { en: 'Next up', nb: 'Neste' } as Bilingual,
      text: {
        // TODO: neste prosjekt du har lyst til å starte på
        en: 'TODO: the next thing you want to build.',
        nb: 'TODO: det neste du har lyst til å bygge.',
      } as Bilingual,
    },
  ],
}

/* ── Utdanning ─────────────────────────────────────────────────────────────── */

export interface TimelineEntry {
  period: string
  title: Bilingual
  organisation: string
  location?: Bilingual
  description?: Bilingual
  highlights?: BilingualList
  /** Sett til true så lenge det er en plassholder du ikke har fylt ut ennå. */
  placeholder?: boolean
}

export const education: TimelineEntry[] = [
  {
    period: '2023 —',
    title: {
      en: 'BSc Computer Engineering',
      nb: 'Bachelor i dataingeniør',
    },
    organisation: 'NTNU',
    location: { en: 'Trondheim', nb: 'Trondheim' },
    description: {
      en: 'Three-year engineering degree covering programming, algorithms, databases, systems development and software architecture.',
      nb: 'Treårig ingeniørutdanning med programmering, algoritmer, databaser, systemutvikling og programvarearkitektur.',
    },
    highlights: {
      // TODO: bytt ut med emner du faktisk har tatt og likt best
      en: [
        'Relevant coursework: algorithms and data structures, databases, systems development, web development',
        'Team-based project work with Git, code review and agile delivery',
      ],
      nb: [
        'Relevante emner: algoritmer og datastrukturer, databaser, systemutvikling, webutvikling',
        'Prosjektarbeid i team med Git, kodegjennomgang og smidig leveranse',
      ],
    },
  },
  {
    // TODO: fyll inn videregående, eller slett hele denne oppføringen
    period: '20XX – 20XX',
    title: { en: 'Upper secondary education', nb: 'Videregående skole' },
    organisation: 'TODO: skolens navn',
    description: {
      en: 'TODO: programme and specialisation.',
      nb: 'TODO: studieretning og fordypning.',
    },
    placeholder: true,
  },
]

/* ── Erfaring ──────────────────────────────────────────────────────────────── */

/**
 * TODO: Fyll inn ALT du har: deltidsjobb, sommerjobb, verv i linjeforening,
 * studentassistent, frivillig arbeid, militærtjeneste. Ikke-teknisk erfaring
 * teller også — den viser at du møter opp og tar ansvar. Slett oppføringene du
 * ikke bruker.
 */
export const experience: TimelineEntry[] = [
  {
    period: '20XX – 20XX',
    title: { en: 'TODO: job title', nb: 'TODO: stillingstittel' },
    organisation: 'TODO: arbeidsgiver',
    location: { en: 'TODO', nb: 'TODO' },
    description: {
      en: 'TODO: one or two sentences on what you were responsible for and what changed because you were there.',
      nb: 'TODO: én til to setninger om hva du hadde ansvar for, og hva som ble annerledes fordi du var der.',
    },
    highlights: {
      en: ['TODO: a concrete result, ideally with a number'],
      nb: ['TODO: et konkret resultat, helst med et tall'],
    },
    placeholder: true,
  },
  {
    period: '20XX – 20XX',
    title: { en: 'TODO: volunteer or student role', nb: 'TODO: verv eller frivillig rolle' },
    organisation: 'TODO: organisasjon eller linjeforening',
    description: {
      en: 'TODO: what the role involved.',
      nb: 'TODO: hva rollen gikk ut på.',
    },
    placeholder: true,
  },
]

/* ── Ferdigheter ───────────────────────────────────────────────────────────── */

/**
 * Bevisst ingen prosentbarer eller stjerner — ingen tror på «Java 87 %», og det
 * er et av de tydeligste tegnene på en mal-portefølje. Grupper i stedet etter
 * hvor godt du kjenner dem, og vær ærlig: du blir spurt om dette i intervju.
 */
export interface SkillGroup {
  label: Bilingual
  note?: Bilingual
  items: string[]
}

export const skills: SkillGroup[] = [
  {
    label: { en: 'Comfortable with', nb: 'Trygg på' },
    note: {
      en: 'What I reach for by default and can debug without looking things up constantly.',
      nb: 'Det jeg griper til først, og feilsøker uten å måtte slå opp hele tiden.',
    },
    items: ['Java', 'Spring Boot', 'TypeScript', 'Vue 3', 'SQL', 'Git', 'REST'],
  },
  {
    label: { en: 'Worked with', nb: 'Jobbet med' },
    note: {
      en: 'Used in real projects, still learning the deeper parts.',
      nb: 'Brukt i ekte prosjekter, men lærer fortsatt de dypere delene.',
    },
    items: ['Python', 'JUnit', 'Pinia', 'Tailwind CSS', 'SQLite', 'PostgreSQL', 'Vite', 'Docker'],
  },
  {
    label: { en: 'Currently learning', nb: 'Holder på å lære' },
    note: {
      en: 'Actively picking these up — happy to be asked about progress.',
      nb: 'Jobber aktivt med disse nå — spør gjerne hvor langt jeg er kommet.',
    },
    // TODO: juster listen til det du faktisk holder på med
    items: ['Kubernetes', 'CI/CD', 'System design', 'Kotlin'],
  },
]

export const languages: { label: Bilingual; level: Bilingual }[] = [
  {
    label: { en: 'Norwegian', nb: 'Norsk' },
    level: { en: 'Native', nb: 'Morsmål' },
  },
  {
    label: { en: 'English', nb: 'Engelsk' },
    level: { en: 'Fluent, written and spoken', nb: 'Flytende, skriftlig og muntlig' },
  },
]

/* ── Utenfor skjermen ──────────────────────────────────────────────────────── */

/**
 * TODO: Bytt ut med dine egne. Denne seksjonen er der for å gjøre siden
 * menneskelig — den er ofte det intervjueren faktisk spør om. Oppføringer som
 * fortsatt begynner med «TODO» skjules automatisk.
 */
export const offScreen: Bilingual[] = [
  {
    en: 'TODO: something you do that has nothing to do with programming',
    nb: 'TODO: noe du driver med som ikke har noe med programmering å gjøre',
  },
  {
    en: 'TODO: a book, a game, a place you keep going back to',
    nb: 'TODO: en bok, et spill, et sted du stadig vender tilbake til',
  },
]

/* ── Hjelpefunksjoner ──────────────────────────────────────────────────────── */

export type Locale = 'en' | 'nb'

export const pick = (value: Bilingual | undefined, locale: string): string =>
  value ? value[(locale as Locale) in value ? (locale as Locale) : 'en'] : ''

export const pickList = (value: BilingualList | undefined, locale: string): string[] =>
  value ? value[(locale as Locale) in value ? (locale as Locale) : 'en'] : []

/** True for tekst som fortsatt er en uutfylt plassholder. */
export const isPlaceholder = (value: Bilingual): boolean =>
  value.nb.trimStart().startsWith('TODO') || value.en.trimStart().startsWith('TODO')

export const calculateAge = (birthDate: string): number => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}
