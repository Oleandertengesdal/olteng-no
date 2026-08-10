/**
 * En widget som henter data utenfra, som tilstand.
 *
 * Alt det kjedelige ligger her: cache, oppfriskning når fanen kommer tilbake,
 * avbryting når widgeten fjernes, og skillet mellom «har ingenting», «har noe
 * gammelt» og «har noe ferskt». Widgeten selv skal bare beskrive hvordan de
 * tre ser ut.
 *
 * Merk at feil aldri erstatter data. Har vi et gammelt svar og en ny
 * forespørsel feiler, blir det gamle svaret stående med tidsstempel og en
 * merknad. Å bytte ut noe som er litt gammelt med en feilmelding er å gjøre
 * situasjonen verre enn den er.
 */

import { computed, onBeforeUnmount, onMounted, ref, shallowRef, type Ref } from 'vue'
import { readCache, writeCache, isFresh, type FetchResult, type RemoteError } from './remote.ts'

export interface RemoteOptions<T> {
  /** Cachenøkkel. Må skille mellom steder, holdeplasser og lignende. */
  key: Ref<string> | (() => string)
  /** Selve hentingen. Får et signal som avbrytes når widgeten forsvinner. */
  load: (signal: AbortSignal) => Promise<FetchResult<T>>
  /** Hvor lenge et svar regnes som ferskt. */
  maxAgeMs: number
  /**
   * Hvor ofte vi prøver på nytt av oss selv. Utelates den, hentes data ved
   * montering og når fanen kommer tilbake — og ellers når brukeren ber om det.
   */
  refreshMs?: number
  /** Sett til usann for kilder som skal hentes først når brukeren ber om det. */
  immediate?: boolean
}

export const useRemote = <T>(options: RemoteOptions<T>) => {
  const { maxAgeMs, refreshMs, immediate = true } = options
  const keyOf = () => (typeof options.key === 'function' ? options.key() : options.key.value)

  const data = shallowRef<T | null>(null)
  const fetchedAt = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<RemoteError | null>(null)

  let controller: AbortController | null = null
  let timer = 0

  /** Har vi data, og er de gamle? */
  const stale = computed(
    () => data.value !== null && fetchedAt.value !== null && !isFresh(fetchedAt.value, maxAgeMs, Date.now()),
  )

  const loadFromCache = (): boolean => {
    const entry = readCache<T>(keyOf())
    if (!entry) return false
    data.value = entry.data
    fetchedAt.value = entry.at
    return isFresh(entry.at, maxAgeMs, Date.now())
  }

  const refresh = async (force = false): Promise<void> => {
    if (loading.value) return

    // Ligger fanen i bakgrunnen, henter vi ingenting. Ingen ser svaret, og
    // kilden er gratis. Vi henter i stedet med én gang fanen kommer tilbake.
    if (!force && typeof document !== 'undefined' && document.hidden) return

    // Fersk nok fra før? Da lar vi kilden være i fred.
    if (!force && fetchedAt.value !== null && isFresh(fetchedAt.value, maxAgeMs, Date.now())) return

    controller?.abort('replaced')
    controller = new AbortController()
    loading.value = true

    const result = await options.load(controller.signal)

    loading.value = false

    if (result.ok) {
      const now = Date.now()
      data.value = result.data
      fetchedAt.value = now
      error.value = null
      writeCache(keyOf(), result.data, now)
      return
    }

    // Feilen noteres, men det vi allerede har blir stående.
    error.value = result.error
  }

  /** Byttet sted eller holdeplass: les cachen for den nye nøkkelen, hent så. */
  const reset = (): void => {
    data.value = null
    fetchedAt.value = null
    error.value = null
    if (!loadFromCache()) void refresh()
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible') void refresh()
  }

  onMounted(() => {
    const fresh = loadFromCache()
    if (immediate && !fresh) void refresh()

    if (refreshMs) timer = window.setInterval(() => void refresh(), refreshMs)
    document.addEventListener('visibilitychange', onVisibility)
    // Kom nettet tilbake, er det nettopp da det er verdt å prøve igjen.
    window.addEventListener('online', onVisibility)
  })

  onBeforeUnmount(() => {
    window.clearInterval(timer)
    controller?.abort('unmounted')
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('online', onVisibility)
  })

  return { data, fetchedAt, loading, error, stale, refresh, reset }
}
