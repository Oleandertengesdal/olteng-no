import { describe, it, expect } from 'vitest'
import {
  withVat,
  statsFor,
  nationalAverage,
  currentHourIndex,
  percentDiff,
  levelFor,
  parsePoints,
  osloDate,
  osloHourNow,
  tomorrowMayBePublished,
  VAT_RATE,
  type PricePoint,
  type ZoneDay,
} from '../data/power'

/** Builds an hour-long point starting at the given ISO timestamp */
const point = (iso: string, nok: number): PricePoint => ({
  key: iso,
  start: new Date(iso),
  end: new Date(new Date(iso).getTime() + 3_600_000),
  nokExVat: nok,
  eurPerKwh: nok / 11,
})

const day = (zone: ZoneDay['zone'], points: PricePoint[]): ZoneDay => ({
  zone,
  date: '2026-08-02',
  points,
})

describe('merverdiavgift', () => {
  it('legger på 25 % når brukeren ber om det', () => {
    expect(withVat(1, 'NO1', true)).toBeCloseTo(1 + VAT_RATE, 10)
  })

  it('lar prisen stå urørt når mva er slått av', () => {
    expect(withVat(1, 'NO1', false)).toBe(1)
  })

  it('legger aldri på mva i Nord-Norge, selv om brukeren har huket av', () => {
    // NO4 har fritak — dette er hele grunnen til at mva er per sone
    expect(withVat(1, 'NO4', true)).toBe(1)
  })
})

describe('statistikk for et døgn', () => {
  const points = [
    point('2026-08-02T00:00:00+02:00', 0.9),
    point('2026-08-02T01:00:00+02:00', 0.1),
    point('2026-08-02T02:00:00+02:00', 0.5),
  ]

  it('finner billigste og dyreste time', () => {
    const stats = statsFor(points)
    expect(stats.min).toBe(0.1)
    expect(stats.max).toBe(0.9)
    expect(stats.cheapest?.key).toBe('2026-08-02T01:00:00+02:00')
    expect(stats.priciest?.key).toBe('2026-08-02T00:00:00+02:00')
  })

  it('regner snittet', () => {
    expect(statsFor(points).mean).toBeCloseTo(0.5, 10)
  })

  it('takler et tomt døgn uten å kaste', () => {
    const stats = statsFor([])
    expect(stats.mean).toBe(0)
    expect(stats.cheapest).toBeNull()
  })
})

describe('landssnitt', () => {
  it('snitter time for time på tvers av soner', () => {
    const result = nationalAverage([
      day('NO1', [point('2026-08-02T00:00:00+02:00', 1)]),
      day('NO2', [point('2026-08-02T00:00:00+02:00', 3)]),
    ])

    expect(result).toHaveLength(1)
    expect(result[0]!.nokExVat).toBe(2)
  })

  it('stiller soner på linje etter tidsstempel, ikke etter posisjon i lista', () => {
    // Sone to mangler den første timen. Indeks-for-indeks ville her ha snittet
    // NO1 kl. 00 sammen med NO2 kl. 01 og gitt feil svar for begge timene.
    const result = nationalAverage([
      day('NO1', [point('2026-08-02T00:00:00+02:00', 1), point('2026-08-02T01:00:00+02:00', 2)]),
      day('NO2', [point('2026-08-02T01:00:00+02:00', 4)]),
    ])

    expect(result).toHaveLength(2)
    expect(result[0]!.nokExVat).toBe(1)
    expect(result[1]!.nokExVat).toBe(3)
  })

  it('holder rekkefølgen kronologisk uansett hvilken sone som kom først', () => {
    const result = nationalAverage([
      day('NO1', [point('2026-08-02T05:00:00+02:00', 1)]),
      day('NO2', [point('2026-08-02T02:00:00+02:00', 1)]),
    ])

    expect(result.map((p) => p.key)).toEqual([
      '2026-08-02T02:00:00+02:00',
      '2026-08-02T05:00:00+02:00',
    ])
  })

  it('gir tom liste når ingen soner svarte', () => {
    expect(nationalAverage([])).toEqual([])
  })
})

