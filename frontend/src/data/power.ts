/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  STRØMPRIS — datalag
 *
 *  Kilde: https://www.hvakosterstrommen.no/strompris-api
 *  Åpent og gratis, ingen nøkkel. Prisene hentes fra ENTSO-E i euro og
 *  konverteres til kroner med dagskursen fra Norges Bank.
 *
 *  Tre ting API-et gjør som er lett å bomme på, og som alt under tar hensyn til:
 *
 *    1. Prisene er UTEN mva. NO4 (Nord-Norge) betaler i tillegg ikke mva i det
 *       hele tatt, så mva-påslaget må være sonebetinget — ikke en global bryter.
 *    2. Morgendagens priser publiseres tidligst kl. 13. Før det svarer API-et
 *       404, som er en forventet tilstand og ikke en feil.
 *    3. Et døgn har ikke alltid 24 timer. Ved overgang til og fra sommertid får
 *       du 23 eller 25 punkter. Ingenting her antar 24.
 *
 *  All logikk under er rene funksjoner nettopp for at de skal kunne testes uten
 *  nettverk — se __tests__/power.spec.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Hue } from './tech'

/* ── Prisområder ───────────────────────────────────────────────────────────── */

export type ZoneId = 'NO1' | 'NO2' | 'NO3' | 'NO4' | 'NO5'

export interface Zone {
  id: ZoneId
  city: string
  region: { en: string; nb: string }
  /** Nord-Norge har fritak for merverdiavgift på strøm */
  vatExempt: boolean
  hue: Hue
}

export const ZONES: Zone[] = [
  {
    id: 'NO1',
    city: 'Oslo',
    region: { en: 'Eastern Norway', nb: 'Øst-Norge' },
    vatExempt: false,
    hue: 'iris',
  },
  {
    id: 'NO2',
    city: 'Kristiansand',
    region: { en: 'Southern Norway', nb: 'Sør-Norge' },
    vatExempt: false,
    hue: 'clay',
  },
  {
    id: 'NO3',
    city: 'Trondheim',
    region: { en: 'Central Norway', nb: 'Midt-Norge' },
    vatExempt: false,
    hue: 'pine',
  },
  {
    id: 'NO4',
    city: 'Tromsø',
    region: { en: 'Northern Norway', nb: 'Nord-Norge' },
    vatExempt: true,
    hue: 'ochre',
  },
  {
    id: 'NO5',
    city: 'Bergen',
    region: { en: 'Western Norway', nb: 'Vest-Norge' },
    vatExempt: false,
    hue: 'ochre',
  },
]

export const zoneById = (id: ZoneId): Zone => ZONES.find((z) => z.id === id) ?? ZONES[0]!

export const VAT_RATE = 0.25

/* ── Typer ─────────────────────────────────────────────────────────────────── */

/** Rårespons fra API-et, ett objekt per time. */
interface RawPricePoint {
  NOK_per_kWh: number
  EUR_per_kWh: number
  EXR: number
  time_start: string
  time_end: string
}

export interface PricePoint {
  /** ISO-streng fra API-et, brukt som nøkkel når soner skal stilles på linje */
  key: string
  start: Date
  end: Date
  /** Kroner per kWh, uten mva — slik API-et leverer det */
  nokExVat: number
  eurPerKwh: number
}

export interface ZoneDay {
  zone: ZoneId
  /** YYYY-MM-DD, i norsk tid */
  date: string
  points: PricePoint[]
}

export class PricesNotPublishedError extends Error {
  constructor(date: string) {
    super(`Prices for ${date} have not been published yet`)
    this.name = 'PricesNotPublishedError'
  }
}

/* ── Dato- og klokkeslettformat i norsk tid ───────────────────────────────── */

export const OSLO = 'Europe/Oslo'

/**
 * Datoen i Norge akkurat nå — ikke i leserens tidssone. En bruker i New York
 * skal se norske strømpriser for det norske døgnet.
 */
export const osloDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: OSLO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return { year: get('year'), month: get('month'), day: get('day') }
}

