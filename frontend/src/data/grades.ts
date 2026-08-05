/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  KARAKTERSNITT — vektet etter studiepoeng
 *
 *  Norske universiteter bruker A til F, der A er best. Snittet skal vektes
 *  etter studiepoeng: et emne på 15 sp teller dobbelt så mye som ett på 7,5.
 *  Å ta et rent gjennomsnitt av bokstavene er den vanligste feilen, og den
 *  slår ut i din disfavør så snart de tunge emnene gikk bra.
 *
 *  Emner med bestått/ikke bestått holdes utenfor snittet, men studiepoengene
 *  teller. Det er slik lærestedene selv regner.
 *
 *  Om NTNU-import: NTNU har ikke noe dokumentert offentlig API for emner, så
 *  i stedet tolker `parseCourses` det man får når man limer inn fra Studentweb
 *  eller et regneark. Det er mer robust — en udokumentert intern URL kan
 *  forsvinne når som helst, mens utklippstavla alltid virker.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'pass' | 'fail'

/** Tallverdien som brukes i snittet. Bestått/ikke bestått har ingen. */
export const GRADE_POINTS: Record<string, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
}

export const LETTER_GRADES: Grade[] = ['A', 'B', 'C', 'D', 'E', 'F']

export const isLetterGrade = (grade: Grade): boolean => grade in GRADE_POINTS

/** Teller emnet i snittet? Bestått/ikke bestått gjør ikke det. */
export const countsTowardsAverage = (course: Course, includeFailed: boolean): boolean => {
  if (!isLetterGrade(course.grade)) return false
  if (course.grade === 'F' && !includeFailed) return false
  return true
}

export interface Course {
  id: string
  code: string
  name: string
  /** Studiepoeng */
  credits: number
  grade: Grade
  /** Valgfritt, f.eks. «H24» */
  term?: string
}

/* ── Snittet ───────────────────────────────────────────────────────────────── */

export interface Summary {
  /** Vektet snitt på skalaen 0–5, eller null når ingenting teller */
  average: number | null
  /** Nærmeste bokstav til snittet */
  letter: string | null
  /** Studiepoeng som teller i snittet */
  weightedCredits: number
  /** Studiepoeng bestått totalt, inkludert bestått/ikke bestått */
  passedCredits: number
  /** Antall emner som teller */
  counted: number
}

export const summarise = (courses: Course[], includeFailed = false): Summary => {
  let weighted = 0
  let credits = 0
  let passed = 0
  let counted = 0

  for (const course of courses) {
    if (course.credits <= 0) continue

    // Alt som ikke er strøket gir studiepoeng
    if (course.grade !== 'F' && course.grade !== 'fail') passed += course.credits

    if (!countsTowardsAverage(course, includeFailed)) continue

    weighted += GRADE_POINTS[course.grade]! * course.credits
    credits += course.credits
    counted += 1
  }

  const average = credits > 0 ? weighted / credits : null

  return {
    average,
    letter: average === null ? null : letterFor(average),
    weightedCredits: credits,
    passedCredits: passed,
    counted,
  }
}

/**
 * Nærmeste bokstav til et snitt.
 *
 * Avrunder til nærmeste hele trinn: 4,49 blir B, 4,50 blir A. Dette er en
 * forenkling — lærestedene har ingen offisiell omregning fra snitt til bokstav,
 * og en søknadsportal kan regne annerledes.
 */
export const letterFor = (average: number): string => {
  const rounded = Math.round(average)
  const entry = Object.entries(GRADE_POINTS).find(([, points]) => points === rounded)
  return entry ? entry[0] : 'F'
}

/** Hvor mange studiepoeng som ligger bak hver bokstav */
export const distribution = (courses: Course[]): { grade: string; credits: number }[] =>
  LETTER_GRADES.filter((grade) => grade !== 'fail').map((grade) => ({
    grade,
    credits: courses
      .filter((course) => course.grade === grade)
      .reduce((total, course) => total + course.credits, 0),
  }))

/* ── Hva må jeg ha på resten? ──────────────────────────────────────────────── */

export interface TargetResult {
  /** Snittet som kreves på de gjenstående studiepoengene */
  requiredAverage: number
  /** Nærmeste bokstav */
  requiredLetter: string
  /** Er det i det hele tatt mulig? A på alt er taket. */
  achievable: boolean
  /** Er målet allerede nådd uansett hva som kommer? */
  alreadyReached: boolean
}

