<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import TechChip from '@/components/TechChip.vue'
import type { Project } from '@/data/projects'
import { hueAt, hoverTextClasses } from '@/data/tech'

const props = defineProps<{
  project: Project
  /** Row number shown in the left margin, e.g. 1 renders as "01" */
  index: number
}>()

const { t, locale } = useI18n()

const title = computed(
  () => props.project.title[locale.value as 'en' | 'nb'] ?? props.project.title.en,
)
const description = computed(
  () => props.project.description[locale.value as 'en' | 'nb'] ?? props.project.description.en,
)
const number = computed(() => String(props.index).padStart(2, '0'))

/** Each project has a signature colour; unassigned ones cycle deterministically */
const hue = computed(() => props.project.hue ?? hueAt(props.index - 1))
const hueHover = computed(() => hoverTextClasses[hue.value])
</script>

<template>
  <article class="group border-t border-line">
    <RouterLink
      :to="`/projects/${project.id}`"
      class="row grid grid-cols-1 gap-x-8 gap-y-4 py-9 md:grid-cols-12 md:py-12"
    >
      <!-- Number + status -->
      <div class="flex items-center gap-3 md:col-span-2 md:block">
        <span
          class="block font-display text-2xl font-medium leading-none text-line transition-all duration-500 ease-editorial md:text-4xl md:group-hover:translate-x-1"
          :class="hueHover"
        >
          {{ number }}
        </span>
        <span
          v-if="project.type === 'live'"
          class="font-mono text-[0.688rem] uppercase tracking-[0.14em] text-positive md:mt-3 md:block"
        >
          {{ t('live') }}
        </span>
      </div>

      <!-- Title + description -->
      <div class="md:col-span-6">
        <h3
          class="font-display text-2xl font-medium leading-tight text-ink transition-colors duration-300 md:text-[1.875rem]"
          :class="hueHover"
        >
          {{ title }}
        </h3>
        <p class="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-muted">
          {{ description }}
        </p>
      </div>

      <!-- Meta -->
      <div class="flex flex-col justify-between gap-4 md:col-span-4 md:items-end">
        <ul class="flex flex-wrap gap-1.5 md:justify-end">
          <li v-for="tech in project.technologies.slice(0, 5)" :key="tech">
            <TechChip :label="tech" />
          </li>
          <li
            v-if="project.technologies.length > 5"
            class="self-center font-mono text-[0.688rem] text-faint"
          >
            +{{ project.technologies.length - 5 }}
          </li>
        </ul>

        <span
          class="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-faint transition-colors duration-300"
          :class="hueHover"
        >
          {{ project.type === 'live' ? t('tryItLive') : t('actions.readMore') }}
          <span
            aria-hidden="true"
            class="inline-block transition-transform duration-300 ease-editorial group-hover:translate-x-1.5"
            >&rarr;</span
          >
        </span>
      </div>
    </RouterLink>
  </article>
</template>
