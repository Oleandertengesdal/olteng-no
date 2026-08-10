/**
 * Oppsettet som tilstand.
 *
 * Modulnivå, ikke per komponent: toppfeltet, rutenettet og widget-velgeren
 * skal se det samme oppsettet, og et oppsett som finnes i tre eksemplarer er
 * tre oppsett som kan bli uenige.
 */

import { computed, ref, watch, type Ref } from 'vue'
import { KEY, read, write } from '@/data/storage.ts'
import { WIDGET_IDS, widgetById } from '@/widgets/registry.ts'
import {
  COLUMNS,
  addItem,
  breakpointFor,
  isLayout,
  moveItem,
  moveItemTo,
  pruneUnknown,
  removeItem,
  resizeItem,
  type Layout,
  type MoveDirection,
  type ResizeDirection,
} from './grid.ts'
import { buildPreset, type Preset } from './presets.ts'

/**
 * `null` og `[]` er forskjellige svar.
 *
 * null betyr «har aldri satt opp dashbordet» og skal møtes med et forslag.
 * [] betyr «har fjernet alt med vilje» og skal ikke overkjøres med et forslag
 * brukeren nettopp takket nei til.
 */
const stored = read<Layout | null>(KEY.layout, null, (v): v is Layout | null =>
  v === null ? true : isLayout(v),
)

const layout: Ref<Layout> = ref(stored ? pruneUnknown(stored, WIDGET_IDS) : [])

/** Har brukeren valgt et oppsett, uansett hva det ble? */
const configured = ref(stored !== null)

watch(
  layout,
  (value) => {
    if (configured.value) write(KEY.layout, value)
  },
  { deep: true },
)

/* ── Skjermbredde ──────────────────────────────────────────────────────────
   Kolonnetallet må finnes i JavaScript og ikke bare i CSS, fordi
   tastaturflytting trenger å vite hva raden over er. */

const viewportWidth = ref(typeof window === 'undefined' ? 1280 : window.innerWidth)

if (typeof window !== 'undefined') {
  let frame = 0
  window.addEventListener('resize', () => {
    // Ett kall per tegning. Uten dette kjører håndteringen hundrevis av ganger
    // mens man drar i vinduskanten.
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      viewportWidth.value = window.innerWidth
    })
  })
}

const breakpoint = computed(() => breakpointFor(viewportWidth.value))
const columns = computed(() => COLUMNS[breakpoint.value])

/* ── Redigeringsmodus ──────────────────────────────────────────────────────  */

const editing = ref(false)

export const useLayout = () => ({
  layout,
  configured,
  editing,
  breakpoint,
  columns,

  add: (widgetId: string) => {
    const definition = widgetById(widgetId)
    if (!definition) return
    configured.value = true
    layout.value = addItem(layout.value, definition.id, definition.defaultSize)
  },

  remove: (id: string) => {
    configured.value = true
    layout.value = removeItem(layout.value, id)
  },

  move: (id: string, direction: MoveDirection) => {
    layout.value = moveItem(layout.value, id, direction, columns.value)
  },

  dropOn: (id: string, targetId: string) => {
    layout.value = moveItemTo(layout.value, id, targetId)
  },

  resize: (id: string, direction: ResizeDirection) => {
    const item = layout.value.find((i) => i.id === id)
    const definition = item && widgetById(item.widget)
    if (!definition) return
    layout.value = resizeItem(layout.value, id, definition.sizes, direction)
  },

  applyPreset: (preset: Preset) => {
    configured.value = true
    layout.value = buildPreset(preset)
  },

  /** Tømmer dashbordet uten å glemme at brukeren har satt det opp. */
  clear: () => {
    configured.value = true
    layout.value = []
  },

  /**
   * Leser oppsettet inn på nytt fra lagringen. Kalles etter import, som
   * skriver rett til localStorage og ikke gjennom denne modulen.
   */
  reload: () => {
    const next = read<Layout | null>(KEY.layout, null, (v): v is Layout | null =>
      v === null ? true : isLayout(v),
    )
    configured.value = next !== null
    layout.value = next ? pruneUnknown(next, WIDGET_IDS) : []
  },
})
