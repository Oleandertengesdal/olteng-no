/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RUTENETT — ren logikk
 *
 *  Ingen DOM her. Alt som har med plassering å gjøre er funksjoner fra oppsett
 *  til oppsett, slik at flytting, endring av størrelse og pakking i rader kan
 *  testes uten en nettleser. Komponentene under layout/ tegner resultatet og
 *  gjør ingenting annet.
 *
 *  Rutenettet er 12 kolonner på skrivebord, 6 på nettbrett, 2 på mobil. Radene
 *  er faste i høyde og fylles i rekkefølge — ikke tettpakket. Tettpakking
 *  («dense») ser penere ut på en skjermdump og er umulig å styre med
 *  tastaturet, fordi en widget da hopper til et hull man ikke ser.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { WidgetSize } from '@/widgets/types.ts'

export const BREAKPOINTS = ['mobile', 'tablet', 'desktop'] as const
export type Breakpoint = (typeof BREAKPOINTS)[number]

export const COLUMNS: Record<Breakpoint, number> = {
  mobile: 2,
  tablet: 6,
  desktop: 12,
}

/** Samme knekkpunkter som Tailwind sine sm og lg. Ett sted å endre dem. */
export const breakpointFor = (width: number): Breakpoint => {
  if (width >= 1024) return 'desktop'
  if (width >= 640) return 'tablet'
  return 'mobile'
}

export interface LayoutItem {
  /** Unik for forekomsten, ikke for widget-typen. */
  id: string
  /** WidgetDefinition.id */
  widget: string
  w: number
  h: number
}

export type Layout = LayoutItem[]

/* ── Validering ────────────────────────────────────────────────────────────
   Kjøres på alt som kommer fra localStorage eller en importfil. Alt som ikke
   ser riktig ut forkastes i sin helhet framfor å repareres delvis — et halvt
   gjenopprettet oppsett er vanskeligere å forstå enn et tomt.                */

const isItem = (value: unknown): value is LayoutItem => {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.widget === 'string' &&
    item.widget.length > 0 &&
    Number.isInteger(item.w) &&
    (item.w as number) > 0 &&
    Number.isInteger(item.h) &&
    (item.h as number) > 0
  )
}

export const isLayout = (value: unknown): value is Layout =>
  Array.isArray(value) && value.every(isItem)

/**
 * Fjerner widgets som ikke lenger finnes i registeret.
 *
 * Dette skjer på ordentlig: en widget fjernes i en utgivelse, og noen har den
 * i oppsettet sitt. Alternativet til å luke den bort er en rute som prøver å
 * laste en komponent som ikke finnes.
 */
export const pruneUnknown = (layout: Layout, known: ReadonlySet<string>): Layout =>
  layout.filter((item) => known.has(item.widget))

/* ── Plassering ────────────────────────────────────────────────────────────  */

/** En widget kan aldri være bredere enn rutenettet den står i. */
export const clampWidth = (w: number, columns: number): number =>
  Math.max(1, Math.min(w, columns))

/**
 * Deler oppsettet i rader slik nettleseren kommer til å gjøre det.
 *
 * Vi trenger dette i JavaScript og ikke bare i CSS, fordi «flytt opp» med
 * tastaturet må vite hva raden over er. Uten det blir tastaturalternativet
 * bare «bytt plass med naboen», og da kan man ikke flytte en widget fra bunn
 * til topp uten tjue tastetrykk.
 */
export const packRows = (layout: Layout, columns: number): LayoutItem[][] => {
  const rows: LayoutItem[][] = []
  let current: LayoutItem[] = []
  let used = 0

  for (const item of layout) {
    const w = clampWidth(item.w, columns)
    if (used + w > columns && current.length > 0) {
      rows.push(current)
      current = []
      used = 0
    }
    current.push(item)
    used += w
  }

  if (current.length > 0) rows.push(current)
  return rows
}

/* ── Flytting ──────────────────────────────────────────────────────────────  */

export type MoveDirection = 'left' | 'right' | 'up' | 'down'

const indexOf = (layout: Layout, id: string): number => layout.findIndex((i) => i.id === id)

