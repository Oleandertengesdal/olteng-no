/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PROMILLE — Widmark med absorpsjon og et ærlig usikkerhetsspenn
 *
 *  HVA VERKTØYET SVARER PÅ: når er alkoholen sannsynligvis ute av kroppen.
 *
 *  HVA DET IKKE SVARER PÅ, MED VILJE: om du kan kjøre. Det finnes ingen
 *  utregning som kan gi det svaret, fordi individuell variasjon på ±30 % er
 *  vanlig og fordi et anslag aldri kan måle den faktiske promillen din. Derfor
 *  har verktøyet heller ingen «hvor mye mer tåler jeg»-funksjon. Å regne seg
 *  fram til hvor mye man kan drikke og fortsatt kjøre er nøyaktig den bruken
 *  som gjør slike kalkulatorer farlige.
 *
 *  Promillegrensen i Norge er 0,2 ‰ (vegtrafikkloven § 22).
 *
 *  Modellen:
 *    Widmark:  promille = gram alkohol / (r × kroppsvekt i kg)
 *    r er fordelingsfaktoren, altså hvor stor andel av kroppen som er vann.
 *    Forbrenningen trekkes fra lineært med β ‰ per time.
 *
 *  Alt her er rene funksjoner uten DOM — se __tests__/bac.spec.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Tetthet til etanol, gram per milliliter */
export const ETHANOL_DENSITY = 0.789

/** Promillegrensen for kjøring i Norge */
export const LEGAL_LIMIT = 0.2

/**
 * Fordelingsfaktor. Dette er egentlig et mål på hvor stor andel av kroppen som
 * er vann, ikke på kjønn — muskler holder mer vann enn fett. Verdiene under er
 * de vanlige gjennomsnittene, og de er grove.
 */
export const R_FACTORS = {
  higher: 0.68,
  lower: 0.55,
} as const

/**
 * Forbrenning i promille per time. Spennet er reelt: 0,10 til 0,20 dekker de
 * fleste, og det er nettopp derfor verktøyet oppgir et intervall og ikke ett
 * tall. Et anslag med to desimaler ville vært falsk presisjon.
 */
export const BURN_RATE = {
  slow: 0.1,
  typical: 0.15,
  fast: 0.2,
} as const

/**
 * Hvor lang tid en enhet bruker på å gå over i blodet. Widmark antar at det
 * skjer momentant, noe som overdriver promillen det første kvarteret. En lineær
 * opptaksrampe er fortsatt en forenkling, men den ligger nærmere virkeligheten.
 */
export const ABSORPTION_MINUTES = 30

/* ── Drikkeenheter ─────────────────────────────────────────────────────────── */

export interface DrinkPreset {
  id: string
  label: { en: string; nb: string }
  /** Milliliter */
  volume: number
  /** Volumprosent alkohol */
  abv: number
}

export const DRINK_PRESETS: DrinkPreset[] = [
  { id: 'beer-033', label: { en: 'Beer 0.33 L', nb: 'Øl 0,33 L' }, volume: 330, abv: 4.7 },
  { id: 'beer-05', label: { en: 'Beer 0.5 L', nb: 'Øl 0,5 L' }, volume: 500, abv: 4.7 },
  { id: 'cider', label: { en: 'Cider 0.33 L', nb: 'Cider 0,33 L' }, volume: 330, abv: 4.5 },
  { id: 'wine', label: { en: 'Wine 0.15 L', nb: 'Vin 0,15 L' }, volume: 150, abv: 12 },
  { id: 'fortified', label: { en: 'Fortified 8 cl', nb: 'Sterkvin 8 cl' }, volume: 80, abv: 20 },
  { id: 'spirit', label: { en: 'Spirits 4 cl', nb: 'Sprit 4 cl' }, volume: 40, abv: 40 },
]

export interface Drink {
  /** Intern nøkkel for lista */
  id: string
  volume: number
  abv: number
  label: string
  /** Minutter siden enheten ble drukket. 0 = akkurat nå. */
  minutesAgo: number
}

/** Gram ren alkohol i en enhet */
export const gramsOfAlcohol = (volumeMl: number, abvPercent: number): number =>
  volumeMl * (abvPercent / 100) * ETHANOL_DENSITY

/* ── Modellen ──────────────────────────────────────────────────────────────── */

export interface Person {
  /** Kilogram */
  weight: number
  /** Fordelingsfaktor, se R_FACTORS */
  r: number
}

/**
 * Hvor stor andel av en enhet som er tatt opp i blodet etter et gitt antall
 * minutter. Lineær rampe fra 0 til 1 over absorpsjonstiden.
 */
export const absorbedFraction = (minutesSinceDrink: number): number => {
  if (minutesSinceDrink <= 0) return 0
  if (minutesSinceDrink >= ABSORPTION_MINUTES) return 1
  return minutesSinceDrink / ABSORPTION_MINUTES
}

