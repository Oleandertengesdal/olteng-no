import { isStop, type Stop } from './logic.ts'

export interface DeparturesSettings {
  /** Lagrede holdeplasser, i den rekkefølgen brukeren la dem inn. */
  stops: Stop[]
  /** Hvilken som vises nå. */
  activeId: string | null
  /** Hvor mange avganger som hentes. */
  count: number
}

export const DEFAULT_DEPARTURES_SETTINGS: DeparturesSettings = {
  stops: [],
  activeId: null,
  count: 6,
}

/** Tre favoritter. Hjem, campus og den ene til — flere er en liste, ikke en snarvei. */
export const MAX_STOPS = 3

export const isDeparturesSettings = (value: unknown): value is DeparturesSettings => {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    Array.isArray(s.stops) &&
    s.stops.every(isStop) &&
    (s.activeId === null || typeof s.activeId === 'string') &&
    Number.isInteger(s.count) &&
    (s.count as number) > 0 &&
    (s.count as number) <= 20
  )
}
