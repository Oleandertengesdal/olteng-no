/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LÅNEKASSEN — hvor mye av lånet blir stipend
 *
 *  ALLE SATSER STÅR SAMLET I `RATES` NEDENFOR, med årstall og kilde. De endres
 *  hvert eneste studieår, så det er den ene blokken du oppdaterer — resten av
 *  koden trenger ikke røres. Står det feil tall der, er hele kalkulatoren feil,
 *  og derfor er det bevisst umulig å endre en sats uten å se hvilket år den
 *  gjelder for.
 *
 *  Reglene den bygger på, gjeldende fra studieåret 2025–2026:
 *
 *    · Basislånet utbetales over elleve måneder, august til juni.
 *    · Inntil 40 % kan gjøres om til stipend, delt i to:
 *        15 % for beståtte studiepoeng, forholdsmessig etter hvor mange
 *        25 % når du fullfører en grad
 *    · Bor du hos foreldrene, får du ikke omgjøring i det hele tatt.
 *    · Tjener du over fribeløpet, reduseres stipendet — lånet består.
 *
 *  Dette er et anslag, ikke et vedtak. Lånekassen har flere ordninger enn dette
 *  (forsørgerstipend, sykestipend, tilleggslån, utenlandsstudier), og formue
 *  teller også med. Sjekk alltid mot lanekassen.no før du planlegger etter tallet.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface RateSet {
  /** Studieåret satsene gjelder for */
  year: string
  /** Basislån for hele studieåret, i kroner */
  basicLoanPerYear: number
  /** Antall måneder støtten utbetales over */
  months: number
  /** Andel som gjøres om for beståtte studiepoeng */
  creditShare: number
  /** Andel som gjøres om når en grad fullføres */
  degreeShare: number
  /** Studiepoeng et fullt studieår normalt gir */
  fullYearCredits: number
  /** Inntektsgrense før stipendet reduseres */
  incomeLimit: number
  /** Andel av inntekt over grensa som trekkes fra stipendet */
  incomeReduction: number
  source: string
}

/**
 * Satsene. Legg til et nytt år øverst når Lånekassen justerer, og la de gamle
 * stå — da kan man fortsatt regne på et tidligere studieår.
 */
export const RATES: RateSet[] = [
  {
    year: '2025–2026',
    basicLoanPerYear: 166_859,
    months: 11,
    creditShare: 0.15,
    degreeShare: 0.25,
    fullYearCredits: 60,
    incomeLimit: 224_709,
    incomeReduction: 0.05,
    source:
      'https://lanekassen.no/nb-NO/laresteder/nyheter/endringer-i-lanekassens-regler-2025-2026/',
  },
]

export const defaultRates = (): RateSet => RATES[0]!

/* ── Inndata ───────────────────────────────────────────────────────────────── */

export interface LoanInput {
  rates: RateSet
  /** Bor du hos foreldrene? Da faller omgjøringen bort. */
  livesAtHome: boolean
  /** Studiepoeng bestått i løpet av året */
  creditsPassed: number
  /** Fullførte du en grad dette året? */
  completedDegree: boolean
  /** Brutto personinntekt i kalenderåret */
  income: number
}

export interface LoanResult {
  /** Utbetalt basislån for året */
  paidOut: number
  /** Utbetaling per måned */
  perMonth: number
  /** Omgjøring for beståtte studiepoeng */
  creditGrant: number
  /** Omgjøring for fullført grad */
  degreeGrant: number
  /** Trekk fordi inntekten er over fribeløpet */
  incomeCut: number
  /** Stipend etter trekk */
  grant: number
  /** Det som blir stående som gjeld */
  remainingLoan: number
  /** Hvor stor andel av basislånet som ble stipend */
  grantShare: number
  /** Andel av et fullt studieår du besto */
  creditProgress: number
}

/**
 * Omgjøringen for studiepoeng er forholdsmessig: består du 45 av 60 poeng, får
 * du tre firedeler av de 15 prosentene. Gradsomgjøringen er derimot alt eller
 * ingenting — den utløses når graden er fullført.
 */
export const calculate = (input: LoanInput): LoanResult => {
  const { rates } = input

  const paidOut = rates.basicLoanPerYear
  const perMonth = paidOut / rates.months

  const creditProgress = Math.min(
    1,
    Math.max(0, input.creditsPassed) / Math.max(1, rates.fullYearCredits),
  )

  // Bor du hjemme hos foreldrene, faller hele omgjøringen bort
  const eligible = !input.livesAtHome

  const creditGrant = eligible ? paidOut * rates.creditShare * creditProgress : 0
  const degreeGrant = eligible && input.completedDegree ? paidOut * rates.degreeShare : 0

  const grossGrant = creditGrant + degreeGrant

  // Over fribeløpet reduseres stipendet, ikke lånet. Trekket kan aldri bli
  // større enn stipendet — man skylder ikke Lånekassen penger for å ha jobbet.
  const excess = Math.max(0, input.income - rates.incomeLimit)
  const incomeCut = Math.min(grossGrant, excess * rates.incomeReduction)

  const grant = Math.max(0, grossGrant - incomeCut)

  return {
    paidOut,
    perMonth,
    creditGrant,
    degreeGrant,
    incomeCut,
    grant,
    remainingLoan: paidOut - grant,
    grantShare: paidOut > 0 ? grant / paidOut : 0,
    creditProgress,
  }
}

/** Inntekten der hele stipendet er spist opp av trekket */
export const incomeWhereGrantIsGone = (input: LoanInput): number | null => {
  const withoutIncome = calculate({ ...input, income: 0 })
  if (withoutIncome.grant <= 0) return null
  return input.rates.incomeLimit + withoutIncome.grant / input.rates.incomeReduction
}

/**
 * Hva skiller det å bo hjemme fra å bo borte? Dette er tallet folk faktisk er
 * ute etter, og det er verdt å vise for seg.
 */
export const homeVersusAway = (input: LoanInput): number => {
  const away = calculate({ ...input, livesAtHome: false })
  const home = calculate({ ...input, livesAtHome: true })
  return away.grant - home.grant
}

/* ── Formatering ───────────────────────────────────────────────────────────── */

export const formatKr = (value: number): string =>
  new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(Math.round(value))

export const formatPercent = (value: number): string =>
  new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(value * 100)
