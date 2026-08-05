/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  KONTRAST — WCAG 2.2
 *
 *  Bygget fordi en kontrastmåling av denne siden avslørte at --c-faint lå på
 *  2,86:1 mot kortbakgrunnen, altså under gulvet på 3:1 for små etiketter.
 *  Feilen hadde ligget der siden designsystemet ble laget, og var ikke synlig
 *  for øyet — den måtte regnes ut.
 *
 *  Formlene under er hentet fra WCAG-spesifikasjonen og ikke fra et bibliotek.
 *  Det er tre linjer matematikk, og å skrive dem selv gjør at man forstår
 *  hvorfor grønn teller nesten ti ganger mer enn blå.
 *
 *  Alt her er rene funksjoner uten DOM, nettopp for at de skal kunne testes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

/* ── Parsing ───────────────────────────────────────────────────────────────
   Fire formater støttes, og det siste er grunnen til at verktøyet er nyttig
   for meg selv: `--c-ink: 26 22 18` er slik denne siden lagrer fargene sine,
   fordi Tailwind trenger kanalene hver for seg for å kunne sette gjennomsikt.  */

const clampChannel = (value: number): number => Math.min(255, Math.max(0, Math.round(value)))

export const parseColor = (input: string): Rgb | null => {
  const text = input.trim().toLowerCase()
  if (text === '') return null

  // #abc, #aabbcc, #aabbccff
  const hex = text.startsWith('#') ? text.slice(1) : /^[0-9a-f]{3,8}$/.test(text) ? text : null
  if (hex) {
    if (hex.length === 3 || hex.length === 4) {
      const [r, g, b] = [...hex.slice(0, 3)].map((char) => parseInt(char + char, 16))
      return { r: r!, g: g!, b: b! }
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      }
    }
    return null
  }

  // rgb(26, 22, 18) / rgb(26 22 18 / 80%) — gjennomsikt ignoreres
  const rgbMatch = text.match(/^rgba?\(([^)]+)\)$/)
  const body = rgbMatch ? rgbMatch[1]! : text

  // «26 22 18» og «26, 22, 18» — samme kode dekker begge
  const parts = body
    .split('/')[0]!
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)

  if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
    return { r: clampChannel(parts[0]!), g: clampChannel(parts[1]!), b: clampChannel(parts[2]!) }
  }

  return null
}

export const toHex = ({ r, g, b }: Rgb): string =>
  '#' + [r, g, b].map((channel) => clampChannel(channel).toString(16).padStart(2, '0')).join('')

/* ── Luminans og kontrast ──────────────────────────────────────────────────
   sRGB er gammakodet: verdien 128 er ikke halvparten så lys som 255. Derfor
   må hver kanal lineariseres før den veies. Vektene gjenspeiler at øyet er
   klart mest følsomt for grønt og minst for blått.                          */

const linearise = (channel: number): number => {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export const relativeLuminance = ({ r, g, b }: Rgb): number =>
  0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b)

export const contrastRatio = (a: Rgb, b: Rgb): number => {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (lighter! + 0.05) / (darker! + 0.05)
}

/**
 * Avrund NEDOVER, aldri oppover.
 *
 * 4,499 vist som «4,50» ved siden av et grønt merke ville vært en løgn: kravet
 * er 4,5 og verdien er under. Vurderingen gjøres uansett på råverdien, men
 * tallet på skjermen skal ikke motsi merket ved siden av.
 */
export const formatRatio = (ratio: number): string => (Math.floor(ratio * 100) / 100).toFixed(2)

/* ── Nivåene ───────────────────────────────────────────────────────────────
   «Stor tekst» i WCAG betyr minst 24 px, eller 18,66 px når den er halvfet.  */

export interface Level {
  id: string
  label: { en: string; nb: string }
  required: number
  note: { en: string; nb: string }
}

export const LEVELS: Level[] = [
  {
    id: 'aa-body',
    label: { en: 'Body text, AA', nb: 'Brødtekst, AA' },
    required: 4.5,
    note: { en: 'The everyday minimum', nb: 'Minstekravet i praksis' },
  },
  {
    id: 'aa-large',
    label: { en: 'Large text, AA', nb: 'Stor tekst, AA' },
    required: 3,
    note: { en: 'From 24px, or 18.66px bold', nb: 'Fra 24 px, eller 18,66 px halvfet' },
  },
  {
    id: 'non-text',
    label: { en: 'Interface and graphics', nb: 'Grensesnitt og grafikk' },
    required: 3,
    note: { en: 'Borders, icons, chart bars', nb: 'Kanter, ikoner, søyler i en graf' },
  },
  {
    id: 'aaa-body',
    label: { en: 'Body text, AAA', nb: 'Brødtekst, AAA' },
    required: 7,
    note: { en: 'Stricter than most projects need', nb: 'Strengere enn de fleste trenger' },
  },
  {
    id: 'aaa-large',
    label: { en: 'Large text, AAA', nb: 'Stor tekst, AAA' },
    required: 4.5,
    note: { en: 'Large text, stricter grade', nb: 'Stor tekst, strengere nivå' },
  },
]

