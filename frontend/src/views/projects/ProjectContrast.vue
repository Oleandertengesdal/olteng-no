<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { projects } from '@/data/projects'
import {
  parseColor,
  toHex,
  contrastRatio,
  formatRatio,
  passes,
  suggestPassing,
  readToken,
  LEVELS,
  SITE_FOREGROUNDS,
  SITE_BACKGROUNDS,
  FAINT_BEFORE,
  FAINT_AFTER,
  RAISED_LIGHT,
  type Rgb,
} from '@/data/contrast'

const { t, locale } = useI18n()

/* ── The two colours ───────────────────────────────────────────────────── */

const foregroundText = ref('#8a5a10')
const backgroundText = ref('#faf7f2')

const foreground = computed(() => parseColor(foregroundText.value))
const background = computed(() => parseColor(backgroundText.value))

const ratio = computed(() =>
  foreground.value && background.value ? contrastRatio(foreground.value, background.value) : null,
)

const results = computed(() =>
  LEVELS.map((level) => ({
    ...level,
    ok: ratio.value !== null && passes(ratio.value, level.required),
  })),
)

/** Worst level that fails — the one worth fixing first */
const suggestion = computed(() => {
  if (!foreground.value || !background.value) return null
  return suggestPassing(foreground.value, background.value, 4.5)
})

const swap = () => {
  const previous = foregroundText.value
  foregroundText.value = backgroundText.value
  backgroundText.value = previous
}

const applySuggestion = () => {
  if (suggestion.value) foregroundText.value = toHex(suggestion.value.color)
}

/** The native colour picker only speaks hex, so keep a valid hex beside it */
const foregroundHex = computed(() => (foreground.value ? toHex(foreground.value) : '#000000'))
const backgroundHex = computed(() => (background.value ? toHex(background.value) : '#ffffff'))

const style = (color: Rgb | null) => (color ? `rgb(${color.r} ${color.g} ${color.b})` : undefined)

/* ── Auditing this very page ───────────────────────────────────────────────
   The tool reads the site's own custom properties from the running document,
   so the numbers can never drift from the design system. Switch the page to
   dark mode and every figure below changes with it.                         */

const audit = ref<
  { foreground: string; background: string; ratio: number; colour: Rgb; surface: Rgb }[]
>([])

const runAudit = () => {
  const rows: typeof audit.value = []

  for (const surface of SITE_BACKGROUNDS.tokens) {
    const surfaceColour = readToken(surface.variable)
    if (!surfaceColour) continue

    for (const token of SITE_FOREGROUNDS.tokens) {
      const colour = readToken(token.variable)
      if (!colour) continue

      rows.push({
        foreground: token.name,
        background: surface.name,
        ratio: contrastRatio(colour, surfaceColour),
        colour,
        surface: surfaceColour,
      })
    }
  }

  audit.value = rows
}

