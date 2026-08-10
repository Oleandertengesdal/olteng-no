<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import { searchStops } from './api.ts'
import type { Stop } from './logic.ts'
import {
  DEFAULT_DEPARTURES_SETTINGS,
  MAX_STOPS,
  isDeparturesSettings,
  type DeparturesSettings,
} from './settings.ts'

const props = defineProps<{ instanceId: string }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

const settings = useWidgetSettings<DeparturesSettings>(
  props.instanceId,
  DEFAULT_DEPARTURES_SETTINGS,
  isDeparturesSettings,
)

const query = ref('')
const results = ref<Stop[]>([])
const searching = ref(false)
const searched = ref(false)

let debounce = 0
let controller: AbortController | null = null

watch(query, (value) => {
  window.clearTimeout(debounce)
  controller?.abort('replaced')

  if (value.trim().length < 2) {
    results.value = []
    searched.value = false
    return
  }

  debounce = window.setTimeout(async () => {
    controller = new AbortController()
    searching.value = true
    results.value = await searchStops(value, controller.signal)
    searching.value = false
    searched.value = true
  }, 300)
})

onBeforeUnmount(() => {
  window.clearTimeout(debounce)
  controller?.abort('unmounted')
})

const full = computed(() => settings.value.stops.length >= MAX_STOPS)

const add = (stop: Stop) => {
  if (settings.value.stops.some((s) => s.id === stop.id)) {
    settings.value = { ...settings.value, activeId: stop.id }
  } else {
    settings.value = {
      ...settings.value,
      stops: [...settings.value.stops, stop].slice(0, MAX_STOPS),
      activeId: stop.id,
    }
  }
  query.value = ''
  results.value = []
  searched.value = false
}

const remove = (stop: Stop) => {
  const stops = settings.value.stops.filter((s) => s.id !== stop.id)
  settings.value = {
    ...settings.value,
    stops,
    activeId: settings.value.activeId === stop.id ? (stops[0]?.id ?? null) : settings.value.activeId,
  }
}
</script>

<template>
  <div class="flex h-full flex-col gap-3 overflow-auto p-3">
    <div class="relative flex items-center">
      <AppIcon name="search" :size="15" class="pointer-events-none absolute left-2 text-faint" />
      <input
        v-model="query"
        type="search"
        :placeholder="t('departures.searchStop')"
        :aria-label="t('departures.searchStop')"
        :disabled="full"
        class="w-full border border-line bg-paper py-1.5 pl-7 pr-2 text-sm text-ink placeholder:text-faint"
      />
    </div>

    <p v-if="full" class="text-[0.7rem] leading-relaxed text-muted">
      {{ t('departures.full', { max: MAX_STOPS }) }}
    </p>
    <p v-else-if="searching" class="text-xs text-muted">{{ t('weather.searching') }}</p>
    <p v-else-if="searched && results.length === 0" class="text-xs text-muted">
      {{ t('departures.noResults', { query }) }}
    </p>

    <ul v-if="results.length > 0" role="list" class="divide-y divide-line border border-line">
      <li v-for="stop in results" :key="stop.id">
        <button
          type="button"
          class="flex w-full items-baseline gap-2 px-2.5 py-1.5 text-left transition-colors duration-150 hover:bg-raised"
          @click="add(stop)"
        >
          <span class="text-sm text-ink">{{ stop.name }}</span>
          <span class="truncate text-xs text-faint">{{ stop.locality }}</span>
        </button>
      </li>
    </ul>

    <div v-if="settings.stops.length > 0">
      <h3 class="eyebrow mb-1.5">{{ t('departures.saved') }}</h3>
      <ul role="list" class="divide-y divide-line border border-line">
        <li v-for="stop in settings.stops" :key="stop.id" class="flex items-center">
          <span class="flex-1 truncate px-2.5 py-1.5 text-sm text-ink">
            {{ stop.name }}
            <span class="text-xs text-faint">{{ stop.locality }}</span>
          </span>
          <button
            type="button"
            class="px-2 text-faint transition-colors duration-150 hover:text-critical"
            :aria-label="t('departures.forget', { name: stop.name })"
            @click="remove(stop)"
          >
            <AppIcon name="close" :size="14" />
          </button>
        </li>
      </ul>
    </div>

    <label class="flex items-center gap-2 border-t border-line pt-3 text-sm text-ink">
      {{ t('departures.count') }}
      <input
        v-model.number="settings.count"
        type="number"
        min="1"
        max="20"
        step="1"
        class="tnum w-16 border border-line bg-paper px-2 py-1 font-mono text-sm text-ink"
      />
    </label>

    <button type="button" class="btn btn-primary mt-auto self-start" @click="emit('close')">
      {{ t('common.done') }}
    </button>
  </div>
</template>
