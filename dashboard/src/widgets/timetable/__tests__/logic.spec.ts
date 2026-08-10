import { describe, it, expect } from 'vitest'
import { parseIcs } from '@/data/ics.ts'
import { dayWindow, looksLikeUrl, nextDayWithEvents, normaliseCalendarUrl, planFor, statusOf } from '../logic.ts'

const calendar = (...events: string[]) =>
  ['BEGIN:VCALENDAR', ...events, 'END:VCALENDAR'].join('\r\n')

const vevent = (...lines: string[]) => ['BEGIN:VEVENT', ...lines, 'END:VEVENT'].join('\r\n')

/**
 * Mandag 17. august 2026, med forelesning hver mandag og onsdag.
 *
 * Tidene står uten TZID — «flytende» tid, som betyr lokal tid der brukeren er.
 * Det er med vilje: disse testene handler om døgninndeling, ikke om
 * tidssoner, og med en navngitt sone ville de gitt forskjellig svar avhengig
 * av hvor maskinen som kjører dem står. Selve soneregningen er testet grundig
 * for seg i data/__tests__/ics.spec.ts.
 */
const timetable = parseIcs(
  calendar(
    vevent(
      'UID:1',
      'SUMMARY:TDT4109 Forelesning',
      'LOCATION:R1',
      'DTSTART:20260817T081500',
      'DTEND:20260817T100000',
      'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=8',
    ),
  ),
).events

describe('dayWindow', () => {
  it('dekker hele døgnet og ikke ett millisekund mer', () => {
    const { start, end } = dayWindow(new Date(2026, 7, 17, 14, 30))
    expect(new Date(start).getHours()).toBe(0)
    expect(new Date(end).getDate()).toBe(17)
    // Ellers dukker morgendagens 00:00-hendelse opp i dag.
    expect(new Date(end + 1).getDate()).toBe(18)
  })
})

describe('planFor', () => {
  it('finner dagens forelesninger', () => {
    const plan = planFor(timetable, new Date(2026, 7, 17, 7, 0))
    expect(plan.occurrences).toHaveLength(1)
    expect(plan.occurrences[0]!.summary).toBe('TDT4109 Forelesning')
  })

  it('gir en tom dag når det ikke er noe', () => {
    // Tirsdag.
    expect(planFor(timetable, new Date(2026, 7, 18, 7, 0)).occurrences).toHaveLength(0)
  })
})

describe('nextDayWithEvents', () => {
  it('finner neste dag det står noe', () => {
    const plan = nextDayWithEvents(timetable, new Date(2026, 7, 18, 7, 0))
    expect(plan?.date.getDate()).toBe(19)
    expect(plan?.occurrences).toHaveLength(1)
  })

  it('gir opp etter to uker framfor å lete i det uendelige', () => {
    // Semesteret er over etter åtte ganger; da er svaret «ingenting».
    expect(nextDayWithEvents(timetable, new Date(2026, 10, 1))).toBeNull()
  })
})

describe('statusOf', () => {
  const occurrence = {
    uid: '1',
    summary: 'X',
    location: '',
    start: Date.UTC(2026, 7, 17, 6, 15),
    end: Date.UTC(2026, 7, 17, 8, 0),
    allDay: false,
  }

  it('skiller mellom ferdig, i gang og ikke begynt', () => {
    expect(statusOf(occurrence, occurrence.start - 60_000)).toBe('upcoming')
    expect(statusOf(occurrence, occurrence.start)).toBe('now')
    expect(statusOf(occurrence, occurrence.end)).toBe('now')
    expect(statusOf(occurrence, occurrence.end + 1)).toBe('past')
  })

  it('bruker starttidspunktet når hendelsen ikke har slutt', () => {
    const open = { ...occurrence, end: null }
    expect(statusOf(open, open.start + 1)).toBe('past')
  })
})

describe('kalenderlenker', () => {
  it('bytter webcal mot https', () => {
    // webcal har aldri betydd noe annet enn https, og fetch kjenner ikke
    // skjemaet.
    expect(normaliseCalendarUrl('webcal://cloud.timeedit.net/x.ics')).toBe(
      'https://cloud.timeedit.net/x.ics',
    )
    expect(normaliseCalendarUrl('WEBCAL://a.no/b')).toBe('https://a.no/b')
  })

  it('kjenner igjen noe som kan hentes', () => {
    expect(looksLikeUrl('https://cloud.timeedit.net/x.ics')).toBe(true)
    expect(looksLikeUrl('webcal://cloud.timeedit.net/x.ics')).toBe(true)
    expect(looksLikeUrl('timeplanen min')).toBe(false)
    expect(looksLikeUrl('file:///home/ola/timeplan.ics')).toBe(false)
  })
})
