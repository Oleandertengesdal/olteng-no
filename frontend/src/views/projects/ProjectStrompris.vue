<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import PriceChart from '@/components/power/PriceChart.vue'
import ZoneCompare from '@/components/power/ZoneCompare.vue'
import NorwayMap from '@/components/power/NorwayMap.vue'
import { textClasses } from '@/data/tech'
import { projects } from '@/data/projects'
import {
  ZONES,
  zoneById,
  fetchAllZones,
  nationalAverage,
  statsFor,
  levelFor,
  currentHourIndex,
  osloDate,
  hourLabel,
  tomorrowMayBePublished,
  formatOre,
  formatKroner,
  PricesNotPublishedError,
  type ChartPoint,
  type ZoneDay,
  type ZoneId,
  type ZoneSummary,
} from '@/data/power'
import {
  currentTariffs,
  DEFAULT_USER_TARIFF,
  breakdown,
  breakdownParts,
  compareSchemes,
  breakEvenSpot,
  dayTotals,
  monthlyEstimate,
  thresholdInclVat,
  type Scheme,
  type UserTariff,
} from '@/data/pricing'

const { t, locale } = useI18n()

const SETTINGS_KEY = 'olteng.power.v2'

/* ── State ─────────────────────────────────────────────────────────────── */

const zone = ref<ZoneId>('NO3')
const dayOffset = ref<0 | 1>(0)
const scheme = ref<Scheme>('spot')
const user = ref<UserTariff>({ ...DEFAULT_USER_TARIFF })
const monthlyKwh = ref(1200)
const settingsOpen = ref(false)
const hovered = ref<number | null>(null)

const days = ref<ZoneDay[]>([])
const failedZones = ref<ZoneId[]>([])
const loading = ref(true)
const notPublished = ref(false)
const error = ref<string | null>(null)

const tariffs = currentTariffs()

let controller: AbortController | null = null

/** Reactive clock so a tab left open overnight still shows the right day */
const now = ref(new Date())
let clock: ReturnType<typeof setInterval> | undefined

const targetDate = computed(() => osloDate(dayOffset.value, now.value))
const tomorrowAvailable = computed(() => tomorrowMayBePublished(now.value))

/* ── Persistence ───────────────────────────────────────────────────────── */

onMounted(() => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const parsed = JSON.parse(saved) as {
      zone?: ZoneId
      scheme?: Scheme
      user?: UserTariff
      monthlyKwh?: number
    }
    if (parsed.zone) zone.value = parsed.zone
    if (parsed.scheme) scheme.value = parsed.scheme
    if (parsed.user) user.value = { ...DEFAULT_USER_TARIFF, ...parsed.user }
    if (parsed.monthlyKwh) monthlyKwh.value = parsed.monthlyKwh
  } catch {
    // Blocked or corrupt storage — the defaults are fine
  }
})

watch(
  [zone, scheme, user, monthlyKwh],
  () => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          zone: zone.value,
          scheme: scheme.value,
          user: user.value,
          monthlyKwh: monthlyKwh.value,
        }),
      )
    } catch {
      /* private mode */
    }
  },
  { deep: true },
)

/* ── Loading ───────────────────────────────────────────────────────────── */

const load = async () => {
  controller?.abort()
  controller = new AbortController()

  loading.value = true
  error.value = null
  notPublished.value = false
  hovered.value = null

  try {
    const result = await fetchAllZones(targetDate.value, controller.signal)

    if (result.days.length === 0) {
      notPublished.value = dayOffset.value === 1
      if (!notPublished.value) error.value = t('power.errorGeneric')
      days.value = []
      return
    }

    days.value = result.days
    failedZones.value = result.failed
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === 'AbortError') return
    if (caught instanceof PricesNotPublishedError) notPublished.value = true
    else error.value = t('power.errorGeneric')
    days.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  clock = setInterval(() => (now.value = new Date()), 60_000)
})