export const passes = (ratio: number, required: number): boolean => ratio >= required

/* ── Forslag til en farge som består ───────────────────────────────────────
   Hue og metning holdes i ro, bare lysheten flyttes — da kjenner man fortsatt
   igjen fargen. Kontrasten er V-formet rundt bakgrunnens lyshet, så begge
   retninger prøves og den minste endringen vinner.                          */

export const rgbToHsl = ({ r, g, b }: Rgb): { h: number; s: number; l: number } => {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn!, gn!, bn!)
  const min = Math.min(rn!, gn!, bn!)
  const l = (max + min) / 2
  const delta = max - min

  if (delta === 0) return { h: 0, s: 0, l }

  const s = delta / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === rn) h = ((gn! - bn!) / delta) % 6
  else if (max === gn) h = (bn! - rn!) / delta + 2
  else h = (rn! - gn!) / delta + 4

  return { h: (h * 60 + 360) % 360, s, l }
}

export const hslToRgb = ({ h, s, l }: { h: number; s: number; l: number }): Rgb => {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  const [r1, g1, b1] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]

  return {
    r: clampChannel((r1 + m) * 255),
    g: clampChannel((g1 + m) * 255),
    b: clampChannel((b1 + m) * 255),
  }
}

export interface Suggestion {
  color: Rgb
  ratio: number
  /** Ble fargen mørkere eller lysere enn den var? */
  direction: 'darker' | 'lighter'
}

/**
 * Nærmeste farge som klarer kravet, funnet ved å skanne lysheten i begge
 * retninger. En skanning med 500 steg koster ingenting og slipper unna
 * kantene et binærsøk ville hatt der kontrasten snur.
 */
export const suggestPassing = (
  foreground: Rgb,
  background: Rgb,
  required: number,
): Suggestion | null => {
  if (passes(contrastRatio(foreground, background), required)) return null

  const { h, s, l } = rgbToHsl(foreground)
  const steps = 500

  const search = (direction: -1 | 1): Suggestion | null => {
    for (let step = 1; step <= steps; step++) {
      const lightness = l + (direction * step) / steps
      if (lightness < 0 || lightness > 1) break

      const candidate = hslToRgb({ h, s, l: lightness })
      const ratio = contrastRatio(candidate, background)
      if (passes(ratio, required)) {
        return { color: candidate, ratio, direction: direction === -1 ? 'darker' : 'lighter' }
      }
    }
    return null
  }

  const darker = search(-1)
  const lighter = search(1)

  if (!darker) return lighter
  if (!lighter) return darker

  // Den som endrer lysheten minst er den som ligner mest på originalen
  const darkerShift = Math.abs(rgbToHsl(darker.color).l - l)
  const lighterShift = Math.abs(rgbToHsl(lighter.color).l - l)
  return darkerShift <= lighterShift ? darker : lighter
}

/* ── Lesing av sidens egne fargevariabler ──────────────────────────────────
   Verktøyet reviderer siden det står på. Verdiene leses fra det som faktisk
   er i bruk, så de kan aldri komme i utakt med designsystemet — og bytter du
   til mørk modus, endrer tallene seg.                                        */

export interface TokenGroup {
  label: { en: string; nb: string }
  tokens: { name: string; variable: string }[]
}

export const SITE_FOREGROUNDS: TokenGroup = {
  label: { en: 'Text and accents', nb: 'Tekst og aksenter' },
  tokens: [
    { name: 'ink', variable: '--c-ink' },
    { name: 'muted', variable: '--c-muted' },
    { name: 'faint', variable: '--c-faint' },
    { name: 'accent', variable: '--c-accent' },
    { name: 'clay', variable: '--c-clay' },
    { name: 'pine', variable: '--c-pine' },
    { name: 'iris', variable: '--c-iris' },
    { name: 'ochre', variable: '--c-ochre' },
  ],
}

export const SITE_BACKGROUNDS: TokenGroup = {
  label: { en: 'Surfaces', nb: 'Flater' },
  tokens: [
    { name: 'paper', variable: '--c-paper' },
    { name: 'surface', variable: '--c-surface' },
    { name: 'raised', variable: '--c-raised' },
  ],
}

/** Leser en `--c-*`-variabel fra det kjørende dokumentet. */
export const readToken = (variable: string, element?: Element): Rgb | null => {
  if (typeof window === 'undefined') return null
  const target = element ?? document.documentElement
  const raw = getComputedStyle(target).getPropertyValue(variable)
  return parseColor(raw)
}

/**
 * Historisk notat, med vilje hardkodet: dette er verdien --c-faint hadde da
 * verktøyet avslørte den, og den skal ikke endre seg selv om variabelen gjør
 * det. Den er hele grunnen til at prosjektet finnes.
 */
export const FAINT_BEFORE: Rgb = { r: 150, g: 140, b: 128 }
export const FAINT_AFTER: Rgb = { r: 136, g: 126, b: 114 }
export const RAISED_LIGHT: Rgb = { r: 243, g: 238, b: 230 }
