import { describe, it, expect } from 'vitest'
import {
  RATES,
  defaultRates,
  calculate,
  homeVersusAway,
  incomeWhereGrantIsGone,
  type LoanInput,
} from '../data/lanekassen'

const rates = defaultRates()

const base: LoanInput = {
  rates,
  livesAtHome: false,
  creditsPassed: 60,
  completedDegree: false,
  income: 0,
}

describe('satsene', () => {
  it('har årstall og kilde på hvert sett', () => {
    // Satsene endres årlig. Uten årstall og kilde er tallene umulige å
    // etterprøve, og en kalkulator med utdaterte satser er verre enn ingen.
    for (const set of RATES) {
      expect(set.year).toMatch(/\d{4}/)
      expect(set.source).toMatch(/^https:\/\//)
    }
  })

  it('lar de to omgjøringene summere til taket på 40 prosent', () => {
    expect(rates.creditShare + rates.degreeShare).toBeCloseTo(0.4, 10)
  })
})

describe('omgjøring', () => {
  it('gir 15 prosent for et fullt år uten grad', () => {
    expect(calculate(base).grant).toBeCloseTo(rates.basicLoanPerYear * 0.15, 0)
  })

  it('gir 40 prosent når graden er fullført', () => {
    const result = calculate({ ...base, completedDegree: true })
    expect(result.grant).toBeCloseTo(rates.basicLoanPerYear * 0.4, 0)
    expect(result.grantShare).toBeLessThanOrEqual(0.4001)
  })

  it('er forholdsmessig for studiepoeng', () => {
    // Halvparten av poengene gir halvparten av de 15 prosentene
    expect(calculate({ ...base, creditsPassed: 30 }).grant).toBeCloseTo(
      rates.basicLoanPerYear * 0.075,
      0,
    )
  })

  it('gir ingenting uten beståtte studiepoeng', () => {
    expect(calculate({ ...base, creditsPassed: 0 }).grant).toBe(0)
  })

  it('gir ikke mer enn 15 prosent for flere poeng enn normert', () => {
    expect(calculate({ ...base, creditsPassed: 90 }).grant).toBeCloseTo(
      rates.basicLoanPerYear * 0.15,
      0,
    )
  })
})

describe('bo hjemme', () => {
  it('fjerner hele omgjøringen', () => {
    expect(calculate({ ...base, livesAtHome: true, completedDegree: true }).grant).toBe(0)
  })

  it('lar hele beløpet stå som gjeld', () => {
    expect(calculate({ ...base, livesAtHome: true }).remainingLoan).toBe(rates.basicLoanPerYear)
  })

  it('gjør forskjellen lik hele stipendet', () => {
    const withDegree = { ...base, completedDegree: true }
    expect(homeVersusAway(withDegree)).toBeCloseTo(calculate(withDegree).grant, 5)
  })
})

describe('inntekt over fribeløpet', () => {
  it('trekker ingenting på grensa', () => {
    expect(calculate({ ...base, income: rates.incomeLimit }).incomeCut).toBe(0)
  })

  it('trekker fem prosent av det overskytende', () => {
    expect(calculate({ ...base, income: rates.incomeLimit + 100_000 }).incomeCut).toBeCloseTo(
      5_000,
      0,
    )
  })

  it('trekker aldri mer enn stipendet', () => {
    // Man skylder ikke Lånekassen penger for å ha jobbet
    const extreme = calculate({ ...base, income: 2_000_000 })
    expect(extreme.grant).toBe(0)
    expect(extreme.remainingLoan).toBeLessThanOrEqual(rates.basicLoanPerYear)
  })

  it('finner inntekten der stipendet er helt borte', () => {
    const ceiling = incomeWhereGrantIsGone(base)
    expect(ceiling).not.toBeNull()
    expect(calculate({ ...base, income: ceiling! }).grant).toBeCloseTo(0, 5)
  })

  it('gir null tak når det ikke finnes noe stipend å spise av', () => {
    expect(incomeWhereGrantIsGone({ ...base, livesAtHome: true })).toBeNull()
  })
})

describe('utbetaling', () => {
  it('fordeler basislånet over elleve måneder', () => {
    expect(calculate(base).perMonth).toBeCloseTo(rates.basicLoanPerYear / 11, 5)
  })
})
