/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  KLOKKE — ren logikk
 *
 *  Ukenummer er hovedgrunnen til at denne widgeten finnes. Norske studieplaner,
 *  timeplaner og innleveringsfrister er skrevet i uker, ikke i datoer, og «uke
 *  37» er informasjon man må slå opp hvis den ikke står noe sted.
 *
 *  Studieuke er det samme spørsmålet stilt av en student: ikke hvilken uke i
 *  året, men hvor langt ut i semesteret vi er.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Ukenummer etter ISO 8601, som er standarden Norge bruker.
 *
 * Regelen er at uke 1 er uken som inneholder årets første torsdag. Trikset
 * under følger av det: flytt datoen til torsdagen i sin egen uke, og tell så
 * hvor mange uker det er fra 1. januar det året torsdagen havnet i.
 *
 * Regningen gjøres i UTC med rene datofelter. Ikke fordi tidssonen betyr noe
 * for hvilken uke det er, men fordi sommertid gjør at et døgn kan være 23 eller
 * 25 timer, og en utregning som deler på 86 400 000 bommer da med én dag ved
 * hver overgang.
 */
export const isoWeek = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // getUTCDay gir 0 for søndag; ISO vil ha 7.
  const weekday = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - weekday)
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7)
}

/**
 * Året uken tilhører, som ikke alltid er året datoen tilhører.
 * 1. januar 2021 lå i uke 53 av 2020. Uten dette ville «uke 53 2021» stått på
 * skjermen, og det året hadde 52 uker.
 */
export const isoWeekYear = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const weekday = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - weekday)
  return d.getUTCFullYear()
}

/* ── Semester ──────────────────────────────────────────────────────────────  */

/**
 * Semesteret som ukeintervall.
 *
 * Standardverdiene er *typiske* for norske læresteder, ikke fasit — UiT og
 * NTNU starter ikke i samme uke, og et lærested kan flytte semesterstart et
 * år. Derfor er de innstillinger, og derfor står det «omtrentlig» i
 * grensesnittet. En studieuke som er én uke feil er verre enn ingen studieuke,
 * hvis brukeren ikke vet at den kan være det.
 */
export interface SemesterConfig {
  /** Første undervisningsuke om våren. */
  springStartWeek: number
  /** Antall uker semesteret varer, eksamen medregnet. */
  springWeeks: number
  autumnStartWeek: number
  autumnWeeks: number
}

export const DEFAULT_SEMESTER: SemesterConfig = {
  springStartWeek: 2,
  springWeeks: 23,
  autumnStartWeek: 33,
  autumnWeeks: 18,
}

export const isSemesterConfig = (value: unknown): value is SemesterConfig => {
  if (typeof value !== 'object' || value === null) return false
  const c = value as Record<string, unknown>
  const fields = ['springStartWeek', 'springWeeks', 'autumnStartWeek', 'autumnWeeks'] as const
  return fields.every((f) => Number.isInteger(c[f]) && (c[f] as number) >= 1 && (c[f] as number) <= 53)
}

export type SemesterName = 'spring' | 'autumn'

export interface SemesterProgress {
  semester: SemesterName
  /** Studieuke, 1-indeksert. */
  week: number
  total: number
}

/**
 * Hvilken studieuke er det nå — eller ingen, hvis det er ferie.
 *
 * `null` er et ekte svar og ikke en feiltilstand. Det er sommer i ti uker,
 * og da skal det stå at det er sommer framfor «uke 0».
 */
export const semesterProgress = (
  date: Date,
  config: SemesterConfig = DEFAULT_SEMESTER,
): SemesterProgress | null => {
  const week = isoWeek(date)

  const springEnd = config.springStartWeek + config.springWeeks - 1
  if (week >= config.springStartWeek && week <= springEnd) {
    return {
      semester: 'spring',
      week: week - config.springStartWeek + 1,
      total: config.springWeeks,
    }
  }

  const autumnEnd = config.autumnStartWeek + config.autumnWeeks - 1
  if (week >= config.autumnStartWeek && week <= autumnEnd) {
    return {
      semester: 'autumn',
      week: week - config.autumnStartWeek + 1,
      total: config.autumnWeeks,
    }
  }

  return null
}

/* ── Tikking ───────────────────────────────────────────────────────────────  */

/**
 * Millisekunder til neste hele sekund.
 *
 * En klokke som oppdateres med setInterval(1000) driver: den starter midt i et
 * sekund og blir liggende der, så sifferet skifter et halvt sekund etter at
 * tiden faktisk gjorde det. Ved å planlegge neste oppdatering til akkurat
 * sekundskiftet skifter tallet når det skal, og driften nullstilles hver gang.
 */
export const msToNextSecond = (now: number): number => 1000 - (now % 1000)

/** Samme for minutt — brukes når sekunder ikke vises og vi kan sove lenger. */
export const msToNextMinute = (now: number): number => 60_000 - (now % 60_000)
