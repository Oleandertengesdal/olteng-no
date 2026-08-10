/**
 * Open-Meteo.
 *
 * Gratis, ingen nøkkel, CORS påslått, data under CC BY 4.0 til ikke-kommersiell
 * bruk. Krediteringen står i widgeten.
 *
 * Merk hvorfor det ikke er MET Norway her, som ellers ville vært den opplagte
 * kilden i Norge: MET krever en identifiserende User-Agent, og User-Agent er
 * en forbudt header i fetch — nettleseren nekter å sette den. MET kan altså
 * ikke brukes klientside uten en proxy, og en proxy er en server.
 */

import { fetchJson, type FetchResult } from '@/data/remote.ts'
import type { Place } from './logic.ts'

const FORECAST = 'https://api.open-meteo.com/v1/forecast'
const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search'

export const ATTRIBUTION = { label: 'Open-Meteo', url: 'https://open-meteo.com/' }

/**
 * Vi ber om 14 timer og viser 12. Marginen finnes fordi svaret begynner ved
 * inneværende hele time, og timer som allerede er passert filtreres bort.
 */
export const forecastUrl = (place: Place): string => {
  const params = new URLSearchParams({
    latitude: place.latitude.toFixed(4),
    longitude: place.longitude.toFixed(4),
    current: 'temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m',
    hourly: 'temperature_2m,precipitation,precipitation_probability,weather_code',
    forecast_hours: '14',
    timezone: 'auto',
    wind_speed_unit: 'ms',
  })
  return `${FORECAST}?${params}`
}

export const fetchForecast = (place: Place, signal: AbortSignal): Promise<FetchResult<unknown>> =>
  fetchJson<unknown>(forecastUrl(place), { signal, timeoutMs: 8000 })

/* ── Stedssøk ──────────────────────────────────────────────────────────────  */

interface GeoResult {
  id?: number
  name?: string
  latitude?: number
  longitude?: number
  admin1?: string
  admin2?: string
  country?: string
  country_code?: string
}

export const searchPlaces = async (
  query: string,
  language: 'nb' | 'en',
  signal: AbortSignal,
): Promise<Place[]> => {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const params = new URLSearchParams({
    name: trimmed,
    count: '8',
    language,
    format: 'json',
  })

  const result = await fetchJson<{ results?: GeoResult[] }>(`${GEOCODE}?${params}`, {
    signal,
    timeoutMs: 6000,
  })

  // Søket gir ingen feilmelding — et søk som ikke svarer og et søk uten treff
  // ser like ut for brukeren, og «ingen treff» er den nyttige beskjeden.
  if (!result.ok || !Array.isArray(result.data.results)) return []

  return result.data.results
    .filter((r): r is GeoResult & { name: string; latitude: number; longitude: number } =>
      typeof r.name === 'string' && Number.isFinite(r.latitude) && Number.isFinite(r.longitude),
    )
    .map((r) => ({
      id: String(r.id ?? `${r.latitude},${r.longitude}`),
      name: r.name,
      region: r.admin1 ?? r.admin2 ?? '',
      country: r.country ?? r.country_code ?? '',
      latitude: r.latitude,
      longitude: r.longitude,
    }))
}
