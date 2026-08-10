import { describe, it, expect } from 'vitest'
import {
  addDays,
  expandEvent,
  occurrencesBetween,
  parseIcs,
  parseIcsTime,
  parseLine,
  parseRrule,
  toInstant,
  unescapeText,
  unfold,
  weekdayIndex,
  zonedToUtc,
} from '../ics.ts'

const ics = (...lines: string[]) =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', ...lines, 'END:VCALENDAR'].join('\r\n')

const event = (...lines: string[]) => ics('BEGIN:VEVENT', ...lines, 'END:VEVENT')

describe('unfold', () => {
  it('setter sammen brettede linjer', () => {
    // Uten dette blir en emnekode delt i to.
    expect(unfold('SUMMARY:TDT4109 Informasjons\r\n teknologi')).toEqual([
      'SUMMARY:TDT4109 Informasjonsteknologi',
    ])
  })

  it('godtar tabulator som fortsettelsestegn', () => {
    expect(unfold('A:en\n\tto')).toEqual(['A:ento'])
  })

  it('tåler både CRLF, LF og CR', () => {
    expect(unfold('A:1\r\nB:2\nC:3\rD:4')).toEqual(['A:1', 'B:2', 'C:3', 'D:4'])
  })

  it('lar en linje som begynner med mellomrom stå alene når det ikke er noe foran', () => {
    expect(unfold(' rar')).toEqual([' rar'])
  })
})

describe('parseLine', () => {
  it('deler navn, parametere og verdi', () => {
    expect(parseLine('DTSTART;TZID=Europe/Oslo:20260817T081500')).toEqual({
      name: 'DTSTART',
      params: { TZID: 'Europe/Oslo' },
      value: '20260817T081500',
    })
  })

  it('lar kolon inne i anførselstegn være i fred', () => {
    // Ellers deles linjen midt i en parameterverdi.
    const line = parseLine('X-THING;NOTE="a:b":verdi')
    expect(line?.value).toBe('verdi')
    expect(line?.params.NOTE).toBe('a:b')
  })

  it('lar kolon inne i selve verdien være i fred', () => {
    expect(parseLine('DESCRIPTION:se her: rom A2')?.value).toBe('se her: rom A2')
  })

  it('svarer null på en linje uten kolon', () => {
    expect(parseLine('BARE TEKST')).toBeNull()
  })
})

describe('unescapeText', () => {
  it('gjør escapede tegn om til tegnene de står for', () => {
    expect(unescapeText('Rom A2\\, bygg 1\\; inngang B')).toBe('Rom A2, bygg 1; inngang B')
    expect(unescapeText('Linje 1\\nLinje 2')).toBe('Linje 1\nLinje 2')
    expect(unescapeText('sti\\\\her')).toBe('sti\\her')
  })
})

describe('parseIcsTime', () => {
  it('leser en heldagsdato', () => {
    const time = parseIcsTime('20260817', { VALUE: 'DATE' })
    expect(time?.allDay).toBe(true)
    expect(time?.wall).toMatchObject({ year: 2026, month: 8, day: 17 })
  })

  it('leser en dato uten klokkeslett som heldags', () => {
    expect(parseIcsTime('20260817', {})?.allDay).toBe(true)
  })

  it('leser UTC-tid', () => {
    const time = parseIcsTime('20260817T061500Z', {})
    expect(time?.utc).toBe(true)
    expect(toInstant(time!)).toBe(Date.UTC(2026, 7, 17, 6, 15, 0))
  })

  it('leser tid med navngitt sone', () => {
    const time = parseIcsTime('20260817T081500', { TZID: 'Europe/Oslo' })
    expect(time?.tzid).toBe('Europe/Oslo')
    // 17. august er sommertid i Norge: UTC+2.
    expect(toInstant(time!)).toBe(Date.UTC(2026, 7, 17, 6, 15, 0))
  })

  it('svarer null på noe som ikke er en dato', () => {
    expect(parseIcsTime('i morgen', {})).toBeNull()
    expect(parseIcsTime('2026-08-17', {})).toBeNull()
  })
})

describe('zonedToUtc', () => {
  it('finner riktig forskyvning på begge sider av sommertid', () => {
    const winter = { year: 2026, month: 1, day: 15, hour: 12, minute: 0, second: 0 }
    const summer = { year: 2026, month: 7, day: 15, hour: 12, minute: 0, second: 0 }
    expect(zonedToUtc('Europe/Oslo', winter)).toBe(Date.UTC(2026, 0, 15, 11, 0, 0))
    expect(zonedToUtc('Europe/Oslo', summer)).toBe(Date.UTC(2026, 6, 15, 10, 0, 0))
  })

  it('treffer riktig time rett etter overgangen om våren', () => {
    // 29. mars 2026 klokka 02:00 hopper Norge til 03:00.
    const after = { year: 2026, month: 3, day: 29, hour: 4, minute: 0, second: 0 }
    expect(zonedToUtc('Europe/Oslo', after)).toBe(Date.UTC(2026, 2, 29, 2, 0, 0))
  })

  it('faller tilbake på lokal tid for en ukjent sone framfor å kaste', () => {
    const wall = { year: 2026, month: 8, day: 17, hour: 8, minute: 15, second: 0 }
    expect(() => zonedToUtc('Mars/Olympus_Mons', wall)).not.toThrow()
  })
})

