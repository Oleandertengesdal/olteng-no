<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import {
  DRINK_PRESETS,
  R_FACTORS,
  LEGAL_LIMIT,
  ABSORPTION_MINUTES,
  estimateAt,
  minutesUntilBelow,
  buildCurve,
  formatBac,
  formatDuration,
  clockAfter,
  type Drink,
} from '@/data/bac'

const { t, locale } = useI18n()

/* ── Input ─────────────────────────────────────────────────────────────── */

const weight = ref(75)
const rFactor = ref<number>(R_FACTORS.higher)
const drinks = ref<Drink[]>([])

let counter = 0

const addDrink = (presetId: string) => {
  const preset = DRINK_PRESETS.find((item) => item.id === presetId)
  if (!preset) return

  drinks.value.push({
    id: `drink-${counter++}`,
    volume: preset.volume,
    abv: preset.abv,
    label: preset.label[locale.value as 'en' | 'nb'],
    minutesAgo: 0,
  })
}

const removeDrink = (id: string) => {
  drinks.value = drinks.value.filter((drink) => drink.id !== id)
}

const clearAll = () => {
  drinks.value = []
}

const person = computed(() => ({ weight: weight.value, r: rFactor.value }))

/* ── Results ───────────────────────────────────────────────────────────── */

const current = computed(() => estimateAt(drinks.value, person.value, 0))
const peak = computed(() => {
  const curve = buildCurve(drinks.value, person.value, 12, 5)
  return curve.reduce((best, point) => (point.estimate.high > best.estimate.high ? point : best), {
    minutes: 0,
    estimate: current.value,
  })
})

const untilLegal = computed(() => minutesUntilBelow(drinks.value, person.value, LEGAL_LIMIT))
const untilZero = computed(() => minutesUntilBelow(drinks.value, person.value, 0.01))

const hasDrinks = computed(() => drinks.value.length > 0)

/* ── Chart ─────────────────────────────────────────────────────────────────
   Hours ahead adapts to how long it actually takes to sober up, so the curve
   never gets squeezed into the left edge of a fixed 12 hour window.         */

const hoursAhead = computed(() => {
  const minutes = untilZero.value ?? 480
  return Math.min(24, Math.max(4, Math.ceil((minutes + 60) / 60)))
})

const curve = computed(() => buildCurve(drinks.value, person.value, hoursAhead.value, 10))

const W = 760
const H = 260
const PAD = { top: 16, right: 12, bottom: 30, left: 44 }
const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

const scaleMax = computed(() => {
  const highest = Math.max(...curve.value.map((point) => point.estimate.high), LEGAL_LIMIT * 2)
  const step = highest > 2 ? 0.5 : highest > 1 ? 0.25 : 0.1
  return { max: Math.ceil(highest / step) * step, step }
})

const x = (minutes: number) => PAD.left + (minutes / (hoursAhead.value * 60)) * plotW
const y = (value: number) => PAD.top + plotH * (1 - value / scaleMax.value.max)

/** The uncertainty band, drawn as one closed shape */
const bandPath = computed(() => {
  if (!hasDrinks.value) return ''
  const top = curve.value.map((p) => `${x(p.minutes)} ${y(p.estimate.high)}`)
  const bottom = [...curve.value].reverse().map((p) => `${x(p.minutes)} ${y(p.estimate.low)}`)
  return `M ${top.join(' L ')} L ${bottom.join(' L ')} Z`
})

