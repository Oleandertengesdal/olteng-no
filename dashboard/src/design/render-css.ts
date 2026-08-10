/**
 * Gjør fargemodusene om til CSS.
 *
 * Ren funksjon uten filsystem, slik at både byggeskriptet og testen som passer
 * på at den genererte filen er oppdatert kan kalle den uten bivirkninger.
 */

import { THEMES, DEFAULT_THEME, type Theme } from './themes.ts'
import { toCssTriplet } from './contrast.ts'

const block = (selector: string, theme: Theme): string =>
  [
    `${selector} {`,
    `  color-scheme: ${theme.scheme};`,
    ...Object.entries(theme.tokens).map(([name, rgb]) => `  --c-${name}: ${toCssTriplet(rgb)};`),
    '}',
  ].join('\n')

export const renderThemesCss = (): string => {
  const parts: string[] = [
    '/* GENERERT AV scripts/build-themes.ts — IKKE REDIGER.',
    ' * Kilden er src/design/themes.ts. Kjør `npm run themes` etter endring. */',
    '',
  ]

  for (const theme of THEMES) {
    // Standardmodusen får også :root, slik at siden har farger før JavaScript
    // har rukket å sette data-theme. Uten det blinker siden ustilt.
    const selector =
      theme.id === DEFAULT_THEME
        ? `:root,\n[data-theme='${theme.id}']`
        : `[data-theme='${theme.id}']`
    parts.push(block(selector, theme), '')
  }

  return parts.join('\n')
}