describe('sommertid', () => {
  it('takler et døgn med 25 timer uten å anta 24', () => {
    // Natt til 25. oktober 2026 stilles klokka tilbake: 02-timen kommer to
    // ganger, med hver sin UTC-forskyvning.
    const raw = [
      {
        NOK_per_kWh: 1,
        EUR_per_kWh: 0.1,
        EXR: 11,
        time_start: '2026-10-25T02:00:00+02:00',
        time_end: '2026-10-25T02:00:00+01:00',
      },
      {
        NOK_per_kWh: 2,
        EUR_per_kWh: 0.2,
        EXR: 11,
        time_start: '2026-10-25T02:00:00+01:00',
        time_end: '2026-10-25T03:00:00+01:00',
      },
    ]

    const points = parsePoints(raw)
    expect(points).toHaveLength(2)
    // De to punktene er distinkte i tid selv om begge heter «02»
    expect(points[0]!.start.getTime()).not.toBe(points[1]!.start.getTime())
    expect(statsFor(points).mean).toBe(1.5)
  })
})

describe('gjeldende time', () => {
  const points = [point('2026-08-02T10:00:00+02:00', 1), point('2026-08-02T11:00:00+02:00', 2)]

  it('finner timen vi står i', () => {
    expect(currentHourIndex(points, new Date('2026-08-02T11:30:00+02:00'))).toBe(1)
  })

  it('teller starttimen som inkludert og sluttimen som ekskludert', () => {
    expect(currentHourIndex(points, new Date('2026-08-02T11:00:00+02:00'))).toBe(1)
    expect(currentHourIndex(points, new Date('2026-08-02T12:00:00+02:00'))).toBe(-1)
  })

  it('gir -1 for et døgn som ikke er nå', () => {
    expect(currentHourIndex(points, new Date('2026-08-03T11:30:00+02:00'))).toBe(-1)
  })
})

describe('avvik i prosent', () => {
  it('regner positivt for dyrere enn referansen', () => {
    expect(percentDiff(1.5, 1)).toBeCloseTo(50, 10)
  })

  it('regner negativt for billigere', () => {
    expect(percentDiff(0.5, 1)).toBeCloseTo(-50, 10)
  })

  it('nekter å dele på null', () => {
    expect(percentDiff(1, 0)).toBeNull()
  })
})

describe('prisnivå innenfor døgnet', () => {
  const stats = statsFor([
    point('2026-08-02T00:00:00+02:00', 0),
    point('2026-08-02T01:00:00+02:00', 3),
  ])

  it('deler døgnet i tre', () => {
    expect(levelFor(0.5, stats)).toBe('low')
    expect(levelFor(1.5, stats)).toBe('mid')
    expect(levelFor(2.5, stats)).toBe('high')
  })

  it('faller tilbake til midten når alle timer koster det samme', () => {
    const flat = statsFor([point('2026-08-02T00:00:00+02:00', 1)])
    expect(levelFor(1, flat)).toBe('mid')
  })
})

describe('døgnskifte', () => {
  // Fanen kan stå åpen over midnatt. Da må datoen skifte av seg selv, ellers
  // viser siden gårsdagens priser under dagens overskrift.
  it('bytter dato ved midnatt norsk tid, ikke ved midnatt UTC', () => {
    // Om sommeren er midnatt i Norge kl. 22:00 UTC
    expect(osloDate(0, new Date('2026-08-02T21:59:00Z'))).toBe('2026-08-02')
    expect(osloDate(0, new Date('2026-08-02T22:01:00Z'))).toBe('2026-08-03')
  })

  it('bytter dato riktig også på vintertid', () => {
    // Om vinteren er midnatt i Norge kl. 23:00 UTC
    expect(osloDate(0, new Date('2026-01-15T22:59:00Z'))).toBe('2026-01-15')
    expect(osloDate(0, new Date('2026-01-15T23:01:00Z'))).toBe('2026-01-16')
  })

  it('lar «i morgen» følge med over skiftet', () => {
    expect(osloDate(1, new Date('2026-08-02T22:01:00Z'))).toBe('2026-08-04')
  })

  it('gir norsk dato uansett hvor leseren sitter', () => {
    // 19:00 i New York er 01:00 i Norge dagen etter
    expect(osloDate(0, new Date('2026-08-02T23:00:00Z'))).toBe('2026-08-03')
  })
})

describe('publiseringstidspunkt', () => {
  it('leser klokka i norsk tid, ikke i leserens tidssone', () => {
    // 09:00 UTC er 11:00 i Oslo om sommeren
    expect(osloHourNow(new Date('2026-08-02T09:00:00Z'))).toBeCloseTo(11, 5)
  })

  it('holder morgendagen stengt før kl. 13 og åpner den etterpå', () => {
    expect(tomorrowMayBePublished(new Date('2026-08-02T09:00:00+02:00'))).toBe(false)
    expect(tomorrowMayBePublished(new Date('2026-08-02T13:00:00+02:00'))).toBe(true)
    expect(tomorrowMayBePublished(new Date('2026-08-02T18:00:00+02:00'))).toBe(true)
  })
})
