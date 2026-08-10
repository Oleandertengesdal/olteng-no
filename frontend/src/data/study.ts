/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EKSAMENSLESING — fordeling av lesebolker, og logikken bak timeren
 *
 *  Fordelingen svarer på ett spørsmål: hva skal jeg lese i dag?
 *
 *  Den naive løsningen er å dele dagene likt mellom emnene, men det er feil av
 *  to grunner. Et emne på 15 studiepoeng krever mer enn ett på 7,5, og et emne
 *  med eksamen om tre dager haster mer enn ett med eksamen om tre uker — selv
 *  om det siste er større. Derfor vektes hvert emne hver enkelt dag etter
 *
 *      studiepoeng / dager igjen til eksamen
 *
 *  Det gir en plan som skifter tyngdepunkt av seg selv etter hvert som en
 *  eksamen nærmer seg, uten at man må planlegge om.
 *
 *  Om pauselengder: 25/5 fra pomodoro-metoden er en konvensjon, ikke et
 *  forskningsresultat. Derfor er alt konfigurerbart, og standardverdiene er
 *  merket som utgangspunkt og ikke som fasit.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Exam {
  id: string
  /** Emnekode eller navn */
  subject: string
  /** ISO-dato, YYYY-MM-DD */
  date: string
  /** Studiepoeng — brukes som vekt */
  credits: number
}

export interface PlanBlock {
  examId: string
  subject: string
  blocks: number
}

export interface PlanDay {
  /** YYYY-MM-DD */
  date: string
  /** Antall dager fram i tid, 0 = i dag */
  offset: number
  /** Eksamener som holdes denne dagen */
  examsToday: Exam[]
  allocation: PlanBlock[]
}

/** Dato som YYYY-MM-DD i lokal tid — ikke UTC, som ville bommet på kvelden */
export const toIsoDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const addDays = (iso: string, days: number): string => {
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** Hele dager fra `from` til `to`. Negativt tall betyr at datoen er passert. */
export const daysBetween = (from: string, to: string): number => {
  const a = new Date(`${from}T12:00:00`).getTime()
  const b = new Date(`${to}T12:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/**
 * Fordeler dagens bolker mellom emnene.
 *
 * Hele tall er poenget: «1,4 bolker på matte» er ikke noe man kan gjøre. Derfor
 * fordeles hele bolker først, og restene tildeles til de emnene som tapte mest
 * på avrundingen — samme metode som brukes når mandater skal fordeles etter
 * stemmetall.
 */
export const allocateBlocks = (
  exams: { id: string; subject: string; weight: number }[],
  totalBlocks: number,
): PlanBlock[] => {
  if (exams.length === 0 || totalBlocks <= 0) return []

  const totalWeight = exams.reduce((sum, exam) => sum + exam.weight, 0)
  if (totalWeight <= 0) return []

  const exact = exams.map((exam) => ({
    ...exam,
    ideal: (exam.weight / totalWeight) * totalBlocks,
  }))

  const allocation = exact.map((exam) => ({
    examId: exam.id,
    subject: exam.subject,
    blocks: Math.floor(exam.ideal),
    remainder: exam.ideal - Math.floor(exam.ideal),
  }))

  let assigned = allocation.reduce((sum, item) => sum + item.blocks, 0)

  // Del ut det som er igjen til dem med størst rest
  const byRemainder = [...allocation].sort((a, b) => b.remainder - a.remainder)
  let index = 0
  while (assigned < totalBlocks && byRemainder.length > 0) {
    byRemainder[index % byRemainder.length]!.blocks += 1
    assigned += 1
    index += 1
  }

  return allocation
    .filter((item) => item.blocks > 0)
    .map(({ examId, subject, blocks }) => ({ examId, subject, blocks }))
}

/**
 * Bygger planen fra i dag til siste eksamen.
 *
 * Et emne slutter å få bolker på selve eksamensdagen og etterpå — da er løpet
 * kjørt, og timene bør gå til det som gjenstår.
 */
export const buildPlan = (
  exams: Exam[],
  blocksPerDay: number,
  today = toIsoDate(new Date()),
): PlanDay[] => {
  const upcoming = exams.filter((exam) => exam.date && daysBetween(today, exam.date) >= 0)
  if (upcoming.length === 0) return []

  const lastDay = upcoming.reduce(
    (latest, exam) => Math.max(latest, daysBetween(today, exam.date)),
    0,
  )

  const days: PlanDay[] = []

  for (let offset = 0; offset <= lastDay; offset++) {
    const date = addDays(today, offset)

    const examsToday = upcoming.filter((exam) => exam.date === date)

    // Bare emner det fortsatt er tid til å lese til
    const active = upcoming
      .map((exam) => ({ exam, daysLeft: daysBetween(date, exam.date) }))
      .filter(({ daysLeft }) => daysLeft > 0)
      .map(({ exam, daysLeft }) => ({
        id: exam.id,
        subject: exam.subject,
        // Jo nærmere eksamen, jo tyngre veier emnet
        weight: exam.credits / daysLeft,
      }))

    days.push({
      date,
      offset,
      examsToday,
      allocation: allocateBlocks(active, blocksPerDay),
    })
  }

  return days
}

/** Samlet antall bolker per emne i hele planen */
export const totalBlocksPerExam = (plan: PlanDay[]): Record<string, number> => {
  const totals: Record<string, number> = {}
  for (const day of plan) {
    for (const item of day.allocation) {
      totals[item.examId] = (totals[item.examId] ?? 0) + item.blocks
    }
  }
  return totals
}

/* ── Timeren ───────────────────────────────────────────────────────────────── */

export interface TimerSettings {
  /** Minutter med lesing */
  focusMinutes: number
  /** Minutter kort pause */
  breakMinutes: number
  /** Minutter lang pause */
  longBreakMinutes: number
  /** Antall lesebolker før den lange pausen */
  blocksBeforeLongBreak: number
}

/**
 * Utgangspunkt, ikke fasit. 25/5 stammer fra pomodoro-metoden og er en
 * konvensjon noen fant på — det finnes ingen forskning som sier at nettopp
 * 25 minutter er riktig. 45 minutter passer mange bedre til tung lesing, så
 * det er standarden her, og alt kan endres.
 */
export const DEFAULT_TIMER: TimerSettings = {
  focusMinutes: 45,
  breakMinutes: 10,
  longBreakMinutes: 25,
  blocksBeforeLongBreak: 3,
}

export type Phase = 'focus' | 'break' | 'longBreak'

/** Hva kommer etter denne fasen, gitt hvor mange bolker som er fullført */
export const nextPhase = (
  current: Phase,
  completedBlocks: number,
  settings: TimerSettings,
): Phase => {
  if (current !== 'focus') return 'focus'
  const isLong =
    settings.blocksBeforeLongBreak > 0 && completedBlocks % settings.blocksBeforeLongBreak === 0
  return isLong ? 'longBreak' : 'break'
}

export const phaseMinutes = (phase: Phase, settings: TimerSettings): number => {
  if (phase === 'focus') return settings.focusMinutes
  if (phase === 'break') return settings.breakMinutes
  return settings.longBreakMinutes
}

/** mm:ss, med timer foran hvis det trengs */
export const formatClock = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.ceil(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60

  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Lesetid i timer og minutter, til dagsoppsummeringen */
export const formatFocusTotal = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours} t`
  return `${hours} t ${mins} min`
}
