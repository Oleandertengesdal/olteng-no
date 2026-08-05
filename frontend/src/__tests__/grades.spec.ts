import { describe, it, expect } from 'vitest'
import {
  summarise,
  distribution,
  requiredForTarget,
  parseCourses,
  letterFor,
  type Course,
  type Grade,
} from '../data/grades'

const course = (code: string, credits: number, grade: Grade): Course => ({
  id: code,
  code,
  name: code,
  credits,
  grade,
})

describe('vektet snitt', () => {
  it('vekter etter studiepoeng og ikke etter antall emner', () => {
    // 15 sp A og 7,5 sp C. Et rent gjennomsnitt ville gitt 4,00 — det er feil,
    // og feilen går i din disfavør når de tunge emnene gikk best.
    const summary = summarise([course('A', 15, 'A'), course('B', 7.5, 'C')])
    expect(summary.average).toBeCloseTo(4.3333, 3)
    expect(summary.weightedCredits).toBe(22.5)
  })

  it('gir null snitt uten emner', () => {
    expect(summarise([]).average).toBeNull()
  })

  it('hopper over emner uten studiepoeng', () => {
    expect(summarise([course('A', 0, 'A')]).average).toBeNull()
  })
})

describe('bestått og ikke bestått', () => {
  it('holdes utenfor snittet', () => {
    const summary = summarise([course('A', 7.5, 'A'), course('P', 7.5, 'pass')])
    expect(summary.average).toBe(5)
  })

  it('gir likevel studiepoeng', () => {
    expect(summarise([course('A', 7.5, 'A'), course('P', 7.5, 'pass')]).passedCredits).toBe(15)
  })
})

describe('stryk', () => {
  it('utelates fra snittet som standard', () => {
    expect(summarise([course('A', 7.5, 'A'), course('F', 7.5, 'F')]).average).toBe(5)
  })

  it('kan tas med når man vil se det', () => {
    expect(summarise([course('A', 7.5, 'A'), course('F', 7.5, 'F')], true).average).toBe(2.5)
  })

  it('gir ikke studiepoeng', () => {
    expect(summarise([course('A', 7.5, 'A'), course('F', 7.5, 'F')]).passedCredits).toBe(7.5)
  })
})

describe('bokstav fra snitt', () => {
  it('runder til nærmeste trinn', () => {
    expect(letterFor(4.5)).toBe('A')
    expect(letterFor(4.49)).toBe('B')
    expect(letterFor(0.2)).toBe('F')
  })
})

describe('fordeling', () => {
  it('summerer studiepoeng per bokstav', () => {
    const spread = distribution([course('a', 7.5, 'A'), course('b', 15, 'A')])
    expect(spread.find((item) => item.grade === 'A')?.credits).toBe(22.5)
  })
})

describe('hva må jeg ha på resten', () => {
  it('regner ut snittet som kreves', () => {
    const target = requiredForTarget(summarise([course('x', 60, 'C')]), 60, 4)
    expect(target?.requiredAverage).toBeCloseTo(5, 5)
    expect(target?.achievable).toBe(true)
  })

  it('flagger umulige mål', () => {
    expect(requiredForTarget(summarise([course('x', 60, 'D')]), 30, 4.5)?.achievable).toBe(false)
  })

  it('flagger mål som allerede er nådd', () => {
    expect(requiredForTarget(summarise([course('x', 60, 'A')]), 30, 3)?.alreadyReached).toBe(true)
  })

  it('gir null uten gjenstående studiepoeng', () => {
    expect(requiredForTarget(summarise([course('x', 60, 'A')]), 0, 3)).toBeNull()
  })
})

describe('lim inn emner', () => {
  it('tolker tabulator fra et regneark', () => {
    const result = parseCourses('TDT4100\tObjektorientert programmering\t7,5\tB')
    expect(result.courses).toHaveLength(1)
    expect(result.courses[0]).toMatchObject({ code: 'TDT4100', credits: 7.5, grade: 'B' })
  })

  it('tolker semikolon', () => {
    expect(parseCourses('IDATA2306;Applikasjonsutvikling;10;C').courses[0]?.credits).toBe(10)
  })

  it('tolker ren tekst med mellomrom', () => {
    const result = parseCourses('TDT4100 Objektorientert programmering 7.5 B')
    expect(result.courses[0]?.grade).toBe('B')
    expect(result.courses[0]?.name).toBe('Objektorientert programmering')
  })

  it('kjenner igjen bestått', () => {
    expect(parseCourses('EXPH0004;Examen philosophicum;7,5;Bestått').courses[0]?.grade).toBe('pass')
  })

  it('virker uten emnekode', () => {
    expect(parseCourses('Matematikk 3\t10\tD').courses[0]?.grade).toBe('D')
  })

  it('forveksler ikke et årstall med studiepoeng', () => {
    // Begge er tall på samme linje. Studiepoeng har derfor et tak på 60.
    expect(parseCourses('TDT4100\tNoe\t2024\t7,5\tA').courses[0]?.credits).toBe(7.5)
  })

  it('samler linjer den ikke forsto i stedet for å kaste dem', () => {
    const result = parseCourses('bare noe tull\n\nTDT4100\tNoe\t7,5\tA')
    expect(result.courses).toHaveLength(1)
    expect(result.skipped).toHaveLength(1)
  })

  it('takler tom inndata', () => {
    expect(parseCourses('').courses).toHaveLength(0)
  })
})
