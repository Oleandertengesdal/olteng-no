export interface TimetableSource {
  kind: 'file' | 'url'
  /** Filnavn eller adresse, slik at brukeren ser hvor timeplanen kom fra. */
  label: string
  importedAt: number
}

export interface TimetableSettings {
  /** Selve ICS-filen, som tekst. Null før noe er lagt inn. */
  raw: string | null
  source: TimetableSource | null
  /** Vis også hva som har vært tidligere i dag, framfor bare det som gjenstår. */
  showPast: boolean
}

export const DEFAULT_TIMETABLE_SETTINGS: TimetableSettings = {
  raw: null,
  source: null,
  showPast: true,
}

/**
 * Én megabyte.
 *
 * localStorage har rundt fem megabyte totalt for hele domenet, og en
 * semestertimeplan er sjelden over to hundre kilobyte. Grensen finnes for at
 * en feilaktig fil ikke skal spise opp plassen til alt det andre — og for at
 * beskjeden skal komme før lagringen feiler, ikke etterpå.
 */
export const MAX_ICS_BYTES = 1_000_000

export const isTimetableSettings = (value: unknown): value is TimetableSettings => {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>

  if (s.raw !== null && typeof s.raw !== 'string') return false
  if (typeof s.showPast !== 'boolean') return false

  if (s.source !== null) {
    if (typeof s.source !== 'object' || s.source === null) return false
    const source = s.source as Record<string, unknown>
    if (source.kind !== 'file' && source.kind !== 'url') return false
    if (typeof source.label !== 'string') return false
    if (typeof source.importedAt !== 'number') return false
  }

  return true
}
