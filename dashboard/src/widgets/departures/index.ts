import type { WidgetDefinition } from '../types.ts'

const definition: WidgetDefinition = {
  id: 'departures',
  title: { nb: 'Neste avganger', en: 'Next departures' },
  description: {
    nb: 'Sanntid fra holdeplassen din. Linje, destinasjon, minutter til og forsinkelse.',
    en: 'Live departures from your stop. Line, destination, minutes away and delay.',
  },
  category: 'day',
  icon: 'bus',
  sizes: [
    { w: 3, h: 3 },
    { w: 4, h: 3 },
    { w: 6, h: 3 },
    { w: 4, h: 4 },
  ],
  defaultSize: { w: 4, h: 3 },
  needsNetwork: true,
  component: () => import('./Widget.vue'),
  settings: () => import('./Settings.vue'),
}

export default definition