const typicalPath = computed(() => {
  if (!hasDrinks.value) return ''
  return curve.value
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.minutes)} ${y(p.estimate.typical)}`)
    .join(' ')
})

const gridLines = computed(() => {
  const lines: number[] = []
  for (let value = 0; value <= scaleMax.value.max + 1e-9; value += scaleMax.value.step) {
    lines.push(Number(value.toFixed(2)))
  }
  return lines
})

const hourMarks = computed(() =>
  Array.from({ length: hoursAhead.value + 1 }, (_, hour) => hour).filter(
    (hour) => hour % Math.ceil(hoursAhead.value / 8) === 0,
  ),
)
</script>

<template>
  <div class="shell py-16 md:py-24">
    <RouterLink
      to="/projects"
      class="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-faint transition-colors hover:text-accent"
    >
      <span aria-hidden="true">&larr;</span> {{ t('backToProjects') }}
    </RouterLink>

    <header class="mt-10 max-w-3xl border-b border-line pb-10">
      <span class="block h-1 w-16 bg-iris" aria-hidden="true" />
      <p class="eyebrow mt-6 text-positive">{{ t('live') }}</p>
      <h1 class="mt-5 font-display text-title font-medium text-ink">{{ t('bac.title') }}</h1>
      <p class="prose-column mt-6">{{ t('bac.lead') }}</p>
    </header>

    <!-- The one thing that matters most, stated before anything else -->
    <p
      class="mt-8 border-l-2 border-clay py-2 pl-5 text-[1.0625rem] font-medium leading-relaxed text-ink"
    >
      {{ t('bac.warning') }}
    </p>

    <!-- ── Input ───────────────────────────────────────────────────────── -->
    <section class="grid gap-10 border-b border-line py-10 md:grid-cols-12">
      <div class="md:col-span-5">
        <label class="eyebrow block" for="weight">{{ t('bac.weight') }}</label>
        <div class="mt-3 flex items-center gap-4">
          <input
            id="weight"
            v-model.number="weight"
            type="range"
            min="40"
            max="150"
            step="1"
            class="flex-1 accent-accent"
          />
          <span class="w-16 shrink-0 text-right font-mono text-sm text-ink">{{ weight }} kg</span>
        </div>

        <p class="eyebrow mt-8">{{ t('bac.bodyWater') }}</p>
        <div class="mt-3 flex gap-1.5">
          <button
            v-for="option in [
              { value: R_FACTORS.higher, key: 'bac.waterHigher' },
              { value: R_FACTORS.lower, key: 'bac.waterLower' },
            ]"
            :key="option.key"
            type="button"
            class="flex-1 rounded-sm border px-3 py-2 font-mono text-[0.75rem] tracking-wide transition-colors"
            :class="
              rFactor === option.value
                ? 'border-ink bg-ink text-paper'
                : 'border-line text-muted hover:border-ink hover:text-ink'
            "
            @click="rFactor = option.value"
          >
            {{ t(option.key) }}
          </button>
        </div>
        <p class="mt-3 font-mono text-[0.688rem] leading-relaxed text-faint">
          {{ t('bac.bodyWaterNote') }}
        </p>
      </div>

      <div class="md:col-span-7">
        <p class="eyebrow">{{ t('bac.addDrink') }}</p>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <button
            v-for="preset in DRINK_PRESETS"
            :key="preset.id"
            type="button"
            class="rounded-sm border border-line px-3 py-2 font-mono text-[0.75rem] text-muted transition-colors hover:border-ink hover:text-ink"
            @click="addDrink(preset.id)"
          >
            + {{ preset.label[locale as 'en' | 'nb'] }}
          </button>
        </div>

        <!-- Drink list -->
        <ul v-if="hasDrinks" class="mt-6">
          <li
            v-for="drink in drinks"
            :key="drink.id"
            class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line py-3 last:border-b"
          >
            <span class="w-32 shrink-0 text-[0.9375rem] text-ink">{{ drink.label }}</span>

            <label class="flex flex-1 items-center gap-3">
              <span class="sr-only">{{ t('bac.whenDrunk') }}</span>
              <input
                v-model.number="drink.minutesAgo"
                type="range"
                min="0"
                max="480"
                step="15"
                class="flex-1 accent-accent"
              />
              <span class="w-24 shrink-0 text-right font-mono text-[0.75rem] text-muted">
                {{
                  drink.minutesAgo === 0
                    ? t('bac.justNow')
                    : t('bac.minutesAgo', { time: formatDuration(drink.minutesAgo, locale) })
                }}
              </span>
            </label>

            <button
              type="button"
              class="shrink-0 font-mono text-[0.688rem] uppercase tracking-widest text-faint transition-colors hover:text-clay"
              :aria-label="`${t('actions.delete')} ${drink.label}`"
              @click="removeDrink(drink.id)"
            >
              {{ t('actions.delete') }}
            </button>
          </li>
        </ul>

        <button v-if="hasDrinks" type="button" class="btn btn-outline mt-5" @click="clearAll">
          {{ t('clearall') }}
        </button>

        <p v-else class="mt-6 font-mono text-[0.8125rem] text-faint">{{ t('bac.empty') }}</p>
      </div>
    </section>

    <!-- ── Result ──────────────────────────────────────────────────────── -->
    <section v-if="hasDrinks" class="grid gap-10 border-b border-line py-10 md:grid-cols-12">
      <div class="md:col-span-5">
        <p class="eyebrow">{{ t('bac.rightNow') }}</p>
        <p
          class="mt-3 font-display text-[clamp(2.5rem,7vw,4rem)] font-medium leading-none text-ink"
        >
          {{ formatBac(current.low) }}–{{ formatBac(current.high) }}
          <span class="text-faint">‰</span>
        </p>
        <p class="mt-3 text-[0.9375rem] leading-relaxed text-muted">{{ t('bac.rangeNote') }}</p>
      </div>

      <dl class="grid grid-cols-2 gap-6 md:col-span-7">
        <div>
          <dt class="eyebrow">{{ t('bac.peak') }}</dt>
          <dd class="mt-2 font-mono text-lg text-ink">{{ formatBac(peak.estimate.high) }} ‰</dd>
          <dd class="font-mono text-[0.688rem] text-faint">
            {{ peak.minutes === 0 ? t('bac.now') : clockAfter(peak.minutes) }}
          </dd>
        </div>
        <div>
          <dt class="eyebrow">{{ t('bac.underLimit') }}</dt>
          <dd class="mt-2 font-mono text-lg text-ochre">
            {{ untilLegal === null ? '—' : formatDuration(untilLegal, locale) }}
          </dd>
          <dd v-if="untilLegal !== null" class="font-mono text-[0.688rem] text-faint">
            {{ t('bac.around', { time: clockAfter(untilLegal) }) }}
          </dd>
        </div>
        <div>
          <dt class="eyebrow">{{ t('bac.sober') }}</dt>
          <dd class="mt-2 font-mono text-lg text-pine">
            {{ untilZero === null ? '—' : formatDuration(untilZero, locale) }}
          </dd>
          <dd v-if="untilZero !== null" class="font-mono text-[0.688rem] text-faint">
            {{ t('bac.around', { time: clockAfter(untilZero) }) }}
          </dd>
        </div>
        <div>
          <dt class="eyebrow">{{ t('bac.units') }}</dt>
          <dd class="mt-2 font-mono text-lg text-ink">{{ drinks.length }}</dd>
        </div>
      </dl>
    </section>

    <!-- ── Curve ───────────────────────────────────────────────────────── -->
    <section v-if="hasDrinks" class="border-b border-line py-10">
      <div class="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h2 class="font-display text-2xl font-medium text-ink">{{ t('bac.curveHeading') }}</h2>
        <p class="font-mono text-[0.688rem] uppercase tracking-[0.1em] text-muted">
          {{ t('bac.curveLegend') }}
        </p>
      </div>

      <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" role="img" :aria-label="t('bac.curveAria')">
        <!-- Grid -->
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
            :x="PAD.left - 8"
            :y="y(line) + 4"
            text-anchor="end"
            class="fill-faint font-mono text-[11px]"
          >
            {{ line.toFixed(2) }}
          </text>
        </template>

        <!-- Legal limit -->
        <line
          :x1="PAD.left"
          :x2="W - PAD.right"
          :y1="y(LEGAL_LIMIT)"
          :y2="y(LEGAL_LIMIT)"
          class="stroke-clay"
          stroke-width="1.5"
          stroke-dasharray="6 4"
        />
        <text
          :x="W - PAD.right"
          :y="y(LEGAL_LIMIT) - 6"
          text-anchor="end"
          class="fill-clay font-mono text-[11px]"
        >
          {{ LEGAL_LIMIT.toFixed(1) }} ‰
        </text>

        <!-- Uncertainty band, then the typical line on top -->
        <path :d="bandPath" class="fill-iris/25" />
        <path
          :d="typicalPath"
          fill="none"
          class="stroke-iris"
          stroke-width="2"
          stroke-linejoin="round"
        />

        <!-- Baseline and hour labels -->
        <line
          :x1="PAD.left"
          :x2="W - PAD.right"
          :y1="PAD.top + plotH"
          :y2="PAD.top + plotH"
          class="stroke-ink/40"
          stroke-width="1"
        />
        <text
          v-for="hour in hourMarks"
          :key="hour"
          :x="x(hour * 60)"
          :y="H - 10"
          text-anchor="middle"
          class="fill-faint font-mono text-[11px]"
        >
          +{{ hour }}
        </text>
      </svg>

      <p class="mt-4 font-mono text-[0.688rem] leading-relaxed text-faint">
        {{ t('bac.curveNote', { minutes: ABSORPTION_MINUTES }) }}
      </p>
    </section>

    <!-- ── Why there is no "can I drive" button ────────────────────────── -->
    <section class="py-10">
      <div class="grid gap-10 md:grid-cols-12">
        <h2 class="font-display text-2xl font-medium text-ink md:col-span-4">
          {{ t('bac.designHeading') }}
        </h2>
        <div class="md:col-span-8">
          <p class="prose-column">{{ t('bac.designBody') }}</p>
          <p class="prose-column mt-5">{{ t('bac.designBody2') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
