/**
 * Ikoner, tegnet her.
 *
 * Ingen ikonpakke. Et bibliotek med fem tusen ikoner for å bruke tolv er en
 * avhengighet man ikke kan forsvare, og det verre problemet er at pakkeikoner
 * er tegnet av noen andre til noe annet — strektykkelsen, hjørneradiusen og
 * det optiske tyngdepunktet stemmer aldri helt med resten av siden.
 *
 * Reglene for settet:
 *   24 × 24 rutenett, tegnet på hele og halve piksler
 *   stroke-width 1,5 — samme som hårlinjene i grensesnittet
 *   currentColor, aldri en egen farge
 *   runde ender og hjørner
 *   ingen fyll
 *
 * Ikonene er dekorative og merkes aria-hidden. Er et ikon eneste innhold i en
 * knapp, hører navnet hjemme i knappens aria-label, ikke i ikonet.
 */

export const ICONS = {
  clock: [
    'M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0',
    'M12 6.75V12l3.5 2',
  ],
  calendar: [
    'M4.5 6.5h15v13h-15z',
    'M4.5 10.5h15',
    'M8.5 4v4',
    'M15.5 4v4',
  ],
  plus: ['M12 5.5v13', 'M5.5 12h13'],
  close: ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  chevronLeft: ['M14.5 5.5L8 12l6.5 6.5'],
  chevronRight: ['M9.5 5.5L16 12l-6.5 6.5'],
  chevronUp: ['M5.5 14.5L12 8l6.5 6.5'],
  chevronDown: ['M5.5 9.5L12 16l6.5-6.5'],
  /* Halvfylt sirkel — lys og mørk i samme form. */
  theme: ['M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0', 'M12 3.5v17', 'M12 6.5h5', 'M12 12h8'],
  language: [
    'M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0',
    'M3.6 12h16.8',
    'M12 3.5c2.4 2.7 3.6 5.5 3.6 8.5s-1.2 5.8-3.6 8.5c-2.4-2.7-3.6-5.5-3.6-8.5s1.2-5.8 3.6-8.5Z',
  ],
  download: ['M12 4v11', 'M7.5 10.5L12 15l4.5-4.5', 'M4.5 19.5h15'],
  upload: ['M12 15V4', 'M7.5 8.5L12 4l4.5 4.5', 'M4.5 19.5h15'],
  grid: ['M4.5 4.5h6v6h-6z', 'M13.5 4.5h6v6h-6z', 'M4.5 13.5h6v6h-6z', 'M13.5 13.5h6v6h-6z'],
  settings: [
    'M4 8.5h7',
    'M15 8.5h5',
    'M4 15.5h4',
    'M12 15.5h8',
    'M15 6.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
    'M10 13.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  ],
  search: ['M17.5 10.5a7 7 0 1 1-14 0 7 7 0 0 1 14 0', 'M15.5 15.5L20.5 20.5'],
  trash: ['M4.5 7h15', 'M9.5 7V4.5h5V7', 'M6.5 7l1 12.5h9l1-12.5'],
  /* Gripeflate. Prikker, ikke piler — det er en flate man tar tak i. */
  grip: [
    'M9 7.5h.01',
    'M9 12h.01',
    'M9 16.5h.01',
    'M15 7.5h.01',
    'M15 12h.01',
    'M15 16.5h.01',
  ],
  info: ['M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0', 'M12 11v5.5', 'M12 7.75h.01'],
  offline: [
    'M3.5 3.5l17 17',
    'M6.8 9.2A5 5 0 0 0 7 19h9.5a4.5 4.5 0 0 0 2.6-.8',
    'M9.6 6.2A5.5 5.5 0 0 1 19 10.4a4.5 4.5 0 0 1 1.9 3.4',
  ],
  refresh: ['M20 12a8 8 0 1 1-2.6-5.9', 'M20.5 4.2v4.6H16'],
  location: [
    'M12 20.8s6.4-6 6.4-10.4a6.4 6.4 0 1 0-12.8 0C5.6 14.8 12 20.8 12 20.8Z',
    'M14.4 10.4a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0',
  ],
  pencil: ['M4.5 19.5h4l10-10-4-4-10 10z', 'M14.5 5.5l4 4'],
  file: ['M6.5 3.5h7l4.5 4.5v12h-11.5z', 'M13.5 3.5V8h4.5'],
  link: [
    'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1 1',
    'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1-1',
  ],
  hourglass: [
    'M7.5 3.5h9',
    'M7.5 20.5h9',
    'M8.5 3.5v3.2c0 1.7 3.5 3.6 3.5 5.3s-3.5 3.6-3.5 5.3v3.2',
    'M15.5 3.5v3.2c0 1.7-3.5 3.6-3.5 5.3s3.5 3.6 3.5 5.3v3.2',
  ],

  /* ── Transportmidler ─────────────────────────────────────────────────────
     Entur oppgir flere enn disse. Resten faller tilbake på bussen, fordi et
     ikon som er omtrent riktig er bedre enn et tomrom — og linjenummeret ved
     siden av sier uansett hva det er.                                        */
  bus: [
    'M5.5 4.5h13v12h-13z',
    'M5.5 9.5h13',
    'M9.9 18.6a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0',
    'M16.9 18.6a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0',
    'M8.5 13h.01',
    'M15.5 13h.01',
  ],
  train: [
    'M7.5 3.5h9v13h-9z',
    'M7.5 9.5h9',
    'M9.8 13h.01',
    'M14.2 13h.01',
    'M9.5 16.5L7.5 20.5',
    'M14.5 16.5l2 4',
  ],
  boat: ['M4 16.5l1.6 4h12.8l1.6-4z', 'M12 3.5v13', 'M12 6.5l5.5 3.5H12'],

  /* ── Vær ─────────────────────────────────────────────────────────────────
     Tolv former som dekker hele WMO-tabellen. Samme strektykkelse som resten
     av settet, slik at en sol ikke veier mer enn en buss.                     */
  sun: [
    'M16.4 12a4.4 4.4 0 1 1-8.8 0 4.4 4.4 0 0 1 8.8 0',
    'M12 2.8v2.2',
    'M12 19v2.2',
    'M2.8 12h2.2',
    'M19 12h2.2',
    'M5.5 5.5l1.6 1.6',
    'M16.9 16.9l1.6 1.6',
    'M18.5 5.5l-1.6 1.6',
    'M7.1 16.9l-1.6 1.6',
  ],
  moon: ['M20 14.4A8.4 8.4 0 0 1 9.6 4 8.4 8.4 0 1 0 20 14.4Z'],
  cloud: ['M7 19h10a3.6 3.6 0 0 0 .2-7.2 5.4 5.4 0 0 0-10.4 1 3.1 3.1 0 0 0 .2 6.2Z'],
  cloudSun: [
    'M13.8 7.6a3.1 3.1 0 1 0-5.3 2.2',
    'M8.8 2.6v1.5',
    'M3.6 7.6h1.5',
    'M5.2 4l1 1',
    'M12.4 4l-1 1',
    'M9.2 20.4h8.2a3.1 3.1 0 0 0 .2-6.2 4.7 4.7 0 0 0-9 .9 2.7 2.7 0 0 0 .6 5.3Z',
  ],
  cloudMoon: [
    'M14.6 9.4A4.6 4.6 0 0 1 9 3.9 4.6 4.6 0 1 0 14.6 9.4Z',
    'M9.2 20.4h8.2a3.1 3.1 0 0 0 .2-6.2 4.7 4.7 0 0 0-9 .9 2.7 2.7 0 0 0 .6 5.3Z',
  ],
  rain: [
    'M7 15.5h10a3.6 3.6 0 0 0 .2-7.2 5.4 5.4 0 0 0-10.4 1 3.1 3.1 0 0 0 .2 6.2Z',
    'M9 18v2.5',
    'M12.5 18v3',
    'M16 18v2.5',
  ],
  drizzle: [
    'M7 15.5h10a3.6 3.6 0 0 0 .2-7.2 5.4 5.4 0 0 0-10.4 1 3.1 3.1 0 0 0 .2 6.2Z',
    'M9.5 18.5v1.2',
    'M12.5 19v1.2',
    'M15.5 18.5v1.2',
  ],
  snow: [
    'M7 15.5h10a3.6 3.6 0 0 0 .2-7.2 5.4 5.4 0 0 0-10.4 1 3.1 3.1 0 0 0 .2 6.2Z',
    'M9.5 19h.01',
    'M12.5 20.5h.01',
    'M15.5 19h.01',
    'M12.5 18h.01',
  ],
  sleet: [
    'M7 15.5h10a3.6 3.6 0 0 0 .2-7.2 5.4 5.4 0 0 0-10.4 1 3.1 3.1 0 0 0 .2 6.2Z',
    'M9.5 18v2.5',
    'M12.5 19.5h.01',
    'M15.5 18v2.5',
  ],
  fog: ['M3.6 7.5h16.8', 'M3.6 11.5h16.8', 'M6.4 15.5h11.2', 'M8.4 19.5h7.2'],
  thunder: [
    'M7 14.5h10a3.6 3.6 0 0 0 .2-7.2 5.4 5.4 0 0 0-10.4 1 3.1 3.1 0 0 0 .2 6.2Z',
    'M12.8 16.2l-2.4 3.6h2.4l-1.6 2.9',
  ],
  wind: [
    'M3.6 8.5h10.6a2.5 2.5 0 1 0-2.5-2.5',
    'M3.6 13h13.1a2.5 2.5 0 1 1-2.5 2.5',
    'M3.6 17.5h7',
  ],
  droplet: ['M12 3.4c3 3.7 5 6.4 5 8.8a5 5 0 0 1-10 0c0-2.4 2-5.1 5-8.8Z'],
} as const satisfies Record<string, readonly string[]>

export type IconName = keyof typeof ICONS
