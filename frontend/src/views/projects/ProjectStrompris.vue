<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import PriceChart from '@/components/power/PriceChart.vue'
import ZoneCompare from '@/components/power/ZoneCompare.vue'
import NorwayMap from '@/components/power/NorwayMap.vue'
import { bgClasses, textClasses } from '@/data/tech'
import { projects } from '@/data/projects'
import {
  ZONES,
  zoneById,
  fetchAllZones,
  nationalAverage,
  statsFor,
  levelFor,
  currentHourIndex,
  percentDiff,
  withVat,
  osloDate,
  hourLabel,
  tomorrowMayBePublished,
  formatKr,
  formatOre,
  PricesNotPublishedError,
  type ChartPoint,
  type ZoneDay,
  type ZoneId,
  type ZoneSummary,
} from '@/data/power'

const { t, locale } = useI18n()

/* ── State ─────────────────────────────────────────────────────────────── */

const zone = ref<ZoneId>('NO3')
const dayOffset = ref<0 | 1>(0)
const includeVat = ref(true)
const hovered = ref<number | null>(null)

const days = ref<ZoneDay[]>([])
const failedZones = ref<ZoneId[]>([])
const loading = ref(true)
const notPublished = ref(false)
const error = ref<string | null>(null)

let controller: AbortController | null = null

/**
 * A reactive clock, ticking once a minute.
 *
 * Everything time-dependent on this page reads from it rather than calling
 * `new Date()` inside a computed. A computed only re-evaluates when one of its
 * reactive dependencies changes, and wall-clock time is not one — so without
 * this tick a tab left open overnight would keep showing yesterday's prices
 * under today's heading, the "now" marker would freeze on the hour the page
 * happened to load, and the tomorrow button would stay disabled past 13:00.
 */
const now = ref(new Date())
let clock: ReturnType<typeof setInterval> | undefined

const targetDate = computed(() => osloDate(dayOffset.value, now.value))
const tomorrowAvailable = computed(() => tomorrowMayBePublished(now.value))

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
      // Every zone failed. If tomorrow simply is not out yet, say exactly that
      // rather than showing a generic error the visitor cannot act on.
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

// Midnight rollover: the date this page is showing changed under our feet, so
// fetch the new day rather than leaving stale prices on screen.
watch(targetDate, (next, previous) => {
  if (next !== previous) load()
})

/* ── Derived data ──────────────────────────────────────────────────────── */

const selectedDay = computed(() => days.value.find((day) => day.zone === zone.value) ?? null)

/** Raw (ex-VAT) statistics — used for colour levels, which VAT cannot change */
const rawStats = computed(() => statsFor(selectedDay.value?.points ?? []))

const display = (value: number, forZone: ZoneId = zone.value) =>
  withVat(value, forZone, includeVat.value)

const nationalPoints = computed(() => nationalAverage(days.value))

const nowIndex = computed(() =>
  dayOffset.value === 0 ? currentHourIndex(selectedDay.value?.points ?? [], now.value) : -1,
)

const chartPoints = computed<ChartPoint[]>(
  () =>
    selectedDay.value?.points.map((point, index) => ({
      key: point.key,
      label: hourLabel(point.start),
      value: display(point.nokExVat),
      level: levelFor(point.nokExVat, rawStats.value),
      isNow: index === nowIndex.value,
    })) ?? [],
)

/**
 * The national line is drawn without VAT variation between zones — it is a
 * plain mean of the five areas, so we apply the selected zone's VAT rule to
 * keep the two series comparable on the same axis.
 */
const nationalSeries = computed(() => nationalPoints.value.map((point) => display(point.nokExVat)))

const nationalMean = computed(() => display(statsFor(nationalPoints.value).mean))

const zoneSummaries = computed<ZoneSummary[]>(() =>
  days.value.map((day) => ({
    zone: day.zone,
    mean: withVat(statsFor(day.points).mean, day.zone, includeVat.value),
  })),
)

const zoneMean = computed(() => display(rawStats.value.mean))
const vsNational = computed(() => percentDiff(zoneMean.value, nationalMean.value))

/** Whatever the pointer is on, falling back to the current hour */
const focusIndex = computed(() => hovered.value ?? (nowIndex.value >= 0 ? nowIndex.value : 0))
const focusPoint = computed(() => selectedDay.value?.points[focusIndex.value] ?? null)

const headline = computed(() => {
  const point = focusPoint.value
  if (!point) return null
  return {
    value: display(point.nokExVat),
    hour: hourLabel(point.start),
    isNow: focusIndex.value === nowIndex.value,
  }
})

const cheapest = computed(() => {
  const point = rawStats.value.cheapest
  return point ? { hour: hourLabel(point.start), value: display(point.nokExVat) } : null
})

const priciest = computed(() => {
  const point = rawStats.value.priciest
  return point ? { hour: hourLabel(point.start), value: display(point.nokExVat) } : null
})

const activeZone = computed(() => zoneById(zone.value))

const dateLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'nb' ? 'nb-NO' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Oslo',
  }).format(new Date(`${targetDate.value}T12:00:00+02:00`)),
)

/**
 * The write-up is stored alongside every other project rather than duplicated
 * here, so the projects list and this page can never drift apart.
 */
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

