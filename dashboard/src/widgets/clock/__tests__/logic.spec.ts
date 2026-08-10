import { describe, it, expect } from 'vitest'
import {
  isoWeek,
  isoWeekYear,
  semesterProgress,
  msToNextSecond,
  msToNextMinute,
  DEFAULT_SEMESTER,
  isSemesterConfig,
} from '../logic.ts'

/** Midt på dagen, slik at ingen test kan lykkes eller feile på grunn av tidssone. */
const day = (iso: string) => new Date(`${iso}T12:00:00`)

describe('isoWeek', () => {
  it('teller uke 1 som uken med årets første torsdag', () => {
    // 1. januar 2026 er en torsdag, altså ligger den selv i uke 1.
    expect(isoWeek(day('2026-01-01'))).toBe(1)
    expect(isoWeek(day('2026-01-04'))).toBe(1)
    expect(isoWeek(day('2026-01-05'))).toBe(2)
  })

  it('legger januardager i forrige års siste uke når de hører hjemme der', () => {
    // 1. januar 2021 var en fredag i uke 53 av 2020 — ikke uke 1 av 2021.
    expect(isoWeek(day('2021-01-01'))).toBe(53)
    expect(isoWeekYear(day('2021-01-01'))).toBe(2020)
  })

  it('legger desemberdager i neste års uke 1 når de hører hjemme der', () => {
    // 30. desember 2019 var en mandag, og den uken inneholdt 2. januar 2020.
    expect(isoWeek(day('2019-12-30'))).toBe(1)
    expect(isoWeekYear(day('2019-12-30'))).toBe(2020)
  })

  it('kjenner igjen år med 53 uker', () => {
    expect(isoWeek(day('2026-12-31'))).toBe(53)
    expect(isoWeekYear(day('2026-12-31'))).toBe(2026)
  })

  it('bommer ikke over sommertidsovergangen', () => {
    // Siste søndag i mars: døgnet er 23 timer langt. En utregning som deler
    // millisekunder på 86 400 000 uten å gå via rene datofelter bommer her.
    expect(isoWeek(day('2026-03-28'))).toBe(13)
    expect(isoWeek(day('2026-03-29'))).toBe(13)
    expect(isoWeek(day('2026-03-30'))).toBe(14)
  })

  it('gir samme ukenummer for alle sju dagene i en uke', () => {
    const week = isoWeek(day('2026-08-03'))
    for (let i = 0; i < 7; i += 1) {
      const d = day('2026-08-03')
      d.setDate(d.getDate() + i)
      expect(isoWeek(d)).toBe(week)
    }
  })
})

describe('semesterProgress', () => {
  it('teller studieuke fra første undervisningsuke', () => {
    expect(semesterProgress(day('2026-01-05'))).toEqual({
      semester: 'spring',
      week: 1,
      total: DEFAULT_SEMESTER.springWeeks,
    })
    expect(semesterProgress(day('2026-08-17'))).toEqual({
      semester: 'autumn',
      week: 2,
      total: DEFAULT_SEMESTER.autumnWeeks,
    })
  })

  it('svarer null i ferien framfor å finne på en uke 0', () => {
    expect(semesterProgress(day('2026-07-01'))).toBeNull()
    expect(semesterProgress(day('2026-01-01'))).toBeNull()
    expect(semesterProgress(day('2026-12-28'))).toBeNull()
  })

  it('følger egne semesterdatoer når lærestedet ikke starter i uke 33', () => {
    const config = { ...DEFAULT_SEMESTER, autumnStartWeek: 34, autumnWeeks: 15 }
    expect(semesterProgress(day('2026-08-17'), config)).toEqual({
      semester: 'autumn',
      week: 1,
      total: 15,
    })
  })

  it('tar med siste uke av semesteret og ikke uken etter', () => {
    const config = { ...DEFAULT_SEMESTER, autumnStartWeek: 33, autumnWeeks: 2 }
    expect(semesterProgress(day('2026-08-17'), config)?.week).toBe(2)
    expect(semesterProgress(day('2026-08-24'), config)).toBeNull()
  })
})

describe('isSemesterConfig', () => {
  it('godtar en gyldig oppsettsverdi', () => {
    expect(isSemesterConfig(DEFAULT_SEMESTER)).toBe(true)
  })

  it('avviser det som ikke kan være ukenummer', () => {
    expect(isSemesterConfig(null)).toBe(false)
    expect(isSemesterConfig({ ...DEFAULT_SEMESTER, springStartWeek: 0 })).toBe(false)
    expect(isSemesterConfig({ ...DEFAULT_SEMESTER, autumnStartWeek: 54 })).toBe(false)
    expect(isSemesterConfig({ ...DEFAULT_SEMESTER, springWeeks: 2.5 })).toBe(false)
    expect(isSemesterConfig({ springStartWeek: 2 })).toBe(false)
  })
})

describe('tikking', () => {
  it('sikter mot sekundskiftet framfor å telle tusen om gangen', () => {
    expect(msToNextSecond(1_000)).toBe(1000)
    expect(msToNextSecond(1_400)).toBe(600)
    expect(msToNextSecond(1_999)).toBe(1)
  })

  it('kan sove til neste minutt når sekunder ikke vises', () => {
    expect(msToNextMinute(60_000)).toBe(60_000)
    expect(msToNextMinute(60_001)).toBe(59_999)
  })
})
