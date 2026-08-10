<script setup lang="ts">
/**
 * Stedsvalg.
 *
 * Søk er hovedveien. Posisjonsknappen er et tillegg som aldri utløses av seg
 * selv — nettleseren spør om tillatelse først, koordinatene blir i denne
 * maskinen, og det eneste som sendes noe sted er et oppslag mot Open-Meteo på
 * to desimaltall. Det står i grensesnittet, ikke bare her.
 */

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import { searchPlaces } from './api.ts'
import type { Place } from './logic.ts'
import { DEFAULT_WEATHER_SETTINGS, isWeatherSettings, type WeatherSettings } from './settings.ts'

const props = defineProps<{ instanceId: string }>()
const emit = defineEmits<{ close: [] }>()

const { t, locale } = useI18n()
const lang = computed(() => (locale.value === 'nb' ? 'nb' : 'en') as 'nb' | 'en')

const settings = useWidgetSettings<WeatherSettings>(
  props.instanceId,
  DEFAULT_WEATHER_SETTINGS,
  isWeatherSettings,
)

/* ── Søk ───────────────────────────────────────────────────────────────────
   Ventetid på 300 ms før forespørselen går. Uten den blir det ett oppslag per
   tastetrykk, og «Trondheim» blir til ni forespørsler mot en gratis tjeneste. */

const query = ref('')
const results = ref<Place[]>([])
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
    results.value = await searchPlaces(value, lang.value, controller.signal)
    searching.value = false
    searched.value = true
  }, 300)
})

onBeforeUnmount(() => {
  window.clearTimeout(debounce)
  controller?.abort('unmounted')
})

/* ── Valg ──────────────────────────────────────────────────────────────────  */

const sameSpot = (a: Place, b: Place) =>
  a.latitude.toFixed(3) === b.latitude.toFixed(3) && a.longitude.toFixed(3) === b.longitude.toFixed(3)

const choose = (place: Place) => {
  const favourites = settings.value.favourites.filter((f) => !sameSpot(f, place))
  settings.value = {
    place,
    // Tre er nok. Flere enn det er en liste man må lete i, ikke snarveier.
    favourites: [place, ...favourites].slice(0, 3),
  }
  query.value = ''
  results.value = []
  searched.value = false
}

const forget = (place: Place) => {
  settings.value = {
    ...settings.value,
    favourites: settings.value.favourites.filter((f) => !sameSpot(f, place)),
  }
}

const label = (place: Place) => [place.region, place.country].filter(Boolean).join(', ')

/* ── Posisjon ──────────────────────────────────────────────────────────────  */

const locating = ref(false)
const locationError = ref(false)

const useMyLocation = () => {
  if (!navigator.geolocation) {
    locationError.value = true
    return
  }

  locating.value = true
  locationError.value = false

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false
      const { latitude, longitude } = position.coords
      choose({
        id: `coord:${latitude.toFixed(4)},${longitude.toFixed(4)}`,
        // Navnet er ærlig: vi har ikke slått opp hva stedet heter, vi har et
        // punkt. Koordinatene står under, slik at det går an å kontrollere.
        name: t('weather.myLocation'),
        region: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
        country: '',
        latitude,
        longitude,
      })
    },
    () => {
      locating.value = false
      locationError.value = true
    },
    { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
  )
}
</script>

<template>
  <div class="flex h-full flex-col gap-3 overflow-auto p-3">
    <div class="relative flex items-center">
      <AppIcon name="search" :size="15" class="pointer-events-none absolute left-2 text-faint" />
      <input
        v-model="query"
        type="search"
        :placeholder="t('weather.searchPlace')"
        :aria-label="t('weather.searchPlace')"
        class="w-full border border-line bg-paper py-1.5 pl-7 pr-2 text-sm text-ink placeholder:text-faint"
      />
    </div>

    <p v-if="searching" class="text-xs text-muted">{{ t('weather.searching') }}</p>
    <p v-else-if="searched && results.length === 0" class="text-xs text-muted">
      {{ t('weather.noResults', { query }) }}
    </p>

    <ul v-if="results.length > 0" role="list" class="divide-y divide-line border border-line">
      <li v-for="place in results" :key="place.id">
        <button
          type="button"
          class="flex w-full items-baseline gap-2 px-2.5 py-1.5 text-left transition-colors duration-150 hover:bg-raised"
          @click="choose(place)"
        >
          <span class="text-sm text-ink">{{ place.name }}</span>
          <span class="truncate text-xs text-faint">{{ label(place) }}</span>
        </button>
      </li>
    </ul>

    <div v-if="settings.favourites.length > 0">
      <h3 class="eyebrow mb-1.5">{{ t('weather.saved') }}</h3>
      <ul role="list" class="divide-y divide-line border border-line">
        <li v-for="place in settings.favourites" :key="place.id" class="flex items-center">
          <button
            type="button"
            class="flex flex-1 items-baseline gap-2 px-2.5 py-1.5 text-left transition-colors duration-150 hover:bg-raised"
            :aria-current="settings.place ? sameSpot(settings.place, place) : false"
            @click="choose(place)"
          >
            <span
              class="text-sm"
              :class="settings.place && sameSpot(settings.place, place) ? 'text-accent' : 'text-ink'"
            >
              {{ place.name }}
            </span>
            <span class="truncate text-xs text-faint">{{ label(place) }}</span>
          </button>
          <button
            type="button"
            class="px-2 text-faint transition-colors duration-150 hover:text-critical"
            :aria-label="t('weather.forget', { name: place.name })"
            @click="forget(place)"
          >
            <AppIcon name="close" :size="14" />
          </button>
        </li>
      </ul>
    </div>

    <div class="border-t border-line pt-3">
      <button type="button" class="btn" :disabled="locating" @click="useMyLocation">
        <AppIcon name="location" :size="14" />
        {{ locating ? t('weather.locating') : t('weather.useLocation') }}
      </button>
      <p class="mt-2 text-[0.7rem] leading-relaxed text-muted">{{ t('weather.locationNote') }}</p>
      <p v-if="locationError" class="mt-1.5 text-[0.7rem] leading-relaxed text-critical">
        {{ t('weather.locationFailed') }}
      </p>
    </div>

    <button type="button" class="btn btn-primary mt-auto self-start" @click="emit('close')">
      {{ t('common.done') }}
    </button>
  </div>
</template>
