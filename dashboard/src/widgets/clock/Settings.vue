<script setup lang="ts">
/**
 * Innstillinger for klokken.
 *
 * Semesterukene er her fordi standardverdiene er typiske og ikke riktige.
 * NTNU, UiT og BI starter ikke i samme uke, og et lærested kan flytte
 * semesterstart et år. En studieuke som er én uke feil er verre enn ingen
 * studieuke — med mindre brukeren kan rette den.
 */

import { useI18n } from 'vue-i18n'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import { DEFAULT_SEMESTER, isSemesterConfig, type SemesterConfig } from './logic.ts'

const props = defineProps<{ instanceId: string }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

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

const fields = [
  { key: 'springStartWeek', label: 'clock.springStart' },
  { key: 'springWeeks', label: 'clock.springLength' },
  { key: 'autumnStartWeek', label: 'clock.autumnStart' },
  { key: 'autumnWeeks', label: 'clock.autumnLength' },
] as const

const reset = () => {
  settings.value = { ...settings.value, semester: { ...DEFAULT_SEMESTER } }
}
</script>

<template>
  <form class="flex h-full flex-col gap-4 p-4" @submit.prevent="emit('close')">
    <label class="flex items-center gap-2 text-sm text-ink">
      <input
        v-model="settings.showSeconds"
        type="checkbox"
        class="h-4 w-4 accent-accent"
      />
      {{ t('clock.showSeconds') }}
    </label>

    <fieldset class="border-t border-line pt-3">
      <legend class="eyebrow mb-1">{{ t('clock.semester') }}</legend>
      <p class="mb-3 text-xs leading-relaxed text-muted">{{ t('clock.semesterNote') }}</p>

      <div class="grid grid-cols-2 gap-x-3 gap-y-2">
        <label v-for="field in fields" :key="field.key" class="flex flex-col gap-1">
          <span class="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint">
            {{ t(field.label) }}
          </span>
          <input
            v-model.number="settings.semester[field.key]"
            type="number"
            min="1"
            max="53"
            step="1"
            class="tnum w-full border border-line bg-paper px-2 py-1 font-mono text-sm text-ink"
          />
        </label>
      </div>
    </fieldset>

    <div class="mt-auto flex gap-2">
      <button type="submit" class="btn btn-primary">{{ t('common.done') }}</button>
      <button type="button" class="btn" @click="reset">{{ t('common.reset') }}</button>
    </div>
  </form>
</template>
