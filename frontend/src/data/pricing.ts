/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HVA DU FAKTISK BETALER FOR STRØMMEN
 *
 *  Spotprisen er bare én av seks komponenter på strømregningen, og som regel
 *  under halvparten av beløpet. Et verktøy som bare viser spotpris svarer ikke
 *  på spørsmålet folk stiller — «hva koster strømmen» betyr «hva står det på
 *  regningen».
 *
 *  Regnestykket, per kilowattime:
 *
 *      spotpris
 *    − strømstøtte        90 % av det som overstiger terskelen, time for time
 *    + påslag             strømleverandørens fortjeneste
 *    + elavgift           statlig forbruksavgift
 *    + nettleie           energileddet hos nettselskapet
 *    ─────────────────
 *    = grunnlag
 *    + mva                25 %, men ikke i Nord-Norge
 *
 *  ALT REGNES I ØRE. Kroner finnes bare i månedstotalene nederst. Å blande
 *  kroner og øre i samme kodebase gir feil på en faktor hundre, og de er
 *  vanskelige å oppdage fordi tallet ofte ser plausibelt ut uansett.
 *
 *  ALLE SATSER STÅR I `TARIFFS` MED ÅRSTALL OG KILDE. De endres ved hvert
 *  statsbudsjett. Er de utdaterte, er hele verktøyet feil.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ZoneId } from './power'

export interface Tariffs {
  /** Året satsene gjelder for */
  year: string

  /**
   * Strømstøtte: staten dekker en andel av spotprisen som overstiger terskelen.
   * Terskelen er uten mva, og beregningen gjøres time for time — ikke på
   * månedssnittet, som var ordningen fram til september 2023.
   */
  supportThresholdOre: number
  supportShare: number
  /** Tak per måned per målepunkt */
  supportCapKwhPerMonth: number

  /**
   * Norgespris: fastpris man kan velge i stedet for spot pluss strømstøtte.
   * De to ordningene er alternativer — man får ikke begge.
   */
  norgesprisOre: number
  norgesprisCapKwhPerMonth: number
  /** Tak for fritidsbolig */
  norgesprisCabinCapKwhPerMonth: number

  /** Forbruksavgift på elektrisk kraft, alminnelig sats */
  electricityTaxOre: number

  vatRate: number

  sources: string[]
}

export const TARIFFS: Tariffs[] = [
  {
    year: '2026',
    supportThresholdOre: 77,
    supportShare: 0.9,
    supportCapKwhPerMonth: 5000,
    norgesprisOre: 40,
    norgesprisCapKwhPerMonth: 5000,
    norgesprisCabinCapKwhPerMonth: 1000,
    electricityTaxOre: 7.13,
    vatRate: 0.25,
    sources: [
      'https://www.regjeringen.no/no/tema/energi/strom/sporsmal-og-svar-om-norgespris/id3089310/',
      'https://www.nve.no/reguleringsmyndigheten/kunde/stroem/dette-er-norgespris/',
      'https://www.hvakosterstrommen.no/artikler/slik-fungerer-stromstotten',
    ],
  },
]

export const currentTariffs = (): Tariffs => TARIFFS[0]!

/* ── Brukerens egne satser ─────────────────────────────────────────────────
   Påslag og nettleie varierer fra leverandør til leverandør og fra nettområde
   til nettområde, så de kan ikke slås opp — de må oppgis. Standardverdiene er
   grove typetall, og det står i grensesnittet at de skal sjekkes mot egen
   faktura.                                                                  */

export interface UserTariff {
  /** Strømleverandørens påslag, øre/kWh uten mva */
  markupOre: number
  /** Nettleiens energiledd, øre/kWh uten mva */
  gridOre: number
  /**
   * Nord-Troms og Finnmark har fritak for elavgift. Det er et mindre område
   * enn mva-fritaket, som gjelder hele Nord-Norge, så de kan ikke utledes av
   * hverandre.
   */
  electricityTaxExempt: boolean
}

export const DEFAULT_USER_TARIFF: UserTariff = {
  markupOre: 5,
  gridOre: 30,
  electricityTaxExempt: false,
}

/* ── Ordninger ─────────────────────────────────────────────────────────────── */

export type Scheme = 'spot' | 'norgespris'

/* ── Strømstøtte ───────────────────────────────────────────────────────────── */

