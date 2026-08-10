import { isCountdown, type Countdown } from './logic.ts'

export interface CountdownSettings {
  items: Countdown[]
  /** Skjul frister som er passert, framfor å flytte dem bakerst. */
  hidePast: boolean
}

export const DEFAULT_COUNTDOWN_SETTINGS: CountdownSettings = {
  items: [],
  hidePast: false,
}

export const isCountdownSettings = (value: unknown): value is CountdownSettings => {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return Array.isArray(s.items) && s.items.every(isCountdown) && typeof s.hidePast === 'boolean'
}