onBeforeUnmount(() => {
  controller?.abort()
  clearInterval(clock)
})

watch(dayOffset, load)
watch(targetDate, (next, previous) => {
  if (next !== previous) load()
})

/* ── Pricing ───────────────────────────────────────────────────────────── */

const activeZone = computed(() => zoneById(zone.value))
const selectedDay = computed(() => days.value.find((day) => day.zone === zone.value) ?? null)
const spotPrices = computed(() => selectedDay.value?.points.map((point) => point.oreExVat) ?? [])

/** Shared context for every pricing call on this page */
const pricingContext = computed(() => ({
  zone: zone.value,
  tariffs,
  user: user.value,
  vatExempt: activeZone.value.vatExempt,
}))

const priceAt = (spot: number, forScheme: Scheme = scheme.value) =>
  breakdown({ ...pricingContext.value, spotOreExVat: spot, scheme: forScheme })

const nowIndex = computed(() =>
  dayOffset.value === 0 ? currentHourIndex(selectedDay.value?.points ?? [], now.value) : -1,
)

const focusIndex = computed(() => hovered.value ?? (nowIndex.value >= 0 ? nowIndex.value : 0))
const focusPoint = computed(() => selectedDay.value?.points[focusIndex.value] ?? null)

const current = computed(() => (focusPoint.value ? priceAt(focusPoint.value.oreExVat) : null))
const currentParts = computed(() => (current.value ? breakdownParts(current.value) : []))

const comparison = computed(() =>
  focusPoint.value
    ? compareSchemes({ ...pricingContext.value, spotOreExVat: focusPoint.value.oreExVat })
    : null,
)

const breakEven = computed(() => breakEvenSpot(tariffs, user.value))
const totals = computed(() =>
  dayTotals(spotPrices.value, { ...pricingContext.value, scheme: scheme.value }),
)
const monthly = computed(() =>
  monthlyEstimate(monthlyKwh.value, spotPrices.value, {
    ...pricingContext.value,
    scheme: scheme.value,
  }),
)

/* ── Chart ─────────────────────────────────────────────────────────────────
   Bars show what you actually pay. The dashed line shows what the same hour
   would have cost without the support scheme — so the gap between them is the
   support, visible at a glance rather than buried in a number.             */

const rawStats = computed(() => statsFor(selectedDay.value?.points ?? []))

const chartPoints = computed<ChartPoint[]>(
  () =>
    selectedDay.value?.points.map((point, index) => ({
      key: point.key,
      label: hourLabel(point.start),
      value: priceAt(point.oreExVat).total,
      level: levelFor(point.oreExVat, rawStats.value),
      isNow: index === nowIndex.value,
    })) ?? [],
)

const withoutSupport = computed(() =>
  spotPrices.value.map(
    (spot) =>
      breakdown({
        ...pricingContext.value,
        spotOreExVat: spot,
        scheme: 'spot',
        tariffs: { ...tariffs, supportThresholdOre: Number.POSITIVE_INFINITY },
      }).total,
  ),
)

/* ── Zones ─────────────────────────────────────────────────────────────── */

const zoneSummaries = computed<ZoneSummary[]>(() =>
  days.value.map((day) => ({
    zone: day.zone,
    mean: dayTotals(
      day.points.map((point) => point.oreExVat),
      {
        zone: day.zone,
        tariffs,
        user: user.value,
        vatExempt: zoneById(day.zone).vatExempt,
        scheme: scheme.value,
      },
    ).averageTotal,
  })),
)

const nationalMean = computed(() => {
  const points = nationalAverage(days.value)
  if (points.length === 0) return 0
  return dayTotals(
    points.map((point) => point.oreExVat),
    { ...pricingContext.value, scheme: scheme.value },
  ).averageTotal
})

/* ── Labels ────────────────────────────────────────────────────────────── */

const dateLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'nb' ? 'nb-NO' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Oslo',
  }).format(new Date(`${targetDate.value}T12:00:00+02:00`)),
)

