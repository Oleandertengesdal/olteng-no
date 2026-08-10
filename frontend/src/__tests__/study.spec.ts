import { describe, it, expect } from 'vitest'
import {
  allocateBlocks,
  buildPlan,
  daysBetween,
  addDays,
  toIsoDate,
  nextPhase,
  phaseMinutes,
  formatClock,
  DEFAULT_TIMER,
  type Exam,
} from '../data/study'

describe('datoregning', () => {
  it('teller hele dager mellom to datoer', () => {
    expect(daysBetween('2026-05-01', '2026-05-15')).toBe(14)
    expect(daysBetween('2026-05-15', '2026-05-01')).toBe(-14)
  })

  it('krysser måneds- og årsskifte', () => {
    expect(addDays('2026-05-30', 3)).toBe('2026-06-02')
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
  })

  it('bruker lokal tid og ikke UTC', () => {
    // Kl. 23:30 norsk tid er allerede neste dag i UTC om sommeren. Datoen på
    // planen skal følge kalenderen på veggen, ikke tidssonen.
    expect(toIsoDate(new Date(2026, 4, 1, 23, 30))).toBe('2026-05-01')
  })
})

describe('fordeling av bolker', () => {
  it('deler ut alle bolker', () => {
    const allocation = allocateBlocks(
      [
        { id: 'a', subject: 'A', weight: 2 },
        { id: 'b', subject: 'B', weight: 1 },
        { id: 'c', subject: 'C', weight: 1 },
      ],
      4,
    )
    expect(allocation.reduce((sum, item) => sum + item.blocks, 0)).toBe(4)
  })

  it('gir tyngste emne flest bolker', () => {
    const allocation = allocateBlocks(
      [
        { id: 'a', subject: 'A', weight: 2 },
        { id: 'b', subject: 'B', weight: 1 },
      ],
      3,
    )
    expect(allocation.find((item) => item.examId === 'a')!.blocks).toBe(2)
  })

  it('gir bare hele bolker', () => {
    // «1,4 bolker på matte» er ikke noe et menneske kan gjøre
    const allocation = allocateBlocks(
      [
        { id: 'a', subject: 'A', weight: 1 },
        { id: 'b', subject: 'B', weight: 1 },
        { id: 'c', subject: 'C', weight: 1 },
      ],
      4,
    )
    expect(allocation.every((item) => Number.isInteger(item.blocks))).toBe(true)
    expect(allocation.reduce((sum, item) => sum + item.blocks, 0)).toBe(4)
  })

  it('takler tomme tilfeller', () => {
    expect(allocateBlocks([], 4)).toEqual([])
    expect(allocateBlocks([{ id: 'a', subject: 'A', weight: 1 }], 0)).toEqual([])
  })
})

describe('planen', () => {
  const today = '2026-05-01'
  const exams: Exam[] = [
    { id: 'x', subject: 'Matte', date: '2026-05-05', credits: 7.5 },
    { id: 'y', subject: 'Prog', date: '2026-05-20', credits: 15 },
  ]

  it('går fra i dag til siste eksamen', () => {
    const plan = buildPlan(exams, 4, today)
    expect(plan).toHaveLength(20)
    expect(plan[0]!.date).toBe(today)
  })

  it('prioriterer emnet med nærmest eksamen, selv om det er minst', () => {
    // Matte er halvparten så stort som Prog, men eksamen er om fire dager
    const [first] = buildPlan(exams, 4, today)
    const matte = first!.allocation.find((item) => item.examId === 'x')!.blocks
    const prog = first!.allocation.find((item) => item.examId === 'y')!.blocks
    expect(matte).toBeGreaterThanOrEqual(prog)
  })

  it('slutter å gi tid til et emne etter eksamensdagen', () => {
    const plan = buildPlan(exams, 4, today)
    const afterMatte = plan.filter((day) => day.offset > 4)
    expect(afterMatte.every((day) => !day.allocation.some((item) => item.examId === 'x'))).toBe(
      true,
    )
  })

  it('markerer eksamensdagene', () => {
    const plan = buildPlan(exams, 4, today)
    const examDay = plan.find((day) => day.date === '2026-05-05')!
    expect(examDay.examsToday.map((exam) => exam.id)).toEqual(['x'])
  })

  it('ignorerer eksamener som er passert', () => {
    expect(
      buildPlan([{ id: 'z', subject: 'Gammel', date: '2020-01-01', credits: 10 }], 4, today),
    ).toEqual([])
  })
})

describe('timerens faser', () => {
  const settings = DEFAULT_TIMER

  it('følger lesing med kort pause', () => {
    expect(nextPhase('focus', 1, settings)).toBe('break')
    expect(nextPhase('focus', 2, settings)).toBe('break')
  })

  it('gir lang pause hver tredje bolk', () => {
    expect(nextPhase('focus', 3, settings)).toBe('longBreak')
    expect(nextPhase('focus', 6, settings)).toBe('longBreak')
  })

  it('går alltid tilbake til lesing etter en pause', () => {
    expect(nextPhase('break', 3, settings)).toBe('focus')
    expect(nextPhase('longBreak', 3, settings)).toBe('focus')
  })

  it('henter riktig lengde per fase', () => {
    expect(phaseMinutes('focus', settings)).toBe(settings.focusMinutes)
    expect(phaseMinutes('longBreak', settings)).toBe(settings.longBreakMinutes)
  })
})

describe('klokkeformat', () => {
  it('viser mm:ss', () => {
    expect(formatClock(65)).toBe('01:05')
  })

  it('legger til timer når det trengs', () => {
    expect(formatClock(3725)).toBe('1:02:05')
  })

  it('går aldri under null', () => {
    expect(formatClock(-5)).toBe('00:00')
  })
})
