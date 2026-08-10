<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WidgetState from '@/components/WidgetState.vue'
import { useNow } from '@/data/useNow.ts'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import type { WidgetProps } from '../types.ts'
import { remaining, sortByUrgency, targetDate } from './logic.ts'
import {
  DEFAULT_COUNTDOWN_SETTINGS,
  isCountdownSettings,
  type CountdownSettings,
} from './settings.ts'

const props = defineProps<WidgetProps>()
const emit = defineEmits<{ openSettings: [] }>()

const { t, locale } = useI18n()
const intlLocale = computed(() => (locale.value === 'nb' ? 'nb-NO' : 'en-GB'))

const settings = useWidgetSettings<CountdownSettings>(
  props.instanceId,
  DEFAULT_COUNTDOWN_SETTINGS,
  isCountdownSettings,
)

/* Ett minutt. Nedtellinger som viser dager trenger det ikke, men de som er
   under et døgn viser minutter, og da skal minuttet stemme. */
const nowMs = useNow(60_000)
const now = computed(() => new Date(nowMs.value))

const rows = computed(() =>
  sortByUrgency(settings.value.items, now.value)
    .map((item) => ({ item, left: remaining(item, now.value) }))
    .filter((row) => !(settings.value.hidePast && row.left.kind === 'past'))
    .map((row) => ({
      ...row,
      when: targetDate(row.item).toLocaleDateString(intlLocale.value, {
        day: 'numeric',
        month: 'short',
        ...(row.item.time ? { hour: '2-digit', minute: '2-digit' } : {}),
      }),
    })),
)
</script>

<template>
  <div class="flex h-full flex-col">
    <WidgetState
      v-if="settings.items.length === 0"
      kind="empty"
      :title="t('countdowns.empty')"
      :message="t('countdowns.emptyNote')"
      :action-label="t('countdowns.add')"
      @action="emit('openSettings')"
    />

    <ul v-else role="list" class="min-h-0 flex-1 divide-y divide-line overflow-auto">
      <li
        v-for="(row, index) in rows"
        :key="row.item.id"
        class="flex items-baseline gap-3 px-3 py-2"
        :class="row.left.kind === 'past' ? 'text-faint' : ''"
      >
        <!-- Tallet først. Det er det man kommer for. -->
        <span class="tnum shrink-0 text-right font-display leading-none" :class="index === 0 ? 'text-3xl' : 'text-xl'">
          <template v-if="row.left.kind === 'days'">{{ row.left.days }}</template>
          <template v-else-if="row.left.kind === 'hours'">{{ row.left.hours }}</template>
          <template v-else>&ndash;</template>
        </span>

        <span class="shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint">
          <template v-if="row.left.kind === 'days'">{{ t('countdowns.days') }}</template>
          <template v-else-if="row.left.kind === 'hours'">
            {{ t('countdowns.hoursMinutes', { minutes: row.left.minutes }) }}
          </template>
        </span>

        <span class="min-w-0 flex-1">
          <span
            class="block truncate text-sm"
            :class="row.left.kind === 'past' ? 'text-muted line-through' : 'text-ink'"
          >
            {{ row.item.title }}
          </span>
          <span class="block truncate font-mono text-[0.65rem] text-faint">
            {{ row.when }}
            <template v-if="row.left.kind === 'past'">
              &middot; {{ t('countdowns.past', { days: row.left.days }) }}
            </template>
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>
