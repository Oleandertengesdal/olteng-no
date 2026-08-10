/**
 * Entur.
 *
 * Åpent API under NLOD, ingen nøkkel. Entur ber om at kallende systemer
 * identifiserer seg med headeren ET-Client-Name, og i motsetning til MET sin
 * User-Agent er den lov å sette fra en nettleser. Derfor kan denne kilden
 * brukes klientside, og MET kan ikke.
 *
 * Navnet under er det som dukker opp i Enturs logger hvis noe går galt her.
 */

import { fetchJson, postJson, type FetchResult } from '@/data/remote.ts'
import type { Stop } from './logic.ts'

const JOURNEY_PLANNER = 'https://api.entur.io/journey-planner/v3/graphql'
const GEOCODER = 'https://api.entur.io/geocoder/v1/autocomplete'

const CLIENT_NAME = 'olteng-dashboard'
const HEADERS = { 'ET-Client-Name': CLIENT_NAME }

export const ATTRIBUTION = { label: 'Entur', url: 'https://entur.org/' }

/**
 * Spørringen er holdt så liten som den kan bli.
 *
 * Bare felter som har vært i v3-skjemaet siden det ble lansert, og ingen
 * argumenter utover de to som trengs. Et GraphQL-API svarer med feil på hele
 * spørringen hvis ett felt er skrevet feil, så hvert felt man ikke trenger er
 * en måte hele widgeten kan slutte å virke på.
 */
const QUERY = `query Departures($id: String!, $n: Int!) {
  stopPlace(id: $id) {
    id
    name
    estimatedCalls(numberOfDepartures: $n, timeRange: 7200) {
      aimedDepartureTime
      expectedDepartureTime
      realtime
      cancellation
      destinationDisplay { frontText }
      quay { id publicCode }
      serviceJourney { id line { id publicCode name transportMode } }
    }
  }
}`

interface GraphQlBody {
  errors?: { message?: string }[]
}

export const fetchDepartures = async (
  stopId: string,
  count: number,
  signal: AbortSignal,
): Promise<FetchResult<unknown>> => {
  const result = await postJson<unknown>(
    JOURNEY_PLANNER,
    { query: QUERY, variables: { id: stopId, n: count } },
    { headers: HEADERS, signal, timeoutMs: 8000 },
  )

  if (!result.ok) return result

  // GraphQL svarer 200 også når spørringen er feil. Uten dette ville en
  // skrivefeil i spørringen sett ut som «ingen avganger».
  const body = result.data as GraphQlBody
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    return { ok: false, error: { kind: 'parse', detail: body.errors[0]?.message } }
  }

  return result
}

/* ── Holdeplassøk ──────────────────────────────────────────────────────────  */

interface Feature {
  properties?: {
    id?: string
    name?: string
    locality?: string
    county?: string
    layer?: string
  }
}

export const searchStops = async (query: string, signal: AbortSignal): Promise<Stop[]> => {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const params = new URLSearchParams({
    text: trimmed,
    lang: 'no',
    size: '8',
    // Bare holdeplasser. Uten dette kommer gateadresser og bydeler med, og de
    // har ingen avganger.
    layers: 'venue',
  })

  const result = await fetchJson<{ features?: Feature[] }>(`${GEOCODER}?${params}`, {
    headers: HEADERS,
    signal,
    timeoutMs: 6000,
  })

  if (!result.ok || !Array.isArray(result.data.features)) return []

  return result.data.features
    .map((feature) => feature.properties)
    .filter(
      (p): p is { id: string; name: string; locality?: string; county?: string } =>
        typeof p?.id === 'string' && p.id.startsWith('NSR:StopPlace:') && typeof p.name === 'string',
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      locality: p.locality ?? p.county ?? '',
    }))
}
