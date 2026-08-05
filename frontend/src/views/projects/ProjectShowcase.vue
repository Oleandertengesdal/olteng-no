<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TechChip from '@/components/TechChip.vue'
import { projects } from '@/data/projects'
import { bgClasses, textClasses } from '@/data/tech'

const route = useRoute()
const { t, locale } = useI18n()

const project = computed(() => projects.find((p) => p.id === route.params.id))

/** The project's signature colour, reused from the row it was opened from */
const hue = computed(() => project.value?.hue ?? 'clay')

const loc = computed(() => locale.value as 'en' | 'nb')

const text = (value?: { en: string; nb: string }) => (value ? (value[loc.value] ?? value.en) : '')
const list = (value?: { en: string[]; nb: string[] }) =>
  value ? (value[loc.value] ?? value.en) : []

const meta = computed(() => {
  const d = project.value?.details
  if (!d) return []
  return [
    { label: t('projectYear'), value: d.year },
    { label: t('projectDuration'), value: d.duration },
    { label: t('projectRole'), value: d.role },
    { label: t('projectStatus'), value: d.status },
  ].filter((item) => Boolean(item.value))
})

/** Every list-style showcase section, rendered through one loop */
const listSections = computed(() => {
  const s = project.value?.showcase
  if (!s) return []
  return [
    { key: 'features', heading: t('keyFeatures'), items: list(s.features) },
    { key: 'challenges', heading: t('challenges'), items: list(s.challenges) },
    { key: 'outcomes', heading: t('outcomes'), items: list(s.outcomes) },
    { key: 'future', heading: t('futureImprovements'), items: list(s.futureImprovements) },
  ].filter((section) => section.items.length > 0)
})
</script>

<template>
  <div class="shell py-16 md:py-24">
    <!-- Not found -->
    <div v-if="!project" class="py-24 text-center">
      <p class="eyebrow">404</p>
      <h1 class="mt-6 font-display text-title font-medium text-ink">
        {{ t('projectDetail.notFound') }}
      </h1>
      <RouterLink to="/projects" class="btn btn-outline mt-8">
        {{ t('backToProjects') }}
      </RouterLink>
    </div>

    <article v-else>
      <RouterLink
        to="/projects"
        class="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-faint transition-colors hover:text-accent"
      >
        <span aria-hidden="true">&larr;</span> {{ t('backToProjects') }}
      </RouterLink>

      <!-- Title block -->
      <header class="mt-10 border-b border-line pb-12">
        <span class="mt-8 block h-1 w-16" :class="bgClasses[hue]" aria-hidden="true" />

        <p v-if="project.type === 'live'" class="eyebrow mt-6 text-positive">{{ t('live') }}</p>
        <h1 class="mt-5 font-display text-display font-medium" :class="textClasses[hue]">
          {{ text(project.title) }}
        </h1>
        <p class="prose-column mt-8 text-[1.1875rem] leading-[1.7]">
          {{ text(project.description) }}
        </p>

        <div class="mt-10 flex flex-wrap gap-3">
          <a
            v-if="project.githubUrl"
            :href="project.githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-solid"
          >
            {{ t('viewOnGithub') }}
          </a>
          <a
            v-if="project.liveUrl"
            :href="project.liveUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline"
          >
            {{ t('liveDemo') }}
          </a>
        </div>
      </header>

      <!-- Meta + technologies -->
      <div class="grid gap-12 border-b border-line py-10 md:grid-cols-12">
        <dl v-if="meta.length" class="grid grid-cols-2 gap-6 md:col-span-6 md:grid-cols-4">
          <div v-for="item in meta" :key="item.label">
            <dt class="eyebrow">{{ item.label }}</dt>
            <dd class="mt-2 text-[0.9375rem] text-ink">{{ item.value }}</dd>
          </div>
        </dl>

        <div class="md:col-span-6">
          <p class="eyebrow">{{ t('technologies') }}</p>
          <ul class="mt-3 flex flex-wrap gap-1.5">
            <li v-for="tech in project.technologies" :key="tech">
              <TechChip :label="tech" :interactive="false" />
            </li>
          </ul>
        </div>
      </div>

      <!-- Overview -->
      <section v-if="project.showcase?.overview" class="border-b border-line py-12">
        <div class="grid gap-8 md:grid-cols-12">
          <h2 class="font-display text-2xl font-medium text-ink md:col-span-4">
            {{ t('projectOverview') }}
          </h2>
          <p class="prose-column md:col-span-8">{{ text(project.showcase.overview) }}</p>
        </div>
      </section>

      <!-- Technical details -->
      <section v-if="project.showcase?.technicalDetails" class="border-b border-line py-12">
        <div class="grid gap-8 md:grid-cols-12">
          <h2 class="font-display text-2xl font-medium text-ink md:col-span-4">
            {{ t('technicalDetails') }}
          </h2>
          <p class="prose-column md:col-span-8">{{ text(project.showcase.technicalDetails) }}</p>
        </div>
      </section>

      <!-- Feature / challenge / outcome lists -->
      <section
        v-for="section in listSections"
        :key="section.key"
        class="border-b border-line py-12"
      >
        <div class="grid gap-8 md:grid-cols-12">
          <h2 class="font-display text-2xl font-medium text-ink md:col-span-4">
            {{ section.heading }}
          </h2>
          <ul class="md:col-span-8">
            <li
              v-for="(item, i) in section.items"
              :key="i"
              class="flex gap-5 border-t border-line py-3.5 first:border-t-0 first:pt-0"
            >
              <span class="mt-0.5 font-mono text-[0.75rem] tracking-widest text-faint">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
              <span class="text-[0.9375rem] leading-relaxed text-muted">{{ item }}</span>
            </li>
          </ul>
        </div>
      </section>

      <div class="pt-12">
        <RouterLink to="/projects" class="btn btn-outline">
          <span aria-hidden="true">&larr;</span> {{ t('backToProjects') }}
        </RouterLink>
      </div>
    </article>
  </div>
</template>
