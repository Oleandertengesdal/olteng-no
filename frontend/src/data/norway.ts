/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  NORGESKART — geometri for de fem prisområdene
 *
 *  ÆRLIG OM PRESISJONEN: omrisset under er tegnet for hånd fra omtrentlige
 *  koordinater for kjente punkter langs kysten og riksgrensa. Det er godt nok
 *  til at Norge er gjenkjennelig og til at man ser hvilket område som er dyrest,
 *  men det er ikke et kartverk. Fjorder, øyer og Lofoten er utelatt, og
 *  grensene mellom prisområdene er forenklet til rette linjer.
 *
 *  Grensene mellom områdene følger dessuten kraftnettet, ikke fylkesgrenser, så
 *  selv en nøyaktig fylkesinndeling ville vært feil her.
 *
 *  Vil du bytte til ekte data senere: hent GeoJSON for prisområdene, konverter
 *  til samme [lengdegrad, breddegrad]-format og erstatt `ZONE_RINGS`. Resten av
 *  koden — projeksjonen, komponenten, fargene — trenger ikke å endres.
 *
 *  Alle punkter er [lengdegrad, breddegrad] i grader, slik GeoJSON gjør det.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ZoneId } from './power'

export type LngLat = [number, number]

/* ── Delte hjørner ─────────────────────────────────────────────────────────
   Der to prisområder møtes MÅ de bruke nøyaktig samme punkt. Deler de ikke
   koordinat, får du en hårfin hvit stripe mellom polygonene ved enkelte
   zoomnivåer. Derfor er møtepunktene navngitte konstanter og ikke tall som
   er skrevet inn to steder.                                                */

/** Kysten sør for Bergen, der NO2 møter NO5 (ved Haugesund) */
const COAST_NO2_NO5: LngLat = [5.55, 59.45]
/** Kysten nord for Bergen, der NO5 møter NO3 (ved Stad) */
const COAST_NO5_NO3: LngLat = [5.9, 62.2]
/** Kysten i Nordland, der NO3 møter NO4 (ved Saltfjellet) */
const COAST_NO3_NO4: LngLat = [12.5, 66.2]
/** Sørlandskysten, der NO2 møter NO1 (ved Kragerø) */
const COAST_NO2_NO1: LngLat = [9.3, 58.75]

/** Fjellknutepunktet der NO5, NO1 og NO2 møtes (Haukeli-traktene) */
const INLAND_NO5_NO1_NO2: LngLat = [7.5, 59.8]
/** Fjellknutepunktet der NO5, NO3 og NO1 møtes (Jotunheimen-traktene) */
const INLAND_NO5_NO3_NO1: LngLat = [8.5, 62.0]
/** Riksgrensa der NO3 møter NO1 (ved Røros) */
const BORDER_NO3_NO1: LngLat = [12.2, 62.6]
/** Riksgrensa der NO3 møter NO4 (ved Saltfjellet) */
const BORDER_NO3_NO4: LngLat = [14.6, 66.3]
/** Halden — der riksgrensa treffer sjøen */
const BORDER_COAST_SOUTH: LngLat = [11.39, 59.12]

/* ── Kyst- og grensestrekk ────────────────────────────────────────────────
   Hvert strekk går i én retning og gjenbrukes reversert der det trengs.    */

/** Sørkysten fra Lindesnes østover til Kragerø */
const SOUTH_COAST: LngLat[] = [
  [7.05, 58.0], // Lindesnes
  [8.0, 58.15], // Kristiansand
  [8.6, 58.4],
]

/** Vestkysten fra Lindesnes nordover til Haugesund */
const WEST_COAST_SOUTH: LngLat[] = [
  [5.73, 58.97], // Stavanger
  [5.3, 59.2],
]

/** Vestkysten fra Haugesund nordover til Stad */
const WEST_COAST_MID: LngLat[] = [
  [5.2, 59.9],
  [5.32, 60.39], // Bergen
  [4.95, 61.0],
  [5.1, 61.6],
]

/** Kysten fra Stad nordover til Saltfjellet */
const WEST_COAST_NORTH: LngLat[] = [
  [6.15, 62.47], // Ålesund
  [7.2, 63.05],
  [8.6, 63.65], // Kristiansund
  [9.7, 63.9],
  [11.3, 64.8], // Namsos
  [12.1, 65.6],
]

/** Kysten fra Saltfjellet rundt Nordkapp til Grense Jakobselv */
const NORTH_COAST: LngLat[] = [
  [13.2, 66.9],
  [14.4, 67.28], // Bodø
  [15.6, 68.2],
  [16.8, 68.7],
  [17.9, 69.35],
  [18.96, 69.65], // Tromsø
  [20.6, 70.1],
  [23.2, 70.65],
  [25.78, 71.17], // Nordkapp
  [27.6, 70.9],
  [29.2, 70.35],
  [30.9, 69.8], // Grense Jakobselv
]

