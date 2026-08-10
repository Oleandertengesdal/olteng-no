<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WidgetState from '@/components/WidgetState.vue'
import { useNow } from '@/data/useNow.ts'
import { parseIcs } from '@/data/ics.ts'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import type { WidgetProps } from '../types.ts'
import { nextDayWithEvents, planFor, statusOf } from './logic.ts'
import {
  DEFAULT_TIMETABLE_SETTINGS,
  isTimetableSettings,
  type TimetableSettings,
} from './settings.ts'

const props = defineProps<WidgetProps>()
const emit = defineEmits<{ openSettings: [] }>()

const { t, locale } = useI18n()
const intlLocale = computed(() => (locale.value === 'nb' ? 'nb-NO' : 'en-GB'))

const settings = useWidgetSettings<TimetableSettings>(
  props.instanceId,
  DEFAULT_TIMETABLE_SETTINGS,
  isTimetableSettings,
)

/* Filen leses på nytt bare når teksten endrer seg. En semestertimeplan er
   noen hundre kilobyte, og det tar millisekunder — men det er ingen grunn til
   å gjøre det hvert minutt bare fordi klokka går. */
const parsed = computed(() => (settings.value.raw ? parseIcs(settings.value.raw) : null))

const nowMs = useNow(60_000)
const now = computed(() => new Date(nowMs.value))

const today = computed(() => (parsed.value ? planFor(parsed.value.events, now.value) : null))

const next = computed(() =>
  parsed.value && today.value?.occurrences.length === 0
    ? nextDayWithEvents(parsed.value.events, now.value)
    : null,
)

/** Dagen som faktisk vises: i dag hvis det er noe, ellers neste dag med noe. */
const shown = computed(() => (today.value?.occurrences.length ? today.value : (next.value ?? today.value)))

const rows = computed(() => {
  const plan = shown.value
  if (!plan) return []

  const isToday = plan.date.toDateString() === now.value.toDateString()

  return plan.occurrences
    .map((occurrence) => ({
      occurrence,
      status: isToday ? statusOf(occurrence, nowMs.value) : ('upcoming' as const),
      time: occurrence.allDay
        ? t('timetable.allDay')
        : new Date(occurrence.start).toLocaleTimeString(intlLocale.value, {
            hour: '2-digit',
            minute: '2-digit',
          }),
      endTime:
        occurrence.end && !occurrence.allDay
          ? new Date(occurrence.end).toLocaleTimeString(intlLocale.value, {
              hour: '2-digit',
              minute: '2-digit',
            })
          : null,
    }))
    .filter((row) => settings.value.showPast || row.status !== 'past')
})

const heading = computed(() => {
  const plan = shown.value
  if (!plan) return ''
  const isToday = plan.date.toDateString() === now.value.toDateString()
  return isToday
    ? t('timetable.today')
    : plan.date.toLocaleDateString(intlLocale.value, { weekday: 'long', day: 'numeric', month: 'short' })
})
</script>

<template>
  <div class="flex h-full flex-col">
    <WidgetState
      v-if="!settings.raw"
      kind="empty"
      :title="t('timetable.empty')"
      :message="t('timetable.emptyNote')"
      :action-label="t('timetable.import')"
      @action="emit('openSettings')"
    />

    <template v-else>
      <p class="shrink-0 truncate px-3 pt-2 text-xs capitalize text-muted">{{ heading }}</p>

      <div class="min-h-0 flex-1 overflow-auto">
        <p v-if="rows.length === 0" class="p-3 text-xs leading-relaxed text-muted">
          {{ t('timetable.nothing') }}
        </p>

        <ul v-else role="list" class="divide-y divide-line">
          <li
            v-for="(row, index) in rows"
            :key="`${row.occurrence.uid}-${row.occurrence.start}-${index}`"
            class="flex gap-3 px-3 py-2"
            :class="row.status === 'past' ? 'opacity-55' : ''"
          >
            <span class="tnum shrink-0 font-mono text-xs leading-relaxed">
              <span :class="row.status === 'now' ? 'text-accent' : 'text-ink'">{{ row.time }}</span>
              <span v-if="row.endTime" class="block text-faint">{{ row.endTime }}</span>
            </span>

            <!-- Loddrett strek som markerer den som pågår nå. Ingen fyllfarge,
                 ingen ramme — bare en linje som er der eller ikke. -->
            <span
              class="w-px shrink-0"
              :class="row.status === 'now' ? 'bg-accent' : 'bg-line'"
              aria-hidden="true"
            ></span>

            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm text-ink">{{ row.occurrence.summary }}</span>
              <span v-if="row.occurrence.location" class="block truncate text-xs text-muted">
                {{ row.occurrence.location }}
              </span>
              <span v-if="row.status === 'now'" class="sr-only">{{ t('timetable.inProgress') }}</span>
            </span>
          </li>
        </ul>
      </div>

      <!-- Hendelser vi ikke kunne folde ut. Sies rett ut framfor å utelates
           stille — en timeplan der to forelesninger mangler skal si det. -->
      <p
        v-if="parsed && parsed.unsupportedRecurrences > 0"
        class="shrink-0 border-t border-line px-3 py-1.5 font-mono text-[0.65rem] leading-relaxed text-warning"
      >
        {{ t('timetable.unsupported', { count: parsed.unsupportedRecurrences }) }}
      </p>
    </template>
  </div>
</template>
