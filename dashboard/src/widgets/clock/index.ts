import type { WidgetDefinition } from '../types.ts'

/**
 * Klokke, dato, ukenummer og studieuke.
 *
 * Den enkleste widgeten som finnes, og derfor den første: den beviser at
 * registeret, rutenettet, lagringen, språkbyttet og fargemodusene henger
 * sammen, uten at noe av det skjules bak et API som kan være nede.
 */
const definition: WidgetDefinition = {
  id: 'clock',
  title: { nb: 'Klokke og dato', en: 'Clock and date' },
  description: {
    nb: 'Klokkeslett, dato, ukenummer og hvilken studieuke i semesteret det er.',
    en: 'Time, date, week number, and which week of the semester it is.',
  },
  category: 'day',
  icon: 'clock',
  sizes: [
    { w: 3, h: 2 },
    { w: 4, h: 2 },
    { w: 6, h: 3 },
  ],
  defaultSize: { w: 4, h: 2 },
  needsNetwork: false,
  component: () => import('./Widget.vue'),
  settings: () => import('./Settings.vue'),
}

export default definition
