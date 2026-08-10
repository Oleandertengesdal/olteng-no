/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FARGEMODUSER
 *
 *  Dette er eneste kilde til sannhet for farge. Fra denne filen genereres
 *  themes.css (scripts/build-themes.ts), og mot denne filen måles kontrasten
 *  (scripts/check-contrast.ts). Ingen komponent skriver en fargeverdi selv —
 *  de bruker semantiske Tailwind-klasser som peker hit.
 *
 *  Fem moduser, ikke to. To lyse, to mørke og én for maksimal lesbarhet, slik
 *  at «følg systemet» har noe fornuftig å veksle mellom og resten er et
 *  faktisk valg. Alle skal tåle å bli sett på i timevis: ingen ren svart
 *  (etterbilder på OLED), ingen ren hvit i standardmodus (for skarpt i et
 *  mørkt rom), og aksentfargene er dempet nok til å ikke stikke i øynene når
 *  det er tolv av dem på skjermen samtidig.
 *
 *  Tallene under er *målt*, ikke gjettet. Se npm run contrast.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Bilingual } from '@/data/bilingual.ts'
// Eksplisitt .ts-endelse, ikke av vane. Skriptene i scripts/ kjøres direkte av
// Node, som stripper typene men ikke gjetter filendelser slik en bundler gjør.
// Da må stien være hel. Vite takler den formen uten videre.
import { WCAG, type Rgb } from './contrast.ts'

/* ── Tokennavn ─────────────────────────────────────────────────────────────
   Semantiske, ikke beskrivende. «--c-paper» sier hva flaten *er*, ikke hvilken
   farge den har, og overlever derfor at Natt-modusen gjør den nesten svart.  */

/** Flater som tekst kan ligge oppå. */
export const SURFACE_TOKENS = ['paper', 'surface', 'raised'] as const

/** Farger som brukes til tekst og ikoner. */
export const INK_TOKENS = [
  'ink',
  'muted',
  'faint',
  'accent',
  'positive',
  'warning',
  'critical',
] as const

/** Farger som verken er flate eller tekst. */
export const OTHER_TOKENS = ['line', 'accent-ink'] as const

export type SurfaceToken = (typeof SURFACE_TOKENS)[number]
export type InkToken = (typeof INK_TOKENS)[number]
export type OtherToken = (typeof OTHER_TOKENS)[number]
export type TokenName = SurfaceToken | InkToken | OtherToken

export type ThemeId = 'papir' | 'natt' | 'skog' | 'hav' | 'kontrast'

export interface Theme {
  id: ThemeId
  name: Bilingual
  /** Én setning om hva modusen er til. Vises i modusvelgeren. */
  note: Bilingual
  /**
   * Hva nettleseren skal fortelle operativsystemet, slik at rullefelt,
   * skjemafelter og innebygde kontroller følger med.
   */
  scheme: 'light' | 'dark'
  /**
   * Minstekrav for tekst mot flate i denne modusen. Fire moduser ligger på
   * AA (4,5:1). Kontrast-modusen finnes nettopp fordi AA ikke alltid holder,
   * og ligger derfor på AAA (7:1).
   */
  minRatio: number
  tokens: Readonly<Record<TokenName, Rgb>>
}

/* ── Papir ─────────────────────────────────────────────────────────────────
   Standard om dagen. Varm off-white med blekksvart tekst. Aksenten er en
   brent teglrød — den er hentet fra olteng.no, både fordi den er målt og
   fordi slektskapet mellom sidene skal være synlig uten å være påtrengende. */

const papir: Theme = {
  id: 'papir',
  name: { nb: 'Papir', en: 'Paper' },
  note: {
    nb: 'Varm off-white med blekksvart tekst. Standard om dagen.',
    en: 'Warm off-white with ink-black text. The daytime default.',
  },
  scheme: 'light',
  minRatio: WCAG.textAA,
  tokens: {
    paper: [250, 247, 242],
    surface: [255, 253, 249],
    raised: [243, 238, 230],
    ink: [26, 22, 18],
    muted: [102, 93, 82],
    faint: [116, 107, 97],
    line: [227, 219, 206],
    accent: [163, 57, 28],
    'accent-ink': [255, 252, 248],
    positive: [22, 96, 84],
    warning: [130, 82, 6],
    critical: [172, 33, 33],
  },
}

/* ── Natt ──────────────────────────────────────────────────────────────────
   Dyp varm mørk. Ikke ren svart: på OLED slår ren svart av pikselen helt, og
   overgangen til tent piksel gir etterbilder når man ruller. 19/17/15 er mørkt
   nok til å føles svart og lyst nok til at skjermen holder pikslene i live.  */

