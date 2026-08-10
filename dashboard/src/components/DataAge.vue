<script setup lang="ts">
/**
 * «Oppdatert for 3 min siden», og en knapp for å hente på nytt.
 *
 * Dette er den delen som gjør at gamle data er brukbare framfor villedende.
 * En temperatur uten tidsstempel påstår at den gjelder nå. Med tidsstempel
 * påstår den bare at den gjaldt da, og det er en påstand som er sann.
 */

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import { formatAge } from '@/data/remote.ts'

const props = defineProps<{
  fetchedAt: number | null
  stale: boolean
  loading: boolean
  /** Hvem dataene kommer fra. Vises fordi kilden ber om det. */
  source?: { label: string; url: string }
}>()

const emit = defineEmits<{ refresh: [] }>()

const { t, locale } = useI18n()

/* Alderen må tegnes på nytt av og til, ellers står det «for 1 min siden» i en
   time. Ett minutt er raskt nok, og billig når det bare er én tekst. */
const now = ref(Date.now())
let timer = 0

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
  }, 60_000)
})

onBeforeUnmount(() => window.clearInterval(timer))

const age = computed(() =>
  props.fetchedAt === null ? '' : formatAge(props.fetchedAt, now.value, locale.value === 'nb' ? 'nb-NO' : 'en-GB'),
)
</script>

<template>
  <div class="flex items-center gap-2 border-t border-line px-3 py-1.5">
    <p class="truncate font-mono text-[0.65rem] tracking-[0.04em]" :class="stale ? 'text-warning' : 'text-faint'">
      <span v-if="fetchedAt === null">{{ t('remote.never') }}</span>
      <span v-else-if="stale">{{ t('remote.stale', { age }) }}</span>
      <span v-else>{{ t('remote.updated', { age }) }}</span>
    </p>

    <a
      v-if="source"
      :href="source.url"
      class="ml-auto shrink-0 font-mono text-[0.65rem] text-faint transition-colors duration-150 hover:text-accent"
      rel="noreferrer"
    >
      {{ source.label }}
    </a>

    <button
      type="button"
      class="shrink-0 text-faint transition-colors duration-150 hover:text-ink"
      :class="source ? '' : 'ml-auto'"
      :disabled="loading"
      :aria-label="t('remote.refresh')"
      @click="emit('refresh')"
    >
      <AppIcon name="refresh" :size="14" :class="loading ? 'opacity-40' : ''" />
    </button>
  </div>
</template>
