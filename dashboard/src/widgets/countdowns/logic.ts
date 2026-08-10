/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  NEDTELLINGER — ren logikk
 *
 *  Det vanskelige her er ikke subtraksjonen, det er hva «dag» betyr.
 *
 *  «Fire dager til eksamen» handler om kalenderdager, ikke om 96 timer. Står
 *  man på mandag klokka 23 og eksamen er torsdag klokka 09, er det tre dager
 *  til — selv om det er under 58 timer. Derfor telles hele dager mellom
 *  datoene, ikke millisekunder delt på 86 400 000.
 *
 *  Den forskjellen betyr også at sommertid ikke kan bomme: det finnes to døgn
 *  i året som er 23 og 25 timer lange, og en utregning som deler millisekunder
 *  på et døgn viser feil dag i dagene rundt dem.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Countdown {
  id: string
  title: string
  /** ISO-dato uten tidssone: «2026-12-12». */
  date: string
  /** «09:00», eller null for noe som gjelder hele dagen. */
  time: string | null
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/

export const isCountdown = (value: unknown): value is Countdown => {
  if (typeof value !== 'object' || value === null) return false
  const c = value as Record<string, unknown>
  return (
    typeof c.id === 'string' &&
    c.id !== '' &&
    typeof c.title === 'string' &&
    typeof c.date === 'string' &&
    DATE_PATTERN.test(c.date) &&
    (c.time === null || (typeof c.time === 'string' && TIME_PATTERN.test(c.time)))
  )
}

export const newCountdownId = (): string =>
  `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/* ── Datoregning ───────────────────────────────────────────────────────────  */

/**
 * Hele kalenderdager mellom to tidspunkter, i lokal tid.
 *
 * Datoene normaliseres til UTC-midnatt før subtraksjonen. Ikke fordi vi bryr
 * oss om UTC, men fordi UTC-døgn alltid er 24 timer — da kan divisjonen ikke
 * bomme ved sommertidsovergangene.
 */
export const daysBetween = (from: Date, to: Date): number => {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b - a) / 86_400_000)
}

/** «2026-12-12» og «09:00» til et lokalt tidspunkt. */
export const targetDate = (countdown: Countdown): Date => {
  const [year, month, day] = countdown.date.split('-').map(Number) as [number, number, number]
  if (!countdown.time) {
    // Uten klokkeslett gjelder det hele dagen, og dagen er ikke over før den
    // er over. En frist «12. desember» går ut når 12. desember gjør det.
    return new Date(year, month - 1, day, 23, 59, 59, 999)
  }
  const [hour, minute] = countdown.time.split(':').map(Number) as [number, number]
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

/* ── Gjenstående ───────────────────────────────────────────────────────────  */

export type Remaining =
  /** Fristen er passert. `days` er hvor mange dager siden, som positivt tall. */
  | { kind: 'past'; days: number }
  /** Under et døgn igjen: da er timer og minutter det nyttige tallet. */
  | { kind: 'hours'; hours: number; minutes: number }
  /** Én eller flere kalenderdager igjen. */
  | { kind: 'days'; days: number }

export const remaining = (countdown: Countdown, now: Date): Remaining => {
  const target = targetDate(countdown)
  const ms = target.getTime() - now.getTime()

  if (ms < 0) {
    return { kind: 'past', days: Math.abs(daysBetween(now, target)) }
  }

  // Under et døgn: timer og minutter. Over: kalenderdager.
  if (ms < 86_400_000) {
    const totalMinutes = Math.floor(ms / 60_000)
    return { kind: 'hours', hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
  }

  return { kind: 'days', days: daysBetween(now, target) }
}

/**
 * Nærmeste først, og passerte frister sist.
 *
 * Passerte frister slettes ikke automatisk. Eksamen var i går, og widgeten
 * skal ikke bestemme når man er ferdig med å tenke på den — men den skal
 * heller ikke stå øverst.
 */
export const sortByUrgency = (countdowns: Countdown[], now: Date): Countdown[] =>
  countdowns.slice().sort((a, b) => {
    const ta = targetDate(a).getTime()
    const tb = targetDate(b).getTime()
    const nowMs = now.getTime()

    const aPast = ta < nowMs
    const bPast = tb < nowMs
    if (aPast !== bPast) return aPast ? 1 : -1

    // Blant passerte: den siste først. Blant kommende: den første først.
    return aPast ? tb - ta : ta - tb
  })
