<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ProjectRow from '@/components/ProjectRow.vue'
import TechChip from '@/components/TechChip.vue'
import { sortedProjects } from '@/data/projects'
import { categories, bgClasses } from '@/data/tech'

const { t, locale } = useI18n()

type Filter = 'all' | 'large' | 'small'

const filter = ref<Filter>('all')

const filters: { id: Filter; key: string }[] = [
  { id: 'all', key: 'projectsPage.filterAll' },
  { id: 'large', key: 'projectsPage.filterApps' },
  { id: 'small', key: 'toolsAndUtilities' },
]

const visible = computed(() => {
  if (filter.value === 'all') return sortedProjects
  if (filter.value === 'large') return sortedProjects.filter((p) => p.size !== 'small')
  return sortedProjects.filter((p) => p.size === 'small')
})

/** All distinct technologies, for the index strip near the bottom */
const allTech = computed(() =>
  [...new Set(sortedProjects.flatMap((p) => p.technologies))].sort((a, b) => a.localeCompare(b)),
)
</script>

<template>
  <div class="shell py-16 md:py-24">
    <header class="max-w-3xl">
      <p class="eyebrow">{{ t('navigations.projects') }}</p>
      <h1 class="mt-6 font-display text-display font-medium text-ink">
        {{ t('projectsPage.title') }}
      </h1>
      <p class="prose-column mt-8 text-[1.1875rem] leading-[1.7]">
        {{ t('projectsPage.lead') }}
      </p>
    </header>

    <!-- Filters -->
    <div
      v-if="sortedProjects.length > 2"
      class="mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line pb-4"
    >
      <button
        v-for="item in filters"
        :key="item.id"
        type="button"
        class="font-mono text-[0.75rem] uppercase tracking-[0.12em] transition-colors"
        :class="filter === item.id ? 'text-ink' : 'text-faint hover:text-muted'"
        :aria-pressed="filter === item.id"
        @click="filter = item.id"
      >
        {{ t(item.key) }}
        <span v-if="filter === item.id" class="ml-1 text-accent" aria-hidden="true">&bull;</span>
      </button>
    </div>

    <!-- Project list -->
    <div v-if="visible.length" class="mt-6 border-b border-line">
      <ProjectRow
        v-for="(project, i) in visible"
        :key="project.id"
        v-reveal="Math.min(i, 4)"
        :project="project"
        :index="i + 1"
      />
    </div>

    <p v-else class="mt-20 text-center font-mono text-sm text-faint">
      {{ t('noProjectsYet') }}
    </p>

    <!-- Technology index, with the colour key that explains the chips -->
    <section class="mt-24">
      <p class="eyebrow border-t border-line pt-6">{{ t('projectsPage.techIndex') }}</p>

      <ul class="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        <li
          v-for="category in categories"
          :key="category.hue"
          class="flex items-center gap-2 font-mono text-[0.688rem] uppercase tracking-[0.12em] text-muted"
        >
          <span class="h-1.5 w-1.5 shrink-0" :class="bgClasses[category.hue]" aria-hidden="true" />
          {{ category.label[locale as 'en' | 'nb'] }}
        </li>
      </ul>

      <ul class="mt-6 flex flex-wrap gap-1.5">
        <li v-for="tech in allTech" :key="tech"><TechChip :label="tech" :interactive="false" /></li>
      </ul>
    </section>

    <!-- Pointer to GitHub -->
    <section class="mt-20 border-t border-line pt-10">
      <p class="max-w-prose font-display text-title font-medium leading-tight text-ink">
        {{ t('projectsPage.moreOnGithub') }}
      </p>
      <a
        href="https://github.com/Oleandertengesdal"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-solid mt-8"
      >
        {{ t('viewOnGithub') }}
      </a>
    </section>
  </div>
</template>