/**
 * Snittet du må ha på de neste `remainingCredits` studiepoengene for å ende på
 * `target` totalt.
 *
 * Løser (oppnådd + x × gjenstående) / (bak deg + gjenstående) = mål for x.
 */
export const requiredForTarget = (
  summary: Summary,
  remainingCredits: number,
  target: number,
): TargetResult | null => {
  if (remainingCredits <= 0) return null

  const earned = (summary.average ?? 0) * summary.weightedCredits
  const totalCredits = summary.weightedCredits + remainingCredits
  const required = (target * totalCredits - earned) / remainingCredits

  return {
    requiredAverage: required,
    requiredLetter: letterFor(Math.min(5, Math.max(0, required))),
    achievable: required <= 5,
    alreadyReached: required <= 0,
  }
}

/* ── Lim inn emner ─────────────────────────────────────────────────────────────
   Folk limer inn fra Studentweb, fra et regneark, eller skriver det for hånd.
   Parseren tar derfor imot tabulator, semikolon, komma og ren fritekst, og
   plukker ut felt etter form framfor etter posisjon: en emnekode ser ut som
   bokstaver etterfulgt av tall, studiepoeng er et lite desimaltall, og
   karakteren er én bokstav eller ordet «bestått».                            */

const CODE_PATTERN = /^[A-ZÆØÅ]{2,10}[- ]?\d{3,5}$/i
const CREDIT_PATTERN = /^\d{1,3}([.,]\d)?$/

const PASS_WORDS = ['bestått', 'bestatt', 'pass', 'passed', 'godkjent']
const FAIL_WORDS = ['ikke bestått', 'ikke bestatt', 'fail', 'failed', 'ikke godkjent']

const normaliseGrade = (token: string): Grade | null => {
  const value = token.trim().toLowerCase()
  if (FAIL_WORDS.includes(value)) return 'fail'
  if (PASS_WORDS.includes(value)) return 'pass'

  const upper = token.trim().toUpperCase()
  return LETTER_GRADES.includes(upper as Grade) ? (upper as Grade) : null
}

const parseCredits = (token: string): number | null => {
  const value = Number(token.trim().replace(',', '.'))
  // Over 60 sp på ett emne finnes praktisk talt ikke, og fanger opp årstall
  return Number.isFinite(value) && value > 0 && value <= 60 ? value : null
}

export interface ParseResult {
  courses: Course[]
  /** Linjer som ikke lot seg tolke, slik at brukeren kan se hva som ble hoppet over */
  skipped: string[]
}

let sequence = 0
const nextId = () => `course-${Date.now()}-${sequence++}`

export const parseCourses = (input: string): ParseResult => {
  const courses: Course[] = []
  const skipped: string[] = []

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '') continue

    // Del først på tabulator eller semikolon, som er det regneark gir. Finnes
    // ingen av delene, faller vi tilbake til mellomrom.
    const columns = /[\t;]/.test(line)
      ? line.split(/[\t;]/).map((part) => part.trim())
      : line.split(/\s{2,}|\s/).map((part) => part.trim())

    const tokens = columns.filter(Boolean)
    if (tokens.length < 2) {
      skipped.push(line)
      continue
    }

    // Finn felt etter form, ikke etter posisjon — kolonnerekkefølgen varierer
    const codeIndex = tokens.findIndex((token) => CODE_PATTERN.test(token))
    const gradeIndex = tokens.findIndex((token, i) => i !== codeIndex && normaliseGrade(token))
    const creditIndex = tokens.findIndex(
      (token, i) => i !== codeIndex && i !== gradeIndex && CREDIT_PATTERN.test(token),
    )

    const grade = gradeIndex >= 0 ? normaliseGrade(tokens[gradeIndex]!) : null
    const credits = creditIndex >= 0 ? parseCredits(tokens[creditIndex]!) : null

    if (!grade || credits === null) {
      skipped.push(line)
      continue
    }

    const name = tokens
      .filter((_, i) => i !== codeIndex && i !== gradeIndex && i !== creditIndex)
      .join(' ')
      .trim()

    courses.push({
      id: nextId(),
      code: codeIndex >= 0 ? tokens[codeIndex]!.toUpperCase() : '',
      name,
      credits,
      grade,
    })
  }

  return { courses, skipped }
}

export const emptyCourse = (): Course => ({
  id: nextId(),
  code: '',
  name: '',
  credits: 7.5,
  grade: 'C',
})

export const formatAverage = (value: number): string =>
  new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value,
  )

export const formatCredits = (value: number): string =>
  new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(value)
