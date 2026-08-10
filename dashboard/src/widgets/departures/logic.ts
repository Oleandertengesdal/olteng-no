/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AVGANGER — ren logikk
 *
 *  Parsing av Entur-svaret, og regnestykkene som avgjør hva som står i ruta.
 *
 *  Det som gjør denne widgeten nyttig framfor pen er skillet mellom planlagt
 *  og forventet tid. En avgang som skulle gått 14:32 og går 14:38 er ikke «en
 *  avgang 14:38» — det er en forsinkelse, og det er den informasjonen som
 *  avgjør om man må løpe.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { IconName } from '@/components/icons.ts'
import type { Bilingual } from '@/data/bilingual.ts'

/* ── Holdeplass ────────────────────────────────────────────────────────────  */

export interface Stop {
  /** NSR:StopPlace:44085 */
  id: string
  name: string
  /** Kommunen. «Gløshaugen» finnes i både Trondheim og Grong. */
  locality: string
}

export const isStop = (value: unknown): value is Stop => {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    s.id.startsWith('NSR:') &&
    typeof s.name === 'string' &&
    typeof s.locality === 'string'
  )
}

/* ── Transportmiddel ───────────────────────────────────────────────────────
   Entur oppgir flere moduser enn vi har ikoner til. Resten faller tilbake på
   bussen framfor på et tomrom, fordi linjenummeret ved siden av uansett sier
   hva det er.                                                                */

export const modeIcon = (mode: string | null): IconName => {
  switch (mode) {
    case 'rail':
    case 'tram':
    case 'metro':
      return 'train'
    case 'water':
      return 'boat'
    default:
      return 'bus'
  }
}

export const MODE_LABEL: Record<string, Bilingual> = {
  bus: { nb: 'Buss', en: 'Bus' },
  tram: { nb: 'Trikk', en: 'Tram' },
  rail: { nb: 'Tog', en: 'Train' },
  metro: { nb: 'T-bane', en: 'Metro' },
  water: { nb: 'Båt', en: 'Boat' },
  coach: { nb: 'Ekspressbuss', en: 'Coach' },
  air: { nb: 'Fly', en: 'Air' },
}

/* ── Avgang ────────────────────────────────────────────────────────────────  */

export interface Departure {
  /** Sammensatt av avgangstid og linje — Entur gir ingen id på selve kallet. */
  key: string
  /** Linjenummeret slik det står på skiltet: «5», «RE10», «FLY1». */
  line: string
  destination: string
  mode: string | null
  /** Planlagt tid, som millisekunder. */
  aimed: number
  /** Forventet tid, sanntid når den finnes. */
  expected: number
  /** Er tiden fra sanntidssystemet, eller bare fra ruteplanen? */
  realtime: boolean
  cancelled: boolean
  /** Plattform eller spor, når holdeplassen har flere. */
  quay: string | null
}

const str = (value: unknown): string | null => (typeof value === 'string' && value !== '' ? value : null)

const time = (value: unknown): number | null => {
  const text = str(value)
  if (!text) return null
  const ms = Date.parse(text)
  return Number.isNaN(ms) ? null : ms
}

/**
 * Leser Entur-svaret.
 *
 * Defensivt hele veien: felter kan mangle, og et felt som mangler skal gi én
 * avgang mindre framfor en widget som krasjer. Avganger uten forventet tid
 * hoppes over — de har ingenting å bidra med i en liste over hva som går nå.
 */
export const parseDepartures = (raw: unknown): Departure[] | null => {
  if (typeof raw !== 'object' || raw === null) return null

  const data = (raw as Record<string, unknown>).data as Record<string, unknown> | undefined
  const stopPlace = data?.stopPlace as Record<string, unknown> | null | undefined

  // stopPlace er null når id-en ikke finnes. Det er et gyldig svar på et
  // dårlig spørsmål, og skal gi en tom liste og ikke en feil.
  if (stopPlace === null) return []
  if (!stopPlace) return null

  const calls = stopPlace.estimatedCalls
  if (!Array.isArray(calls)) return null

  const departures: Departure[] = []

  for (const raw of calls) {
    if (typeof raw !== 'object' || raw === null) continue
    const call = raw as Record<string, unknown>

    const expected = time(call.expectedDepartureTime)
    const aimed = time(call.aimedDepartureTime)
    if (expected === null) continue

    const journey = call.serviceJourney as Record<string, unknown> | undefined
    const line = journey?.line as Record<string, unknown> | undefined
    const destination = call.destinationDisplay as Record<string, unknown> | undefined
    const quay = call.quay as Record<string, unknown> | undefined

    departures.push({
      key: `${expected}-${str(line?.id) ?? '?'}-${departures.length}`,
      line: str(line?.publicCode) ?? str(line?.name) ?? '',
      destination: str(destination?.frontText) ?? str(line?.name) ?? '',
      mode: str(line?.transportMode),
      aimed: aimed ?? expected,
      expected,
      realtime: call.realtime === true,
      cancelled: call.cancellation === true,
      quay: str(quay?.publicCode),
    })
  }

  return departures
}

/* ── Tid ───────────────────────────────────────────────────────────────────  */

/**
 * Minutter til avgang, rundet *ned*.
 *
 * Nedover, ikke til nærmeste. En buss som går om 89 sekunder står som «1 min»
 * og ikke «2 min», fordi den som leser skal rekke den. Å runde opp gir et
 * halvt minutt man ikke har.
 */
export const minutesUntil = (expected: number, now: number): number =>
  Math.floor((expected - now) / 60_000)

/** Forsinkelse i hele minutter. Negativ betyr før tiden. */
export const delayMinutes = (aimed: number, expected: number): number =>
  Math.round((expected - aimed) / 60_000)

export type WaitDisplay =
  | { kind: 'now' }
  | { kind: 'minutes'; minutes: number }
  | { kind: 'clock'; at: number }
  | { kind: 'gone' }

/**
 * Hva som skal stå der tiden står.
 *
 * Under en time: minutter, fordi det er tallet man planlegger etter når man
 * står i gangen med jakka på. Over en time: klokkeslett, fordi «73 min» er et
 * tall ingen klarer å gjøre noe med.
 */
export const waitDisplay = (expected: number, now: number): WaitDisplay => {
  const minutes = minutesUntil(expected, now)
  if (minutes < 0) return { kind: 'gone' }
  if (minutes === 0) return { kind: 'now' }
  if (minutes < 60) return { kind: 'minutes', minutes }
  return { kind: 'clock', at: expected }
}

/**
 * Fjerner avganger som allerede har gått.
 *
 * Svaret kan ligge i cache i noen minutter, og en liste som begynner med noe
 * som gikk for tre minutter siden er verre enn en kortere liste.
 */
export const stillUpcoming = (departures: Departure[], now: number): Departure[] =>
  departures.filter((d) => d.expected >= now - 30_000)