onMounted(() => {
  runAudit()

  // The theme toggle flips a class on <html>; re-measure when it does
  const observer = new MutationObserver(runAudit)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

const auditFailures = computed(() => audit.value.filter((row) => !passes(row.ratio, 3)))

/** Group by surface so the table reads as three short columns */
const auditBySurface = computed(() =>
  SITE_BACKGROUNDS.tokens
    .map((surface) => ({
      name: surface.name,
      rows: audit.value.filter((row) => row.background === surface.name),
    }))
    .filter((group) => group.rows.length > 0),
)

/* ── The story, read from the projects list so it stays in one place ────── */

const build = computed(() => {
  const entry = projects.find((project) => project.id === 'kontrast')
  if (!entry?.showcase) return null
  const loc = locale.value as 'en' | 'nb'
  return {
    details: entry.showcase.technicalDetails?.[loc] ?? '',
    challenges: entry.showcase.challenges?.[loc] ?? [],
    githubUrl: entry.githubUrl,
  }
})

const faintBefore = contrastRatio(FAINT_BEFORE, RAISED_LIGHT)
const faintAfter = contrastRatio(FAINT_AFTER, RAISED_LIGHT)

/* Keep the two fields in sync when the picker is used */
watch(foregroundText, (value) => {
  if (value.length > 20) foregroundText.value = value.slice(0, 20)
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
      <span class="block h-1 w-16 bg-ochre" aria-hidden="true" />
      <p class="eyebrow mt-6 text-positive">{{ t('live') }}</p>
      <h1 class="mt-5 font-display text-title font-medium text-ink">{{ t('contrast.title') }}</h1>
      <p class="prose-column mt-6">{{ t('contrast.lead') }}</p>
    </header>

    <!-- ── The checker ─────────────────────────────────────────────────── -->
    <section class="grid gap-10 border-b border-line py-10 md:grid-cols-12">
      <div class="md:col-span-5">
        <!-- Foreground -->
        <label class="eyebrow block" for="fg">{{ t('contrast.foreground') }}</label>
        <div class="mt-3 flex items-center gap-3">
          <input
            :value="foregroundHex"
            type="color"
            class="h-10 w-12 shrink-0 cursor-pointer rounded-sm border border-line bg-transparent p-1"
            :aria-label="t('contrast.foreground')"
            @input="foregroundText = ($event.target as HTMLInputElement).value"
          />
          <input
            id="fg"
            v-model="foregroundText"
            type="text"
            spellcheck="false"
            class="w-full rounded-sm border bg-surface px-3 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
            :class="foreground ? 'border-line' : 'border-clay'"
            placeholder="#8a5a10"
          />
        </div>

        <button type="button" class="btn btn-outline my-4" @click="swap">
          {{ t('contrast.swap') }}
        </button>

        <!-- Background -->
        <label class="eyebrow block" for="bg">{{ t('contrast.background') }}</label>
        <div class="mt-3 flex items-center gap-3">
          <input
            :value="backgroundHex"
            type="color"
            class="h-10 w-12 shrink-0 cursor-pointer rounded-sm border border-line bg-transparent p-1"
            :aria-label="t('contrast.background')"
            @input="backgroundText = ($event.target as HTMLInputElement).value"
          />
          <input
            id="bg"
            v-model="backgroundText"
            type="text"
            spellcheck="false"
            class="w-full rounded-sm border bg-surface px-3 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
            :class="background ? 'border-line' : 'border-clay'"
            placeholder="#faf7f2"
          />
        </div>

        <p class="mt-3 font-mono text-[0.688rem] leading-relaxed text-faint">
          {{ t('contrast.formats') }}
        </p>
      </div>

      <!-- Ratio and grades -->
      <div class="md:col-span-7">
        <p class="eyebrow">{{ t('contrast.ratio') }}</p>
        <p
          class="mt-3 font-display text-[clamp(3rem,9vw,5rem)] font-medium leading-none"
          :class="ratio !== null && passes(ratio, 4.5) ? 'text-pine' : 'text-clay'"
        >
          {{ ratio !== null ? formatRatio(ratio) : '—' }}<span class="text-faint">:1</span>
        </p>

        <ul class="mt-8">
          <li
            v-for="level in results"
            :key="level.id"
            class="flex items-baseline gap-4 border-t border-line py-3 last:border-b"
          >
            <span
              class="shrink-0 font-mono text-[0.688rem] uppercase tracking-[0.12em]"
              :class="level.ok ? 'text-pine' : 'text-clay'"
            >
              {{ level.ok ? t('contrast.pass') : t('contrast.fail') }}
            </span>
            <span class="flex-1 text-[0.9375rem] text-ink">
              {{ level.label[locale as 'en' | 'nb'] }}
              <span class="block text-[0.8125rem] text-faint">
                {{ level.note[locale as 'en' | 'nb'] }}
              </span>
            </span>
            <span class="shrink-0 font-mono text-[0.8125rem] text-muted">
              {{ level.required.toFixed(1) }}:1
            </span>
          </li>
        </ul>

        <!-- Suggestion -->
        <div v-if="suggestion" class="mt-8 border-l-2 border-ochre py-1 pl-4">
          <p class="text-[0.9375rem] leading-relaxed text-muted">
            {{
              t('contrast.suggestion', {
                hex: toHex(suggestion.color),
                ratio: formatRatio(suggestion.ratio),
                direction: t(`contrast.${suggestion.direction}`),
              })
            }}
          </p>
          <button type="button" class="btn btn-outline mt-4" @click="applySuggestion">
            <span
              class="h-3 w-3 shrink-0 border border-line"
              :style="{ backgroundColor: style(suggestion.color) }"
              aria-hidden="true"
            />
            {{ t('contrast.useIt') }}
          </button>
        </div>
      </div>
    </section>

    <!-- ── Preview ─────────────────────────────────────────────────────── -->
    <section class="border-b border-line py-10">
      <p class="eyebrow mb-6">{{ t('contrast.previewHeading') }}</p>

      <div
        class="rounded-sm border border-line p-8 transition-colors"
        :style="{ backgroundColor: style(background) }"
      >
        <p class="font-display text-[2rem] leading-tight" :style="{ color: style(foreground) }">
          {{ t('contrast.previewLarge') }}
        </p>
        <p class="mt-4 text-[1.0625rem] leading-relaxed" :style="{ color: style(foreground) }">
          {{ t('contrast.previewBody') }}
        </p>
        <p
          class="mt-4 font-mono text-[0.688rem] uppercase tracking-[0.18em]"
          :style="{ color: style(foreground) }"
        >
          {{ t('contrast.previewSmall') }}
        </p>
        <div class="mt-6 flex items-center gap-3">
          <span
            class="h-6 w-6 shrink-0 rounded-sm"
            :style="{ backgroundColor: style(foreground) }"
            aria-hidden="true"
          />
          <span
            class="h-px flex-1"
            :style="{ backgroundColor: style(foreground) }"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>

    <!-- ── Auditing this page ──────────────────────────────────────────── -->
    <section class="border-b border-line py-10">
      <div class="mb-8 max-w-prose">
        <h2 class="font-display text-2xl font-medium text-ink">{{ t('contrast.auditHeading') }}</h2>
        <p class="prose-column mt-4 text-[0.9375rem]">{{ t('contrast.auditLead') }}</p>
        <p
          class="mt-4 font-mono text-[0.75rem]"
          :class="auditFailures.length ? 'text-clay' : 'text-pine'"
        >
          {{
            auditFailures.length
              ? t('contrast.auditFailing', { count: auditFailures.length })
              : t('contrast.auditClean', { count: audit.length })
          }}
        </p>
      </div>

      <div class="grid gap-8 sm:grid-cols-3">
        <div v-for="group in auditBySurface" :key="group.name">
          <p class="eyebrow mb-3">{{ t('contrast.onSurface', { surface: group.name }) }}</p>
          <ul>
            <li
              v-for="row in group.rows"
              :key="`${row.background}-${row.foreground}`"
              class="flex items-center gap-3 border-t border-line py-2 last:border-b"
            >
              <span
                class="h-3 w-3 shrink-0 rounded-sm border border-line"
                :style="{ backgroundColor: style(row.colour) }"
                aria-hidden="true"
              />
              <span class="flex-1 font-mono text-[0.75rem] text-muted">{{ row.foreground }}</span>
              <span
                class="font-mono text-[0.75rem]"
                :class="
                  passes(row.ratio, 4.5)
                    ? 'text-pine'
                    : passes(row.ratio, 3)
                      ? 'text-ochre'
                      : 'text-clay'
                "
              >
                {{ formatRatio(row.ratio) }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <p class="mt-6 font-mono text-[0.688rem] leading-relaxed text-faint">
        {{ t('contrast.auditNote') }}
      </p>
    </section>

    <!-- ── Why this exists ─────────────────────────────────────────────── -->
    <section class="border-b border-line py-10">
      <div class="grid gap-10 md:grid-cols-12">
        <h2 class="font-display text-2xl font-medium text-ink md:col-span-4">
          {{ t('contrast.storyHeading') }}
        </h2>

        <div class="md:col-span-8">
          <p class="prose-column">{{ t('contrast.storyBody') }}</p>

          <dl class="mt-8 grid grid-cols-2 gap-px border border-line bg-line">
            <div class="bg-paper px-5 py-5">
              <dt class="eyebrow">{{ t('contrast.before') }}</dt>
              <dd class="mt-2 font-display text-2xl font-medium text-clay">
                {{ formatRatio(faintBefore) }}:1
              </dd>
              <dd class="mt-1 font-mono text-[0.688rem] text-faint">
                {{ toHex(FAINT_BEFORE) }} · {{ t('contrast.fail') }}
              </dd>
            </div>
            <div class="bg-paper px-5 py-5">
              <dt class="eyebrow">{{ t('contrast.after') }}</dt>
              <dd class="mt-2 font-display text-2xl font-medium text-pine">
                {{ formatRatio(faintAfter) }}:1
              </dd>
              <dd class="mt-1 font-mono text-[0.688rem] text-faint">
                {{ toHex(FAINT_AFTER) }} · {{ t('contrast.pass') }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- ── How it is built ─────────────────────────────────────────────── -->
    <section v-if="build" class="py-10">
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
              <span class="mt-0.5 font-mono text-[0.75rem] tracking-widest text-ochre">
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
  </div>
</template>
