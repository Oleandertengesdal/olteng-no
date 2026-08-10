/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  KONTRASTSJEKK
 *
 *  Går gjennom hver kombinasjon av tekstfarge og flate i hver fargemodus,
 *  regner ut forholdet etter WCAG 2.2 og avslutter med feilkode hvis noe
 *  ligger under kravet. Kjøres av `npm run prebuild`, altså før hvert bygg.
 *
 *  To ting dette skriptet finnes for å hindre:
 *
 *  1. At små etiketter behandles som grafikk. 11 px monospace er vanlig tekst
 *     og krever 4,5:1. Unntaket på 3:1 gjelder fra 24 px. Denne feilen er
 *     usynlig for øyet og fant sted i designsystemet på olteng.no i månedsvis.
 *
 *  2. At avrunding pynter på et resultat. Forhold rundes *ned* før
 *     sammenligning, slik at 4,4499 aldri rapporteres som «4,5 — består».
 *
 *  Kjøres med `node scripts/check-contrast.ts`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { THEMES, SURFACE_TOKENS, INK_TOKENS, type Theme } from '../src/design/themes.ts'
import { contrastRatio, floorRatio, formatRatio, WCAG } from '../src/design/contrast.ts'

interface Check {
  theme: string
  pair: string
  ratio: number
  required: number
  ok: boolean
  /** Hvorfor akkurat dette kravet gjelder for akkurat dette paret. */
  why: string
}

const checksFor = (theme: Theme): Check[] => {
  const out: Check[] = []
  const t = theme.tokens

  for (const ink of INK_TOKENS) {
    for (const surface of SURFACE_TOKENS) {
      const ratio = contrastRatio(t[ink], t[surface])
      out.push({
        theme: theme.id,
        pair: `${ink} på ${surface}`,
        ratio,
        required: theme.minRatio,
        ok: floorRatio(ratio) >= theme.minRatio,
        why: 'vanlig tekst',
      })
    }
  }

  // Aksentfargen brukes som flate bak knapper. Da er --c-accent-ink teksten.
  const onAccent = contrastRatio(t['accent-ink'], t.accent)
  out.push({
    theme: theme.id,
    pair: 'accent-ink på accent',
    ratio: onAccent,
    required: theme.minRatio,
    ok: floorRatio(onAccent) >= theme.minRatio,
    why: 'tekst på knapp',
  })

  // Fokusmarkeringen tegnes i aksentfargen mot sidebakgrunnen. Den er en
  // grensesnittkomponent, ikke tekst, så kravet er 3:1 — men aksenten må
  // uansett klare tekstkravet over, så dette er i praksis et sikkerhetsnett
  // for det tilfellet at aksenten en dag bare brukes til strek og ikke tekst.
  const focus = contrastRatio(t.accent, t.paper)
  out.push({
    theme: theme.id,
    pair: 'accent på paper (fokusring)',
    ratio: focus,
    required: WCAG.uiAA,
    ok: floorRatio(focus) >= WCAG.uiAA,
    why: 'grensesnittkomponent',
  })

  return out
}

/* ── Rapport ─────────────────────────────────────────────────────────────── */

const pad = (text: string, width: number): string => text.padEnd(width, ' ')

const all = THEMES.flatMap(checksFor)
const failures = all.filter((c) => !c.ok)

const pairWidth = Math.max(...all.map((c) => c.pair.length))

for (const theme of THEMES) {
  const rows = all.filter((c) => c.theme === theme.id)
  const worst = rows.reduce((min, c) => Math.min(min, c.ratio), Infinity)

  console.log(
    `\n  ${theme.name.nb.toUpperCase()}  krav ${theme.minRatio.toFixed(1).replace('.', ',')}:1` +
      `  svakeste ${formatRatio(worst)}`,
  )
  console.log(`  ${'─'.repeat(pairWidth + 26)}`)

  for (const c of rows) {
    const mark = c.ok ? '  ' : '!!'
    const required = `krav ${c.required.toFixed(1).replace('.', ',')}`
    console.log(`  ${mark} ${pad(c.pair, pairWidth)}  ${pad(formatRatio(c.ratio), 8)}  ${required}`)
  }
}

console.log(`\n  ${all.length} kombinasjoner målt i ${THEMES.length} moduser.`)

if (failures.length > 0) {
  console.error(`\n  ${failures.length} under kravet:\n`)
  for (const c of failures) {
    console.error(
      `    ${c.theme}: ${c.pair} — ${formatRatio(c.ratio)}, ` +
        `krever ${c.required.toFixed(1).replace('.', ',')}:1 (${c.why})`,
    )
  }
  console.error('\n  Bygget stoppes. Juster tokenet i src/design/themes.ts.\n')
  process.exit(1)
}

console.log('  Alle består.\n')
