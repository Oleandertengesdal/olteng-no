export interface LinksSettings {
  /**
   * Adressene til lenkene som vises, i den rekkefølgen brukeren festet dem.
   *
   * Adressen og ikke navnet, fordi navnet kan endre seg når lærestedet bytter
   * system. Forsvinner adressen fra katalogen, forsvinner lenken stille fra
   * widgeten — som er riktig: den pekte uansett på noe som ikke er der lenger.
   */
  pinned: string[]
}

export const DEFAULT_LINKS_SETTINGS: LinksSettings = { pinned: [] }

export const MAX_PINNED = 12

export const isLinksSettings = (value: unknown): value is LinksSettings => {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return Array.isArray(s.pinned) && s.pinned.every((url) => typeof url === 'string')
}
