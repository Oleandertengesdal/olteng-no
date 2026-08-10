/**
 * Ferdige oppsett.
 *
 * En ny bruker skal møte noe fornuftig, ikke en tom side med en knapp. Det er
 * forskjellen mellom et verktøy man forstår på ti sekunder og et man må sette
 * opp før man skjønner hva det er.
 *
 * Oppsettene viser til widgets ved id, og ukjente id-er lukes bort når
 * oppsettet bygges. Det betyr at listene under kan beskrive dashbordet slik
 * det skal bli, mens etappe 1 bare har klokken — og at en ny widget dukker opp
 * i «Morgen» automatisk den dagen den er ferdig, uten at denne filen må røres.
 */

import type { Bilingual } from '@/data/bilingual.ts'
import { WIDGET_IDS, widgetById } from '@/widgets/registry.ts'
import { addItem, type Layout } from './grid.ts'

export interface Preset {
  id: string
  name: Bilingual
  note: Bilingual
  /** Widget-id-er i den rekkefølgen de skal stå. */
  widgets: string[]
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'morning',
    name: { nb: 'Morgen', en: 'Morning' },
    note: {
      nb: 'Det du trenger før du går ut døra.',
      en: 'What you need before you leave the house.',
    },
    widgets: ['clock', 'weather', 'departures', 'timetable', 'countdowns', 'links'],
  },
  {
    id: 'reading-room',
    name: { nb: 'Lesesal', en: 'Reading room' },
    note: {
      nb: 'Én økt om gangen, uten noe som drar blikket bort.',
      en: 'One session at a time, with nothing pulling your eyes away.',
    },
    widgets: ['clock', 'focus-timer', 'reading-plan', 'countdowns', 'links', 'flashcards'],
  },
  {
    id: 'everything',
    name: { nb: 'Alt', en: 'Everything' },
    note: {
      nb: 'Alle widgets. Ryddig er noe du gjør etterpå.',
      en: 'Every widget. Tidying up is something you do afterwards.',
    },
    widgets: [],
  },
] as const

/**
 * Bygger et oppsett av et ferdigoppsett.
 *
 * «Alt» har en tom liste og betyr bokstavelig talt alt som er registrert —
 * ellers måtte den vedlikeholdes hver gang en widget legges til.
 */
export const buildPreset = (preset: Preset): Layout => {
  const wanted = preset.widgets.length > 0 ? preset.widgets : [...WIDGET_IDS]

  let layout: Layout = []
  for (const id of wanted) {
    const definition = widgetById(id)
    if (!definition) continue
    layout = addItem(layout, definition.id, definition.defaultSize)
  }
  return layout
}

/** Hvor mange av widgetene i oppsettet som finnes ennå. */
export const presetCoverage = (preset: Preset): { available: number; total: number } => {
  if (preset.widgets.length === 0) return { available: WIDGET_IDS.size, total: WIDGET_IDS.size }
  return {
    available: preset.widgets.filter((id) => WIDGET_IDS.has(id)).length,
    total: preset.widgets.length,
  }
}

export const DEFAULT_PRESET = 'morning'