/**
 * YYYY-MM-DD for «i dag» eller et gitt antall døgn fram i norsk tid.
 *
 * `now` kan sendes inn slik at kalleren kan gjøre datoen reaktiv — og slik at
 * det går an å teste døgnskifter uten å stille klokka på maskinen.
 */
export const osloDate = (offsetDays = 0, now = new Date()): string => {
  const base = new Date(now)
  base.setUTCDate(base.getUTCDate() + offsetDays)
  const { year, month, day } = osloDateParts(base)
  return `${year}-${month}-${day}`
}

export const hourLabel = (date: Date): string =>
  new Intl.DateTimeFormat('nb-NO', {
    timeZone: OSLO,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(date)

/** Klokkeslettet i Norge som desimaltall, f.eks. 13.5 for 13:30. */
export const osloHourNow = (now = new Date()): number => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: OSLO,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)

  return get('hour') + get('minute') / 60
}

/** Morgendagens priser slippes tidligst kl. 13 norsk tid. */
export const TOMORROW_PUBLISHED_AT = 13

export const tomorrowMayBePublished = (now = new Date()): boolean =>
  osloHourNow(now) >= TOMORROW_PUBLISHED_AT

/* ── Henting ───────────────────────────────────────────────────────────────── */

/**
 * Bytt denne hvis kallet en gang skulle bli blokkert av CORS — da peker du den
 * mot en egen proxy og resten av appen trenger ikke å vite om det.
 */
export const API_BASE = 'https://www.hvakosterstrommen.no/api/v1/prices'

const buildUrl = (date: string, zone: ZoneId): string => {
  const [year, month, day] = date.split('-')
  return `${API_BASE}/${year}/${month}-${day}_${zone}.json`
}

/** Ett døgn per sone hentes én gang per øktløp — API-et er gratis, vær grei. */
const cache = new Map<string, ZoneDay>()

export const clearPriceCache = () => cache.clear()

export const parsePoints = (raw: RawPricePoint[]): PricePoint[] =>
  raw.map((entry) => ({
    key: entry.time_start,
    start: new Date(entry.time_start),
    end: new Date(entry.time_end),
    nokExVat: entry.NOK_per_kWh,
    eurPerKwh: entry.EUR_per_kWh,
  }))

