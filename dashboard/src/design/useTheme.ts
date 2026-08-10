/**
 * Fargemodus som tilstand.
 *
 * Valget kan være en av de fem modusene, eller «system» — som er et eget valg
 * og ikke en sjette modus. Skillet betyr noe: velger man Papir eksplisitt, skal
 * siden bli værende lys når mobilen slår om til mørk modus klokka ti om
 * kvelden. Velger man «system», skal den ikke det.
 */

import { computed, ref, watch, type Ref } from 'vue'
import { DEFAULT_THEME, SYSTEM_PAIR, THEMES, isThemeId, type ThemeId } from './themes.ts'
import { KEY, read, write } from '@/data/storage.ts'

export type ThemeChoice = ThemeId | 'system'

const isChoice = (value: unknown): value is ThemeChoice =>
  value === 'system' || isThemeId(value)

const media = (): MediaQueryList | null =>
  typeof window !== 'undefined' && 'matchMedia' in window
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

/* Modulnivå, ikke per komponent. Alle som spør skal få samme tilstand —
   ellers ender modusvelgeren i toppen og en widget som leser modusen opp med
   hvert sitt svar.                                                           */

const choice: Ref<ThemeChoice> = ref(read<ThemeChoice>(KEY.theme, 'system', isChoice))
const systemDark = ref(media()?.matches ?? false)

media()?.addEventListener('change', (event) => {
  systemDark.value = event.matches
})

/** Modusen som faktisk gjelder nå, etter at «system» er løst opp. */
const active = computed<ThemeId>(() =>
  choice.value === 'system'
    ? systemDark.value
      ? SYSTEM_PAIR.dark
      : SYSTEM_PAIR.light
    : choice.value,
)

const apply = (id: ThemeId): void => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = id

  // theme-color styrer fargen på nettleserens adressefelt og statuslinje på
  // mobil. Uten den blir det en lys stripe over et mørkt dashbord.
  const theme = THEMES.find((t) => t.id === id)
  if (!theme) return
  const [r, g, b] = theme.tokens.paper
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', `rgb(${r} ${g} ${b})`)
}

watch(active, apply, { immediate: true })
watch(choice, (value) => write(KEY.theme, value))

export const useTheme = () => ({
  /** Brukerens valg, inkludert «system». */
  choice,
  /** Modusen som gjelder nå. */
  active,
  /** Alle fem, i rekkefølgen de skal vises. */
  themes: THEMES,
  setTheme: (value: ThemeChoice) => {
    choice.value = value
  },
  /** Er «system» valgt, og hva peker det på nå. */
  systemResolvesTo: computed<ThemeId>(() =>
    systemDark.value ? SYSTEM_PAIR.dark : SYSTEM_PAIR.light,
  ),
  DEFAULT_THEME,
})
