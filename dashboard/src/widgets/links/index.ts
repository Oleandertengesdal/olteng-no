import type { WidgetDefinition } from '../types.ts'

const definition: WidgetDefinition = {
  id: 'links',
  title: { nb: 'Lenker', en: 'Links' },
  description: {
    nb: 'Snarveier til systemene ved lærestedet ditt. Velg selv hvilke som står her.',
    en: "Shortcuts to your institution's systems. Choose which ones appear here.",
  },
  category: 'tools',
  icon: 'link',
  sizes: [
    { w: 3, h: 2 },
    { w: 3, h: 3 },
    { w: 4, h: 3 },
    { w: 6, h: 3 },
  ],
  defaultSize: { w: 3, h: 3 },
  needsNetwork: false,
  component: () => import('./Widget.vue'),
  settings: () => import('./Settings.vue'),
}

export default definition