const chartCaption = computed(() =>
  t('power.chartCaption', {
    zone: zone.value,
    city: activeZone.value.city,
    date: dateLabel.value,
  }),
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

    <!-- Header -->
    <header class="mt-10 max-w-3xl border-b border-line pb-10">
      <span class="block h-1 w-16 bg-pine" aria-hidden="true" />
      <p class="eyebrow mt-6 text-positive">{{ t('live') }}</p>
      <h1 class="mt-5 font-display text-title font-medium text-ink">{{ t('power.title') }}</h1>
      <p class="prose-column mt-6">{{ t('power.lead') }}</p>
    </header>

    <!-- Controls -->
    <div class="mt-10 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
      <div>
        <p class="eyebrow mb-3">{{ t('power.zone') }}</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="option in ZONES"
            :key="option.id"
            type="button"
            class="flex items-center gap-2 rounded-sm border px-3 py-2 font-mono text-[0.75rem] tracking-wide transition-colors duration-200"
            :class="
              option.id === zone
                ? 'border-ink bg-ink text-paper'
                : 'border-line text-muted hover:border-ink hover:text-ink'
            "
            :aria-pressed="option.id === zone"
            @click="zone = option.id"
          >
            <span
              v-if="option.id !== zone"
              class="h-1.5 w-1.5 shrink-0"
              :class="bgClasses[option.hue]"
              aria-hidden="true"
            />
            {{ option.id }}
            <span class="hidden sm:inline">· {{ option.city }}</span>
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-end gap-6">
        <div>
          <p class="eyebrow mb-3">{{ t('power.day') }}</p>
          <div class="flex gap-1.5">
            <button
              type="button"
              class="rounded-sm border px-3 py-2 font-mono text-[0.75rem] tracking-wide transition-colors"
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
              class="rounded-sm border px-3 py-2 font-mono text-[0.75rem] tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40"
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

        <label class="flex cursor-pointer items-center gap-2.5 pb-2">
          <input
            v-model="includeVat"
            type="checkbox"
            class="h-4 w-4 shrink-0 accent-accent"
            :disabled="activeZone.vatExempt"
          />
          <span class="font-mono text-[0.75rem] tracking-wide text-muted">
            {{ t('power.withVat') }}
          </span>
        </label>
      </div>
    </div>

    <!-- States -->
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

    <!-- Data -->
    <template v-else-if="selectedDay">
      <!-- Headline numbers -->
      <div class="grid gap-8 border-b border-line py-10 md:grid-cols-12">
        <div class="md:col-span-5">
          <p class="eyebrow">
            {{
              headline?.isNow ? t('power.rightNow') : t('power.atHour', { hour: headline?.hour })
            }}
          </p>
          <p
            class="mt-3 font-display text-[clamp(3rem,9vw,5rem)] font-medium leading-none"
            :class="textClasses[activeZone.hue]"
          >
            {{ headline ? formatKr(headline.value) : '—' }}
          </p>
          <p class="mt-2 font-mono text-[0.8125rem] tracking-wide text-muted">
            {{ t('power.perKwh') }} · {{ headline ? formatOre(headline.value) : '—' }}
            {{ t('power.ore') }}
          </p>
          <p class="mt-4 text-[0.9375rem] text-muted">
            {{ activeZone.id }} · {{ activeZone.city }},
            {{ activeZone.region[locale as 'en' | 'nb'] }} — {{ dateLabel }}
          </p>
        </div>

        <dl class="grid grid-cols-2 gap-6 md:col-span-7 md:grid-cols-4">
          <div>
            <dt class="eyebrow">{{ t('power.dayAverage') }}</dt>
            <dd class="mt-2 font-mono text-lg text-ink">{{ formatKr(zoneMean) }}</dd>
          </div>
          <div>
            <dt class="eyebrow">{{ t('power.cheapestHour') }}</dt>
            <dd class="mt-2 font-mono text-lg text-pine">
              {{ cheapest ? formatKr(cheapest.value) : '—' }}
            </dd>
            <dd class="font-mono text-[0.688rem] text-faint">
              {{ t('power.atHourShort', { hour: cheapest?.hour ?? '—' }) }}
            </dd>
          </div>
          <div>
            <dt class="eyebrow">{{ t('power.priciestHour') }}</dt>
            <dd class="mt-2 font-mono text-lg text-clay">
              {{ priciest ? formatKr(priciest.value) : '—' }}
            </dd>
            <dd class="font-mono text-[0.688rem] text-faint">
              {{ t('power.atHourShort', { hour: priciest?.hour ?? '—' }) }}
            </dd>
          </div>
          <div>
            <dt class="eyebrow">{{ t('power.vsNational') }}</dt>
            <dd
              class="mt-2 font-mono text-lg"
              :class="(vsNational ?? 0) > 0 ? 'text-clay' : 'text-pine'"
            >
              <template v-if="vsNational !== null">
                {{ vsNational > 0 ? '+' : '' }}{{ vsNational.toFixed(0) }} %
              </template>
              <template v-else>—</template>
            </dd>
            <dd class="font-mono text-[0.688rem] text-faint">{{ formatKr(nationalMean) }}</dd>
          </div>
        </dl>
      </div>

      <!-- Chart -->
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
              {{ t('power.legendNational') }}
            </li>
          </ul>
        </div>

        <PriceChart
          v-model:hovered="hovered"
          :points="chartPoints"
          :average="nationalSeries"
          :caption="chartCaption"
        />

        <p class="mt-4 font-mono text-[0.688rem] leading-relaxed text-faint">
          {{ t('power.chartNote') }}
        </p>
      </section>

      <!-- Zone comparison: map on the left, ranking on the right -->
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

      <!-- How it is built — the write-up lives under the working tool -->
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

      <!-- Source -->
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
      </footer>
    </template>
  </div>
</template>
