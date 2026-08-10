import type { WidgetDefinition } from '../types.ts'

const definition: WidgetDefinition = {
  id: 'timetable',
  title: { nb: 'Timeplan i dag', en: "Today's timetable" },
  description: {
    nb: 'Dagens forelesninger med rom og klokkeslett, fra en .ics-fil du legger inn selv.',
    en: "Today's lectures with room and time, from an .ics file you supply yourself.",
  },
  category: 'day',
  icon: 'calendar',
  sizes: [
    { w: 3, h: 3 },
    { w: 4, h: 3 },
    { w: 6, h: 3 },
    { w: 4, h: 4 },
  ],
  defaultSize: { w: 4, h: 3 },
  // Filen ligger lokalt etter at den er lagt inn. Bare oppdatering fra en
  // abonnementslenke trenger nett, og det er ikke hovedveien.
  needsNetwork: false,
  component: () => import('./Widget.vue'),
  settings: () => import('./Settings.vue'),
}

export default definition
