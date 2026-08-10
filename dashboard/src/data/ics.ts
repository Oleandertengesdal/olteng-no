/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ICS — kalenderfiler, lest her
 *
 *  RFC 5545 er et stort format, og denne filen leser den delen av det som
 *  timeplaner faktisk bruker. Grunnen til at det ikke er en pakke: de fire
 *  vanskelige tingene i en timeplan-ICS er alle så små at et bibliotek koster
 *  mer enn det løser, og de er alle steder man må forstå hva som skjer for å
 *  stole på resultatet.
 *
 *  De fire:
 *
 *  1. Linjebretting. Lange linjer brytes med CRLF etterfulgt av mellomrom.
 *     Leser man linjene rått, blir en emnekode delt i to.
 *
 *  2. Tidssoner. Et klokkeslett i en ICS kan være UTC, en navngitt sone eller
 *     «flytende» lokal tid. Uten en tidssonedatabase kan man ikke regne på
 *     navngitte soner — men Intl har en, og den kan brukes baklengs. Se
 *     zonedToUtc under.
 *
 *  3. Gjentakelser. En forelesning hver tirsdag klokka 08:15 skal være 08:15
 *     også etter at sommertiden slår inn. Da må gjentakelsen regnes i
 *     kalenderdager på veggklokka, ikke i millisekunder — ellers flytter hele
 *     timeplanen seg en time i slutten av mars.
 *
 *  4. Escaping. \n, \, og \; i tekstfelter. Uten dette står det bokstavelig
 *     «\,» i romnavn.
 *
 *  Alt her er rene funksjoner uten DOM.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ── Linjer ────────────────────────────────────────────────────────────────  */

/**
 * Setter sammen igjen linjer som er brettet.
 *
 * Regelen i RFC 5545 er at en linje som begynner med mellomrom eller
 * tabulator er en fortsettelse av den forrige, og at det ene tegnet skal
 * fjernes. Filer i naturen bruker både CRLF og LF.
 */
export const unfold = (text: string): string[] => {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const out: string[] = []

  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length > 0) {
      out[out.length - 1] += line.slice(1)
    } else {
      out.push(line)
    }
  }

  return out.filter((line) => line !== '')
}

export interface ContentLine {
  name: string
  params: Record<string, string>
  value: string
}

/**
 * Deler «DTSTART;TZID=Europe/Oslo:20260817T081500» i navn, parametere og verdi.
 *
 * Kolon kan stå inne i en parameterverdi i anførselstegn, så delingen kan ikke
 * gjøres med indexOf(':').
 */
export const parseLine = (line: string): ContentLine | null => {
  let inQuotes = false
  let colon = -1

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') inQuotes = !inQuotes
    else if (char === ':' && !inQuotes) {
      colon = i
      break
    }
  }

  if (colon < 0) return null

  const head = line.slice(0, colon)
  const value = line.slice(colon + 1)

  const parts = head.split(';')
  const name = (parts[0] ?? '').toUpperCase()
  if (name === '') return null

  const params: Record<string, string> = {}
  for (const part of parts.slice(1)) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    const key = part.slice(0, eq).toUpperCase()
    const raw = part.slice(eq + 1)
    params[key] = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
  }

  return { name, params, value }
}