describe('addDays og weekdayIndex', () => {
  it('beholder klokkeslettet over sommertidsovergangen', () => {
    // Dette er hele poenget: en forelesning tirsdag 08:15 skal være 08:15 også
    // uken etter at klokka ble stilt.
    const before = { year: 2026, month: 3, day: 24, hour: 8, minute: 15, second: 0 }
    const after = addDays(before, 7)
    expect(after).toEqual({ year: 2026, month: 3, day: 31, hour: 8, minute: 15, second: 0 })
  })

  it('går over månedsskiftet', () => {
    expect(addDays({ year: 2026, month: 1, day: 31, hour: 0, minute: 0, second: 0 }, 1)).toMatchObject({
      year: 2026,
      month: 2,
      day: 1,
    })
  })

  it('teller mandag som dag 0', () => {
    // 17. august 2026 er en mandag.
    expect(weekdayIndex({ year: 2026, month: 8, day: 17, hour: 0, minute: 0, second: 0 })).toBe(0)
    expect(weekdayIndex({ year: 2026, month: 8, day: 23, hour: 0, minute: 0, second: 0 })).toBe(6)
  })
})

describe('parseRrule', () => {
  it('leser en ukentlig regel', () => {
    const rule = parseRrule('FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261211T235900Z;INTERVAL=2')
    expect(rule).toMatchObject({ freq: 'WEEKLY', interval: 2, byDay: [0, 2] })
    expect(rule?.until).not.toBeNull()
  })

  it('bruker intervall 1 når det ikke står noe', () => {
    expect(parseRrule('FREQ=WEEKLY')?.interval).toBe(1)
  })

  it('ignorerer tallprefiks i BYDAY, som ikke betyr noe ukentlig', () => {
    expect(parseRrule('FREQ=WEEKLY;BYDAY=2TU')?.byDay).toEqual([1])
  })

  it('svarer null uten FREQ', () => {
    expect(parseRrule('BYDAY=MO')).toBeNull()
  })
})

describe('parseIcs', () => {
  it('leser en enkelt hendelse', () => {
    const result = parseIcs(
      event(
        'UID:abc@timeedit',
        'SUMMARY:TDT4109 Forelesning',
        'LOCATION:R1\\, Realfagbygget',
        'DTSTART;TZID=Europe/Oslo:20260817T081500',
        'DTEND;TZID=Europe/Oslo:20260817T100000',
      ),
    )

    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({
      uid: 'abc@timeedit',
      summary: 'TDT4109 Forelesning',
      location: 'R1, Realfagbygget',
    })
  })

  it('hopper over hendelser uten starttid', () => {
    expect(parseIcs(event('SUMMARY:Uten tid')).events).toHaveLength(0)
  })

  it('leser flere EXDATE-linjer og flere datoer per linje', () => {
    const result = parseIcs(
      event(
        'DTSTART:20260817T081500Z',
        'RRULE:FREQ=WEEKLY',
        'EXDATE:20260824T081500Z,20260831T081500Z',
        'EXDATE:20260907T081500Z',
      ),
    )
    expect(result.events[0]!.exdates).toHaveLength(3)
  })

  it('teller gjentakelser vi ikke kan regne på framfor å tie om dem', () => {
    const result = parseIcs(event('DTSTART:20260817T081500Z', 'RRULE:FREQ=MONTHLY;BYDAY=3MO'))
    expect(result.unsupportedRecurrences).toBe(1)
  })

  it('tåler søppel mellom hendelsene', () => {
    const result = parseIcs(
      ics(
        'X-WR-CALNAME:Timeplan',
        'BEGIN:VTIMEZONE',
        'TZID:Europe/Oslo',
        'END:VTIMEZONE',
        'BEGIN:VEVENT',
        'DTSTART:20260817T081500Z',
        'SUMMARY:En ting',
        'END:VEVENT',
      ),
    )
    expect(result.events).toHaveLength(1)
  })

  it('tåler en tom fil uten å kaste', () => {
    expect(parseIcs('').events).toEqual([])
    expect(parseIcs('dette er ikke en kalender').events).toEqual([])
  })
})

