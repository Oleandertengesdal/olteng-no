/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LENKESØK — ren logikk
 *
 *  Søket er måten folk kommer til å bruke katalogen når de først har lært seg
 *  den. Tre ting det må tåle:
 *
 *  1. At man skriver systemets navn. «inspera» skal treffe Inspera.
 *  2. At man *ikke* husker navnet. «eksamen» skal også treffe Inspera, fordi
 *     nøkkelordene sier hva det er til. Det er hele grunnen til at hver lenke
 *     har en merknad og nøkkelord.
 *  3. At man ikke gidder å skrive æ, ø og å. «lanekassen» skal treffe
 *     Lånekassen. Det er ikke slurv — det er et tastatur i en fart.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Locale } from '../bilingual.ts'
import { GROUP_LABEL, type LinkEntry } from './types.ts'

/**
 * Gjør tekst sammenlignbar.
 *
 * æ, ø og å foldes til ae, o og a. Ikke fordi de er feil, men fordi noen som
 * søker raskt skriver «lanekassen», og et søk som ikke finner Lånekassen da er
 * et søk som ikke virker. Foldingen går bare én vei: «lån» treffer fortsatt.
 */
export const fold = (text: string): string =>
  text
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    // Kombinerende aksenter: é blir e, slik at «Tromso» treffer «Tromsø» og
    // «Ålesund» treffer uansett hvilken vei brukeren skriver det.
    .replace(/[̀-ͯ]/g, '')
    .trim()

/**
 * Poeng for hvor godt én lenke passer ett søkeord.
 *
 * Rekkefølgen på testene er rangeringen: navnet veier tyngst, deretter
 * nøkkelord, deretter merknaden. En lenke som *heter* det du søkte etter skal
 * alltid ligge over en som bare nevner det.
 */
const scoreOne = (entry: LinkEntry, term: string, locale: Locale): number => {
  const label = fold(entry.link.label)
  if (label === term) return 120
  if (label.startsWith(term)) return 100
  if (label.includes(term)) return 70

  const keywords = (entry.link.keywords ?? []).map(fold)
  if (keywords.some((k) => k === term)) return 60
  if (keywords.some((k) => k.startsWith(term))) return 50

  if (fold(entry.link.note[locale]).includes(term)) return 30
  if (fold(GROUP_LABEL[entry.group][locale]).includes(term)) return 10

  // Adressen teller lavest. Den treffer på «uio» i uio.no, som er nyttig, men
  // aldri mer nyttig enn et navn.
  if (fold(entry.link.url).includes(term)) return 5

  return 0
}

/**
 * Søk over alle lenker.
 *
 * Flere ord må alle treffe — «uib bibliotek» skal gi UiBs bibliotek og ikke
 * alt som handler om enten UiB eller bibliotek. Poengsummen er summen, slik
 * at en lenke som treffer begge ordene godt havner øverst.
 */
export const searchEntries = (query: string, entries: LinkEntry[], locale: Locale): LinkEntry[] => {
  const terms = fold(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  const scored: { entry: LinkEntry; score: number }[] = []

  for (const entry of entries) {
    let total = 0
    for (const term of terms) {
      const score = scoreOne(entry, term, locale)
      if (score === 0) {
        total = 0
        break
      }
      total += score
    }
    if (total > 0) scored.push({ entry, score: total })
  }

  return scored
    .sort((a, b) => b.score - a.score || a.entry.link.label.localeCompare(b.entry.link.label, 'nb'))
    .map((s) => s.entry)
}

/* ── Ferskhet ──────────────────────────────────────────────────────────────  */

/**
 * Hele måneder siden lærestedet sist ble gjennomgått.
 *
 * Kalendermåneder, ikke dager delt på tretti. «Fire måneder siden» skal bety
 * fire månedsskifter, som er slik folk regner.
 */
export const monthsSince = (reviewed: string, now: Date): number => {
  const [year, month, day] = reviewed.split('-').map(Number)
  if (!year || !month || !day) return Infinity

  let months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
  // Har ikke dagen i måneden passert ennå, er måneden ikke fylt.
  if (now.getDate() < day) months -= 1
  return Math.max(0, months)
}

/**
 * Er gjennomgangen gammel nok til at siden bør si fra?
 *
 * Seks måneder er valgt fordi det er omtrent et semester. Et lærested rekker
 * å bytte læringsplattform på den tiden — NTNU gjorde nettopp det.
 */
export const isStaleReview = (reviewed: string, now: Date, months = 6): boolean =>
  monthsSince(reviewed, now) >= months