/**
 * Støtte for én time, i øre uten mva.
 *
 * Terskelen sammenlignes mot spotprisen uten mva. Med 25 % mva betyr terskelen
 * på 77 øre at prisen må over 96,25 øre inkludert mva før staten bidrar med
 * noe som helst.
 */
export const supportFor = (spotOreExVat: number, tariffs: Tariffs): number =>
  Math.max(0, spotOreExVat - tariffs.supportThresholdOre) * tariffs.supportShare

/** Terskelen uttrykt inkludert mva — tallet folk ser på regninga */
export const thresholdInclVat = (tariffs: Tariffs): number =>
  tariffs.supportThresholdOre * (1 + tariffs.vatRate)

/* ── Full oppdeling ────────────────────────────────────────────────────────── */

export interface Breakdown {
  /** Ren spotpris uten mva */
  spot: number
  /** Strømstøtte, uten mva. Positivt tall som trekkes fra. */
  support: number
  /** Kraftprisen etter støtte, eller Norgesprisen */
  energy: number
  markup: number
  electricityTax: number
  grid: number
  /** Summen før mva */
  subtotal: number
  vat: number
  /** Det du faktisk betaler, øre/kWh */
  total: number
}

export interface BreakdownInput {
  spotOreExVat: number
  zone: ZoneId
  scheme: Scheme
  tariffs: Tariffs
  user: UserTariff
  /** Mva-fritaket i Nord-Norge. Utledes av sonen, men kan overstyres. */
  vatExempt: boolean
}

export const breakdown = (input: BreakdownInput): Breakdown => {
  const { tariffs, user } = input

  const spot = input.spotOreExVat

  // Norgespris og strømstøtte er alternativer, aldri begge
  const support = input.scheme === 'spot' ? supportFor(spot, tariffs) : 0

  // På Norgespris betaler du fastprisen for kraften. Påslaget forsvinner med,
  // fordi Norgesprisen er totalprisen for selve strømmen.
  const energy = input.scheme === 'norgespris' ? tariffs.norgesprisOre : spot - support
  const markup = input.scheme === 'norgespris' ? 0 : user.markupOre

  const electricityTax = user.electricityTaxExempt ? 0 : tariffs.electricityTaxOre
  const grid = user.gridOre

  const subtotal = energy + markup + electricityTax + grid
  const vat = input.vatExempt ? 0 : subtotal * tariffs.vatRate

  return {
    spot,
    support,
    energy,
    markup,
    electricityTax,
    grid,
    subtotal,
    vat,
    total: subtotal + vat,
  }
}

/** Delene som skal tegnes i stolpen, i den rekkefølgen de stables */
export const breakdownParts = (
  result: Breakdown,
): { key: string; value: number; tone: 'energy' | 'markup' | 'tax' | 'grid' | 'vat' }[] =>
  [
    { key: 'energy', value: result.energy, tone: 'energy' as const },
    { key: 'markup', value: result.markup, tone: 'markup' as const },
    { key: 'electricityTax', value: result.electricityTax, tone: 'tax' as const },
    { key: 'grid', value: result.grid, tone: 'grid' as const },
    { key: 'vat', value: result.vat, tone: 'vat' as const },
  ].filter((part) => part.value > 0.001)

/* ── Sammenligning av ordningene ───────────────────────────────────────────── */

export interface SchemeComparison {
  spotTotal: number
  norgesprisTotal: number
  /** Positivt tall betyr at Norgespris er billigere */
  savingWithNorgespris: number
  cheaper: Scheme
}

export const compareSchemes = (input: Omit<BreakdownInput, 'scheme'>): SchemeComparison => {
  const spotTotal = breakdown({ ...input, scheme: 'spot' }).total
  const norgesprisTotal = breakdown({ ...input, scheme: 'norgespris' }).total

  return {
    spotTotal,
    norgesprisTotal,
    savingWithNorgespris: spotTotal - norgesprisTotal,
    cheaper: norgesprisTotal < spotTotal ? 'norgespris' : 'spot',
  }
}

/**
 * Spotprisen der de to ordningene koster akkurat det samme.
 *
 * Under dette nivået lønner spot seg, over lønner Norgespris seg. Dette er det
 * ene tallet som faktisk avgjør valget, og det er verdt å vise for seg.
 *
 * Løser for spot: spot − støtte(spot) + påslag = norgespris
 * Nettleie, elavgift og mva er like i begge ordninger og forsvinner.
 */
