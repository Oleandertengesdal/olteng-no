/**
 * Lenkekatalogen.
 *
 * Én datafil per lærested, slik at et nytt lærested er én fil og én linje her —
 * ingen kodeendring. Det er hele grunnen til at katalogen kan vokse til fjorten
 * læresteder uten at noe annet må røres.
 */

import type { Institution, LinkEntry } from './types.ts'
import ntnu from './ntnu.ts'
import uio from './uio.ts'
import oslomet from './oslomet.ts'
import uib from './uib.ts'
import uit from './uit.ts'
import { NATIONAL_LINKS } from './national.ts'

export const INSTITUTIONS: readonly Institution[] = [ntnu, uio, oslomet, uib, uit] as const

export const institutionById = (id: string): Institution | undefined =>
  INSTITUTIONS.find((i) => i.id === id)

export const isInstitutionId = (value: unknown): value is string =>
  typeof value === 'string' && INSTITUTIONS.some((i) => i.id === value)

/**
 * Alle lenker for ett lærested, flatet ut med opphavet sitt.
 *
 * De nasjonale lenkene er alltid med. En student trenger Lånekassen like mye
 * uansett hvor hen studerer, og å måtte bytte visning for å finne den ville
 * vært en unødvendig avstikker.
 */
export const entriesFor = (institution: Institution | null): LinkEntry[] => {
  const own: LinkEntry[] = institution
    ? institution.groups.flatMap((group) =>
        group.links.map((link) => ({ link, group: group.id, institution: institution.shortName })),
      )
    : []

  const national: LinkEntry[] = NATIONAL_LINKS.map((link) => ({
    link,
    group: 'practical' as const,
    institution: null,
  }))

  return [...own, ...national]
}

/** Hvor mange lenker katalogen har totalt. Brukes i grensesnittet, og er ærlig. */
export const totalLinkCount = (): number =>
  INSTITUTIONS.reduce(
    (sum, institution) =>
      sum + institution.groups.reduce((groupSum, group) => groupSum + group.links.length, 0),
    NATIONAL_LINKS.length,
  )

export * from './types.ts'
export { NATIONAL_LINKS, NATIONAL_LABEL } from './national.ts'