const chartCaption = computed(() =>
  t('power.chartCaption', {
    zone: zone.value,
    city: activeZone.value.city,
    date: dateLabel.value,
  }),
)

const partTone: Record<string, string> = {
  energy: 'bg-iris',
  markup: 'bg-clay',
  tax: 'bg-ochre',
  grid: 'bg-pine',
  vat: 'bg-raised',
}

const build = computed(() => {
  const entry = projects.find((project) => project.id === 'strompris')
  if (!entry?.showcase) return null
  const loc = locale.value as 'en' | 'nb'
  return {
    details: entry.showcase.technicalDetails?.[loc] ?? '',
    challenges: entry.showcase.challenges?.[loc] ?? [],
    githubUrl: entry.githubUrl,
  }
})
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
      <span class="block h-1 w-16 bg-pine" aria-hidden="true" />
      <p class="eyebrow mt-6 text-positive">{{ t('live') }}</p>
      <h1 class="mt-5 font-display text-title font-medium text-ink">{{ t('power.title') }}</h1>
      <p class="prose-column mt-6">{{ t('power.lead') }}</p>
    </header>

    <!-- ── Controls ────────────────────────────────────────────────────── -->
    <div class="mt-10 space-y-6 border-b border-line pb-8">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow mb-3">{{ t('power.zone') }}</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="option in ZONES"
              :key="option.id"
              type="button"
              class="rounded-sm border px-3 py-2 font-mono text-[0.75rem] tracking-wide transition-colors"
              :class="
                option.id === zone
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line text-muted hover:border-ink hover:text-ink'
              "
              :aria-pressed="option.id === zone"
              @click="zone = option.id"
            >
              {{ option.id }}<span class="hidden sm:inline"> · {{ option.city }}</span>
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-6">
          <div>
            <p class="eyebrow mb-3">{{ t('power.day') }}</p>
            <div class="flex gap-1.5">
              <button
                type="button"
                class="rounded-sm border px-3 py-2 font-mono text-[0.75rem] transition-colors"
                :class="
                  dayOffset === 0
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-muted hover:border-ink hover:text-ink'
                "
                @click="dayOffset = 0"
              >
                {{ t('power.today') }}
              </button>
              <button
                type="button"
                class="rounded-sm border px-3 py-2 font-mono text-[0.75rem] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                :class="
                  dayOffset === 1
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-muted hover:border-ink hover:text-ink'
                "
                :disabled="!tomorrowAvailable"
                :title="tomorrowAvailable ? undefined : t('power.tomorrowLocked')"
                @click="dayOffset = 1"
              >
                {{ t('power.tomorrow') }}
              </button>
            </div>
          </div>

          <div>
            <p class="eyebrow mb-3">{{ t('power.scheme') }}</p>
            <div class="flex gap-1.5">
              <button
                v-for="option in [
                  { value: 'spot' as Scheme, key: 'power.schemeSpot' },
                  { value: 'norgespris' as Scheme, key: 'power.schemeNorgespris' },
                ]"
                :key="option.value"
                type="button"
                class="rounded-sm border px-3 py-2 font-mono text-[0.75rem] transition-colors"
                :class="
                  scheme === option.value
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-muted hover:border-ink hover:text-ink'
                "
                :aria-pressed="scheme === option.value"
                @click="scheme = option.value"
              >
                {{ t(option.key) }}
              </button>
            </div>
          </div>

          <button type="button" class="btn btn-outline" @click="settingsOpen = !settingsOpen">
            {{ t('power.settings') }}
          </button>
        </div>
      </div>

      <!-- Your own tariff -->
      <div v-if="settingsOpen" class="grid gap-6 border border-line p-5 sm:grid-cols-3">
        <label class="block">
          <span class="eyebrow">{{ t('power.markup') }}</span>
          <input
            v-model.number="user.markupOre"
            type="number"
            min="0"
            max="50"
            step="0.5"
            class="mt-2 w-full rounded-sm border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.8125rem] text-ink focus:border-ink focus:outline-none"
          />
        </label>
        <label class="block">
          <span class="eyebrow">{{ t('power.grid') }}</span>
          <input
            v-model.number="user.gridOre"
            type="number"
            min="0"
            max="100"
            step="1"
            class="mt-2 w-full rounded-sm border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.8125rem] text-ink focus:border-ink focus:outline-none"
          />
        </label>
        <label class="flex items-end gap-2.5 pb-2">
          <input
            v-model="user.electricityTaxExempt"
            type="checkbox"
            class="h-4 w-4 shrink-0 accent-accent"
          />
          <span class="text-[0.875rem] text-ink">{{ t('power.taxExempt') }}</span>
        </label>
        <p class="font-mono text-[0.688rem] leading-relaxed text-faint sm:col-span-3">
          {{ t('power.settingsNote') }}
        </p>
      </div>
    </div>

    <!-- ── States ──────────────────────────────────────────────────────── -->
    <p v-if="loading" class="py-24 text-center font-mono text-sm text-faint">
      {{ t('ui.loading') }}
    </p>

    <div v-else-if="notPublished" class="border-b border-line py-20 text-center">
      <p class="font-display text-2xl font-medium text-ink">{{ t('power.notPublishedTitle') }}</p>
      <p class="prose-column mx-auto mt-4">{{ t('power.notPublishedBody') }}</p>
      <button type="button" class="btn btn-outline mt-8" @click="dayOffset = 0">
        {{ t('power.backToToday') }}
      </button>
    </div>

    <div v-else-if="error" class="border-b border-line py-20 text-center">
      <p class="font-display text-2xl font-medium text-clay">{{ t('power.errorTitle') }}</p>
      <p class="prose-column mx-auto mt-4">{{ error }}</p>
      <button type="button" class="btn btn-outline mt-8" @click="load">
        {{ t('power.retry') }}
      </button>
    </div>

    <template v-else-if="current && comparison">
      <!-- ── What you actually pay ─────────────────────────────────────── -->
      <section class="grid gap-10 border-b border-line py-10 md:grid-cols-12">
        <div class="md:col-span-5">
          <p class="eyebrow">
            {{
              focusIndex === nowIndex
                ? t('power.youPayNow')
                : t('power.youPayAt', { hour: hourLabel(focusPoint!.start) })
            }}
          </p>
          <p
            class="mt-3 font-display text-[clamp(3rem,10vw,5.5rem)] font-medium leading-none"
            :class="textClasses[activeZone.hue]"
          >
            {{ formatOre(current.total) }}
            <span class="text-faint">{{ t('power.ore') }}</span>
          </p>
          <p class="mt-2 font-mono text-[0.8125rem] tracking-wide text-muted">
            {{ t('power.perKwhAllIn') }}
          </p>
          <p class="mt-4 text-[0.9375rem] text-muted">
            {{ activeZone.id }} · {{ activeZone.city }} — {{ dateLabel }}
          </p>

          <!-- Stacked bar -->
          <div class="mt-8 flex h-3 w-full overflow-hidden rounded-sm" aria-hidden="true">
            <span
              v-for="part in currentParts"
              :key="part.key"
              class="h-full transition-all duration-500 ease-editorial"
              :class="partTone[part.tone]"
              :style="{ width: `${(part.value / current.total) * 100}%` }"
            />
          </div>
        </div>

        <!-- Breakdown -->
        <div class="md:col-span-6 md:col-start-7">
          <p class="eyebrow mb-4">{{ t('power.breakdown') }}</p>
          <dl>
            <div class="flex items-baseline justify-between border-t border-line py-2.5">
              <dt class="text-[0.9375rem] text-muted">{{ t('power.spotPrice') }}</dt>
              <dd class="font-mono text-[0.875rem] text-ink">{{ formatOre(current.spot) }}</dd>
            </div>
            <div
              v-if="current.support > 0"
              class="flex items-baseline justify-between border-t border-line py-2.5"
            >
              <dt class="text-[0.9375rem] text-pine">{{ t('power.support') }}</dt>
              <dd class="font-mono text-[0.875rem] text-pine">
                &minus;{{ formatOre(current.support) }}
              </dd>
            </div>
            <div
              v-for="part in currentParts"
              :key="part.key"
              class="flex items-baseline justify-between border-t border-line py-2.5"
            >
              <dt class="flex items-center gap-2.5 text-[0.9375rem] text-muted">
                <span class="h-2 w-2 shrink-0" :class="partTone[part.tone]" aria-hidden="true" />
                {{ t(`power.part.${part.key}`) }}
              </dt>
              <dd class="font-mono text-[0.875rem] text-ink">{{ formatOre(part.value) }}</dd>
            </div>
            <div class="flex items-baseline justify-between border-y-2 border-ink py-3">
              <dt class="font-medium text-ink">{{ t('power.total') }}</dt>
              <dd class="font-mono text-[1.0625rem] font-medium text-ink">
                {{ formatOre(current.total) }} {{ t('power.ore') }}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- ── Which scheme is cheaper ───────────────────────────────────── -->
      <section class="border-b border-line py-10">
        <div class="grid gap-10 md:grid-cols-12">
          <div class="md:col-span-4">
            <h2 class="font-display text-2xl font-medium text-ink">
              {{ t('power.compareSchemes') }}
            </h2>
            <p class="prose-column mt-4 text-[0.9375rem]">{{ t('power.compareSchemesLead') }}</p>
          </div>

          <div class="md:col-span-7 md:col-start-6">
            <div class="grid grid-cols-2 gap-px border border-line bg-line">
              <div
                class="bg-paper px-5 py-5"
                :class="comparison.cheaper === 'spot' ? 'ring-2 ring-inset ring-pine' : ''"
              >
                <p class="eyebrow">{{ t('power.schemeSpot') }}</p>
                <p class="mt-2 font-display text-2xl font-medium text-ink">
                  {{ formatOre(comparison.spotTotal) }}
                </p>
              </div>
              <div
                class="bg-paper px-5 py-5"
                :class="comparison.cheaper === 'norgespris' ? 'ring-2 ring-inset ring-pine' : ''"
              >
                <p class="eyebrow">{{ t('power.schemeNorgespris') }}</p>
                <p class="mt-2 font-display text-2xl font-medium text-ink">
                  {{ formatOre(comparison.norgesprisTotal) }}
                </p>
              </div>
            </div>

            <p class="mt-6 text-[1.0625rem] leading-relaxed text-ink">
              {{
                t('power.verdict', {
                  scheme:
                    comparison.cheaper === 'spot'
                      ? t('power.schemeSpot')
                      : t('power.schemeNorgespris'),
                  diff: formatOre(Math.abs(comparison.savingWithNorgespris)),
                })
              }}
            </p>

            <p
              class="mt-4 border-l-2 border-ochre py-1 pl-4 text-[0.9375rem] leading-relaxed text-muted"
            >
              {{ t('power.breakEven', { price: formatOre(breakEven) }) }}
            </p>

            <p class="mt-4 font-mono text-[0.688rem] leading-relaxed text-faint">
              {{
                t('power.thresholdNote', {
                  ex: formatOre(tariffs.supportThresholdOre),
                  incl: formatOre(thresholdInclVat(tariffs)),
                  share: tariffs.supportShare * 100,
                })
              }}
            </p>
          </div>
        </div>
      </section>

      <!-- ── Hour by hour ──────────────────────────────────────────────── -->
      <section class="border-b border-line py-10">
        <div class="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <h2 class="font-display text-2xl font-medium text-ink">{{ t('power.chartHeading') }}</h2>
          <ul class="flex flex-wrap items-center gap-x-5 gap-y-2">
            <li
              v-for="item in [
                { cls: 'bg-pine', key: 'power.legendLow' },
                { cls: 'bg-ochre', key: 'power.legendMid' },
                { cls: 'bg-clay', key: 'power.legendHigh' },
              ]"
              :key="item.key"
              class="flex items-center gap-2 font-mono text-[0.688rem] uppercase tracking-[0.1em] text-muted"
            >
              <span class="h-1.5 w-1.5 shrink-0" :class="item.cls" aria-hidden="true" />
              {{ t(item.key) }}
            </li>
            <li
              class="flex items-center gap-2 font-mono text-[0.688rem] uppercase tracking-[0.1em] text-muted"
            >
              <span
                class="h-px w-5 shrink-0 border-t border-dashed border-ink"
                aria-hidden="true"
              />
              {{ t('power.legendWithoutSupport') }}
            </li>
          </ul>
        </div>

        <PriceChart
          v-model:hovered="hovered"
          :points="chartPoints"
          :average="withoutSupport"
          :caption="chartCaption"
        />

        <p class="mt-4 font-mono text-[0.688rem] leading-relaxed text-faint">
          {{ t('power.chartNote') }}
        </p>

        <dl class="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6 sm:grid-cols-4">
          <div>
            <dt class="eyebrow">{{ t('power.dayAverage') }}</dt>
            <dd class="mt-2 font-mono text-lg text-ink">{{ formatOre(totals.averageTotal) }}</dd>
          </div>
          <div>
            <dt class="eyebrow">{{ t('power.cheapestHour') }}</dt>
            <dd class="mt-2 font-mono text-lg text-pine">{{ formatOre(totals.cheapestTotal) }}</dd>
          </div>
          <div>
            <dt class="eyebrow">{{ t('power.priciestHour') }}</dt>
            <dd class="mt-2 font-mono text-lg text-clay">{{ formatOre(totals.priciestTotal) }}</dd>
          </div>
          <div>
            <dt class="eyebrow">{{ t('power.supportedHours') }}</dt>
            <dd class="mt-2 font-mono text-lg text-ink">
              {{ totals.hoursWithSupport }}<span class="text-faint">/{{ spotPrices.length }}</span>
            </dd>
          </div>
        </dl>
      </section>

      <!-- ── Monthly ───────────────────────────────────────────────────── -->
      <section class="border-b border-line py-10">
        <div class="grid gap-10 md:grid-cols-12">
          <div class="md:col-span-4">
            <h2 class="font-display text-2xl font-medium text-ink">
              {{ t('power.monthHeading') }}
            </h2>
            <p class="prose-column mt-4 text-[0.9375rem]">{{ t('power.monthLead') }}</p>
          </div>

          <div class="md:col-span-7 md:col-start-6">
            <label class="eyebrow block" for="kwh">{{ t('power.monthlyUse') }}</label>
            <div class="mt-3 flex items-center gap-4">
              <input
                id="kwh"
                v-model.number="monthlyKwh"
                type="range"
                min="200"
                max="8000"
                step="100"
                class="flex-1 accent-accent"
              />
              <span class="w-24 shrink-0 text-right font-mono text-sm text-ink">
                {{ monthlyKwh }} kWh
              </span>
            </div>

            <dl class="mt-8 grid grid-cols-2 gap-6">
              <div>
                <dt class="eyebrow">{{ t('power.monthTotal') }}</dt>
                <dd class="mt-2 font-display text-3xl font-medium text-ink">
                  {{ formatKroner(monthly.total * 100) }}
                  <span class="text-faint text-lg">kr</span>
                </dd>
              </div>
              <div>
                <dt class="eyebrow">{{ t('power.monthSaved') }}</dt>
                <dd class="mt-2 font-display text-3xl font-medium text-pine">
                  {{ formatKroner(monthly.saved * 100) }}
                  <span class="text-faint text-lg">kr</span>
                </dd>
              </div>
            </dl>

            <p
              v-if="monthly.unsupportedKwh > 0"
              class="mt-6 border-l-2 border-clay py-1 pl-4 text-[0.9375rem] leading-relaxed text-muted"
            >
              {{
                t('power.overCap', {
                  cap: tariffs.supportCapKwhPerMonth,
                  over: Math.round(monthly.unsupportedKwh),
                })
              }}
            </p>

            <p class="mt-4 font-mono text-[0.688rem] leading-relaxed text-faint">
              {{ t('power.monthNote') }}
            </p>
          </div>
        </div>
      </section>

      <!-- ── Across the country ────────────────────────────────────────── -->
      <section class="border-b border-line py-10">
        <div class="mb-8 max-w-prose">
          <h2 class="font-display text-2xl font-medium text-ink">
            {{ t('power.compareHeading') }}
          </h2>
          <p class="prose-column mt-4 text-[0.9375rem]">{{ t('power.compareLead') }}</p>
          <p v-if="failedZones.length" class="mt-4 font-mono text-[0.688rem] text-clay">
            {{ t('power.zonesUnavailable', { zones: failedZones.join(', ') }) }}
          </p>
        </div>

        <div class="grid items-start gap-10 md:grid-cols-12">
          <div class="md:col-span-5">
            <p class="eyebrow mb-5">{{ t('power.mapHeading') }}</p>
            <NorwayMap :summaries="zoneSummaries" :selected="zone" @select="zone = $event" />
          </div>
          <div class="md:col-span-6 md:col-start-7">
            <ZoneCompare
              :summaries="zoneSummaries"
              :national="nationalMean"
              :selected="zone"
              @select="zone = $event"
            />
          </div>
        </div>
      </section>

      <!-- ── How it is built ───────────────────────────────────────────── -->
      <section v-if="build" class="border-b border-line py-10">
        <div class="grid gap-10 md:grid-cols-12">
          <h2 class="font-display text-2xl font-medium text-ink md:col-span-4">
            {{ t('power.howBuilt') }}
          </h2>
          <div class="md:col-span-8">
            <p class="prose-column">{{ build.details }}</p>
            <ul class="mt-8">
              <li
                v-for="(item, i) in build.challenges"
                :key="i"
                class="flex gap-5 border-t border-line py-3.5"
              >
                <span class="mt-0.5 font-mono text-[0.75rem] tracking-widest text-pine">
                  {{ String(i + 1).padStart(2, '0') }}
                </span>
                <span class="text-[0.9375rem] leading-relaxed text-muted">{{ item }}</span>
              </li>
            </ul>
            <a
              v-if="build.githubUrl"
              :href="build.githubUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-outline mt-8"
            >
              {{ t('viewOnGithub') }}
            </a>
          </div>
        </div>
      </section>

      <!-- ── Sources ───────────────────────────────────────────────────── -->
      <footer class="py-10">
        <p class="max-w-prose font-mono text-[0.688rem] leading-relaxed text-faint">
          {{ t('power.sourcePrefix') }}
          <a
            href="https://www.hvakosterstrommen.no"
            target="_blank"
            rel="noopener noreferrer"
            class="link-quiet underline"
          >
            Hva koster strømmen.no
          </a>
          — {{ t('power.sourceNote') }}
        </p>
        <p class="mt-3 max-w-prose font-mono text-[0.688rem] leading-relaxed text-faint">
          {{ t('power.ratesFrom', { year: tariffs.year }) }}
          <a
            v-for="(source, i) in tariffs.sources"
            :key="source"
            :href="source"
            target="_blank"
            rel="noopener noreferrer"
            class="link-quiet underline"
          >
            {{ i === 0 ? 'regjeringen.no' : i === 1 ? 'NVE' : 'hvakosterstrommen.no'
            }}<span v-if="i < tariffs.sources.length - 1">, </span>
          </a>
        </p>
      </footer>
    </template>
  </div>
</template>
