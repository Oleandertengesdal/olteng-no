import { describe, it, expect } from 'vitest'
import {
  gramsOfAlcohol,
  absorbedFraction,
  bacAt,
  estimateAt,
  minutesUntilBelow,
  formatDuration,
  LEGAL_LIMIT,
  R_FACTORS,
  BURN_RATE,
  ABSORPTION_MINUTES,
  type Drink,
} from '../data/bac'

const beer = (minutesAgo: number, id = 'b'): Drink => ({
  id,
  volume: 500,
  abv: 4.7,
  label: 'øl',
  minutesAgo,
})

const person = { weight: 70, r: R_FACTORS.higher }

describe('alkoholmengde', () => {
  it('regner gram ren alkohol i en halvliter øl', () => {
    expect(gramsOfAlcohol(500, 4.7)).toBeCloseTo(18.54, 1)
  })

  it('gir null for alkoholfritt', () => {
    expect(gramsOfAlcohol(500, 0)).toBe(0)
  })
})

describe('opptak', () => {
  it('starter på null og er fullført etter absorpsjonstiden', () => {
    expect(absorbedFraction(0)).toBe(0)
    expect(absorbedFraction(ABSORPTION_MINUTES)).toBe(1)
    expect(absorbedFraction(ABSORPTION_MINUTES * 10)).toBe(1)
  })

  it('er halvveis midtveis', () => {
    expect(absorbedFraction(ABSORPTION_MINUTES / 2)).toBeCloseTo(0.5, 10)
  })
})

describe('Widmark', () => {
  it('gir omtrent 0,39 ‰ for én halvliter på 70 kg', () => {
    // Uten forbrenning, ferdig absorbert
    expect(bacAt([beer(ABSORPTION_MINUTES)], person, 0, 0)).toBeCloseTo(0.39, 2)
  })

  it('synker med tida', () => {
    const drinks = [beer(ABSORPTION_MINUTES)]
    expect(bacAt(drinks, person, 180, BURN_RATE.typical)).toBeLessThan(
      bacAt(drinks, person, 0, BURN_RATE.typical),
    )
  })

  it('blir aldri negativ', () => {
    expect(bacAt([beer(0)], person, 60 * 24, BURN_RATE.typical)).toBe(0)
  })

  it('gir null uten drikke, og kaster ikke på ugyldig vekt', () => {
    expect(bacAt([], person, 0)).toBe(0)
    expect(bacAt([beer(0)], { weight: 0, r: 0.68 }, 0)).toBe(0)
  })
})

describe('usikkerhetsspennet', () => {
  it('er sortert lavt til høyt', () => {
    const estimate = estimateAt([beer(0)], person, 60)
    expect(estimate.low).toBeLessThanOrEqual(estimate.typical)
    expect(estimate.typical).toBeLessThanOrEqual(estimate.high)
  })

  it('er bredt nok til å bety noe', () => {
    // Poenget med spennet er nettopp at det ikke er kosmetisk
    const estimate = estimateAt([beer(0)], person, 60)
    expect(estimate.high - estimate.low).toBeGreaterThan(0.02)
  })
})

describe('når er alkoholen ute', () => {
  it('svarer null når ingenting er drukket', () => {
    expect(minutesUntilBelow([], person, LEGAL_LIMIT)).toBe(0)
  })

  it('gir flere timer etter fem halvlitere', () => {
    const drinks = Array.from({ length: 5 }, (_, i) => beer(0, `b${i}`))
    const minutes = minutesUntilBelow(drinks, person, LEGAL_LIMIT)
    expect(minutes).not.toBeNull()
    expect(minutes!).toBeGreaterThan(240)
  })

  it('sier ikke «edru nå» om et glass som nettopp er drukket', () => {
    // Regresjon: en enhet drukket i dette sekundet er ikke absorbert ennå og
    // måler null. En naiv «første gang under grensa»-sjekk svarte derfor at
    // man var edru med det samme. Funksjonen må se hele kurven.
    const minutes = minutesUntilBelow([beer(0)], person, LEGAL_LIMIT)
    expect(minutes).not.toBeNull()
    expect(minutes!).toBeGreaterThan(60)
  })

  it('lar promillen stige etter at glasset er drukket', () => {
    expect(estimateAt([beer(0)], person, 45).high).toBeGreaterThan(
      estimateAt([beer(0)], person, 0).high,
    )
  })
})

describe('tidsformat', () => {
  it('viser bare minutter under en time', () => {
    expect(formatDuration(35, 'nb')).toBe('35 min')
  })

  it('viser timer og minutter over en time', () => {
    expect(formatDuration(200, 'nb')).toBe('3 t 20 min')
  })

  it('runder oppover til nærmeste fem minutter', () => {
    // Et anslag skal heller være for forsiktig enn for optimistisk
    expect(formatDuration(31, 'nb')).toBe('35 min')
  })
})
