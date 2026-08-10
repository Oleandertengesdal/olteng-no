/**
 * Innstillingene for vær, delt mellom visningen og skjemaet.
 *
 * Ligger i sin egen fil framfor i Widget.vue, fordi to komponenter som leser
 * de samme innstillingene må være enige om hva som er standard — og en
 * standardverdi som er skrevet to steder er to standardverdier.
 */

import { isPlace, type Place } from './logic.ts'

export interface WeatherSettings {
  /** Stedet som vises. Null før brukeren har valgt. */
  place: Place | null
  /** Lagrede steder, i den rekkefølgen brukeren la dem inn. */
  favourites: Place[]
}

export const DEFAULT_WEATHER_SETTINGS: WeatherSettings = {
  place: null,
  favourites: [],
}

export const isWeatherSettings = (value: unknown): value is WeatherSettings => {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  const placeOk = s.place === null || isPlace(s.place)
  const favouritesOk = Array.isArray(s.favourites) && s.favourites.every(isPlace)
  return placeOk && favouritesOk
}
