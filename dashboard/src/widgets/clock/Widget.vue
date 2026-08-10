<script setup lang="ts">
/**
 * Klokke, dato, ukenummer og studieuke.
 *
 * Ukenummeret er poenget. Norske timeplaner, studieplaner og frister er
 * skrevet i uker, og «uke 37» er noe man ellers må slå opp.
 */

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import type { WidgetProps } from '../types.ts'
import {
  DEFAULT_SEMESTER,
  isSemesterConfig,
  isoWeek,
  msToNextSecond,
  semesterProgress,
  type SemesterConfig,
} from './logic.ts'

const props = defineProps<WidgetProps>()
const { t, locale } = useI18n()

interface ClockSettings {
  showSeconds: boolean
  semester: SemesterConfig
}

const isClockSettings = (value: unknown): value is ClockSettings => {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return typeof s.showSeconds === 'boolean' && isSemesterConfig(s.semester)
}

const settings = useWidgetSettings<ClockSettings>(
  props.instanceId,
  { showSeconds: false, semester: DEFAULT_SEMESTER },
  isClockSettings,
)

/* ── Tikking ───────────────────────────────────────────────────────────────
   setInterval(1000) driver: den starter midt i et sekund og blir liggende der,
   så sifferet skifter et halvt sekund etter tiden. Her planlegges hver
   oppdatering til akkurat sekundskiftet, og tiden leses på nytt fra klokka
   hver gang framfor å telles opp — da spiller det ingen rolle om nettleseren
   struper tidtakeren mens fanen ligger i bakgrunnen.                          */

const now = ref(new Date())
let timer = 0

const tick = () => {
  now.value = new Date()
  timer = window.setTimeout(tick, msToNextSecond(Date.now()))
}

const onVisibility = () => {
  // Kom fanen tilbake etter en time i bakgrunnen, kan tidtakeren ha ligget
  // nede lenge. Les klokka på nytt med en gang framfor å vente på neste tikk.
  if (document.visibilityState === 'visible') now.value = new Date()
}

onMounted(() => {
  tick()
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  window.clearTimeout(timer)
  document.removeEventListener('visibilitychange', onVisibility)
})

/* ── Formatering ───────────────────────────────────────────────────────────
   Intl, ikke et datobibliotek. Norsk får nb-NO; engelsk får en-GB framfor
   en-US, fordi et verktøy for studenter i Norge skal vise 14:30 og ikke
   2:30 PM uansett hvilket språk grensesnittet står på.                       */

const intlLocale = computed(() => (locale.value === 'nb' ? 'nb-NO' : 'en-GB'))

const timeParts = computed(() => {
  const d = now.value
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    hm: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    s: pad(d.getSeconds()),
  }
})

const dateText = computed(() =>
  new Intl.DateTimeFormat(intlLocale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now.value),
)

const week = computed(() => isoWeek(now.value))
const progress = computed(() => semesterProgress(now.value, settings.value.semester))

/** Andel av minuttet som er gått. Vises som en hårfin strek, ikke som pynt. */
const secondFraction = computed(() => now.value.getSeconds() / 60)

/** Ved sekund 0 hopper streken tilbake. Da skal den ikke animere bakover. */
const wrapping = computed(() => now.value.getSeconds() === 0)

/** Den største størrelsen har plass til mer luft og et større tall. */
const large = computed(() => props.size.w >= 6)
</script>

<template>
  <div class="flex h-full flex-col justify-between p-4">
    <div>
      <p
        class="tnum font-display leading-none text-ink"
        :class="large ? 'text-6xl' : 'text-4xl'"
      >
        <time :datetime="now.toISOString()">{{ timeParts.hm }}</time
        ><span
          v-if="settings.showSeconds"
          class="ml-1 font-mono text-muted"
          :class="large ? 'text-2xl' : 'text-base'"
          >{{ timeParts.s }}</span
        >
      </p>

      <!-- Sekundene gjennom minuttet. Dette er data og ikke dekorasjon: streken
           er en klokke i seg selv når man ikke vil ha sifrene. -->
      <div class="mt-2 h-px w-full bg-line" aria-hidden="true">
        <div
          class="h-px bg-accent"
          :class="wrapping ? '' : 'transition-[width] duration-1000 ease-linear'"
          :style="{ width: `${secondFraction * 100}%` }"
        ></div>
      </div>

      <p class="mt-2 text-sm capitalize text-muted" :class="large ? 'text-base' : ''">
        {{ dateText }}
      </p>
    </div>

    <dl class="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line pt-2">
      <div class="flex items-baseline gap-1.5">
        <dt class="eyebrow">{{ t('clock.week') }}</dt>
        <dd class="tnum font-mono text-sm text-ink">{{ week }}</dd>
      </div>

      <div class="flex items-baseline gap-1.5">
        <dt class="eyebrow">{{ t('clock.studyWeek') }}</dt>
        <dd class="tnum font-mono text-sm text-ink">
          <template v-if="progress">
            {{ progress.week }}<span class="text-faint">/{{ progress.total }}</span>
            <!-- Semesterukene er typiske, ikke lærestedets egne. Da skal det
                 stå at tallet er et anslag, ikke bare stå der som et faktum. -->
            <span class="ml-1 font-sans text-[0.7rem] normal-case text-faint">
              {{ t('clock.estimate') }}
            </span>
          </template>
          <template v-else>
            <span class="text-muted">{{ t('clock.betweenSemesters') }}</span>
          </template>
        </dd>
      </div>
    </dl>
  </div>
</template>
