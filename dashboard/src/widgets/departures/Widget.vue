<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import WidgetState from '@/components/WidgetState.vue'
import DataAge from '@/components/DataAge.vue'
import { useRemote } from '@/data/useRemote.ts'
import { useNow } from '@/data/useNow.ts'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import type { WidgetProps } from '../types.ts'
import { ATTRIBUTION, fetchDepartures } from './api.ts'
import { delayMinutes, modeIcon, parseDepartures, stillUpcoming, waitDisplay } from './logic.ts'
import {
  DEFAULT_DEPARTURES_SETTINGS,
  isDeparturesSettings,
  type DeparturesSettings,
} from './settings.ts'

const props = defineProps<WidgetProps>()
const emit = defineEmits<{ openSettings: [] }>()

const { t, locale } = useI18n()
const intlLocale = computed(() => (locale.value === 'nb' ? 'nb-NO' : 'en-GB'))

const settings = useWidgetSettings<DeparturesSettings>(
  props.instanceId,
  DEFAULT_DEPARTURES_SETTINGS,
  isDeparturesSettings,
)

const activeStop = computed(
  () => settings.value.stops.find((s) => s.id === settings.value.activeId) ?? settings.value.stops[0] ?? null,
)

/* Sanntid må være fersk for å være sanntid. 45 sekunder er hyppig nok til at
   tallet stemmer når man ser på det, og sjeldent nok til å være en høflig
   gjest hos et gratis API. Hentingen står stille mens fanen er i bakgrunnen. */

const { data, fetchedAt, loading, error, stale, refresh } = useRemote<unknown>({
  key: () => `departures.${activeStop.value?.id ?? 'none'}.${settings.value.count}`,
  load: (signal) => {
    const stop = activeStop.value
    if (!stop) return Promise.resolve({ ok: false as const, error: { kind: 'offline' as const } })
    return fetchDepartures(stop.id, settings.value.count, signal)
  },
  maxAgeMs: 45_000,
  refreshMs: 45_000,
})

/* Minuttene teller ned mellom hentingene. Klokka leses hvert tiende sekund,
   slik at «om 1 min» ikke blir stående i tre minutter. */
const now = useNow(10_000)

const departures = computed(() => {
  const parsed = data.value ? parseDepartures(data.value) : null
  return parsed ? stillUpcoming(parsed, now.value) : null
})

const rows = computed(() =>
  (departures.value ?? []).map((departure) => {
    const wait = waitDisplay(departure.expected, now.value)
    const delay = delayMinutes(departure.aimed, departure.expected)
    return {
      ...departure,
      wait,
      delay,
      clock: new Date(departure.expected).toLocaleTimeString(intlLocale.value, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }),
)

const pickStop = (id: string) => {
  settings.value = { ...settings.value, activeId: id }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <WidgetState
      v-if="settings.stops.length === 0"
      kind="empty"
      :title="t('departures.noStop')"
      :message="t('departures.noStopNote')"
      :action-label="t('departures.chooseStop')"
      @action="emit('openSettings')"
    />

    <WidgetState v-else-if="departures === null && loading" kind="loading" />

    <WidgetState
      v-else-if="departures === null"
      kind="error"
      :error="error"
      :action-label="t('remote.retry')"
      @action="refresh(true)"
    />

    <template v-else>
      <!-- Holdeplassbytte. Vises bare når det er noe å bytte mellom. -->
      <div
        v-if="settings.stops.length > 1"
        role="tablist"
        class="flex shrink-0 gap-px border-b border-line bg-line"
      >
        <button
          v-for="stop in settings.stops"
          :key="stop.id"
          type="button"
          role="tab"
          :aria-selected="activeStop?.id === stop.id"
          class="flex-1 truncate bg-surface px-2 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.08em] transition-colors duration-150"
          :class="activeStop?.id === stop.id ? 'text-accent' : 'text-faint hover:text-ink'"
          @click="pickStop(stop.id)"
        >
          {{ stop.name }}
        </button>
      </div>

      <p v-else class="shrink-0 truncate px-3 pt-2 text-xs text-muted">{{ activeStop?.name }}</p>

      <div class="min-h-0 flex-1 overflow-auto">
        <p v-if="rows.length === 0" class="p-3 text-xs leading-relaxed text-muted">
          {{ t('departures.none') }}
        </p>

        <ul v-else role="list" class="divide-y divide-line">
          <li v-for="row in rows" :key="row.key" class="flex items-center gap-2 px-3 py-1.5">
            <AppIcon :name="modeIcon(row.mode)" :size="15" class="shrink-0 text-faint" />

            <span
              class="tnum min-w-[2.2rem] shrink-0 border border-line px-1 text-center font-mono text-[0.7rem] text-ink"
            >
              {{ row.line }}
            </span>

            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm" :class="row.cancelled ? 'text-critical line-through' : 'text-ink'">
                {{ row.destination }}
              </span>
              <span
                v-if="row.cancelled"
                class="block font-mono text-[0.6rem] uppercase tracking-[0.08em] text-critical"
              >
                {{ t('departures.cancelled') }}
              </span>
              <span
                v-else-if="row.delay >= 1"
                class="block font-mono text-[0.6rem] text-warning"
              >
                {{ t('departures.delayed', { minutes: row.delay, clock: row.clock }) }}
              </span>
              <span
                v-else-if="!row.realtime"
                class="block font-mono text-[0.6rem] text-faint"
                :title="t('departures.scheduledNote')"
              >
                {{ t('departures.scheduled') }}
              </span>
            </span>

            <span
              v-if="row.quay"
              class="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-faint"
            >
              {{ t('departures.quay', { quay: row.quay }) }}
            </span>

            <span class="tnum shrink-0 text-right font-mono text-sm" :class="row.cancelled ? 'text-faint' : 'text-ink'">
              <template v-if="row.wait.kind === 'now'">{{ t('departures.now') }}</template>
              <template v-else-if="row.wait.kind === 'minutes'">
                {{ t('departures.minutes', { minutes: row.wait.minutes }) }}
              </template>
              <template v-else>{{ row.clock }}</template>
            </span>
          </li>
        </ul>
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
