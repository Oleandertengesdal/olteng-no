import type { WidgetDefinition } from '../types.ts'

const definition: WidgetDefinition = {
  id: 'countdowns',
  title: { nb: 'Nedtellinger', en: 'Countdowns' },
  description: {
    nb: 'Til eksamen, til innleveringsfrist, til semesterslutt — eller til hva du vil.',
    en: 'To an exam, a deadline, the end of term — or whatever you like.',
  },
  category: 'day',
  icon: 'hourglass',
  sizes: [
    { w: 3, h: 2 },
    { w: 4, h: 2 },
    { w: 4, h: 3 },
    { w: 6, h: 3 },
  ],
  defaultSize: { w: 4, h: 2 },
  needsNetwork: false,
  component: () => import('./Widget.vue'),
  settings: () => import('./Settings.vue'),
}

export default definition
