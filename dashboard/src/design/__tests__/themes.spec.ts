import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { THEMES, SURFACE_TOKENS, INK_TOKENS, OTHER_TOKENS, isThemeId } from '../themes.ts'
import { contrastRatio, floorRatio, formatRatio, relativeLuminance, WCAG } from '../contrast.ts'
import { renderThemesCss } from '../render-css.ts'

describe('kontrastmatematikk', () => {
  it('gir 21:1 for svart mot hvitt og 1:1 for en farge mot seg selv', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5)
    expect(contrastRatio([120, 40, 90], [120, 40, 90])).toBeCloseTo(1, 5)
  })

  it('er symmetrisk — rekkefølgen på argumentene betyr ingenting', () => {
    const a = [26, 22, 18] as const
    const b = [250, 247, 242] as const
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10)
  })

  it('vekter grønt tyngst og blått lettest, slik øyet gjør', () => {
    expect(relativeLuminance([0, 255, 0])).toBeGreaterThan(relativeLuminance([255, 0, 0]))
    expect(relativeLuminance([255, 0, 0])).toBeGreaterThan(relativeLuminance([0, 0, 255]))
  })

  it('runder ned, slik at et forhold aldri ser ut til å bestå en grense det ikke består', () => {
    expect(floorRatio(4.4499)).toBe(4.4)
    expect(floorRatio(4.4999)).toBe(4.4)
    expect(formatRatio(4.4999)).toBe('4,4:1')
  })
})

describe('fargemodusene', () => {
  it('har fem moduser med unike navn', () => {
    expect(THEMES).toHaveLength(5)
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(5)
  })

  it('har alle tokens definert i alle moduser', () => {
    const expected = [...SURFACE_TOKENS, ...INK_TOKENS, ...OTHER_TOKENS].sort()
    for (const theme of THEMES) {
      expect(Object.keys(theme.tokens).sort(), theme.id).toEqual(expected)
    }
  })

  it('holder alle kanaler innenfor 0–255', () => {
    for (const theme of THEMES) {
      for (const [name, rgb] of Object.entries(theme.tokens)) {
        for (const channel of rgb) {
          expect(Number.isInteger(channel), `${theme.id}/${name}`).toBe(true)
          expect(channel, `${theme.id}/${name}`).toBeGreaterThanOrEqual(0)
          expect(channel, `${theme.id}/${name}`).toBeLessThanOrEqual(255)
        }
      }
    }
  })

  /**
   * Samme sjekk som scripts/check-contrast.ts gjør i byggesteget. Den ligger
   * også her fordi en test som feiler i redigeringsprogrammet oppdages med én
   * gang, mens et bygg som feiler oppdages når man er ferdig og vil publisere.
   */
  it('holder all tekst over kravet mot alle flater', () => {
    for (const theme of THEMES) {
      for (const ink of INK_TOKENS) {
        for (const surface of SURFACE_TOKENS) {
          const ratio = contrastRatio(theme.tokens[ink], theme.tokens[surface])
          expect(floorRatio(ratio), `${theme.id}: ${ink} på ${surface}`).toBeGreaterThanOrEqual(
            theme.minRatio,
          )
        }
      }
    }
  })

  it('holder teksten på knapper over kravet', () => {
    for (const theme of THEMES) {
      const ratio = contrastRatio(theme.tokens['accent-ink'], theme.tokens.accent)
      expect(floorRatio(ratio), theme.id).toBeGreaterThanOrEqual(theme.minRatio)
    }
  })

  it('holder fokusringen synlig mot sidebakgrunnen', () => {
    for (const theme of THEMES) {
      const ratio = contrastRatio(theme.tokens.accent, theme.tokens.paper)
      expect(floorRatio(ratio), theme.id).toBeGreaterThanOrEqual(WCAG.uiAA)
    }
  })

  it('bruker ikke ren svart i mørke moduser', () => {
    // Ren svart slår av pikselen på OLED, og overgangen til tent piksel gir
    // etterbilder når man ruller.
    for (const theme of THEMES.filter((t) => t.scheme === 'dark')) {
      expect(relativeLuminance(theme.tokens.paper), theme.id).toBeGreaterThan(0)
    }
  })

  it('kjenner igjen gyldige modus-id-er', () => {
    expect(isThemeId('papir')).toBe(true)
    expect(isThemeId('regnbue')).toBe(false)
    expect(isThemeId(null)).toBe(false)
  })
})

describe('themes.css', () => {
  it('er oppdatert mot themes.ts', () => {
    // Den genererte filen sjekkes inn slik at `vite dev` virker uten forarbeid.
    // Da må noe passe på at den ikke blir liggende igjen utdatert.
    const path = fileURLToPath(new URL('../themes.css', import.meta.url))
    expect(readFileSync(path, 'utf8')).toBe(renderThemesCss())
  })
})
