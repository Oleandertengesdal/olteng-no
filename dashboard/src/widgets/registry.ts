/**
 * Widget-registeret.
 *
 * Definisjonene importeres direkte — de er ren metadata på noen hundre byte,
 * og velgeren må kunne vise alle widgets uten å laste noen av dem. Selve
 * komponentene ligger bak `component()`, som er en dynamisk import: åpner du
 * ikke Minesveiper, laster du den ikke.
 *
 * Å legge til en widget er én linje her og én mappe under widgets/.
 */

import type { WidgetDefinition } from './types.ts'
import clock from './clock/index.ts'
import weather from './weather/index.ts'
import departures from './departures/index.ts'
import timetable from './timetable/index.ts'
import countdowns from './countdowns/index.ts'
import links from './links/index.ts'

export const WIDGETS: readonly WidgetDefinition[] = [
  clock,
  weather,
  departures,
  timetable,
  countdowns,
  links,
] as const

export const WIDGET_IDS: ReadonlySet<string> = new Set(WIDGETS.map((w) => w.id))

export const widgetById = (id: string): WidgetDefinition | undefined =>
  WIDGETS.find((w) => w.id === id)

/**
 * Kjører i utviklingsmodus. Feilene den fanger — to widgets med samme id,
 * en standardstørrelse som ikke står i listen over tillatte — gir rare
 * symptomer langt unna årsaken hvis de får leve.
 */
if (import.meta.env.DEV) {
  const seen = new Set<string>()
  for (const w of WIDGETS) {
    if (seen.has(w.id)) console.error(`Widget-registeret: «${w.id}» er registrert to ganger.`)
    seen.add(w.id)

    const hasDefault = w.sizes.some((s) => s.w === w.defaultSize.w && s.h === w.defaultSize.h)
    if (!hasDefault) {
      console.error(`Widget «${w.id}»: defaultSize står ikke i sizes.`)
    }
  }
}
