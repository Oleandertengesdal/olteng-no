/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  VÆR — ren logikk
 *
 *  Tolkning av WMO-koder, parsing av svaret fra Open-Meteo, og geometrien til
 *  kurven. Ingenting her rører DOM-en eller nettet.
 *
 *  Om kurven: den er tegnet med rette linjer mellom timene, ikke som en myk
 *  spline. En glattet kurve ser bedre ut og finner opp verdier mellom
 *  målepunktene — den ville vist en topp på 8,3 grader klokka halv tre som
 *  ingen har målt eller varslet. Rette linjer sier det som faktisk står i
 *  varselet: én verdi per time.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Bilingual } from '@/data/bilingual.ts'
import type { IconName } from '@/components/icons.ts'

/* ── Sted ──────────────────────────────────────────────────────────────────  */

export interface Place {
  /** Fra geokoderen, eller «koordinat» for et sted brukeren har hentet selv. */
  id: string
  name: string
  /** Fylke eller region. Skiller de fire stedene som heter Grimstad. */
  region: string
  country: string
  latitude: number
  longitude: number
}

export const isPlace = (value: unknown): value is Place => {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.region === 'string' &&
    typeof p.country === 'string' &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude)
  )
}

/** Koordinater rundes til fire desimaler — omtrent elleve meter.
 *  Mer presisjon gir ingen bedre værvarsel, og gjør cachenøkkelen ustabil. */
export const placeKey = (place: Place): string =>
  `weather.${place.latitude.toFixed(4)},${place.longitude.toFixed(4)}`

/* ── WMO-koder ─────────────────────────────────────────────────────────────
   Tabellen er fra WMO 4677, slik Open-Meteo bruker den. Kodene er gruppert
   fordi ingen har bruk for å skille «lett yr» fra «moderat yr» på et dashbord
   — men grupperingen er konservativ: sludd blir aldri til regn, og
   underkjølt regn får sin egen tekst, fordi det er forskjellen på glatt og
   ikke glatt.                                                                */

export interface WeatherDescription {
  icon: IconName
  label: Bilingual
  /** Sant for koder som betyr at det faller noe. Brukes til å markere kurven. */
  precipitation: boolean
}

export const describeCode = (code: number, isDay: boolean): WeatherDescription => {
  switch (code) {
    case 0:
      return {
        icon: isDay ? 'sun' : 'moon',
        label: { nb: 'Klarvær', en: 'Clear sky' },
        precipitation: false,
      }
    case 1:
      return {
        icon: isDay ? 'cloudSun' : 'cloudMoon',
        label: { nb: 'Stort sett klart', en: 'Mainly clear' },
        precipitation: false,
      }
    case 2:
      return {
        icon: isDay ? 'cloudSun' : 'cloudMoon',
        label: { nb: 'Delvis skyet', en: 'Partly cloudy' },
        precipitation: false,
      }
    case 3:
      return { icon: 'cloud', label: { nb: 'Overskyet', en: 'Overcast' }, precipitation: false }

    case 45:
    case 48:
      return { icon: 'fog', label: { nb: 'Tåke', en: 'Fog' }, precipitation: false }

    case 51:
    case 53:
    case 55:
      return { icon: 'drizzle', label: { nb: 'Yr', en: 'Drizzle' }, precipitation: true }

    case 56:
    case 57:
      return {
        icon: 'sleet',
        // Egen tekst med vilje: underkjølt yr er forskjellen på glatt og ikke.
        label: { nb: 'Underkjølt yr', en: 'Freezing drizzle' },
        precipitation: true,
      }

    case 61:
    case 63:
    case 65:
      return { icon: 'rain', label: { nb: 'Regn', en: 'Rain' }, precipitation: true }

    case 66:
    case 67:
      return {
        icon: 'sleet',
        label: { nb: 'Underkjølt regn', en: 'Freezing rain' },
        precipitation: true,
      }

    case 71:
    case 73:
    case 75:
    case 77:
      return { icon: 'snow', label: { nb: 'Snø', en: 'Snow' }, precipitation: true }

    case 80:
    case 81:
    case 82:
      return { icon: 'rain', label: { nb: 'Regnbyger', en: 'Rain showers' }, precipitation: true }

    case 85:
    case 86:
      return { icon: 'snow', label: { nb: 'Snøbyger', en: 'Snow showers' }, precipitation: true }

    case 95:
      return { icon: 'thunder', label: { nb: 'Torden', en: 'Thunderstorm' }, precipitation: true }

    case 96:
    case 99:
      return {
        icon: 'thunder',
        label: { nb: 'Torden med hagl', en: 'Thunderstorm with hail' },
        precipitation: true,
      }

    default:
      // Ukjent kode. Ikke finn på noe — si at det er ukjent.
      return { icon: 'cloud', label: { nb: 'Ukjent', en: 'Unknown' }, precipitation: false }
  }
}

/* ── Parsing ───────────────────────────────────────────────────────────────
   Svaret leses defensivt. Open-Meteo er stabilt, men et felt som mangler skal
   gi «vi vet ikke» framfor NaN på skjermen.                                  */

export interface HourPoint {
  /** ISO-tekst slik den kom, uten tidssoneforskyvning — den er allerede lokal. */
  time: string
  temperature: number
  precipitation: number
  /** Sannsynlighet i prosent, eller null når modellen ikke oppgir den. */
  probability: number | null
  code: number
}

