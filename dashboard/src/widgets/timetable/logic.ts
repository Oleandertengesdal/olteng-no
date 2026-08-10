/**
 * Timeplanen — ren logikk.
 *
 * Selve ICS-lesingen ligger i src/data/ics.ts, som er et formatbibliotek og
 * ikke en widget. Her er bare spørsmålene denne widgeten stiller: hva skjer i
 * dag, og hvis ingenting skjer i dag — når skjer det noe igjen.
 */

import { occurrencesBetween, type IcsEvent, type Occurrence } from '@/data/ics.ts'

/** Døgnet en dato ligger i, i lokal tid. */
export const dayWindow = (date: Date): { start: number; end: number } => {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  // Slutten er siste millisekund av døgnet, ikke første av det neste — ellers
  // dukker morgendagens 00:00-hendelse opp i dag.
  return { start: start.getTime(), end: end.getTime() - 1 }
}

export interface DayPlan {
  /** Døgnet dette gjelder. Ikke nødvendigvis i dag — se nextDayWithEvents. */
  date: Date
  occurrences: Occurrence[]
}

export const planFor = (events: IcsEvent[], date: Date): DayPlan => {
  const { start, end } = dayWindow(date)
  return { date, occurrences: occurrencesBetween(events, start, end) }
}

/**
 * Neste dag det står noe på timeplanen.
 *
 * Brukes når dagen er tom. «Ingenting i dag» er nyttig; «ingenting i dag,
 * neste er tirsdag 08:15» er nyttigere, og koster ett oppslag til.
 *
 * Leter maksimalt fjorten dager fram. Er det tomt så lenge, er det ferie, og
 * da er svaret uansett «ingenting».
 */
export const nextDayWithEvents = (events: IcsEvent[], from: Date, maxDays = 14): DayPlan | null => {
  for (let offset = 1; offset <= maxDays; offset += 1) {
    const date = new Date(from)
    date.setDate(date.getDate() + offset)
    const plan = planFor(events, date)
    if (plan.occurrences.length > 0) return plan
  }
  return null
}

export type OccurrenceStatus = 'past' | 'now' | 'upcoming'

/** Er forelesningen ferdig, i gang, eller ikke begynt? */
export const statusOf = (occurrence: Occurrence, now: number): OccurrenceStatus => {
  const end = occurrence.end ?? occurrence.start
  if (now > end) return 'past'
  if (now >= occurrence.start) return 'now'
  return 'upcoming'
}

/**
 * Webcal-lenker er https-lenker med et annet skjema foran.
 *
 * TimeEdit og de fleste lærestedskalendere gir ut abonnementslenken med
 * webcal://, som nettleseren ikke kan hente med fetch. Byttet er trygt:
 * webcal har aldri betydd noe annet enn https.
 */
export const normaliseCalendarUrl = (url: string): string =>
  url.trim().replace(/^webcal:\/\//i, 'https://')

export const looksLikeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(normaliseCalendarUrl(url))
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}
