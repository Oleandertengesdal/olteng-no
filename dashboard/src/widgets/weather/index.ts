import type { WidgetDefinition } from '../types.ts'

const definition: WidgetDefinition = {
  id: 'weather',
  title: { nb: 'Vær', en: 'Weather' },
  description: {
    nb: 'Nå, føles som, og de neste tolv timene med nedbør markert.',
    en: 'Now, feels like, and the next twelve hours with precipitation marked.',
  },
  category: 'day',
  icon: 'cloudSun',
  sizes: [
    { w: 4, h: 2 },
    { w: 6, h: 2 },
    { w: 6, h: 3 },
  ],
  defaultSize: { w: 6, h: 2 },
  needsNetwork: true,
  component: () => import('./Widget.vue'),
  settings: () => import('./Settings.vue'),
}

export default definition