describe('expandEvent', () => {
  const week = 7 * 86_400_000

  const weekly = (...extra: string[]) =>
    parseIcs(
      event(
        'UID:u1',
        'SUMMARY:Forelesning',
        'DTSTART;TZID=Europe/Oslo:20260817T081500',
        'DTEND;TZID=Europe/Oslo:20260817T100000',
        ...extra,
      ),
    ).events[0]!

  const from = Date.UTC(2026, 7, 1)
  const to = Date.UTC(2026, 11, 31)

  it('folder ut en ukentlig forelesning', () => {
    const occurrences = expandEvent(weekly('RRULE:FREQ=WEEKLY;COUNT=4'), from, to)
    expect(occurrences).toHaveLength(4)
    expect(occurrences[1]!.start - occurrences[0]!.start).toBe(week)
  })

  it('holder klokkeslettet fast over sommertidsovergangen', () => {
    // Fra 24. mars til 7. april: klokka stilles 29. mars. Alle tre skal være
    // 08:15 lokalt, selv om avstanden i millisekunder ikke er lik.
    const spring = parseIcs(
      event('DTSTART;TZID=Europe/Oslo:20260324T081500', 'RRULE:FREQ=WEEKLY;COUNT=3'),
    ).events[0]!

    const occurrences = expandEvent(spring, Date.UTC(2026, 2, 1), Date.UTC(2026, 3, 30))
    expect(occurrences).toHaveLength(3)

    const hours = occurrences.map((o) =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Oslo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(o.start)),
    )
    expect(hours).toEqual(['08:15', '08:15', '08:15'])
  })

  it('følger BYDAY med flere dager i uken', () => {
    const occurrences = expandEvent(weekly('RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4'), from, to)
    expect(occurrences).toHaveLength(4)
    // Mandag, onsdag, mandag, onsdag.
    expect(occurrences[1]!.start - occurrences[0]!.start).toBe(2 * 86_400_000)
    expect(occurrences[2]!.start - occurrences[1]!.start).toBe(5 * 86_400_000)
  })

  it('hopper over uker når INTERVAL er 2', () => {
    const occurrences = expandEvent(weekly('RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=3'), from, to)
    expect(occurrences[1]!.start - occurrences[0]!.start).toBe(2 * week)
  })

  it('stopper ved UNTIL', () => {
    const occurrences = expandEvent(weekly('RRULE:FREQ=WEEKLY;UNTIL=20260901T000000Z'), from, to)
    expect(occurrences).toHaveLength(3)
  })

  it('tar ut datoer som står i EXDATE', () => {
    const occurrences = expandEvent(
      weekly('RRULE:FREQ=WEEKLY;COUNT=4', 'EXDATE;TZID=Europe/Oslo:20260824T081500'),
      from,
      to,
    )
    // Fire ganger, minus den ene som er avlyst. COUNT teller den likevel.
    expect(occurrences).toHaveLength(3)
  })

  it('begynner aldri før hendelsen selv, også med BYDAY tidligere i uken', () => {
    // Starten er onsdag, men BYDAY inkluderer mandag. Mandagen i startuken
    // ligger før DTSTART og skal ikke være med.
    const wednesday = parseIcs(
      event('DTSTART;TZID=Europe/Oslo:20260819T081500', 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=3'),
    ).events[0]!

    const occurrences = expandEvent(wednesday, from, to)
    expect(new Date(occurrences[0]!.start).getTime()).toBeGreaterThanOrEqual(
      Date.UTC(2026, 7, 19, 6, 15),
    )
  })

  it('folder ut daglige gjentakelser', () => {
    const daily = parseIcs(
      event('DTSTART;TZID=Europe/Oslo:20260817T081500', 'RRULE:FREQ=DAILY;COUNT=3'),
    ).events[0]!
    expect(expandEvent(daily, from, to)).toHaveLength(3)
  })

  it('gir bare startgangen for en regel vi ikke kan regne på', () => {
    const monthly = parseIcs(
      event('DTSTART;TZID=Europe/Oslo:20260817T081500', 'RRULE:FREQ=MONTHLY'),
    ).events[0]!
    expect(expandEvent(monthly, from, to)).toHaveLength(1)
  })

  it('holder seg innenfor vinduet for en uendelig regel', () => {
    // Uten UNTIL og uten COUNT er regelen uendelig. Vinduet er det som stopper.
    const forever = weekly('RRULE:FREQ=WEEKLY')
    const occurrences = expandEvent(forever, Date.UTC(2026, 7, 17), Date.UTC(2026, 8, 17))
    expect(occurrences.length).toBeGreaterThan(3)
    expect(occurrences.length).toBeLessThan(7)
  })

  it('regner ut sluttidspunkt fra varigheten', () => {
    const occurrences = expandEvent(weekly('RRULE:FREQ=WEEKLY;COUNT=2'), from, to)
    expect(occurrences[1]!.end! - occurrences[1]!.start).toBe(105 * 60_000)
  })

  it('lar slutt være null når filen ikke oppgir den', () => {
    const noEnd = parseIcs(event('DTSTART;TZID=Europe/Oslo:20260817T081500')).events[0]!
    expect(expandEvent(noEnd, from, to)[0]!.end).toBeNull()
  })
})

describe('occurrencesBetween', () => {
  it('sorterer alle hendelsene etter tid', () => {
    const events = parseIcs(
      ics(
        'BEGIN:VEVENT',
        'SUMMARY:Sent',
        'DTSTART:20260817T140000Z',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'SUMMARY:Tidlig',
        'DTSTART:20260817T080000Z',
        'END:VEVENT',
      ),
    ).events

    const occurrences = occurrencesBetween(events, Date.UTC(2026, 7, 17), Date.UTC(2026, 7, 18))
    expect(occurrences.map((o) => o.summary)).toEqual(['Tidlig', 'Sent'])
  })
})
