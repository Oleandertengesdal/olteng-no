import { describe, it, expect } from 'vitest'
import {
  describeCode,
  isPlace,
  linePath,
  linePoints,
  parseForecast,
  placeKey,
  precipitationBars,
  temperatureScale,
  totalPrecipitation,
  upcomingHours,
  type HourPoint,
} from '../logic.ts'

const place = {
  id: '3133880',
  name: 'Trondheim',
  region: 'Trøndelag',
  country: 'Norge',
  latitude: 63.43049,
  longitude: 10.39506,
}

describe('describeCode', () => {
  it('bytter mellom sol og måne på klarvær', () => {
    expect(describeCode(0, true).icon).toBe('sun')
    expect(describeCode(0, false).icon).toBe('moon')
  })

  it('skiller underkjølt nedbør fra vanlig', () => {
    // Forskjellen på glatt og ikke glatt. Den skal ikke grupperes bort.
    expect(describeCode(65, true).label.nb).toBe('Regn')
    expect(describeCode(66, true).label.nb).toBe('Underkjølt regn')
    expect(describeCode(55, true).label.nb).toBe('Yr')
    expect(describeCode(57, true).label.nb).toBe('Underkjølt yr')
  })

  it('gjør aldri snø om til regn', () => {
    for (const code of [71, 73, 75, 77, 85, 86]) {
      expect(describeCode(code, true).icon, `kode ${code}`).toBe('snow')
    }
  })

  it('markerer hvilke koder som betyr at det faller noe', () => {
    expect(describeCode(3, true).precipitation).toBe(false)
    expect(describeCode(45, true).precipitation).toBe(false)
    expect(describeCode(61, true).precipitation).toBe(true)
    expect(describeCode(95, true).precipitation).toBe(true)
  })

  it('sier «ukjent» framfor å gjette på en kode den ikke kjenner', () => {
    expect(describeCode(42, true).label.nb).toBe('Ukjent')
  })
})

describe('parseForecast', () => {
  const raw = {
    current: {
      temperature_2m: 6.4,
      apparent_temperature: 3.1,
      weather_code: 3,
      is_day: 1,
      wind_speed_10m: 4.2,
    },
    hourly: {
      time: ['2026-08-06T14:00', '2026-08-06T15:00', '2026-08-06T16:00'],
      temperature_2m: [6.4, 6.1, 5.8],
      precipitation: [0, 0.4, 1.2],
      precipitation_probability: [10, 45, 80],
      weather_code: [3, 61, 63],
    },
  }

  it('leser ut det som trengs', () => {
    const weather = parseForecast(raw)
    expect(weather).not.toBeNull()
    expect(weather!.temperature).toBe(6.4)
    expect(weather!.apparent).toBe(3.1)
    expect(weather!.isDay).toBe(true)
    expect(weather!.hours).toHaveLength(3)
    expect(weather!.hours[1]).toEqual({
      time: '2026-08-06T15:00',
      temperature: 6.1,
      precipitation: 0.4,
      probability: 45,
      code: 61,
    })
  })

  it('svarer null når svaret ikke er et værvarsel', () => {
    expect(parseForecast(null)).toBeNull()
    expect(parseForecast({})).toBeNull()
    expect(parseForecast({ current: {}, hourly: {} })).toBeNull()
    expect(parseForecast({ error: true, reason: 'noe gikk galt' })).toBeNull()
  })

  it('faller tilbake på temperaturen når «føles som» mangler', () => {
    const without = { ...raw, current: { ...raw.current, apparent_temperature: null } }
    expect(parseForecast(without)!.apparent).toBe(6.4)
  })

  it('hopper over timer uten temperatur framfor å vise NaN', () => {
    const gappy = {
      ...raw,
      hourly: { ...raw.hourly, temperature_2m: [6.4, null, 5.8] },
    }
    expect(parseForecast(gappy)!.hours).toHaveLength(2)
  })

  it('lar sannsynlighet være null når modellen ikke oppgir den', () => {
    const without = { ...raw, hourly: { ...raw.hourly, precipitation_probability: undefined } }
    expect(parseForecast(without)!.hours[0]!.probability).toBeNull()
  })

  it('leser mørketid som natt hele døgnet', () => {
    const polarNight = { ...raw, current: { ...raw.current, is_day: 0 } }
    expect(parseForecast(polarNight)!.isDay).toBe(false)
  })
})