export const fetchZoneDay = async (
  zone: ZoneId,
  date: string,
  signal?: AbortSignal,
): Promise<ZoneDay> => {
  const cacheKey = `${date}_${zone}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const response = await fetch(buildUrl(date, zone), { signal })

  // 404 betyr som regel at morgendagens priser ikke er sluppet ennå, ikke at
  // noe er galt. Den forskjellen er verdt å ta vare på helt ut i grensesnittet.
  if (response.status === 404) throw new PricesNotPublishedError(date)
  if (!response.ok) throw new Error(`Kunne ikke hente priser (HTTP ${response.status})`)

  const raw = (await response.json()) as RawPricePoint[]
  if (!Array.isArray(raw) || raw.length === 0) throw new PricesNotPublishedError(date)

  const day: ZoneDay = { zone, date, points: parsePoints(raw) }
  cache.set(cacheKey, day)
  return day
}

/**
 * Alle fem soner samtidig. Bruker allSettled slik at én sone som feiler ikke
 * river med seg resten av siden — landssnittet regnes av det vi faktisk fikk.
 */
export const fetchAllZones = async (
  date: string,
  signal?: AbortSignal,
): Promise<{ days: ZoneDay[]; failed: ZoneId[] }> => {
  const results = await Promise.allSettled(ZONES.map((zone) => fetchZoneDay(zone.id, date, signal)))

  const days: ZoneDay[] = []
  const failed: ZoneId[] = []

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') days.push(result.value)
    else failed.push(ZONES[i]!.id)
  })

  return { days, failed }
}

/* ── Merverdiavgift ────────────────────────────────────────────────────────── */

/**
 * Prisene fra API-et er uten mva. Nord-Norge har fritak, så der skal det aldri
 * legges på noe uansett hva brukeren har huket av.
 */
export const withVat = (nokExVat: number, zone: ZoneId, includeVat: boolean): number => {
  if (!includeVat || zoneById(zone).vatExempt) return nokExVat
  return nokExVat * (1 + VAT_RATE)
}

/* ── Statistikk ────────────────────────────────────────────────────────────── */

export interface DayStats {
  min: number
  max: number
  mean: number
  cheapest: PricePoint | null
  priciest: PricePoint | null
}

export const statsFor = (points: PricePoint[]): DayStats => {
  if (points.length === 0) {
    return { min: 0, max: 0, mean: 0, cheapest: null, priciest: null }
  }

  let cheapest = points[0]!
  let priciest = points[0]!
  let total = 0

  for (const point of points) {
    if (point.nokExVat < cheapest.nokExVat) cheapest = point
    if (point.nokExVat > priciest.nokExVat) priciest = point
    total += point.nokExVat
  }

  return {
    min: cheapest.nokExVat,
    max: priciest.nokExVat,
    mean: total / points.length,
    cheapest,
    priciest,
  }
}

/**
 * Landssnittet time for time.
 *
 * Punktene stilles på linje etter tidsstempel og ikke etter posisjon i lista.
 * På døgn med sommertidsovergang har ikke alle soner nødvendigvis like mange
 * punkter, og da ville indeks-for-indeks gitt feil svar.
 *
 * Merk at dette er et rent gjennomsnitt av de fem prisområdene, ikke et
 * forbruksvektet snitt for Norge — sonene har svært ulikt folketall.
 */
export const nationalAverage = (days: ZoneDay[]): PricePoint[] => {
  if (days.length === 0) return []

  const buckets = new Map<string, { point: PricePoint; total: number; count: number }>()

  for (const day of days) {
    for (const point of day.points) {
      const bucket = buckets.get(point.key)
      if (bucket) {
        bucket.total += point.nokExVat
        bucket.count += 1
      } else {
        buckets.set(point.key, { point, total: point.nokExVat, count: 1 })
      }
    }
  }

  return [...buckets.values()]
    .map(({ point, total, count }) => ({ ...point, nokExVat: total / count }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}

/** Indeks for timen vi er inne i nå, eller -1 hvis døgnet ikke er i dag. */
export const currentHourIndex = (points: PricePoint[], now = new Date()): number =>
  points.findIndex((point) => now >= point.start && now < point.end)

/** Avvik i prosent mot en referanse. Positivt tall betyr dyrere. */
export const percentDiff = (value: number, reference: number): number | null => {
  if (!Number.isFinite(reference) || reference === 0) return null
  return ((value - reference) / reference) * 100
}

/* ── Fargenivå innenfor døgnet ─────────────────────────────────────────────── */

export type PriceLevel = 'low' | 'mid' | 'high'

/**
 * Nivået er relativt til døgnets eget spenn, ikke en absolutt kronegrense.
 * En billig time i januar og en billig time i juli har lite med hverandre å
 * gjøre, og en fast grense ville gjort hele grafen ensfarget halve året.
 */
export const levelFor = (value: number, stats: DayStats): PriceLevel => {
  const span = stats.max - stats.min
  if (span <= 0) return 'mid'
  const position = (value - stats.min) / span
  if (position <= 1 / 3) return 'low'
  if (position >= 2 / 3) return 'high'
  return 'mid'
}

export const levelClasses: Record<PriceLevel, { fill: string; text: string }> = {
  low: { fill: 'fill-pine', text: 'text-pine' },
  mid: { fill: 'fill-ochre', text: 'text-ochre' },
  high: { fill: 'fill-clay', text: 'text-clay' },
}

/* ── Visningstyper ─────────────────────────────────────────────────────────
   Bor her og ikke i komponentene, fordi `<script setup>` ikke kan eksportere
   typer — og fordi både grafen og siden trenger dem.                        */

export interface ChartPoint {
  key: string
  /** Timen i norsk tid, f.eks. «14» */
  label: string
  value: number
  level: PriceLevel
  isNow: boolean
}

export interface ZoneSummary {
  zone: ZoneId
  /** Døgnsnitt i kr/kWh, allerede justert for mva hvis brukeren ba om det */
  mean: number
}

/* ── Formatering ───────────────────────────────────────────────────────────── */

export const formatKr = (value: number): string =>
  new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value,
  )

export const formatOre = (value: number): string =>
  new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(value * 100)