const natt: Theme = {
  id: 'natt',
  name: { nb: 'Natt', en: 'Night' },
  note: {
    nb: 'Dyp varm mørk. Ikke ren svart — det gir etterbilder på OLED.',
    en: 'Deep warm dark. Not pure black — that causes ghosting on OLED.',
  },
  scheme: 'dark',
  minRatio: WCAG.textAA,
  tokens: {
    paper: [19, 17, 15],
    surface: [27, 24, 21],
    raised: [35, 31, 27],
    ink: [241, 236, 227],
    muted: [172, 162, 149],
    faint: [150, 140, 127],
    line: [56, 50, 43],
    accent: [225, 141, 102],
    'accent-ink': [22, 18, 14],
    positive: [110, 190, 168],
    warning: [224, 173, 92],
    critical: [240, 138, 128],
  },
}

/* ── Skog ──────────────────────────────────────────────────────────────────
   Dempet grønn-grå, for lange økter. Mørk, men mindre kontrastrik enn Natt:
   den holder seg rundt 10–12:1 for brødtekst framfor 14–16:1, fordi maksimal
   kontrast er slitsomt over tid selv om den er lett å lese.                  */

const skog: Theme = {
  id: 'skog',
  name: { nb: 'Skog', en: 'Forest' },
  note: {
    nb: 'Dempet grønn-grå. Rolig, laget for lange økter.',
    en: 'Muted green-grey. Calm, built for long sessions.',
  },
  scheme: 'dark',
  minRatio: WCAG.textAA,
  tokens: {
    paper: [21, 28, 25],
    surface: [28, 36, 32],
    raised: [36, 46, 41],
    ink: [226, 235, 228],
    muted: [158, 176, 165],
    faint: [140, 158, 147],
    line: [50, 62, 56],
    accent: [141, 191, 138],
    'accent-ink': [12, 20, 15],
    positive: [126, 196, 150],
    warning: [214, 176, 108],
    critical: [232, 143, 133],
  },
}

/* ── Hav ───────────────────────────────────────────────────────────────────
   Kjølig blågrå med høyere klarhet. Lys, men ikke hvit — flatene har nok blått
   i seg til at teksten ser skarpere ut enn på Papir. Aksenten er en mørk
   petroleumsblå, ikke standard nettblå.                                      */

const hav: Theme = {
  id: 'hav',
  name: { nb: 'Hav', en: 'Sea' },
  note: {
    nb: 'Kjølig blågrå med høyere klarhet.',
    en: 'Cool blue-grey with higher clarity.',
  },
  scheme: 'light',
  minRatio: WCAG.textAA,
  tokens: {
    paper: [240, 244, 248],
    surface: [249, 251, 253],
    raised: [227, 234, 241],
    ink: [16, 24, 33],
    muted: [82, 98, 114],
    // Startet på 93/109/125 og ble målt til 4,3:1 mot --c-raised. Det er akkurat
    // den feilen skriptet finnes for: fargen ser fin ut, men --c-faint brukes
    // til 11 px etiketter, og 11 px er vanlig tekst med krav på 4,5:1.
    faint: [85, 100, 116],
    line: [206, 217, 228],
    accent: [11, 88, 122],
    'accent-ink': [249, 251, 253],
    positive: [13, 97, 82],
    warning: [124, 78, 6],
    critical: [163, 30, 42],
  },
}

/* ── Kontrast ──────────────────────────────────────────────────────────────
   Maksimal lesbarhet. Alt over 7:1, altså AAA. Denne modusen er ikke pen og
   skal ikke være det — den finnes for dem som trenger den, og da er det
   lesbarhet som er kravet og ingenting annet. Merk at flatene her er
   identiske for paper og surface: skillet mellom kort og bakgrunn tegnes med
   en synlig linje framfor med flatetone, fordi svak flatetone er nøyaktig det
   denne brukergruppen ikke ser.                                              */

const kontrast: Theme = {
  id: 'kontrast',
  name: { nb: 'Kontrast', en: 'Contrast' },
  note: {
    nb: 'Maksimal lesbarhet. Alt over 7:1. For dem som trenger det.',
    en: 'Maximum legibility. Everything above 7:1. For those who need it.',
  },
  scheme: 'light',
  minRatio: WCAG.textAAA,
  tokens: {
    paper: [255, 255, 255],
    surface: [255, 255, 255],
    raised: [240, 240, 240],
    ink: [0, 0, 0],
    muted: [45, 45, 45],
    faint: [58, 58, 58],
    line: [90, 90, 90],
    accent: [0, 63, 153],
    'accent-ink': [255, 255, 255],
    positive: [0, 84, 62],
    warning: [106, 56, 0],
    critical: [163, 0, 32],
  },
}

export const THEMES: readonly Theme[] = [papir, natt, skog, hav, kontrast] as const

export const DEFAULT_THEME: ThemeId = 'papir'

/** Hva «følg systemet» veksler mellom. Bevisst bare to av de fem. */
export const SYSTEM_PAIR = { light: 'papir', dark: 'natt' } as const satisfies Record<
  'light' | 'dark',
  ThemeId
>

export const themeById = (id: string): Theme | undefined => THEMES.find((t) => t.id === id)

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && THEMES.some((t) => t.id === value)