/**
 * Promille på et gitt tidspunkt, målt i minutter fra «nå».
 *
 * Negative verdier ser bakover, positive framover. Forbrenningen begynner så
 * snart det finnes alkohol i blodet, og resultatet kan aldri bli negativt.
 */
export const bacAt = (
  drinks: Drink[],
  person: Person,
  minutesFromNow: number,
  burnRate: number = BURN_RATE.typical,
): number => {
  if (person.weight <= 0 || person.r <= 0) return 0

  let consumed = 0
  let earliestMinutesAgo = 0

  for (const drink of drinks) {
    // Hvor lenge siden enheten ble drukket, sett fra tidspunktet vi regner på
    const elapsed = drink.minutesAgo + minutesFromNow
    if (elapsed <= 0) continue

    consumed += gramsOfAlcohol(drink.volume, drink.abv) * absorbedFraction(elapsed)
    earliestMinutesAgo = Math.max(earliestMinutesAgo, elapsed)
  }

  if (consumed === 0) return 0

  const peak = consumed / (person.r * person.weight)
  const burned = (burnRate * earliestMinutesAgo) / 60

  return Math.max(0, peak - burned)
}

export interface Estimate {
  low: number
  typical: number
  high: number
}

/**
 * Anslaget som et spenn.
 *
 * Det lave anslaget kombinerer rask forbrenning med høy fordelingsfaktor, det
 * høye gjør motsatt. Spennet er bredt med vilje — det er slik virkeligheten
 * ser ut, og et enkelt tall ville gitt inntrykk av en presisjon som ikke finnes.
 */
export const estimateAt = (drinks: Drink[], person: Person, minutesFromNow = 0): Estimate => {
  const spread = 0.1
  const values = [
    bacAt(drinks, { ...person, r: person.r * (1 + spread) }, minutesFromNow, BURN_RATE.fast),
    bacAt(drinks, person, minutesFromNow, BURN_RATE.typical),
    bacAt(drinks, { ...person, r: person.r * (1 - spread) }, minutesFromNow, BURN_RATE.slow),
  ].sort((a, b) => a - b)

  return { low: values[0]!, typical: values[1]!, high: values[2]! }
}

/**
 * Minutter til promillen er under en gitt terskel — og blir der.
 *
 * Merk at den leter etter SISTE gang kurven ligger over terskelen, ikke første
 * gang den er under. Et glass som nettopp er drukket er ikke absorbert ennå og
 * måler null i dette øyeblikket; en naiv «første gang under»-sjekk ville
 * dermed svart «du er edru nå» til noen som akkurat har tømt fem halvlitere.
 *
 * Bruker det HØYE anslaget: skal tallet være til nytte, må det være det
 * forsiktige. Returnerer null hvis det ikke skjer innen et døgn.
 */
export const minutesUntilBelow = (
  drinks: Drink[],
  person: Person,
  threshold: number,
): number | null => {
  const maxMinutes = 60 * 24
  const step = 5

  let lastAbove: number | null = null

  for (let minute = 0; minute <= maxMinutes; minute += step) {
    if (estimateAt(drinks, person, minute).high > threshold) lastAbove = minute
  }

  if (lastAbove === null) return 0
  if (lastAbove >= maxMinutes) return null

  return lastAbove + step
}

/** Kurven fra nå og et gitt antall timer framover, til tegning */
export const buildCurve = (
  drinks: Drink[],
  person: Person,
  hoursAhead: number,
  stepMinutes = 15,
): { minutes: number; estimate: Estimate }[] => {
  const points: { minutes: number; estimate: Estimate }[] = []

  for (let minute = 0; minute <= hoursAhead * 60; minute += stepMinutes) {
    points.push({ minutes: minute, estimate: estimateAt(drinks, person, minute) })
  }

  return points
}

/* ── Formatering ───────────────────────────────────────────────────────────── */

export const formatBac = (value: number): string =>
  new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value,
  )

/** «3 t 20 min», eller «20 min» når det er under en time */
export const formatDuration = (minutes: number, locale: string): string => {
  const rounded = Math.ceil(minutes / 5) * 5
  const hours = Math.floor(rounded / 60)
  const mins = rounded % 60

  const hourLabel = locale === 'nb' ? 't' : 'h'
  const minuteLabel = 'min'

  if (hours === 0) return `${mins} ${minuteLabel}`
  if (mins === 0) return `${hours} ${hourLabel}`
  return `${hours} ${hourLabel} ${mins} ${minuteLabel}`
}

/** Klokkeslettet om et gitt antall minutter */
export const clockAfter = (minutes: number, from = new Date()): string => {
  const target = new Date(from.getTime() + minutes * 60_000)
  return new Intl.DateTimeFormat('nb-NO', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(target)
}