/** Riksgrensa sørover fra Grense Jakobselv til Saltfjellet */
const BORDER_NORTH: LngLat[] = [
  [29.6, 69.55],
  [28.2, 69.1],
  [26.4, 69.75], // Finlands nordligste kile
  [25.3, 68.85],
  [23.6, 68.7],
  [22.3, 68.8],
  [21.0, 69.1],
  [20.2, 68.5],
  [18.1, 68.55],
  [17.2, 68.05],
  [16.1, 67.2],
  [15.5, 66.35],
]

/** Riksgrensa sørover fra Saltfjellet til Røros */
const BORDER_MID: LngLat[] = [
  [14.1, 65.3],
  [13.6, 64.6],
  [12.1, 63.6],
]

/** Riksgrensa sørover fra Røros til Halden */
const BORDER_SOUTH: LngLat[] = [
  [12.15, 61.6],
  [12.6, 61.05],
  [12.7, 60.1],
  [11.9, 59.6],
]

/** Oslofjorden og Vestfold-kysten, fra Halden vestover til Kragerø */
const OSLOFJORD_COAST: LngLat[] = [
  [10.7, 59.0],
  [10.1, 58.95],
]

/* ── De fem ringene ────────────────────────────────────────────────────────
   Hver ring er lukket implisitt: siste punkt bindes til det første.        */

export const ZONE_RINGS: Record<ZoneId, LngLat[]> = {
  // Sør-Norge: Agder og Rogaland
  NO2: [
    [7.05, 58.0],
    ...WEST_COAST_SOUTH,
    COAST_NO2_NO5,
    INLAND_NO5_NO1_NO2,
    COAST_NO2_NO1,
    ...[...SOUTH_COAST].reverse().slice(0, -1),
  ],

  // Vest-Norge: Vestland
  NO5: [COAST_NO2_NO5, ...WEST_COAST_MID, COAST_NO5_NO3, INLAND_NO5_NO3_NO1, INLAND_NO5_NO1_NO2],

  // Midt-Norge: Møre og Romsdal, Trøndelag og søndre Nordland
  NO3: [
    COAST_NO5_NO3,
    ...WEST_COAST_NORTH,
    COAST_NO3_NO4,
    BORDER_NO3_NO4,
    ...BORDER_MID,
    BORDER_NO3_NO1,
    INLAND_NO5_NO3_NO1,
  ],

  // Nord-Norge: nordre Nordland, Troms og Finnmark
  NO4: [COAST_NO3_NO4, ...NORTH_COAST, ...BORDER_NORTH, BORDER_NO3_NO4],

  // Øst-Norge: Oslo, Innlandet, Buskerud, Telemark og Vestfold
  NO1: [
    INLAND_NO5_NO3_NO1,
    BORDER_NO3_NO1,
    ...BORDER_SOUTH,
    BORDER_COAST_SOUTH,
    ...OSLOFJORD_COAST,
    COAST_NO2_NO1,
    INLAND_NO5_NO1_NO2,
  ],
}

/**
 * Der etiketten skal stå. Tyngdepunktet til en konkav ring havner fort utenfor
 * selve området — Norge er langt og bøyd — så disse er plassert for hånd.
 */
export const ZONE_LABEL_ANCHORS: Record<ZoneId, LngLat> = {
  NO1: [10.8, 60.6],
  NO2: [7.6, 58.7],
  NO3: [10.0, 63.6],
  NO4: [21.0, 69.4],
  NO5: [6.4, 60.8],
}

/* ── Projeksjon ────────────────────────────────────────────────────────────
   Web Mercator. Formelen er den samme som ligger under nesten alle nettkart,
   og den er kort nok til at det ville vært rart å dra inn et bibliotek.

   Mercator strekker nord — Finnmark blir bredere enn det er — men det er den
   projeksjonen folk er vant til å se Norge i, og den holder kysten
   gjenkjennelig.                                                            */

const RAD = Math.PI / 180

export const project = ([lng, lat]: LngLat): [number, number] => [
  lng * RAD,
  Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)),
]

export interface Projection {
  /** Projiser et punkt til SVG-koordinater innenfor viewBoxen */
  point: (position: LngLat) => [number, number]
  width: number
  height: number
}

/**
 * Regner ut hvordan alle ringene ligger, og skalerer dem inn i en boks med gitt
 * bredde. Høyden faller ut av geometrien i stedet for å gjettes — da slipper
 * man å stille inn viewBoxen på nytt hver gang et punkt justeres.
 */
export const buildProjection = (width: number, padding = 4): Projection => {
  const projected = Object.values(ZONE_RINGS).flat().map(project)

  const xs = projected.map(([x]) => x)
  const ys = projected.map(([, y]) => y)

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const inner = width - padding * 2
  const scale = inner / (maxX - minX)
  const height = (maxY - minY) * scale + padding * 2

  return {
    width,
    height,
    point: (position) => {
      const [x, y] = project(position)
      return [
        padding + (x - minX) * scale,
        // SVG teller y nedover, Mercator oppover
        padding + (maxY - y) * scale,
      ]
    },
  }
}

/** Ringen som en lukket SVG-sti */
export const ringToPath = (ring: LngLat[], projection: Projection): string =>
  ring
    .map((position, index) => {
      const [x, y] = projection.point(position)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ') + ' Z'
