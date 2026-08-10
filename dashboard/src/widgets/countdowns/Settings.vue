<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import { newCountdownId, type Countdown } from './logic.ts'
import {
  DEFAULT_COUNTDOWN_SETTINGS,
  isCountdownSettings,
  type CountdownSettings,
} from './settings.ts'

const props = defineProps<{ instanceId: string }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

const settings = useWidgetSettings<CountdownSettings>(
  props.instanceId,
  DEFAULT_COUNTDOWN_SETTINGS,
  isCountdownSettings,
)

const title = ref('')
const date = ref('')
const time = ref('')

const canAdd = () => title.value.trim() !== '' && /^\d{4}-\d{2}-\d{2}$/.test(date.value)

const add = () => {
  if (!canAdd()) return

  const item: Countdown = {
    id: newCountdownId(),
    title: title.value.trim(),
    date: date.value,
    // Tomt klokkeslettfelt betyr «hele dagen», ikke «midnatt».
    time: /^\d{2}:\d{2}$/.test(time.value) ? time.value : null,
  }

  settings.value = { ...settings.value, items: [...settings.value.items, item] }
  title.value = ''
  date.value = ''
  time.value = ''
}

const remove = (id: string) => {
  settings.value = { ...settings.value, items: settings.value.items.filter((i) => i.id !== id) }
}
</script>

<template>
  <div class="flex h-full flex-col gap-3 overflow-auto p-3">
    <form class="flex flex-col gap-2" @submit.prevent="add">
      <input
        v-model="title"
        type="text"
        :placeholder="t('countdowns.titlePlaceholder')"
        :aria-label="t('countdowns.titleLabel')"
        class="w-full border border-line bg-paper px-2 py-1.5 text-sm text-ink placeholder:text-faint"
      />

      <div class="flex gap-2">
        <label class="flex flex-1 flex-col gap-1">
          <span class="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint">
            {{ t('countdowns.date') }}
          </span>
          <input
            v-model="date"
            type="date"
            class="tnum w-full border border-line bg-paper px-2 py-1 font-mono text-sm text-ink"
          />
        </label>

        <label class="flex w-28 flex-col gap-1">
          <span class="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint">
            {{ t('countdowns.time') }}
          </span>
          <input
            v-model="time"
            type="time"
            class="tnum w-full border border-line bg-paper px-2 py-1 font-mono text-sm text-ink"
          />
        </label>
      </div>

      <p class="text-[0.7rem] leading-relaxed text-muted">{{ t('countdowns.timeNote') }}</p>

      <button type="submit" class="btn self-start" :disabled="!canAdd()">
        <AppIcon name="plus" :size="14" />
        {{ t('countdowns.add') }}
      </button>
    </form>

    <ul v-if="settings.items.length > 0" role="list" class="divide-y divide-line border border-line">
      <li v-for="item in settings.items" :key="item.id" class="flex items-center gap-2">
        <span class="min-w-0 flex-1 truncate px-2.5 py-1.5 text-sm text-ink">
          {{ item.title }}
          <span class="tnum font-mono text-xs text-faint">
            {{ item.date }}<template v-if="item.time"> {{ item.time }}</template>
          </span>
        </span>
        <button
          type="button"
          class="px-2 text-faint transition-colors duration-150 hover:text-critical"
          :aria-label="t('countdowns.remove', { title: item.title })"
          @click="remove(item.id)"
        >
          <AppIcon name="close" :size="14" />
        </button>
      </li>
    </ul>

    <label class="flex items-center gap-2 border-t border-line pt-3 text-sm text-ink">
      <input v-model="settings.hidePast" type="checkbox" class="h-4 w-4 accent-accent" />
      {{ t('countdowns.hidePast') }}
    </label>

    <button type="button" class="btn btn-primary mt-auto self-start" @click="emit('close')">
      {{ t('common.done') }}
    </button>
  </div>
</template>
