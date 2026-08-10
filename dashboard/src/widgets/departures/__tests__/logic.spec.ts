import { describe, it, expect } from 'vitest'
import {
  delayMinutes,
  isStop,
  minutesUntil,
  modeIcon,
  parseDepartures,
  stillUpcoming,
  waitDisplay,
  type Departure,
} from '../logic.ts'

const call = (overrides: Record<string, unknown> = {}) => ({
  aimedDepartureTime: '2026-08-06T14:32:00+02:00',
  expectedDepartureTime: '2026-08-06T14:32:00+02:00',
  realtime: true,
  cancellation: false,
  destinationDisplay: { frontText: 'Dragvoll' },
  quay: { id: 'NSR:Quay:1', publicCode: 'B' },
  serviceJourney: { id: 'j1', line: { id: 'ATB:Line:5', publicCode: '5', name: 'Buss 5', transportMode: 'bus' } },
  ...overrides,
})

const response = (calls: unknown[]) => ({
  data: { stopPlace: { id: 'NSR:StopPlace:44085', name: 'Gløshaugen', estimatedCalls: calls } },
})

describe('parseDepartures', () => {
  it('leser ut en avgang', () => {
    const result = parseDepartures(response([call()]))
    expect(result).toHaveLength(1)
    expect(result![0]).toMatchObject({
      line: '5',
      destination: 'Dragvoll',
      mode: 'bus',
      realtime: true,
      cancelled: false,
      quay: 'B',
    })
  })

  it('svarer med tom liste når holdeplassen ikke finnes', () => {
    // Et gyldig svar på et dårlig spørsmål. Ikke en feil.
    expect(parseDepartures({ data: { stopPlace: null } })).toEqual([])
  })

  it('svarer null når svaret ikke er et Entur-svar', () => {
    expect(parseDepartures(null)).toBeNull()
    expect(parseDepartures({})).toBeNull()
    expect(parseDepartures({ data: {} })).toBeNull()
    expect(parseDepartures({ data: { stopPlace: { estimatedCalls: 'nei' } } })).toBeNull()
  })

  it('hopper over avganger uten forventet tid', () => {
    const result = parseDepartures(response([call({ expectedDepartureTime: null }), call()]))
    expect(result).toHaveLength(1)
  })

  it('faller tilbake på linjenavnet når linjen mangler nummer', () => {
    const result = parseDepartures(
      response([
        call({
          serviceJourney: { line: { id: 'x', name: 'Flybussen', transportMode: 'bus' } },
        }),
      ]),
    )
    expect(result![0]!.line).toBe('Flybussen')
  })

  it('bruker forventet tid som planlagt når planlagt mangler', () => {
    const result = parseDepartures(response([call({ aimedDepartureTime: undefined })]))
    expect(result![0]!.aimed).toBe(result![0]!.expected)
  })

  it('tåler at plattform og destinasjon mangler', () => {
    const result = parseDepartures(response([call({ quay: null, destinationDisplay: null })]))
    expect(result![0]!.quay).toBeNull()
    expect(result![0]!.destination).toBe('Buss 5')
  })

  it('merker innstilte avganger', () => {
    const result = parseDepartures(response([call({ cancellation: true })]))
    expect(result![0]!.cancelled).toBe(true)
  })

  it('gir hver avgang sin egen nøkkel, også når to går samtidig', () => {
    const result = parseDepartures(response([call(), call()]))
    expect(result![0]!.key).not.toBe(result![1]!.key)
  })
})

describe('minutesUntil', () => {
  const now = Date.parse('2026-08-06T14:30:00+02:00')

  it('runder ned, slik at man rekker bussen', () => {
    // 89 sekunder er «1 min», ikke «2 min». Å runde opp gir et halvt minutt
    // man ikke har.
    expect(minutesUntil(now + 89_000, now)).toBe(1)
    expect(minutesUntil(now + 119_000, now)).toBe(1)
    expect(minutesUntil(now + 120_000, now)).toBe(2)
  })

  it('er negativ for noe som allerede har gått', () => {
    expect(minutesUntil(now - 60_000, now)).toBe(-1)
  })
})

describe('delayMinutes', () => {
  it('regner forsinkelse i hele minutter', () => {
    const aimed = Date.parse('2026-08-06T14:32:00+02:00')
    expect(delayMinutes(aimed, aimed + 6 * 60_000)).toBe(6)
  })

  it('er negativ når noe går før tiden', () => {
    const aimed = Date.parse('2026-08-06T14:32:00+02:00')
    expect(delayMinutes(aimed, aimed - 60_000)).toBe(-1)
  })
})

describe('waitDisplay', () => {
  const now = Date.parse('2026-08-06T14:30:00+02:00')

  it('sier «nå» det siste minuttet', () => {
    expect(waitDisplay(now + 30_000, now)).toEqual({ kind: 'now' })
  })

  it('teller minutter under en time', () => {
    expect(waitDisplay(now + 12 * 60_000, now)).toEqual({ kind: 'minutes', minutes: 12 })
    expect(waitDisplay(now + 59 * 60_000, now)).toEqual({ kind: 'minutes', minutes: 59 })
  })

  it('bytter til klokkeslett over en time', () => {
    // «73 min» er et tall ingen klarer å gjøre noe med.
    const at = now + 73 * 60_000
    expect(waitDisplay(at, now)).toEqual({ kind: 'clock', at })
  })

  it('markerer det som har gått', () => {
    expect(waitDisplay(now - 60_000, now)).toEqual({ kind: 'gone' })
  })
})

describe('stillUpcoming', () => {
  const now = Date.parse('2026-08-06T14:30:00+02:00')
  const at = (offsetMs: number): Departure => ({
    key: String(offsetMs),
    line: '5',
    destination: 'Dragvoll',
    mode: 'bus',
    aimed: now + offsetMs,
    expected: now + offsetMs,
    realtime: true,
    cancelled: false,
    quay: null,
  })

  it('luker bort det som gikk for lenge siden', () => {
    // Svaret kan ligge i cache noen minutter. En liste som begynner med noe
    // som gikk for tre minutter siden er verre enn en kortere liste.
    const result = stillUpcoming([at(-180_000), at(60_000)], now)
    expect(result).toHaveLength(1)
  })

  it('lar det som nettopp gikk bli stående noen sekunder', () => {
    expect(stillUpcoming([at(-10_000)], now)).toHaveLength(1)
  })
})

describe('modeIcon', () => {
  it('gir skinnegående sitt eget ikon', () => {
    expect(modeIcon('rail')).toBe('train')
    expect(modeIcon('tram')).toBe('train')
    expect(modeIcon('metro')).toBe('train')
    expect(modeIcon('water')).toBe('boat')
  })

  it('faller tilbake på bussen framfor på et tomrom', () => {
    expect(modeIcon('bus')).toBe('bus')
    expect(modeIcon('funicular')).toBe('bus')
    expect(modeIcon(null)).toBe('bus')
  })
})

describe('isStop', () => {
  it('godtar en holdeplass fra geokoderen', () => {
    expect(isStop({ id: 'NSR:StopPlace:44085', name: 'Gløshaugen', locality: 'Trondheim' })).toBe(true)
  })

  it('avviser noe som ikke er en holdeplass', () => {
    expect(isStop(null)).toBe(false)
    expect(isStop({ id: 'noe-annet', name: 'X', locality: '' })).toBe(false)
    expect(isStop({ id: 'NSR:StopPlace:1', name: 'X' })).toBe(false)
  })
})
