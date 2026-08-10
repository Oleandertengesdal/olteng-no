import { describe, it, expect, beforeEach } from 'vitest'
import {
  read,
  write,
  remove,
  ownKeys,
  exportAll,
  importAll,
  exportFilename,
  storageStatus,
  STORAGE_VERSION,
  APP_ID,
} from '../storage.ts'

const PREFIX = `dashboard.v${STORAGE_VERSION}.`

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'number')

beforeEach(() => {
  localStorage.clear()
})

describe('read og write', () => {
  it('skriver og leser tilbake', () => {
    expect(write('layout', [1, 2, 3])).toBe(true)
    expect(read('layout', [] as number[])).toEqual([1, 2, 3])
  })

  it('legger versjonen i nøkkelen', () => {
    write('theme', 'natt')
    expect(localStorage.getItem(`${PREFIX}theme`)).toBe('"natt"')
  })

  it('gir standardverdien når nøkkelen ikke finnes', () => {
    expect(read('finnes-ikke', 'standard')).toBe('standard')
  })

  it('gir standardverdien og rydder bort ødelagt JSON', () => {
    localStorage.setItem(`${PREFIX}layout`, '{ dette er ikke JSON')
    expect(read('layout', 'standard')).toBe('standard')
    // Ryddet bort, ellers ville feilen gjentatt seg ved hver lasting.
    expect(localStorage.getItem(`${PREFIX}layout`)).toBeNull()
  })

  it('avviser gyldig JSON av feil form', () => {
    localStorage.setItem(`${PREFIX}layout`, '"en streng der det skal være en liste"')
    expect(read('layout', [1], isNumberArray)).toEqual([1])
    expect(localStorage.getItem(`${PREFIX}layout`)).toBeNull()
  })

  it('fjerner en nøkkel', () => {
    write('theme', 'hav')
    remove('theme')
    expect(read('theme', 'papir')).toBe('papir')
  })
})

describe('ownKeys', () => {
  it('ser bare sine egne nøkler', () => {
    write('theme', 'papir')
    write('layout', [])
    localStorage.setItem('noe-annet-på-domenet', 'x')
    localStorage.setItem('dashboard.v99.fra-framtiden', 'x')
    expect(ownKeys()).toEqual(['layout', 'theme'])
  })
})

describe('eksport', () => {
  it('pakker alt i en konvolutt som kan leses av et menneske', () => {
    write('theme', 'skog')
    write('layout', [{ id: 'a' }])

    const bundle = exportAll()
    expect(bundle.app).toBe(APP_ID)
    expect(bundle.version).toBe(STORAGE_VERSION)
    expect(bundle.data).toEqual({ theme: 'skog', layout: [{ id: 'a' }] })
    expect(Date.parse(bundle.exportedAt)).not.toBeNaN()
  })

  it('gir et filnavn med dato', () => {
    expect(exportFilename(new Date('2026-08-06T09:00:00Z'))).toBe('dashboard-2026-08-06.json')
  })
})

describe('import', () => {
  const bundle = (data: unknown, overrides: Record<string, unknown> = {}) =>
    JSON.stringify({
      app: APP_ID,
      version: STORAGE_VERSION,
      exportedAt: '2026-08-06T09:00:00.000Z',
      data,
      ...overrides,
    })

  it('leser tilbake det eksporten skrev', () => {
    write('theme', 'skog')
    write('layout', [{ id: 'a' }])
    const json = JSON.stringify(exportAll())

    localStorage.clear()
    const result = importAll(json)

    expect(result.ok).toBe(true)
    expect(read('theme', '')).toBe('skog')
    expect(read('layout', [])).toEqual([{ id: 'a' }])
  })

  it('avviser noe som ikke er JSON', () => {
    expect(importAll('ikke json')).toEqual({ ok: false, reason: 'parse' })
  })

  it('avviser en fil fra en annen app', () => {
    const result = importAll(bundle({}, { app: 'noe-annet' }))
    expect(result).toMatchObject({ ok: false, reason: 'shape' })
  })

  it('avviser en nyere versjon i sin helhet framfor å importere halvveis', () => {
    // Å skrive inn felter vi ikke forstår gir et oppsett som ser riktig ut og
    // oppfører seg feil. Det er verre å oppdage enn en tydelig avvisning.
    const result = importAll(bundle({ theme: 'framtid' }, { version: STORAGE_VERSION + 1 }))
    expect(result).toMatchObject({ ok: false, reason: 'newer' })
    expect(read('theme', 'papir')).toBe('papir')
  })

  it('godtar en eldre versjon', () => {
    const result = importAll(bundle({ theme: 'natt' }, { version: 0 }))
    expect(result.ok).toBe(true)
  })

  it('hopper over nøkler uten verdi', () => {
    const result = importAll(bundle({ theme: 'natt', layout: null }))
    expect(result).toEqual({ ok: true, keys: ['theme'] })
  })
})

describe('når localStorage ikke kan brukes', () => {
  it('faller tilbake til standardverdien framfor å kaste', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

    // Speiler Safari i privat modus: objektet finnes, men skriving kaster.
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => ({
        setItem() {
          throw new DOMException('QuotaExceededError')
        },
        getItem: () => null,
        removeItem() {},
        key: () => null,
        length: 0,
      }),
    })

    expect(() => read('theme', 'papir')).not.toThrow()
    expect(read('theme', 'papir')).toBe('papir')
    expect(write('theme', 'natt')).toBe(false)
    expect(storageStatus()).toBe('unavailable')

    if (original) Object.defineProperty(globalThis, 'localStorage', original)
  })
})