export interface Weather {
  temperature: number
  apparent: number
  code: number
  isDay: boolean
  windSpeed: number | null
  hours: HourPoint[]
}

const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null)

export const parseForecast = (raw: unknown): Weather | null => {
  if (typeof raw !== 'object' || raw === null) return null
  const root = raw as Record<string, unknown>

  const current = root.current as Record<string, unknown> | undefined
  const hourly = root.hourly as Record<string, unknown> | undefined
  if (!current || !hourly) return null

  const temperature = num(current.temperature_2m)
  const code = num(current.weather_code)
  if (temperature === null || code === null) return null

  const times = Array.isArray(hourly.time) ? (hourly.time as unknown[]) : []
  const temps = Array.isArray(hourly.temperature_2m) ? (hourly.temperature_2m as unknown[]) : []
  const precs = Array.isArray(hourly.precipitation) ? (hourly.precipitation as unknown[]) : []
  const probs = Array.isArray(hourly.precipitation_probability)
    ? (hourly.precipitation_probability as unknown[])
    : []
  const codes = Array.isArray(hourly.weather_code) ? (hourly.weather_code as unknown[]) : []

  const hours: HourPoint[] = []
  for (let i = 0; i < times.length; i += 1) {
    const time = times[i]
    const t = num(temps[i])
    if (typeof time !== 'string' || t === null) continue
    hours.push({
      time,
      temperature: t,
      precipitation: num(precs[i]) ?? 0,
      probability: num(probs[i]),
      code: num(codes[i]) ?? 0,
    })
  }

  return {
    temperature,
    apparent: num(current.apparent_temperature) ?? temperature,
    code,
    // is_day er 1 eller 0. I mørketiden er den 0 hele døgnet, som er riktig.
    isDay: num(current.is_day) !== 0,
    windSpeed: num(current.wind_speed_10m),
    hours,
  }
}

/**
 * Timene fra og med den inneværende, opp til `count`.
 *
 * Open-Meteo svarer fra begynnelsen av inneværende time. Klokka 14:40 vil den
 * første timen være 14:00, som er riktig — det er været nå — men alt før det
 * skal bort.
 */
export const upcomingHours = (hours: HourPoint[], now: Date, count = 12): HourPoint[] => {
  const startOfHour = new Date(now)
  startOfHour.setMinutes(0, 0, 0)
  const cutoff = startOfHour.getTime()

  return hours.filter((h) => new Date(h.time).getTime() >= cutoff).slice(0, count)
}

/* ── Geometri ──────────────────────────────────────────────────────────────  */

export interface Scale {
  min: number
  max: number
}

/**
 * Aksen for temperatur.
 *
 * Minst fire grader spenn, slik at en flat dag ikke blir tegnet som en
 * fjellkjede. En kurve som forstørrer en variasjon på 0,3 grader til full
 * høyde er en løgn med riktige tall.
 */
export const temperatureScale = (values: number[], minimumSpan = 4): Scale => {
  if (values.length === 0) return { min: 0, max: minimumSpan }

  let min = Math.min(...values)
  let max = Math.max(...values)

  const span = max - min
  if (span < minimumSpan) {
    const pad = (minimumSpan - span) / 2
    min -= pad
    max += pad
  }

  return { min, max }
}

/** Punkt i SVG-koordinater. */
export interface Point {
  x: number
  y: number
}

export const linePoints = (values: number[], scale: Scale, width: number, height: number): Point[] => {
  if (values.length === 0) return []
  if (values.length === 1) return [{ x: width / 2, y: height / 2 }]

  const range = scale.max - scale.min || 1
  const step = width / (values.length - 1)

  return values.map((value, i) => ({
    x: i * step,
    // SVG har y nedover; høy temperatur skal være høyt oppe.
    y: height - ((value - scale.min) / range) * height,
  }))
}

/** Rette linjer mellom timene. Se filkommentaren for hvorfor det ikke glattes. */
export const linePath = (points: Point[]): string =>
  points.length === 0
    ? ''
    : points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

export interface Bar {
  x: number
  width: number
  height: number
  /** Millimeter, til skjermlesertekst og etikett. */
  value: number
}

/**
 * Nedbørssøylene.
 *
 * Skalaen har et gulv på 1 mm. Uten det ville 0,1 mm yr blitt tegnet som en
 * full søyle bare fordi det var det største tallet i vinduet.
 */
export const precipitationBars = (
  values: number[],
  width: number,
  height: number,
  floorMm = 1,
): Bar[] => {
  if (values.length === 0) return []

  const max = Math.max(floorMm, ...values)
  const slot = width / values.length
  const barWidth = Math.max(1, slot * 0.5)

  return values.map((value, i) => ({
    x: i * slot + (slot - barWidth) / 2,
    width: barWidth,
    height: value <= 0 ? 0 : Math.max(1, (value / max) * height),
    value,
  }))
}

/** Total nedbør i vinduet, avrundet slik at 0,04 mm ikke blir til «0,0 mm». */
export const totalPrecipitation = (values: number[]): number =>
  Math.round(values.reduce((sum, v) => sum + v, 0) * 10) / 10
