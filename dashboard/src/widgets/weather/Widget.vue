<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import WidgetState from '@/components/WidgetState.vue'
import DataAge from '@/components/DataAge.vue'
import { useRemote } from '@/data/useRemote.ts'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import type { WidgetProps } from '../types.ts'
import { ATTRIBUTION, fetchForecast } from './api.ts'
import {
  describeCode,
  linePath,
  linePoints,
  parseForecast,
  placeKey,
  precipitationBars,
  temperatureScale,
  totalPrecipitation,
  upcomingHours,
} from './logic.ts'
import { DEFAULT_WEATHER_SETTINGS, isWeatherSettings, type WeatherSettings } from './settings.ts'

const props = defineProps<WidgetProps>()
const emit = defineEmits<{ openSettings: [] }>()

const { t, locale } = useI18n()
const lang = computed(() => locale.value as 'nb' | 'en')

const settings = useWidgetSettings<WeatherSettings>(
  props.instanceId,
  DEFAULT_WEATHER_SETTINGS,
  isWeatherSettings,
)

/* ── Data ──────────────────────────────────────────────────────────────────
   Cachenøkkelen er koordinatene, ikke widget-forekomsten. To værwidgets som
   viser Trondheim deler dermed ett svar, og et sted man bytter fram og
   tilbake til henter ingenting på nytt.                                      */

const { data, fetchedAt, loading, error, stale, refresh } = useRemote<unknown>({
  key: () => (settings.value.place ? placeKey(settings.value.place) : 'weather.none'),
  load: (signal) => {
    const place = settings.value.place
    if (!place) return Promise.resolve({ ok: false as const, error: { kind: 'offline' as const } })
    return fetchForecast(place, signal)
  },
  // Varselet oppdateres hos kilden noen ganger i timen. En halvtime er
  // rikelig ferskt, og holder oss unna å mase på en gratis tjeneste.
  maxAgeMs: 30 * 60 * 1000,
  refreshMs: 15 * 60 * 1000,
})

const weather = computed(() => (data.value ? parseForecast(data.value) : null))
const hours = computed(() => (weather.value ? upcomingHours(weather.value.hours, new Date(), 12) : []))

const now = computed(() => (weather.value ? describeCode(weather.value.code, weather.value.isDay) : null))

/* ── Kurven ────────────────────────────────────────────────────────────────
   Fast viewBox som strekkes til ruta. Strekene får vector-effect, slik at de
   holder tykkelsen sin selv om koordinatsystemet strekkes ulikt i x og y —
   ellers ville kurven blitt tynnere i en bred widget enn i en smal.          */

const W = 240
const H = 100
const CURVE_H = 66
const BAR_H = 26

const scale = computed(() => temperatureScale(hours.value.map((h) => h.temperature)))
const points = computed(() => linePoints(hours.value.map((h) => h.temperature), scale.value, W, CURVE_H))
const path = computed(() => linePath(points.value))
const bars = computed(() => precipitationBars(hours.value.map((h) => h.precipitation), W, BAR_H))
const totalRain = computed(() => totalPrecipitation(hours.value.map((h) => h.precipitation)))