/** \n, \N, \, \; og \\ tilbake til tegnene de står for. */
export const unescapeText = (value: string): string =>
  value
    .replace(/\\[nN]/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()

/* ── Tid ───────────────────────────────────────────────────────────────────  */

export interface WallClock {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export interface IcsTime {
  wall: WallClock
  /** IANA-sone fra TZID, eller null for UTC og flytende tid. */
  tzid: string | null
  utc: boolean
  allDay: boolean
}

const DATE_TIME = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/

export const parseIcsTime = (value: string, params: Record<string, string>): IcsTime | null => {
  const match = DATE_TIME.exec(value.trim())
  if (!match) return null

  const [, y, mo, d, h, mi, s, z] = match
  const allDay = params.VALUE === 'DATE' || h === undefined

  return {
    wall: {
      year: Number(y),
      month: Number(mo),
      day: Number(d),
      hour: Number(h ?? 0),
      minute: Number(mi ?? 0),
      second: Number(s ?? 0),
    },
    tzid: params.TZID ?? null,
    utc: z === 'Z',
    allDay,
  }
}

/**
 * Hvor mange millisekunder en sone ligger foran UTC på et gitt tidspunkt.
 *
 * Trikset: formater instansen i sonen, les av feltene, og lat som de var UTC.
 * Differansen mellom det og den ekte instansen *er* forskyvningen. Intl har
 * hele tidssonedatabasen, den er bare ikke tilgjengelig direkte.
 */
const zoneOffsetMs = (tzid: string, instantMs: number): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tzid,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instantMs))

  const field = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? '0')

  const asIfUtc = Date.UTC(
    field('year'),
    field('month') - 1,
    field('day'),
    // 24 betyr midnatt i noen implementasjoner av hour12: false.
    field('hour') % 24,
    field('minute'),
    field('second'),
  )

  return asIfUtc - instantMs
}

/**
 * Veggklokke i en navngitt sone til et faktisk tidspunkt.
 *
 * To runder: den første gjetter forskyvningen ut fra tidspunktet lest som UTC,
 * den andre retter gjetningen med forskyvningen som faktisk gjaldt der. Det
 * holder for alle overganger på én time.
 *
 * Den ene timen om høsten som finnes to ganger blir tolket som den første av
 * dem. Det er et valg, ikke en presisjon — men en forelesning klokka 02:30
 * siste søndag i oktober er ikke et problem noen har.
 */
export const zonedToUtc = (tzid: string, wall: WallClock): number => {
  const naive = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)

  try {
    const firstGuess = naive - zoneOffsetMs(tzid, naive)
    return naive - zoneOffsetMs(tzid, firstGuess)
  } catch {
    // Ugyldig eller ukjent sone. Da er lokal tid en bedre gjetning enn UTC,
    // fordi en timeplan som regel leses i landet den gjelder for.
    return new Date(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second).getTime()
  }
}

/** Tidspunktet som millisekunder, tolket etter hva slags tid det er. */
export const toInstant = (time: IcsTime): number => {
  const { wall } = time
  if (time.utc) {
    return Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
  }
  if (time.tzid) return zonedToUtc(time.tzid, wall)
  // Flytende tid og heldagsdatoer gjelder der brukeren er.
  return new Date(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second).getTime()
}

/**
 * Flytter en veggklokke et antall kalenderdager.
 *
 * Kalenderdager, ikke døgn: en forelesning tirsdag 08:15 skal være 08:15 også
 * uken etter at sommertiden slo inn. Regningen går via UTC nettopp fordi
 * UTC-døgn alltid er 24 timer.
 */
export const addDays = (wall: WallClock, days: number): WallClock => {
  const shifted = new Date(Date.UTC(wall.year, wall.month - 1, wall.day) + days * 86_400_000)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: wall.hour,
    minute: wall.minute,
    second: wall.second,
  }
}

/** Ukedag 0–6 med mandag som 0, som er det norske og ICS-standardens utgangspunkt. */
export const weekdayIndex = (wall: WallClock): number => {
  const day = new Date(Date.UTC(wall.year, wall.month - 1, wall.day)).getUTCDay()
  return (day + 6) % 7
}

/* ── Gjentakelse ───────────────────────────────────────────────────────────  */

const DAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const

export interface RecurrenceRule {
  freq: string
  interval: number
  /** Ukedager som 0–6 med mandag først. Tom betyr «samme dag som starten». */
  byDay: number[]
  count: number | null
  until: IcsTime | null
}

