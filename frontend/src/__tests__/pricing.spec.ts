import { describe, it, expect } from 'vitest'
import {
  TARIFFS,
  currentTariffs,
  DEFAULT_USER_TARIFF,
  supportFor,
  thresholdInclVat,
  breakdown,
  breakdownParts,
  compareSchemes,
  breakEvenSpot,
  dayTotals,
  monthlyEstimate,
  type BreakdownInput,
} from '../data/pricing'

const tariffs = currentTariffs()
const user = { ...DEFAULT_USER_TARIFF }

const base: Omit<BreakdownInput, 'spotOreExVat' | 'scheme'> = {
  zone: 'NO1',
  tariffs,
  user,
  vatExempt: false,
}

describe('satsene', () => {
  it('har årstall og kilder', () => {
    // Satsene endres ved hvert statsbudsjett. Uten årstall og kilde er de
    // umulige å etterprøve, og et verktøy med utdaterte satser er verre enn
    // ingen verktøy.
    for (const set of TARIFFS) {
      expect(set.year).toMatch(/\d{4}/)
      expect(set.sources.length).toBeGreaterThan(0)
      expect(set.sources.every((url) => url.startsWith('https://'))).toBe(true)
    }
  })

  it('holder terskelen for 2026 på 77 øre uten mva', () => {
    expect(tariffs.supportThresholdOre).toBe(77)
    expect(tariffs.supportShare).toBe(0.9)
  })

  it('gjør terskelen til 96,25 øre inkludert mva', () => {
    // Dette er tallet folk møter på regninga, og det er verdt en egen test
    expect(thresholdInclVat(tariffs)).toBeCloseTo(96.25, 5)
  })

  it('setter Norgespris til 40 øre uten mva, altså 50 med', () => {
    expect(tariffs.norgesprisOre).toBe(40)
    expect(tariffs.norgesprisOre * (1 + tariffs.vatRate)).toBeCloseTo(50, 5)
  })
})

describe('strømstøtte', () => {
  it('gir ingenting under eller på terskelen', () => {
    expect(supportFor(70, tariffs)).toBe(0)
    expect(supportFor(77, tariffs)).toBe(0)
  })

  it('dekker 90 prosent av det som overstiger', () => {
    expect(supportFor(100, tariffs)).toBeCloseTo((100 - 77) * 0.9, 10)
    expect(supportFor(200, tariffs)).toBeCloseTo((200 - 77) * 0.9, 10)
  })

  it('flater ut prisen: 100 øre mer i spot koster deg bare 10', () => {
    // Dette er hele poenget med ordningen, og det er lett å ta feil av
    const low = breakdown({ ...base, spotOreExVat: 100, scheme: 'spot' })
    const high = breakdown({ ...base, spotOreExVat: 200, scheme: 'spot' })
    expect(high.subtotal - low.subtotal).toBeCloseTo(10, 5)
  })
})

describe('full oppdeling', () => {
  const result = breakdown({ ...base, spotOreExVat: 100, scheme: 'spot' })

  it('trekker støtten fra kraftprisen', () => {
    expect(result.energy).toBeCloseTo(100 - (100 - 77) * 0.9, 5)
  })

  it('legger på påslag, elavgift og nettleie før mva', () => {
    expect(result.subtotal).toBeCloseTo(
      result.energy + user.markupOre + tariffs.electricityTaxOre + user.gridOre,
      5,
    )
  })

  it('lar delene summere til totalen', () => {
    const parts = breakdownParts(result)
    expect(parts.reduce((sum, part) => sum + part.value, 0)).toBeCloseTo(result.total, 5)
  })

  it('dropper mva i Nord-Norge', () => {
    const north = breakdown({
      ...base,
      zone: 'NO4',
      vatExempt: true,
      spotOreExVat: 100,
      scheme: 'spot',
    })
    expect(north.vat).toBe(0)
    expect(north.total).toBeCloseTo(north.subtotal, 10)
  })

  it('dropper elavgift ved fritak', () => {
    // Fritaket gjelder Nord-Troms og Finnmark, som er et mindre område enn
    // mva-fritaket — de kan ikke utledes av hverandre
    const exempt = breakdown({
      ...base,
      user: { ...user, electricityTaxExempt: true },
      spotOreExVat: 100,
      scheme: 'spot',
    })
    expect(exempt.electricityTax).toBe(0)
  })
})

describe('Norgespris', () => {
  it('holder kraftprisen fast uansett spotpris', () => {
    const low = breakdown({ ...base, spotOreExVat: 10, scheme: 'norgespris' })
    const high = breakdown({ ...base, spotOreExVat: 1000, scheme: 'norgespris' })
    expect(low.energy).toBe(tariffs.norgesprisOre)
    expect(high.total).toBe(low.total)
  })

  it('gir verken støtte eller påslag', () => {
    const result = breakdown({ ...base, spotOreExVat: 300, scheme: 'norgespris' })
    expect(result.support).toBe(0)
    expect(result.markup).toBe(0)
  })
})

describe('hvilken ordning lønner seg', () => {
  it('velger spot når strømmen er billig', () => {
    expect(compareSchemes({ ...base, spotOreExVat: 20 }).cheaper).toBe('spot')
  })

  it('velger Norgespris når strømmen er dyr', () => {
    expect(compareSchemes({ ...base, spotOreExVat: 300 }).cheaper).toBe('norgespris')
  })

  it('finner et vippepunkt der de koster det samme', () => {
    const point = breakEvenSpot(tariffs, user)
    const at = compareSchemes({ ...base, spotOreExVat: point })
    expect(at.spotTotal).toBeCloseTo(at.norgesprisTotal, 5)
  })

  it('lar vippepunktet skille de to sidene', () => {
    const point = breakEvenSpot(tariffs, user)
    expect(compareSchemes({ ...base, spotOreExVat: point - 5 }).cheaper).toBe('spot')
    expect(compareSchemes({ ...base, spotOreExVat: point + 5 }).cheaper).toBe('norgespris')
  })
})

describe('døgn og måned', () => {
  const day = [50, 80, 120, 200, 60]

  it('teller timene der støtten slo inn', () => {
    // 120 og 200 er over 77; 80 er over også
    expect(dayTotals(day, { ...base, scheme: 'spot' }).hoursWithSupport).toBe(3)
  })

  it('takler et tomt døgn', () => {
    expect(dayTotals([], { ...base, scheme: 'spot' }).averageTotal).toBe(0)
  })

  it('holder forbruk under taket samlet', () => {
    const estimate = monthlyEstimate(1000, day, { ...base, scheme: 'spot' })
    expect(estimate.supportedKwh).toBe(1000)
    expect(estimate.unsupportedKwh).toBe(0)
  })

  it('splitter forbruk over taket', () => {
    // Over 5000 kWh faller ordningen bort — en detalj som overrasker folk
    // med varmekabler og elbil
    const estimate = monthlyEstimate(7000, day, { ...base, scheme: 'spot' })
    expect(estimate.supportedKwh).toBe(5000)
    expect(estimate.unsupportedKwh).toBe(2000)
  })

  it('viser at ordningen faktisk sparer penger', () => {
    expect(monthlyEstimate(1000, day, { ...base, scheme: 'spot' }).saved).toBeGreaterThan(0)
  })
})