describe('upcomingHours', () => {
  const hours: HourPoint[] = ['12:00', '13:00', '14:00', '15:00'].map((hm) => ({
    time: `2026-08-06T${hm}`,
    temperature: 10,
    precipitation: 0,
    probability: null,
    code: 0,
  }))

  it('tar med timen man står i', () => {
    // Klokka 14:40 er været klokka 14:00 fortsatt været nå.
    const result = upcomingHours(hours, new Date('2026-08-06T14:40:00'))
    expect(result.map((h) => h.time)).toEqual(['2026-08-06T14:00', '2026-08-06T15:00'])
  })

  it('kutter etter antallet som er bedt om', () => {
    expect(upcomingHours(hours, new Date('2026-08-06T12:00:00'), 2)).toHaveLength(2)
  })
})

describe('temperatureScale', () => {
  it('gir en flat dag et minste spenn framfor å forstørre støy', () => {
    // Uten gulvet blir 0,3 graders variasjon tegnet som en fjellkjede.
    const scale = temperatureScale([6.0, 6.1, 6.3])
    expect(scale.max - scale.min).toBeGreaterThanOrEqual(4)
    expect(scale.min).toBeLessThanOrEqual(6)
    expect(scale.max).toBeGreaterThanOrEqual(6.3)
  })

  it('lar en dag med ekte variasjon være i fred', () => {
    const scale = temperatureScale([-4, 2, 9])
    expect(scale.min).toBe(-4)
    expect(scale.max).toBe(9)
  })

  it('tåler en tom liste', () => {
    expect(temperatureScale([])).toEqual({ min: 0, max: 4 })
  })
})

describe('linePoints', () => {
  it('legger første punkt helt til venstre og siste helt til høyre', () => {
    const points = linePoints([0, 5, 10], { min: 0, max: 10 }, 100, 50)
    expect(points[0]).toEqual({ x: 0, y: 50 })
    expect(points[2]).toEqual({ x: 100, y: 0 })
  })

  it('snur y-aksen, slik at varmt er høyt', () => {
    const points = linePoints([0, 10], { min: 0, max: 10 }, 100, 50)
    expect(points[1]!.y).toBeLessThan(points[0]!.y)
  })

  it('setter ett enkelt punkt i midten framfor å dele på null', () => {
    expect(linePoints([7], { min: 0, max: 10 }, 100, 50)).toEqual([{ x: 50, y: 25 }])
  })

  it('gir ingen punkter for ingen data', () => {
    expect(linePoints([], { min: 0, max: 10 }, 100, 50)).toEqual([])
    expect(linePath([])).toBe('')
  })
})

describe('precipitationBars', () => {
  it('holder skalaen fast på minst én millimeter', () => {
    // Uten gulvet blir 0,1 mm yr en full søyle bare fordi det er det største
    // tallet i vinduet.
    const bars = precipitationBars([0.1, 0, 0], 90, 20)
    expect(bars[0]!.height).toBeLessThanOrEqual(2)
  })

  it('lar den største verdien fylle høyden når det regner ordentlig', () => {
    const bars = precipitationBars([0, 4], 90, 20)
    expect(bars[1]!.height).toBe(20)
  })

  it('tegner ingen søyle for tørre timer', () => {
    expect(precipitationBars([0, 0], 90, 20).every((b) => b.height === 0)).toBe(true)
  })
})

describe('totalPrecipitation', () => {
  it('runder til én desimal framfor å vise flyttallsstøy', () => {
    // 0.1 + 0.2 er 0.30000000000000004 i JavaScript.
    expect(totalPrecipitation([0.1, 0.2])).toBe(0.3)
  })

  it('er null for et tørt døgn', () => {
    expect(totalPrecipitation([0, 0, 0])).toBe(0)
  })
})

describe('sted', () => {
  it('kjenner igjen et gyldig sted', () => {
    expect(isPlace(place)).toBe(true)
  })

  it('avviser noe som ikke har koordinater', () => {
    expect(isPlace(null)).toBe(false)
    expect(isPlace({ ...place, latitude: 'nord' })).toBe(false)
    expect(isPlace({ ...place, longitude: NaN })).toBe(false)
  })

  it('lager en cachenøkkel som er stabil for samme sted', () => {
    expect(placeKey(place)).toBe(placeKey({ ...place, id: 'et annet id' }))
    expect(placeKey(place)).not.toBe(placeKey({ ...place, latitude: 59.91 }))
  })
})
