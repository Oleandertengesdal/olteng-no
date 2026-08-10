/**
 * Norsk først, engelsk som alternativ.
 *
 * Rekkefølgen er ikke bare et standardvalg: nb er kilden, og engelsk er
 * oversettelsen. Derfor er reservespråket norsk og ikke engelsk — mangler en
 * nøkkel på engelsk, er norsk teksten som faktisk finnes, og en norsk streng i
 * et engelsk grensesnitt er mindre feil enn en tom plass eller en nøkkel.
 */

import { createI18n } from 'vue-i18n'
import nb from '@/locales/nb.json'
import en from '@/locales/en.json'
import { KEY, read, write } from '@/data/storage.ts'
import { isLocale, type Locale } from '@/data/bilingual.ts'

const initial = read<Locale>(KEY.locale, 'nb', isLocale)

export const i18n = createI18n({
  legacy: false,
  locale: initial,
  fallbackLocale: 'nb',
  messages: { nb, en },
})

/** BCP 47-koden som hører til hvert språk. Norsk bokmål er nb, ikke no. */
const HTML_LANG: Record<Locale, string> = { nb: 'nb', en: 'en' }

export const setLocale = (locale: Locale): void => {
  i18n.global.locale.value = locale
  write(KEY.locale, locale)
  // Riktig lang-attributt er ikke pynt: det avgjør hvilken stemme en
  // skjermleser bruker, og hvordan nettleseren deler ord ved linjeskift.
  document.documentElement.lang = HTML_LANG[locale]
}

export const currentLocale = (): Locale => i18n.global.locale.value as Locale

if (typeof document !== 'undefined') {
  document.documentElement.lang = HTML_LANG[initial]
}
