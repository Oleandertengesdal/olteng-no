import { describe, it, expect } from 'vitest'
import {
  parseColor,
  toHex,
  relativeLuminance,
  contrastRatio,
  formatRatio,
  passes,
  suggestPassing,
  rgbToHsl,
  hslToRgb,
  FAINT_BEFORE,
  FAINT_AFTER,
  RAISED_LIGHT,
} from '../data/contrast'

const WHITE = { r: 255, g: 255, b: 255 }
const BLACK = { r: 0, g: 0, b: 0 }

describe('kontrastforhold mot kjente referanseverdier', () => {
  it('gir 21:1 mellom svart og hvit', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5)
  })

  it('gir 1:1 for to like farger', () => {
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 10)
  })

  it('er symmetrisk — rekkefølgen skal ikke bety noe', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(contrastRatio(WHITE, BLACK), 10)
  })

  it('treffer grensefargen #767676, som ligger like over 4,5:1 mot hvit', () => {
    expect(contrastRatio(parseColor('#767676')!, WHITE)).toBeCloseTo(4.54, 1)
  })

  it('treffer grensefargen #595959, som ligger på 7:1 mot hvit', () => {
    expect(contrastRatio(parseColor('#595959')!, WHITE)).toBeCloseTo(7.0, 1)
  })
})

describe('relativ luminans', () => {
  it('setter hvit til 1 og svart til 0', () => {
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 10)
    expect(relativeLuminance(BLACK)).toBeCloseTo(0, 10)
  })

  it('vekter grønt tyngst og blått lettest', () => {
    const red = relativeLuminance({ r: 255, g: 0, b: 0 })
    const green = relativeLuminance({ r: 0, g: 255, b: 0 })
    const blue = relativeLuminance({ r: 0, g: 0, b: 255 })

    expect(green).toBeGreaterThan(red)
    expect(red).toBeGreaterThan(blue)
  })
})

describe('feilen som startet prosjektet', () => {
  // --c-faint lå på 150 140 128 og strøk mot kortbakgrunnen. Testen står her
  // som en regresjonssperre: senker noen fargen igjen, feiler dette.
  it('bekrefter at den gamle verdien lå på 2,86 og strøk kravet på 3:1', () => {
    const before = contrastRatio(FAINT_BEFORE, RAISED_LIGHT)
    expect(before).toBeCloseTo(2.86, 2)
    expect(passes(before, 3)).toBe(false)
  })

  it('bekrefter at den rettede verdien består', () => {
    expect(passes(contrastRatio(FAINT_AFTER, RAISED_LIGHT), 3)).toBe(true)
  })
})

describe('parsing av farger', () => {
  it.each([
    ['#fff', { r: 255, g: 255, b: 255 }],
    ['#ffffff', { r: 255, g: 255, b: 255 }],
    ['1a1612', { r: 26, g: 22, b: 18 }],
    ['#1a161280', { r: 26, g: 22, b: 18 }],
    ['rgb(26, 22, 18)', { r: 26, g: 22, b: 18 }],
    ['rgb(26 22 18 / 80%)', { r: 26, g: 22, b: 18 }],
    ['  #FFF  ', { r: 255, g: 255, b: 255 }],
  ])('tolker %s', (input, expected) => {
    expect(parseColor(input)).toEqual(expected)
  })

  it('tolker formatet denne siden lagrer farger i', () => {
    // Tailwind trenger kanalene hver for seg for å kunne sette gjennomsikt,
    // så CSS-variablene er nakne tripler uten funksjonsnavn rundt.
    expect(parseColor('26 22 18')).toEqual({ r: 26, g: 22, b: 18 })
  })

  it.each(['', '   ', 'blåbær', '#ff', '#12345'])('avviser %j', (input) => {
    expect(parseColor(input)).toBeNull()
  })

  it('går tur-retur gjennom hex uten å endre fargen', () => {
    expect(toHex(parseColor('#a63c1f')!)).toBe('#a63c1f')
  })
})

describe('visning av tallet', () => {
  it('runder nedover, aldri opp', () => {
    // 4,499 vist som «4,50» ved siden av et grønt merke ville vært en løgn
    expect(formatRatio(4.499)).toBe('4.49')
    expect(formatRatio(2.999)).toBe('2.99')
  })

  it('viser to desimaler også når de er null', () => {
    expect(formatRatio(4.5)).toBe('4.50')
    expect(formatRatio(21)).toBe('21.00')
  })
})

describe('forslag til en farge som består', () => {
  it('foreslår ingenting når kravet allerede er innfridd', () => {
    expect(suggestPassing(BLACK, WHITE, 4.5)).toBeNull()
  })

  it('foreslår en farge som faktisk består', () => {
    const suggestion = suggestPassing(parseColor('#999999')!, WHITE, 4.5)
    expect(suggestion).not.toBeNull()
    expect(passes(contrastRatio(suggestion!.color, WHITE), 4.5)).toBe(true)
  })

  it('går mørkere mot lys bakgrunn og lysere mot mørk', () => {
    expect(suggestPassing(parseColor('#999999')!, WHITE, 4.5)?.direction).toBe('darker')
    expect(suggestPassing(parseColor('#666666')!, BLACK, 4.5)?.direction).toBe('lighter')
  })

  it('beholder kuløren så fargen fortsatt kjennes igjen', () => {
    const original = parseColor('#a63c1f')!
    const suggestion = suggestPassing(original, parseColor('#8a5a10')!, 4.5)

    expect(suggestion).not.toBeNull()
    expect(rgbToHsl(suggestion!.color).h).toBeCloseTo(rgbToHsl(original).h, 0)
  })
})

describe('HSL-konvertering', () => {
  it.each(['#a63c1f', '#166054', '#484694', '#8a5a10', '#1a1612', '#faf7f2'])(
    'går tur-retur for %s',
    (hex) => {
      const original = parseColor(hex)!
      const roundTrip = hslToRgb(rgbToHsl(original))

      // Ett trinn slingringsmonn per kanal, siden det avrundes til heltall
      expect(Math.abs(roundTrip.r - original.r)).toBeLessThanOrEqual(1)
      expect(Math.abs(roundTrip.g - original.g)).toBeLessThanOrEqual(1)
      expect(Math.abs(roundTrip.b - original.b)).toBeLessThanOrEqual(1)
    },
  )

  it('setter metning til null for gråtoner', () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 }).s).toBe(0)
  })
})