export const breakEvenSpot = (tariffs: Tariffs, user: UserTariff): number => {
  const target = tariffs.norgesprisOre
  const threshold = tariffs.supportThresholdOre

  // Under terskelen finnes ingen støtte: spot + påslag = norgespris
  const withoutSupport = target - user.markupOre
  if (withoutSupport <= threshold) return withoutSupport

  // Over terskelen: spot − (spot − terskel) × andel + påslag = norgespris
  //             ⇒  spot × (1 − andel) = norgespris − påslag − terskel × andel
  const share = tariffs.supportShare
  return (target - user.markupOre - threshold * share) / (1 - share)
}

/* ── Døgn og måned ─────────────────────────────────────────────────────────── */

export interface DayTotals {
  /** Snittpris per kWh over døgnet, øre inkludert alt */
  averageTotal: number
  /** Snittlig spotpris uten mva */
  averageSpot: number
  /** Samlet støtte per kWh i snitt */
  averageSupport: number
  /** Timer der støtten slo inn */
  hoursWithSupport: number
  cheapestTotal: number
  priciestTotal: number
}

export const dayTotals = (
  spotPrices: number[],
  input: Omit<BreakdownInput, 'spotOreExVat'>,
): DayTotals => {
  if (spotPrices.length === 0) {
    return {
      averageTotal: 0,
      averageSpot: 0,
      averageSupport: 0,
      hoursWithSupport: 0,
      cheapestTotal: 0,
      priciestTotal: 0,
    }
  }

  const results = spotPrices.map((spot) => breakdown({ ...input, spotOreExVat: spot }))
  const totals = results.map((result) => result.total)

  return {
    averageTotal: totals.reduce((sum, value) => sum + value, 0) / totals.length,
    averageSpot: spotPrices.reduce((sum, value) => sum + value, 0) / spotPrices.length,
    averageSupport: results.reduce((sum, result) => sum + result.support, 0) / results.length,
    hoursWithSupport: results.filter((result) => result.support > 0).length,
    cheapestTotal: Math.min(...totals),
    priciestTotal: Math.max(...totals),
  }
}

export interface MonthlyEstimate {
  /** Forbruk innenfor taket */
  supportedKwh: number
  /** Forbruk over taket, som betales til full pris uten støtte */
  unsupportedKwh: number
  /** Kroner */
  total: number
  /** Kroner spart av strømstøtten, eller av Norgesprisen */
  saved: number
}

/**
 * Månedsregning basert på døgnets snittpris.
 *
 * Begge ordningene har tak på 5 000 kWh per måned per målepunkt. Forbruk over
 * taket betales til full pris uten støtte — det er en detalj som overrasker
 * folk med varmekabler og elbil.
 */
export const monthlyEstimate = (
  monthlyKwh: number,
  spotPrices: number[],
  input: Omit<BreakdownInput, 'spotOreExVat'>,
): MonthlyEstimate => {
  const cap =
    input.scheme === 'norgespris'
      ? input.tariffs.norgesprisCapKwhPerMonth
      : input.tariffs.supportCapKwhPerMonth

  const supportedKwh = Math.min(monthlyKwh, cap)
  const unsupportedKwh = Math.max(0, monthlyKwh - cap)

  const supported = dayTotals(spotPrices, input).averageTotal

  // Over taket faller ordningen bort, og du betaler ren spot med påslag
  const unsupported = dayTotals(spotPrices, {
    ...input,
    scheme: 'spot',
    tariffs: { ...input.tariffs, supportThresholdOre: Number.POSITIVE_INFINITY },
  }).averageTotal

  const totalOre = supportedKwh * supported + unsupportedKwh * unsupported

  // Hva regningen ville vært helt uten ordninger
  const bare = dayTotals(spotPrices, {
    ...input,
    scheme: 'spot',
    tariffs: { ...input.tariffs, supportThresholdOre: Number.POSITIVE_INFINITY },
  }).averageTotal

  return {
    supportedKwh,
    unsupportedKwh,
    total: totalOre / 100,
    saved: (monthlyKwh * bare - totalOre) / 100,
  }
}