/** Fire etiketter langs bunnen. Flere blir uleselig i en smal widget. */
const labels = computed(() => {
  const n = hours.value.length
  if (n < 2) return []
  const wanted = [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1]
  return [...new Set(wanted)].map((i) => {
    const hour = hours.value[i]!
    return {
      index: i,
      percent: (i / (n - 1)) * 100,
      text: new Date(hour.time).toLocaleTimeString(lang.value === 'nb' ? 'nb-NO' : 'en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  })
})

/** Kurven er bare synlig informasjon. Dette er den samme informasjonen i ord. */
const curveSummary = computed(() => {
  if (hours.value.length === 0) return ''
  const temps = hours.value.map((h) => h.temperature)
  return t('weather.curveSummary', {
    low: Math.round(Math.min(...temps)),
    high: Math.round(Math.max(...temps)),
    hours: hours.value.length,
    mm: totalRain.value.toLocaleString(lang.value === 'nb' ? 'nb-NO' : 'en-GB'),
  })
})

const compact = computed(() => props.size.w <= 4)
</script>

<template>
  <div class="flex h-full flex-col">
    <WidgetState
      v-if="!settings.place"
      kind="empty"
      :title="t('weather.noPlace')"
      :message="t('weather.noPlaceNote')"
      :action-label="t('weather.choosePlace')"
      @action="emit('openSettings')"
    />

    <WidgetState v-else-if="!weather && loading" kind="loading" />

    <WidgetState
      v-else-if="!weather"
      kind="error"
      :error="error"
      :action-label="t('remote.retry')"
      @action="refresh(true)"
    />

    <template v-else>
      <div class="flex min-h-0 flex-1 flex-col p-3">
        <div class="flex items-start gap-3">
          <AppIcon v-if="now" :name="now.icon" :size="compact ? 28 : 34" class="mt-0.5 text-accent" />

          <div class="min-w-0 flex-1">
            <p class="flex items-baseline gap-2">
              <span class="tnum font-display leading-none text-ink" :class="compact ? 'text-3xl' : 'text-4xl'">
                {{ Math.round(weather.temperature) }}&deg;
              </span>
              <span class="tnum font-mono text-[0.7rem] text-muted">
                {{ t('weather.feelsLike', { value: Math.round(weather.apparent) }) }}
              </span>
            </p>
            <p class="mt-1 truncate text-xs text-muted">
              {{ now?.label[lang] }}
              <template v-if="weather.windSpeed !== null">
                <span class="text-faint"> &middot; </span>
                {{ t('weather.wind', { value: Math.round(weather.windSpeed) }) }}
              </template>
            </p>
          </div>

          <p class="min-w-0 shrink truncate text-right font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint">
            {{ settings.place.name }}
          </p>
        </div>

        <!-- Tolv timer -->
        <figure class="mt-3 flex min-h-0 flex-1 flex-col">
          <figcaption class="sr-only">{{ curveSummary }}</figcaption>

          <svg
            class="min-h-[46px] w-full flex-1"
            :viewBox="`0 0 ${W} ${H}`"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              :d="path"
              fill="none"
              stroke="currentColor"
              class="text-accent"
              stroke-width="1.5"
              stroke-linejoin="round"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
            <g class="text-muted">
              <rect
                v-for="(bar, i) in bars"
                :key="i"
                :x="bar.x"
                :y="H - bar.height"
                :width="bar.width"
                :height="bar.height"
                fill="currentColor"
                opacity="0.45"
              />
            </g>
            <line
              :x1="0"
              :y1="H"
              :x2="W"
              :y2="H"
              stroke="currentColor"
              class="text-line"
              stroke-width="1"
              vector-effect="non-scaling-stroke"
            />
          </svg>

          <div class="relative mt-1 h-3">
            <span
              v-for="label in labels"
              :key="label.index"
              class="tnum absolute top-0 font-mono text-[0.6rem] text-faint"
              :style="{
                left: `${label.percent}%`,
                transform:
                  label.percent === 0
                    ? 'none'
                    : label.percent === 100
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
              }"
            >
              {{ label.text }}
            </span>
          </div>
        </figure>

        <p v-if="totalRain > 0" class="mt-1 font-mono text-[0.65rem] text-muted">
          {{ t('weather.totalRain', { mm: totalRain.toLocaleString(lang === 'nb' ? 'nb-NO' : 'en-GB') }) }}
        </p>
      </div>

      <DataAge
        :fetched-at="fetchedAt"
        :stale="stale"
        :loading="loading"
        :source="ATTRIBUTION"
        @refresh="refresh(true)"
      />
    </template>
  </div>
</template>
