<script setup lang="ts">
import { computed } from 'vue'
import { levelClasses, type ChartPoint } from '@/data/power'

const props = defineProps<{
  points: ChartPoint[]
  /** Optional comparison line, aligned index for index with `points` */
  average?: number[]
  averageLabel?: string
  hovered: number | null
  /** Screen-reader summary of what the chart shows */
  caption: string
}>()

const emit = defineEmits<{ 'update:hovered': [value: number | null] }>()

/* ── Geometry ──────────────────────────────────────────────────────────────
   Drawn by hand rather than with a charting library: 24 bars and one line is
   less code than configuring Chart.js, and it inherits the site's colours
   for free because everything is a Tailwind class on an SVG element.        */

const W = 760
const H = 300
const PAD = { top: 18, right: 10, bottom: 34, left: 46 }

const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

const slot = computed(() => plotW / Math.max(1, props.points.length))
const barWidth = computed(() => Math.min(slot.value * 0.62, 26))

/** Round the axis up to a readable step so the gridlines land on round numbers */
const scale = computed(() => {
  const values = [...props.points.map((p) => p.value), ...(props.average ?? [])]
  const peak = Math.max(0, ...values)
  if (peak <= 0) return { max: 1, step: 0.25 }

  const steps = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10]
  const step = steps.find((candidate) => peak / candidate <= 4) ?? 20
  return { max: Math.ceil(peak / step) * step, step }
})

const gridLines = computed(() => {
  const lines: number[] = []
  for (let value = 0; value <= scale.value.max + 1e-9; value += scale.value.step) {
    lines.push(Number(value.toFixed(4)))
  }
  return lines
})

const y = (value: number) => PAD.top + plotH * (1 - value / scale.value.max)
const centerX = (index: number) => PAD.left + slot.value * (index + 0.5)

const bars = computed(() =>
  props.points.map((point, index) => {
    const top = y(point.value)
    return {
      ...point,
      index,
      x: centerX(index) - barWidth.value / 2,
      y: top,
      height: Math.max(1, PAD.top + plotH - top),
      fill: levelClasses[point.level].fill,
    }
  }),
)

const averagePath = computed(() => {
  if (!props.average?.length) return ''
  return props.average
    .map((value, index) => `${index === 0 ? 'M' : 'L'} ${centerX(index)} ${y(value)}`)
    .join(' ')
})

/** Label every third hour so the axis stays readable on a phone */
const showLabel = (index: number) => index % 3 === 0
</script>

<template>
  <figure>
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full"
      role="img"
      :aria-label="caption"
      @mouseleave="emit('update:hovered', null)"
    >
      <!-- Gridlines and y-axis -->
      <g>
        <template v-for="line in gridLines" :key="line">
          <line
            :x1="PAD.left"
            :x2="W - PAD.right"
            :y1="y(line)"
            :y2="y(line)"
            class="stroke-line"
            stroke-width="1"
          />
          <text
            :x="PAD.left - 10"
            :y="y(line) + 4"
            text-anchor="end"
            class="fill-faint font-mono text-[11px]"
          >
            {{ line.toFixed(2) }}
          </text>
        </template>
      </g>

      <!-- Bars -->
      <g>
        <rect
          v-for="bar in bars"
          :key="bar.key"
          :x="bar.x"
          :y="bar.y"
          :width="barWidth"
          :height="bar.height"
          :class="[bar.fill, hovered !== null && hovered !== bar.index ? 'opacity-35' : '']"
          class="transition-opacity duration-200"
        >
          <title>{{ bar.label }}:00 — {{ bar.value.toFixed(2) }}</title>
        </rect>
      </g>

      <!-- National average -->
      <path
        v-if="averagePath"
        :d="averagePath"
        fill="none"
        class="stroke-ink/55"
        stroke-width="1.75"
        stroke-dasharray="5 4"
        stroke-linejoin="round"
      />

      <!-- Marker for the hour we are currently in -->
      <template v-for="bar in bars" :key="`now-${bar.key}`">
        <g v-if="bar.isNow">
          <rect
            :x="bar.x - 3"
            :y="PAD.top"
            :width="barWidth + 6"
            :height="plotH"
            class="fill-ink/[0.05]"
          />
          <rect
            :x="bar.x - 3"
            :y="bar.y - 3"
            :width="barWidth + 6"
            :height="bar.height + 3"
            fill="none"
            class="stroke-ink"
            stroke-width="1.5"
          />
        </g>
      </template>

      <!-- Baseline -->
      <line
        :x1="PAD.left"
        :x2="W - PAD.right"
        :y1="PAD.top + plotH"
        :y2="PAD.top + plotH"
        class="stroke-ink/40"
        stroke-width="1"
      />

      <!-- Hour labels -->
      <g>
        <template v-for="(point, index) in points" :key="`label-${point.key}`">
          <text
            v-if="showLabel(index)"
            :x="centerX(index)"
            :y="H - 14"
            text-anchor="middle"
            class="fill-faint font-mono text-[11px]"
          >
            {{ point.label }}
          </text>
        </template>
      </g>

      <!-- Transparent hit areas, one per hour, sized for a fingertip -->
      <g>
        <rect
          v-for="(point, index) in points"
          :key="`hit-${point.key}`"
          :x="PAD.left + slot * index"
          :y="PAD.top"
          :width="slot"
          :height="plotH"
          fill="transparent"
          @mouseenter="emit('update:hovered', index)"
        />
      </g>
    </svg>

    <figcaption class="sr-only">{{ caption }}</figcaption>
  </figure>
</template>
