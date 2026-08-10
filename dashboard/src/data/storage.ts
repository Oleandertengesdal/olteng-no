/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LAGRING
 *
 *  Én modul eier all lagring. Det er ikke pedanteri: når det ikke finnes noen
 *  server, er localStorage hele databasen, og da må det finnes nøyaktig ett
 *  sted som vet hvilke nøkler som finnes, hvilken versjon de har, og hva som
 *  skjer når de er ødelagt.
 *
 *  Tre ting denne filen tar på alvor:
 *
 *  1. localStorage kan mangle. Privat modus, skrudd av i innstillinger, full
 *     kvote. Ingen av delene skal gi en hvit side — de skal gi et dashbord som
 *     virker akkurat nå og glemmer alt ved neste besøk, med en beskjed om det.
 *
 *  2. Data kan være ødelagt. En halvskrevet JSON etter en krasj, eller noe fra
 *     en eldre versjon. Feiler parsingen, går vi tilbake til standard framfor
 *     å kaste. Et ødelagt oppsett er irriterende; en side som ikke laster er
 *     verre.
 *
 *  3. Dette er brukerens data. Eksport og import er ikke en ekstrafunksjon —
 *     det er den eneste sikkerhetskopien som finnes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Versjonen står i nøkkelen, ikke i verdien. Da kan v2 leve side om side med
 * v1 uten å ødelegge den, og en bruker som går tilbake til forrige utgivelse
 * finner oppsettet sitt urørt.
 */
export const STORAGE_VERSION = 1

const PREFIX = `dashboard.v${STORAGE_VERSION}.`

/** Nøklene som finnes. Widgetinnstillinger får sin egen navnerom-funksjon. */
export const KEY = {
  layout: 'layout',
  theme: 'theme',
  locale: 'locale',
  /** Valgt lærested. Styrer hele lenkekatalogen. */
  institution: 'institution',
  /** Innstillinger for én widget-forekomst, ikke for widget-typen. */
  widget: (instanceId: string) => `widget.${instanceId}`,
} as const

export type StorageStatus = 'ok' | 'unavailable' | 'full'

let lastStatus: StorageStatus = 'ok'

/** Sist kjente tilstand. Grensesnittet bruker den til å si fra, ikke til å feile. */
export const storageStatus = (): StorageStatus => lastStatus

/**
 * Sjekker om localStorage faktisk kan skrives til.
 *
 * `typeof localStorage !== 'undefined'` holder ikke: Safari i privat modus har
 * historisk hatt et objekt som finnes og kaster ved skriving. Eneste ærlige
 * test er å skrive noe og fjerne det igjen.
 */
const probe = (): Storage | null => {
  try {
    const store = globalThis.localStorage
    if (!store) return null
    const token = `${PREFIX}__probe`
    store.setItem(token, '1')
    store.removeItem(token)
    return store
  } catch {
    return null
  }
}

/* ── Lesing og skriving ────────────────────────────────────────────────────

   `validate` er ikke valgfri pynt. Uten den er en lagret verdi bare «noe som
   var JSON en gang», og TypeScript tror på en usann påstand om hva den er.
   Med den kan lagringen si «dette er ikke et gyldig oppsett» og gå til
   standardverdien framfor å levere søppel videre inn i appen.                */

export const read = <T>(key: string, fallback: T, validate?: (value: unknown) => value is T): T => {
  const store = probe()
  if (!store) {
    lastStatus = 'unavailable'
    return fallback
  }
  lastStatus = 'ok'

  const raw = store.getItem(PREFIX + key)
  if (raw === null) return fallback

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Ødelagt. Rydd bort, slik at feilen ikke gjentar seg ved hver lasting.
    store.removeItem(PREFIX + key)
    return fallback
  }

  if (validate && !validate(parsed)) {
    store.removeItem(PREFIX + key)
    return fallback
  }

  return parsed as T
}

export const write = (key: string, value: unknown): boolean => {
  const store = probe()
  if (!store) {
    lastStatus = 'unavailable'
    return false
  }

  try {
    store.setItem(PREFIX + key, JSON.stringify(value))
    lastStatus = 'ok'
    return true
  } catch {
    // Nesten alltid kvoten. 5 MB er mye for tekst og lite for bilder, og
    // ingenting her bør nærme seg grensen — men brukeren skal få vite det.
    lastStatus = 'full'
    return false
  }
}

export const remove = (key: string): void => {
  probe()?.removeItem(PREFIX + key)
}

/** Alle nøkler som tilhører denne appen og denne versjonen. */
export const ownKeys = (): string[] => {
  const store = probe()
  if (!store) return []
  const keys: string[] = []
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i)
    if (key?.startsWith(PREFIX)) keys.push(key.slice(PREFIX.length))
  }
  return keys.sort()
}

/* ── Eksport og import ─────────────────────────────────────────────────────
   Formatet er med vilje kjedelig: en konvolutt med app-navn, versjon og
   tidspunkt, og dataene som vanlig JSON. Det skal kunne åpnes i en teksteditor
   og forstås av et menneske, for det er en sikkerhetskopi og ikke et
   overføringsformat.                                                         */

export interface ExportBundle {
  app: 'dashboard.olteng.no'
  version: number
  exportedAt: string
  data: Record<string, unknown>
}

export const APP_ID = 'dashboard.olteng.no' as const

export const exportAll = (): ExportBundle => {
  const data: Record<string, unknown> = {}
  for (const key of ownKeys()) {
    data[key] = read<unknown>(key, null)
  }
  return {
    app: APP_ID,
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export type ImportResult =
  | { ok: true; keys: string[] }
  | { ok: false; reason: 'parse' | 'shape' | 'newer' | 'write'; detail?: string }

/**
 * Leser en eksportfil tilbake.
 *
 * En nyere versjon avvises framfor å importeres delvis. Å skrive inn felter vi
 * ikke forstår ville gitt et oppsett som ser riktig ut og oppfører seg feil,
 * og det er vanskeligere å oppdage enn en tydelig avvisning.
 */
export const importAll = (json: string): ImportResult => {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, reason: 'parse' }
  }

  if (typeof parsed !== 'object' || parsed === null) return { ok: false, reason: 'shape' }

  const bundle = parsed as Partial<ExportBundle>
  if (bundle.app !== APP_ID) return { ok: false, reason: 'shape', detail: String(bundle.app) }
  if (typeof bundle.version !== 'number') return { ok: false, reason: 'shape' }
  if (bundle.version > STORAGE_VERSION) {
    return { ok: false, reason: 'newer', detail: String(bundle.version) }
  }
  if (typeof bundle.data !== 'object' || bundle.data === null) return { ok: false, reason: 'shape' }

  const written: string[] = []
  for (const [key, value] of Object.entries(bundle.data)) {
    if (value === null) continue
    if (!write(key, value)) return { ok: false, reason: 'write', detail: key }
    written.push(key)
  }

  return { ok: true, keys: written }
}

/** Filnavn på formen dashboard-2026-08-06.json. */
export const exportFilename = (now: Date = new Date()): string => {
  const iso = now.toISOString().slice(0, 10)
  return `dashboard-${iso}.json`
}