const move = (layout: Layout, from: number, to: number): Layout => {
  const next = layout.slice()
  const [item] = next.splice(from, 1)
  if (!item) return layout
  next.splice(to, 0, item)
  return next
}

/**
 * Flytter én widget én posisjon.
 *
 * Venstre og høyre bytter plass med naboen i rekkefølgen. Opp og ned hopper
 * til begynnelsen av raden over eller slutten av raden under, som er det som
 * føles riktig når man ser på rutenettet framfor på tabellen.
 *
 * Returnerer det samme oppsettet uendret hvis flyttingen ikke er mulig, slik
 * at den som kaller kan sammenligne referansene for å vite om noe skjedde.
 */
export const moveItem = (
  layout: Layout,
  id: string,
  direction: MoveDirection,
  columns: number,
): Layout => {
  const index = indexOf(layout, id)
  if (index < 0) return layout

  if (direction === 'left') {
    return index === 0 ? layout : move(layout, index, index - 1)
  }
  if (direction === 'right') {
    return index === layout.length - 1 ? layout : move(layout, index, index + 1)
  }

  const rows = packRows(layout, columns)
  const rowIndex = rows.findIndex((row) => row.some((item) => item.id === id))
  if (rowIndex < 0) return layout

  if (direction === 'up') {
    if (rowIndex === 0) return layout
    const target = indexOf(layout, rows[rowIndex - 1]![0]!.id)
    return move(layout, index, target)
  }

  // ned
  if (rowIndex === rows.length - 1) return layout
  const below = rows[rowIndex + 1]!
  const target = indexOf(layout, below[below.length - 1]!.id)
  return move(layout, index, target)
}

/** Flytting med pekeren: slipp widget `id` på plassen til `targetId`. */
export const moveItemTo = (layout: Layout, id: string, targetId: string): Layout => {
  const from = indexOf(layout, id)
  const to = indexOf(layout, targetId)
  if (from < 0 || to < 0 || from === to) return layout
  return move(layout, from, to)
}

/* ── Størrelse ─────────────────────────────────────────────────────────────  */

export type ResizeDirection = 'grow' | 'shrink'

/** Minste først. Areal, og bredde som tiebreak — en 4×1 er «mindre» enn en 2×2. */
const bySize = (a: WidgetSize, b: WidgetSize): number => a.w * a.h - b.w * b.h || a.w - b.w

/**
 * Går ett steg opp eller ned i widgetens egen liste over tillatte størrelser.
 *
 * Ikke fri endring av størrelse. En widget vet hvilke former den ser bra ut i,
 * og en bruker som kan dra en klokke til 1×5 har fått muligheten til å ødelegge
 * sitt eget dashbord uten å ville det.
 */
export const resizeItem = (
  layout: Layout,
  id: string,
  allowed: WidgetSize[],
  direction: ResizeDirection,
): Layout => {
  const index = indexOf(layout, id)
  if (index < 0 || allowed.length === 0) return layout

  const item = layout[index]!
  const sizes = allowed.slice().sort(bySize)
  const current = sizes.findIndex((s) => s.w === item.w && s.h === item.h)

  // Ukjent størrelse (kan komme fra en eldre lagret utgave): begynn på minste.
  const from = current < 0 ? 0 : current
  const to = direction === 'grow' ? from + 1 : from - 1
  const next = sizes[to]
  if (!next) return layout

  const copy = layout.slice()
  copy[index] = { ...item, w: next.w, h: next.h }
  return copy
}

/* ── Legge til og fjerne ───────────────────────────────────────────────────  */

/**
 * Forekomst-id. Ikke crypto.randomUUID: den finnes ikke i usikker kontekst,
 * og et dashbord som kjøres fra file:// eller over http på et lokalnett skal
 * også virke. Tidsstempel pluss tilfeldig suffiks er nok når det eneste kravet
 * er å være unik innenfor én brukers oppsett.
 */
export const newInstanceId = (widget: string): string =>
  `${widget}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export const addItem = (layout: Layout, widget: string, size: WidgetSize): Layout => [
  ...layout,
  { id: newInstanceId(widget), widget, w: size.w, h: size.h },
]

export const removeItem = (layout: Layout, id: string): Layout =>
  layout.filter((item) => item.id !== id)
