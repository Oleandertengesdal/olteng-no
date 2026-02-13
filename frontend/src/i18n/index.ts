import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import nb from '../locales/nb.json'

const i18n = createI18n({
  legacy: false,
  locale: 'nb', // set default locale to Norwegian
  fallbackLocale: 'en',
  messages: {
    en,
    nb
  }
})

export default i18n