export const parseRrule = (value: string): RecurrenceRule | null => {
  const parts: Record<string, string> = {}
  for (const chunk of value.split(';')) {
    const eq = chunk.indexOf('=')
    if (eq < 0) continue
    parts[chunk.slice(0, eq).toUpperCase()] = chunk.slice(eq + 1)
  }

  const freq = (parts.FREQ ?? '').toUpperCase()
  if (freq === '') return null

  const byDay = (parts.BYDAY ?? '')
    .split(',')
    .map((code) => code.replace(/^[+-]?\d+/, '').toUpperCase())
    .map((code) => DAY_CODES.indexOf(code as (typeof DAY_CODES)[number]))
    .filter((index) => index >= 0)

  const interval = Number(parts.INTERVAL ?? '1')
  const count = parts.COUNT === undefined ? null : Number(parts.COUNT)

  return {
    freq,
    interval: Number.isFinite(interval) && interval > 0 ? interval : 1,
    byDay,
    count: count !== null && Number.isFinite(count) && count > 0 ? count : null,
    until: parts.UNTIL ? parseIcsTime(parts.UNTIL, {}) : null,
  }
}

/* ── Hendelser ─────────────────────────────────────────────────────────────  */

export interface IcsEvent {
  uid: string
  summary: string
  location: string
  description: string
  start: IcsTime
  /** Slutt, når filen oppgir den. */
  end: IcsTime | null
  rrule: RecurrenceRule | null
  /** Datoer som er tatt ut av gjentakelsen, som instanser. */
  exdates: number[]
}

export interface ParseResult {
  events: IcsEvent[]
  /**
   * Gjentakelsesregler vi ikke kan regne på — månedlig og årlig.
   * Antallet vises i grensesnittet framfor å ties i hjel: en timeplan der to
   * hendelser mangler skal si at to hendelser mangler.
   */
  unsupportedRecurrences: number
}

export const parseIcs = (text: string): ParseResult => {
  const events: IcsEvent[] = []
  let unsupportedRecurrences = 0

  let current: Partial<IcsEvent> & { exdates?: number[] } | null = null

  for (const line of unfold(text)) {
    const parsed = parseLine(line)
    if (!parsed) continue

    if (parsed.name === 'BEGIN' && parsed.value === 'VEVENT') {
      current = { exdates: [] }
      continue
    }

    if (parsed.name === 'END' && parsed.value === 'VEVENT') {
      if (current?.start) {
        const rrule = current.rrule ?? null
        if (rrule && rrule.freq !== 'WEEKLY' && rrule.freq !== 'DAILY') unsupportedRecurrences += 1

        events.push({
          uid: current.uid ?? '',
          summary: current.summary ?? '',
          location: current.location ?? '',
          description: current.description ?? '',
          start: current.start,
          end: current.end ?? null,
          rrule,
          exdates: current.exdates ?? [],
        })
      }
      current = null
      continue
    }

    if (!current) continue

    switch (parsed.name) {
      case 'UID':
        current.uid = parsed.value
        break
      case 'SUMMARY':
        current.summary = unescapeText(parsed.value)
        break
      case 'LOCATION':
        current.location = unescapeText(parsed.value)
        break
      case 'DESCRIPTION':
        current.description = unescapeText(parsed.value)
        break
      case 'DTSTART':
        current.start = parseIcsTime(parsed.value, parsed.params) ?? undefined
        break
      case 'DTEND':
        current.end = parseIcsTime(parsed.value, parsed.params) ?? undefined
        break
      case 'RRULE':
        current.rrule = parseRrule(parsed.value) ?? undefined
        break
      case 'EXDATE': {
        // Kan stå flere ganger, og hver linje kan ha flere datoer.
        for (const chunk of parsed.value.split(',')) {
          const time = parseIcsTime(chunk, parsed.params)
          if (time) current.exdates?.push(toInstant(time))
        }
        break
      }
      default:
        break
    }
  }

  return { events, unsupportedRecurrences }
}

/* ── Utfolding ─────────────────────────────────────────────────────────────  */

