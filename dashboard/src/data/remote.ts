/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HENTING AV DATA UTENFRA
 *
 *  Tre regler, og de gjelder alle widgets som snakker med noen andre:
 *
 *  1. Cache aggressivt. Været endrer seg ikke hvert sekund, og strømprisen for
 *     i dag er den samme klokka ni som klokka ti. Tjenestene er gratis og
 *     drives av folk som ikke får betalt for at vi maser. Et svar lagres med
 *     tidsstempel og gjenbrukes til det er gammelt.
 *
 *  2. Feil isolert. Én kilde nede skal aldri påvirke en annen widget. Derfor
 *     kaster ingenting her videre oppover — feil kommer tilbake som en verdi
 *     med en type, og widgeten bestemmer selv hva den vil vise.
 *
 *  3. Frakoblet er ikke tomt. Har vi et gammelt svar, viser vi det med
 *     tidsstempel og en merknad om at det er gammelt. En rute som er tom fordi
 *     toget gikk inn i en tunnel er verre enn en rute som sier «fra 14:32».
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { read, write } from './storage.ts'

/* ── Cache ─────────────────────────────────────────────────────────────────  */

export interface CacheEntry<T> {
  /** Da svaret kom, i millisekunder siden epoken. */
  at: number
  data: T
}

const isCacheEntry = (value: unknown): value is CacheEntry<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { at?: unknown }).at === 'number' &&
  'data' in value

/** Cachenøkler ligger i sin egen navnerom, slik at de kan tømmes uten å røre oppsettet. */
export const cacheKey = (name: string): string => `cache.${name}`

export const isFresh = (at: number, maxAgeMs: number, now: number): boolean =>
  now - at >= 0 && now - at < maxAgeMs

export const readCache = <T>(name: string): CacheEntry<T> | null => {
  const entry = read<CacheEntry<unknown> | null>(cacheKey(name), null, (v): v is CacheEntry<unknown> | null =>
    v === null ? true : isCacheEntry(v),
  )
  return entry as CacheEntry<T> | null
}

export const writeCache = <T>(name: string, data: T, now: number = Date.now()): void => {
  write(cacheKey(name), { at: now, data })
}

/* ── Henting ───────────────────────────────────────────────────────────────  */

export type RemoteErrorKind =
  /** Nettleseren sier den er frakoblet, eller forespørselen kom aldri fram. */
  | 'offline'
  /** Vi ga opp å vente. */
  | 'timeout'
  /** Tjeneren svarte, men med en feilkode. */
  | 'http'
  /** Tjeneren svarte med noe vi ikke forsto. */
  | 'parse'

export interface RemoteError {
  kind: RemoteErrorKind
  /** HTTP-status når den finnes. 404 er en forventet tilstand for noen kilder. */
  status?: number
  detail?: string
}

export interface FetchOptions {
  /**
   * Hvor lenge vi venter. Standarden er lav med vilje: en widget som henger i
   * tretti sekunder er verre enn en som sier fra etter åtte at det tok for
   * lang tid, for da kan brukeren gjøre noe annet i mellomtiden.
   */
  timeoutMs?: number
  headers?: Record<string, string>
  /** Sendes videre slik at en widget som forsvinner kan avbryte hentingen. */
  signal?: AbortSignal
}

export type FetchResult<T> = { ok: true; data: T } | { ok: false; error: RemoteError }

/**
 * Henter JSON og gir aldri fra seg et unntak.
 *
 * Grunnen til at dette ikke kaster: en widget som glemmer én try/catch skal
 * ikke kunne ta ned dashbordet. Feiltilstanden er en verdi med en type, og
 * TypeScript tvinger widgeten til å håndtere den.
 */
export const fetchJson = async <T>(url: string, options: FetchOptions = {}): Promise<FetchResult<T>> => {
  const { timeoutMs = 8000, headers = {}, signal } = options

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, error: { kind: 'offline' } }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs)

  // Avbryter kalleren, skal vår egen forespørsel også avbrytes.
  const onAbort = () => controller.abort('caller')
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: controller.signal,
      // Nettleserens egen cache skrus ikke av — den er en gratis ekstra runde
      // med sparte forespørsler for kilder som setter riktige headere.
      redirect: 'follow',
    })

    if (!response.ok) {
      return { ok: false, error: { kind: 'http', status: response.status } }
    }

    try {
      return { ok: true, data: (await response.json()) as T }
    } catch {
      return { ok: false, error: { kind: 'parse' } }
    }
  } catch (cause) {
    // AbortError dekker både tidsavbrudd og at kalleren ga seg. Bare det første
    // er noe brukeren skal få vite om.
    const aborted = cause instanceof DOMException && cause.name === 'AbortError'
    if (aborted && controller.signal.reason === 'timeout') {
      return { ok: false, error: { kind: 'timeout' } }
    }
    if (aborted) return { ok: false, error: { kind: 'offline', detail: 'avbrutt' } }
    return { ok: false, error: { kind: 'offline', detail: String(cause) } }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/** Samme, men med en POST-kropp. Entur sitt GraphQL-API vil ha det slik. */
export const postJson = async <T>(
  url: string,
  body: unknown,
  options: FetchOptions = {},
): Promise<FetchResult<T>> => {
  const { timeoutMs = 8000, headers = {}, signal } = options

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, error: { kind: 'offline' } }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs)
  const onAbort = () => controller.abort('caller')
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) return { ok: false, error: { kind: 'http', status: response.status } }

    try {
      return { ok: true, data: (await response.json()) as T }
    } catch {
      return { ok: false, error: { kind: 'parse' } }
    }
  } catch (cause) {
    const aborted = cause instanceof DOMException && cause.name === 'AbortError'
    if (aborted && controller.signal.reason === 'timeout') {
      return { ok: false, error: { kind: 'timeout' } }
    }
    return { ok: false, error: { kind: 'offline', detail: String(cause) } }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/* ── Alder ─────────────────────────────────────────────────────────────────  */

/**
 * «for 3 min siden» — som ren funksjon, slik at den kan testes uten en klokke
 * som beveger seg.
 *
 * Under et minutt sier vi «nå». Det er ikke unøyaktig nok til å være uærlig,
 * og «for 4 sekunder siden» er informasjon ingen har bruk for.
 */
export const formatAge = (at: number, now: number, locale: string): string => {
  const seconds = Math.max(0, Math.round((now - at) / 1000))
  if (seconds < 60) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'second')

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return rtf.format(-minutes, 'minute')

  const hours = Math.round(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')

  return rtf.format(-Math.round(hours / 24), 'day')
}
