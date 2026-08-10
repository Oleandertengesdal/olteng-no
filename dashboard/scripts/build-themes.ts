/**
 * Skriver src/design/themes.css fra src/design/themes.ts.
 *
 * Hvorfor kodegenerering framfor å skrive CSS-en for hånd: fargene må finnes
 * som data for at kontrastskriptet skal kunne måle dem, og de må finnes som
 * CSS for at nettleseren skal kunne bruke dem. To håndskrevne kopier ville
 * drifte fra hverandre i løpet av en uke, og drift her betyr at bygget måler
 * andre farger enn de brukeren faktisk ser.
 *
 * Den genererte filen sjekkes inn, slik at `vite dev` virker uten forarbeid.
 * En test i src/design/__tests__/themes.spec.ts feiler hvis den er utdatert.
 *
 * Kjøres med `node scripts/build-themes.ts`. Node stripper typene selv, så
 * dette koster ingen avhengighet.
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderThemesCss } from '../src/design/render-css.ts'
import { THEMES } from '../src/design/themes.ts'

const OUT = fileURLToPath(new URL('../src/design/themes.css', import.meta.url))

const css = renderThemesCss()
const unchanged = existsSync(OUT) && readFileSync(OUT, 'utf8') === css

if (!unchanged) writeFileSync(OUT, css, 'utf8')

const tokenCount = Object.keys(THEMES[0]!.tokens).length
console.log(
  `themes.css: ${THEMES.length} moduser, ${tokenCount} tokens ${unchanged ? '(uendret)' : '(skrevet)'}`,
)
