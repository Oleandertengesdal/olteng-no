<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ZONE_RINGS, ZONE_LABEL_ANCHORS, buildProjection, ringToPath } from '@/data/norway'
import { levelFor, formatOre, zoneById, type ZoneId, type ZoneSummary } from '@/data/power'

const props = defineProps<{
  summaries: ZoneSummary[]
  selected: ZoneId
}>()

const emit = defineEmits<{ select: [zone: ZoneId] }>()

const { t, locale } = useI18n()

/** Fixed drawing width; height falls out of the projection */
const projection = buildProjection(420)

const meanByZone = computed(
  () => new Map(props.summaries.map((summary) => [summary.zone, summary.mean])),
)

/**
 * Levels are relative to the spread across the five areas on this particular
 * day — the same idea the hourly chart uses. An absolute threshold would paint
 * the whole country one colour for months at a time.
 */
const spread = computed(() => {
  const values = props.summaries.map((summary) => summary.mean)
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: 0,
    cheapest: null,
    priciest: null,
  }
})

const fillFor: Record<string, string> = {
  low: 'fill-pine',
  mid: 'fill-ochre',
  high: 'fill-clay',
}

const areas = computed(() =>
  (Object.keys(ZONE_RINGS) as ZoneId[]).map((id) => {
    const mean = meanByZone.value.get(id)
    const zone = zoneById(id)
    const [labelX, labelY] = projection.point(ZONE_LABEL_ANCHORS[id])

    return {
      id,
      zone,
      mean,
      path: ringToPath(ZONE_RINGS[id], projection),
      fill: mean === undefined ? 'fill-raised' : fillFor[levelFor(mean, spread.value)]!,
      labelX,
      labelY,
      isSelected: id === props.selected,
      label:
        mean === undefined
          ? `${id} — ${t('ui.noResults')}`
          : `${id}, ${zone.city}: ${formatOre(mean)} ${t('power.perKwh')}`,
    }
  }),
)

const choose = (id: ZoneId) => emit('select', id)
</script>

<template>
  <figure>
    <svg
      :viewBox="`0 0 ${projection.width} ${projection.height}`"
      class="mx-auto block h-auto w-full max-w-[19rem]"
      role="group"
      :aria-label="t('power.mapAria')"
    >
      <g v-for="area in areas" :key="area.id">
        <!--
          A native button cannot wrap SVG content, so the group takes the role
          and the keyboard handling instead. Enter and Space both select, which
          is what a real button does.
        -->
        <g
          role="button"
          tabindex="0"
          :aria-pressed="area.isSelected"
          :aria-label="area.label"
          class="cursor-pointer outline-none"
          @click="choose(area.id)"
          @keydown.enter.prevent="choose(area.id)"
          @keydown.space.prevent="choose(area.id)"
        >
          <path
            :d="area.path"
            :class="[
              area.fill,
              area.isSelected ? 'stroke-ink' : 'stroke-paper',
              area.isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100',
            ]"
            :stroke-width="area.isSelected ? 2.5 : 1.25"
            stroke-linejoin="round"
            class="transition-opacity duration-300"
          />

          <text
            :x="area.labelX"
            :y="area.labelY"
            text-anchor="middle"
            class="pointer-events-none fill-paper font-mono text-[13px] font-medium"
          >
            {{ area.id }}
          </text>
          <text
            v-if="area.mean !== undefined"
            :x="area.labelX"
            :y="area.labelY + 14"
            text-anchor="middle"
            class="pointer-events-none fill-paper/85 font-mono text-[11px]"
          >
            {{ formatOre(area.mean) }}
          </text>
        </g>
      </g>
    </svg>

    <figcaption class="mt-4 font-mono text-[0.688rem] leading-relaxed text-faint">
      {{ t('power.mapNote') }}
    </figcaption>

    <!-- Same information as the map, for anyone not reading it visually -->
    <ul class="sr-only">
      <li v-for="area in areas" :key="`sr-${area.id}`">
        {{ area.label }} — {{ area.zone.region[locale as 'en' | 'nb'] }}
      </li>
    </ul>
  </figure>
</template>
