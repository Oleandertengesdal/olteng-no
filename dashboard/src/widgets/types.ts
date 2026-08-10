/**
 * Kontrakten en widget må oppfylle.
 *
 * En widget vet ingenting om de andre. Den kjenner sin egen størrelse, sine
 * egne innstillinger og sin egen datakilde — og ingenting mer. Det er hele
 * grunnen til at et API som er nede gir en rolig tilstand i én rute framfor et
 * tomt dashbord.
 */

import type { Component } from 'vue'
import type { Bilingual } from '@/data/bilingual.ts'
import type { IconName } from '@/components/icons.ts'

export const CATEGORIES = ['day', 'study', 'money', 'life', 'tools', 'break'] as const
export type WidgetCategory = (typeof CATEGORIES)[number]

export const CATEGORY_LABEL: Record<WidgetCategory, Bilingual> = {
  day: { nb: 'Dagen din', en: 'Your day' },
  study: { nb: 'Studie', en: 'Study' },
  money: { nb: 'Penger', en: 'Money' },
  life: { nb: 'Hverdag', en: 'Everyday' },
  tools: { nb: 'Verktøy', en: 'Tools' },
  break: { nb: 'Pauser', en: 'Breaks' },
}

/** Størrelse i rutenettceller. */
export interface WidgetSize {
  w: number
  h: number
}

export interface WidgetDefinition {
  id: string
  title: Bilingual
  description: Bilingual
  category: WidgetCategory
  icon: IconName
  /**
   * Hvilke størrelser widgeten faktisk fungerer i. Ikke et intervall — en
   * liste. En klokke som er én celle bred og fire høy er ikke en klokke,
   * og det er enklere å nekte for det enn å designe rundt det.
   */
  sizes: WidgetSize[]
  defaultSize: WidgetSize
  /**
   * Trenger den nett? Da *må* den ha en frakoblet tilstand, og velgeren
   * merker den slik at brukeren vet hva som slutter å virke på toget.
   */
  needsNetwork: boolean
  /**
   * Dynamisk import. Selve komponenten lastes først når widgeten står på
   * dashbordet — velgeren viser alle uten å laste noen.
   */
  component: () => Promise<{ default: Component }>
  /** Innstillingsskjema. Utelates av widgets som ikke har noe å stille på. */
  settings?: () => Promise<{ default: Component }>
}

/**
 * Det widgeten får inn. `instanceId` er nøkkelen til dens egne innstillinger —
 * to klokker på samme dashbord skal kunne vise hver sin tidssone.
 */
export interface WidgetProps {
  instanceId: string
  size: WidgetSize
}
