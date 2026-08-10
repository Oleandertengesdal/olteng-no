/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  KONTRAST — WCAG 2.2
 *
 *  Tre linjer matematikk hentet fra spesifikasjonen, ikke fra en pakke. Grunnen
 *  til at de ligger her og ikke i en avhengighet er at de brukes i byggesteget:
 *  scripts/check-contrast.ts går gjennom hver kombinasjon av tekstfarge og
 *  flate i hver fargemodus og stopper bygget hvis noe ligger under kravet.
 *
 *  Merk terskelen. 4,5:1 gjelder all vanlig tekst, og 11 px monospace-etiketter
 *  er vanlig tekst. Unntaket på 3:1 gjelder tekst som er minst 24 px, eller 19 px
 *  i halvfet — altså overskrifter, ikke bunntekst. Den forvekslingen er den
 *  vanligste kontrastfeilen som finnes, og den er usynlig for øyet.
 *
 *  Rene funksjoner uten DOM, nettopp for at de skal kunne testes og kjøres i
 *  Node uten nettleser.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** En farge som tre kanaler, 0–255. Samme form som CSS-variablene lagres i. */
export type Rgb = readonly [r: number, g: number, b: number]

/** Krav etter WCAG 2.2 sitt suksesskriterium 1.4.3 / 1.4.6. */
export const WCAG = {
  /** Vanlig tekst, AA. Alt under 24 px regnes som vanlig tekst. */
  textAA: 4.5,
  /** Stor tekst (>= 24 px, eller >= 19 px halvfet), AA. */
  largeTextAA: 3,
  /** Grensesnittkomponenter og grafikk, AA. */
  uiAA: 3,
  /** Vanlig tekst, AAA. */
  textAAA: 7,
} as const

/**
 * Lineariserer én kanal. Skjøten ved 0,03928 er der sRGB-kurven går fra et
 * lineært segment til en potensfunksjon; den finnes for å unngå uendelig
 * stigningstall nær svart.
 */
const linearize = (channel: number): number => {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/**
 * Relativ luminans. Vektene er ikke tilfeldige — de speiler at øyet har flest
 * tapper for grønt og færrest for blått. Grønn teller derfor nesten ti ganger
 * mer enn blå, som er grunnen til at gul tekst på hvitt aldri fungerer og
 * blå tekst på svart er verre enn den ser ut.
 */
export const relativeLuminance = ([r, g, b]: Rgb): number =>
  0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)

/**
 * Kontrastforhold mellom to farger, mellom 1 og 21.
 * 0,05 er «flare»-leddet i spesifikasjonen: en antakelse om at det alltid
 * finnes litt omgivelseslys som reflekteres i skjermen, slik at ren svart
 * aldri er helt svart i praksis.
 */
export const contrastRatio = (a: Rgb, b: Rgb): number => {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const light = Math.max(la, lb)
  const dark = Math.min(la, lb)
  return (light + 0.05) / (dark + 0.05)
}

/**
 * Avrunder *nedover* til én desimal.
 *
 * Med vanlig avrunding blir 4,4499 til «4,5» og et forhold som ikke består
 * ser ut til å bestå. Å runde ned er den eneste retningen som ikke kan lyve.
 */
export const floorRatio = (ratio: number): number => Math.floor(ratio * 10) / 10

/** Formaterer et forhold som «4,5:1» — norsk desimaltegn. */
export const formatRatio = (ratio: number): string =>
  `${floorRatio(ratio).toFixed(1).replace('.', ',')}:1`

/** «26 22 18» — måten fargene skrives i CSS-variablene. */
export const toCssTriplet = ([r, g, b]: Rgb): string => `${r} ${g} ${b}`

/** «#1a1612» — til fargevelgere og verktøy. */
export const toHex = ([r, g, b]: Rgb): string =>
  `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
