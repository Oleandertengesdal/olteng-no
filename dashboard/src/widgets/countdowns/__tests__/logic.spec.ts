import { describe, it, expect } from 'vitest'
import {
  daysBetween,
  isCountdown,
  newCountdownId,
  remaining,
  sortByUrgency,
  targetDate,
  type Countdown,
} from '../logic.ts'

const at = (iso: string) => new Date(iso)

const exam: Countdown = { id: 'a', title: 'Eksamen i matte 3', date: '2026-12-12', time: '09:00' }
const deadline: Countdown = { id: 'b', title: 'Innlevering', date: '2026-12-12', time: null }

describe('daysBetween', () => {
  it('teller hele kalenderdager', () => {
    expect(daysBetween(at('2026-08-06T23:00:00'), at('2026-08-09T09:00:00'))).toBe(3)
    expect(daysBetween(at('2026-08-06T00:01:00'), at('2026-08-06T23:59:00'))).toBe(0)
  })

  it('bommer ikke over sommertidsovergangene', () => {
    // 29. mars 2026 er 23 timer langt, 25. oktober er 25. En utregning som
    // deler millisekunder på et døgn viser feil dag i dagene rundt dem.
    expect(daysBetween(at('2026-03-27T12:00:00'), at('2026-03-31T12:00:00'))).toBe(4)
    expect(daysBetween(at('2026-10-23T12:00:00'), at('2026-10-27T12:00:00'))).toBe(4)
  })

  it('er negativ bakover i tid', () => {
    expect(daysBetween(at('2026-08-09T09:00:00'), at('2026-08-06T09:00:00'))).toBe(-3)
  })
})

describe('targetDate', () => {
  it('setter et klokkeslett der det finnes', () => {
    const target = targetDate(exam)
    expect(target.getHours()).toBe(9)
    expect(target.getMinutes()).toBe(0)
  })

  it('lar en dagsfrist gjelde ut dagen', () => {
    // En frist «12. desember» går ut når 12. desember gjør det, ikke ved
    // midnatt inn til den.
    const target = targetDate(deadline)
    expect(target.getDate()).toBe(12)
    expect(target.getHours()).toBe(23)
    expect(target.getMinutes()).toBe(59)
  })
})

describe('remaining', () => {
  it('teller kalenderdager, ikke døgn', () => {
    // Mandag klokka 23 til torsdag klokka 09 er under 58 timer, men det er
    // fortsatt tre dager til.
    const result = remaining(exam, at('2026-12-09T23:00:00'))
    expect(result).toEqual({ kind: 'days', days: 3 })
  })

  it('bytter til timer og minutter det siste døgnet', () => {
    const result = remaining(exam, at('2026-12-11T20:30:00'))
    expect(result).toEqual({ kind: 'hours', hours: 12, minutes: 30 })
  })

  it('teller ned de siste minuttene', () => {
    expect(remaining(exam, at('2026-12-12T08:45:00'))).toEqual({
      kind: 'hours',
      hours: 0,
      minutes: 15,
    })
  })

  it('markerer det som er passert', () => {
    expect(remaining(exam, at('2026-12-14T09:00:00'))).toEqual({ kind: 'past', days: 2 })
  })

  it('lar en dagsfrist være gjeldende hele den siste dagen', () => {
    expect(remaining(deadline, at('2026-12-12T22:00:00')).kind).toBe('hours')
    expect(remaining(deadline, at('2026-12-13T00:30:00')).kind).toBe('past')
  })

  it('bommer ikke over sommertid i nedtellingen heller', () => {
    const springExam: Countdown = { id: 'c', title: 'Vår', date: '2026-03-31', time: '09:00' }
    expect(remaining(springExam, at('2026-03-27T09:00:00'))).toEqual({ kind: 'days', days: 4 })
  })
})

describe('sortByUrgency', () => {
  const now = at('2026-12-10T12:00:00')

  const items: Countdown[] = [
    { id: '1', title: 'Om to uker', date: '2026-12-24', time: null },
    { id: '2', title: 'I går', date: '2026-12-09', time: null },
    { id: '3', title: 'I morgen', date: '2026-12-11', time: null },
    { id: '4', title: 'For en uke siden', date: '2026-12-03', time: null },
  ]

  it('setter nærmeste frist først', () => {
    expect(sortByUrgency(items, now).map((c) => c.id).slice(0, 2)).toEqual(['3', '1'])
  })

  it('flytter passerte frister bakerst, men sletter dem ikke', () => {
    // Eksamen var i går. Widgeten skal ikke bestemme når man er ferdig med å
    // tenke på den — men den skal heller ikke stå øverst.
    const sorted = sortByUrgency(items, now)
    expect(sorted.map((c) => c.id).slice(2)).toEqual(['2', '4'])
    expect(sorted).toHaveLength(4)
  })

  it('endrer ikke listen som ble sendt inn', () => {
    const before = items.map((c) => c.id).join('')
    sortByUrgency(items, now)
    expect(items.map((c) => c.id).join('')).toBe(before)
  })
})

describe('isCountdown', () => {
  it('godtar gyldige nedtellinger', () => {
    expect(isCountdown(exam)).toBe(true)
    expect(isCountdown(deadline)).toBe(true)
  })

  it('avviser datoer og klokkeslett som ikke har riktig form', () => {
    expect(isCountdown(null)).toBe(false)
    expect(isCountdown({ ...exam, date: '12.12.2026' })).toBe(false)
    expect(isCountdown({ ...exam, date: '2026-12' })).toBe(false)
    expect(isCountdown({ ...exam, time: '9:00' })).toBe(false)
    expect(isCountdown({ ...exam, id: '' })).toBe(false)
  })
})

describe('newCountdownId', () => {
  it('gir unike id-er', () => {
    expect(newCountdownId()).not.toBe(newCountdownId())
  })
})
