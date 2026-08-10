/**
 * Tekst som bor i datafiler framfor i oversettelsesfilene.
 *
 * Grensesnittstrenger hører hjemme i locales/*.json. Men widget-definisjoner,
 * lærestedskataloger og lignende er *data*, og da er det enklere at teksten
 * står ved siden av det den beskriver enn at den ligger i en flat nøkkelfil
 * langt unna. Begge språk er påkrevd av typen, slik at det ikke går an å legge
 * til en widget og glemme engelsk.
 */
export interface Bilingual {
  nb: string
  en: string
}

export type Locale = keyof Bilingual

export const LOCALES: readonly Locale[] = ['nb', 'en'] as const

export const isLocale = (value: unknown): value is Locale =>
  value === 'nb' || value === 'en'

export const pick = (text: Bilingual, locale: Locale): string => text[locale]
