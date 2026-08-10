<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { bgClasses } from '@/data/tech'
import { formatOre, percentDiff, zoneById, type ZoneId, type ZoneSummary } from '@/data/power'

const props = defineProps<{
  summaries: ZoneSummary[]
  /** National mean to compare each zone against */
  national: number
  selected: ZoneId
}>()

const emit = defineEmits<{ select: [zone: ZoneId] }>()

const { t } = useI18n()

/** Longest bar in the track — everything else is drawn relative to it */
const peak = computed(() => Math.max(...props.summaries.map((summary) => summary.mean), 0))

/** Cheapest first — the ranking is the whole point of this panel */
const ranked = computed(() =>
  [...props.summaries]
    .sort((a, b) => a.mean - b.mean)
    .map((summary) => ({
      ...summary,
      meta: zoneById(summary.zone),
      diff: percentDiff(summary.mean, props.national),
      width: peak.value > 0 ? (summary.mean / peak.value) * 100 : 0,
    })),
)
</script>

<template>
  <ul>
    <li v-for="row in ranked" :key="row.zone" class="border-t border-line last:border-b">
      <button
        type="button"
        class="group flex w-full items-center gap-4 py-3.5 text-left transition-colors"
        :aria-current="row.zone === selected ? 'true' : undefined"
        @click="emit('select', row.zone)"
      >
        <span
          class="h-2 w-2 shrink-0 transition-transform duration-300 group-hover:scale-125"
          :class="bgClasses[row.meta.hue]"
          aria-hidden="true"
        />

        <span class="w-28 shrink-0">
          <span
            class="block font-mono text-[0.75rem] tracking-wide"
            :class="row.zone === selected ? 'text-ink' : 'text-muted'"
          >
            {{ row.zone }}
          </span>
          <span class="block text-[0.8125rem] text-faint">{{ row.meta.city }}</span>
        </span>

        <!-- Proportional bar, longest zone fills the track -->
        <span class="relative hidden h-1.5 flex-1 bg-raised sm:block" aria-hidden="true">
          <span
            class="absolute inset-y-0 left-0 transition-all duration-500 ease-editorial"
            :class="bgClasses[row.meta.hue]"
            :style="{ width: `${row.width}%` }"
          />
        </span>

        <span class="ml-auto shrink-0 text-right">
          <span class="block font-mono text-[0.875rem] text-ink">
            {{ formatOre(row.mean) }}
          </span>
          <span
            v-if="row.diff !== null"
            class="block font-mono text-[0.688rem]"
            :class="row.diff > 0 ? 'text-clay' : 'text-pine'"
          >
            {{ row.diff > 0 ? '+' : '' }}{{ row.diff.toFixed(0) }} %
          </span>
        </span>
      </button>
    </li>
  </ul>

  <p class="mt-4 font-mono text-[0.688rem] leading-relaxed text-faint">
    {{ t('power.compareNote') }}
  </p>
</template>