export interface Occurrence {
  uid: string
  summary: string
  location: string
  start: number
  end: number | null
  allDay: boolean
}

/** Hvor lenge en hendelse varer, i millisekunder. Null når filen ikke sier noe. */
const durationOf = (event: IcsEvent): number | null =>
  event.end ? toInstant(event.end) - toInstant(event.start) : null

/**
 * Regner ut når en hendelse faktisk skjer, innenfor et vindu.
 *
 * Vinduet er påkrevd og ikke valgfritt: en RRULE uten UNTIL og uten COUNT er
 * uendelig, og en utfolding uten grense er en løkke som ikke stopper.
 */
export const expandEvent = (event: IcsEvent, windowStart: number, windowEnd: number): Occurrence[] => {
  const duration = durationOf(event)
  const exdates = new Set(event.exdates)

  const make = (wall: WallClock): Occurrence | null => {
    const time: IcsTime = { ...event.start, wall }
    const start = toInstant(time)
    if (exdates.has(start)) return null
    return {
      uid: event.uid,
      summary: event.summary,
      location: event.location,
      start,
      end: duration === null ? null : start + duration,
      allDay: event.start.allDay,
    }
  }

  const rule = event.rrule

  // Uten gjentakelse: én hendelse, hvis den er innenfor vinduet.
  if (!rule || (rule.freq !== 'WEEKLY' && rule.freq !== 'DAILY')) {
    const single = make(event.start.wall)
    if (!single) return []
    return single.start >= windowStart && single.start <= windowEnd ? [single] : []
  }

  const untilMs = rule.until ? toInstant(rule.until) : null
  const stepDays = rule.freq === 'DAILY' ? rule.interval : rule.interval * 7

  // Ved ukentlig gjentakelse med BYDAY er syklusen uken, ikke startdagen.
  const startWeekday = weekdayIndex(event.start.wall)
  const days = rule.freq === 'WEEKLY' && rule.byDay.length > 0 ? rule.byDay : [startWeekday]
  const cycleStart =
    rule.freq === 'WEEKLY' ? addDays(event.start.wall, -startWeekday) : event.start.wall

  const out: Occurrence[] = []
  let emitted = 0
  const startInstant = toInstant(event.start)

  // Taket finnes for å beskytte mot en fil med en regel vi har misforstått.
  // 3000 sykluser er over femti år ukentlig — langt utenfor et studieløp.
  for (let cycle = 0; cycle < 3000; cycle += 1) {
    const base = addDays(cycleStart, cycle * stepDays)

    // Er hele syklusen forbi vinduet, er vi ferdige.
    const cycleInstant = toInstant({ ...event.start, wall: base })
    if (cycleInstant > windowEnd + 7 * 86_400_000) break

    for (const day of rule.freq === 'WEEKLY' ? days : [null]) {
      const wall = day === null ? base : addDays(base, day)
      const start = toInstant({ ...event.start, wall })

      // En gjentakelse begynner aldri før hendelsen selv.
      if (start < startInstant) continue
      if (untilMs !== null && start > untilMs) return out

      // Telles før EXDATE trekkes fra. Slik er COUNT definert i RFC 5545:
      // en avlyst forelesning bruker opp en av de ti gangene.
      emitted += 1
      if (rule.count !== null && emitted > rule.count) return out

      if (exdates.has(start)) continue
      if (start < windowStart || start > windowEnd) continue

      out.push({
        uid: event.uid,
        summary: event.summary,
        location: event.location,
        start,
        end: duration === null ? null : start + duration,
        allDay: event.start.allDay,
      })
    }
  }

  return out
}

/** Alle hendelser i en fil, utfoldet innenfor et vindu og sortert etter tid. */
export const occurrencesBetween = (
  events: IcsEvent[],
  windowStart: number,
  windowEnd: number,
): Occurrence[] =>
  events
    .flatMap((event) => expandEvent(event, windowStart, windowEnd))
    .sort((a, b) => a.start - b.start)
