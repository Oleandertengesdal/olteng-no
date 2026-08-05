<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import SectionHeading from '@/components/SectionHeading.vue'
import TechChip from '@/components/TechChip.vue'
import { projects } from '@/data/projects'
import {
  profile,
  education,
  experience,
  skills,
  languages,
  pick,
  pickList,
  type TimelineEntry,
} from '@/data/profile'

const { t, locale } = useI18n()

/**
 * Placeholder entries are hidden in production builds so a half-filled CV never
 * reaches an employer, but stay visible during `npm run dev` as a reminder.
 */
const showPlaceholders = import.meta.env.DEV

const visible = (entries: TimelineEntry[]) =>
  showPlaceholders ? entries : entries.filter((e) => !e.placeholder)

const educationList = computed(() => visible(education))
const experienceList = computed(() => visible(experience))

const projectHighlights = computed(() => projects.filter((p) => p.featured || p.size === 'large'))
</script>

<template>
  <div class="shell py-16 md:py-24">
    <!-- Header -->
    <header class="flex flex-wrap items-end justify-between gap-8 border-b border-line pb-10">
      <div>
        <p class="eyebrow">{{ t('navigations.resume') }}</p>
        <h1 class="mt-6 font-display text-display font-medium text-ink">{{ profile.name }}</h1>
        <p class="mt-4 font-mono text-[0.8125rem] tracking-wide text-muted">
          {{ pick(profile.location, locale) }} &middot;
          <a :href="`mailto:${profile.email}`" class="link-quiet">{{ profile.email }}</a>
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <a v-if="profile.resumeUrl" :href="profile.resumeUrl" download class="btn btn-solid">
          {{ t('resume.downloadPdf') }}
        </a>
        <a
          :href="profile.linkedin"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-outline"
        >
          LinkedIn
        </a>
        <a :href="profile.github" target="_blank" rel="noopener noreferrer" class="btn btn-outline">
          GitHub
        </a>
      </div>
    </header>

    <!-- Education -->
    <section class="mt-20">
      <SectionHeading eyebrow="01" ghost="01" :title="t('resume.education')" />
      <div>
        <article
          v-for="entry in educationList"
          :key="entry.period + entry.organisation"
          class="grid gap-2 border-t border-line py-7 md:grid-cols-12 md:gap-8"
        >
          <p class="font-mono text-[0.75rem] tracking-widest text-faint md:col-span-3">
            {{ entry.period }}
          </p>
          <div class="md:col-span-9">
            <h3 class="font-display text-xl font-medium text-ink">
              {{ pick(entry.title, locale) }}
              <span
                v-if="entry.placeholder"
                class="ml-2 align-middle font-mono text-[0.625rem] uppercase tracking-widest text-accent"
              >
                {{ t('resume.needsFilling') }}
              </span>
            </h3>
            <p class="mt-1 font-mono text-[0.75rem] tracking-wide text-muted">
              {{ entry.organisation
              }}<template v-if="entry.location">
                &middot; {{ pick(entry.location, locale) }}</template
              >
            </p>
            <p v-if="entry.description" class="prose-column mt-3 text-[0.9375rem]">
              {{ pick(entry.description, locale) }}
            </p>
            <ul v-if="entry.highlights" class="mt-3 space-y-1.5">
              <li
                v-for="(h, i) in pickList(entry.highlights, locale)"
                :key="i"
                class="flex gap-3 text-[0.9375rem] leading-relaxed text-muted"
              >
                <span class="text-faint" aria-hidden="true">&mdash;</span>{{ h }}
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <!-- Experience -->
    <section v-if="experienceList.length" class="mt-20">
      <SectionHeading eyebrow="02" ghost="02" :title="t('resume.experience')" />
      <div>
        <article
          v-for="entry in experienceList"
          :key="entry.period + entry.organisation"
          class="grid gap-2 border-t border-line py-7 md:grid-cols-12 md:gap-8"
        >
          <p class="font-mono text-[0.75rem] tracking-widest text-faint md:col-span-3">
            {{ entry.period }}
          </p>
          <div class="md:col-span-9">
            <h3 class="font-display text-xl font-medium text-ink">
              {{ pick(entry.title, locale) }}
              <span
                v-if="entry.placeholder"
                class="ml-2 align-middle font-mono text-[0.625rem] uppercase tracking-widest text-accent"
              >
                {{ t('resume.needsFilling') }}
              </span>
            </h3>
            <p class="mt-1 font-mono text-[0.75rem] tracking-wide text-muted">
              {{ entry.organisation
              }}<template v-if="entry.location">
                &middot; {{ pick(entry.location, locale) }}</template
              >
            </p>
            <p v-if="entry.description" class="prose-column mt-3 text-[0.9375rem]">
              {{ pick(entry.description, locale) }}
            </p>
            <ul v-if="entry.highlights" class="mt-3 space-y-1.5">
              <li
                v-for="(h, i) in pickList(entry.highlights, locale)"
                :key="i"
                class="flex gap-3 text-[0.9375rem] leading-relaxed text-muted"
              >
                <span class="text-faint" aria-hidden="true">&mdash;</span>{{ h }}
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <!-- Selected projects -->
    <section class="mt-20">
      <SectionHeading
        eyebrow="03"
        ghost="03"
        :title="t('resume.projects')"
        :action-label="t('home.allProjects')"
        action-to="/projects"
      />
      <div>
        <article
          v-for="project in projectHighlights"
          :key="project.id"
          class="grid gap-2 border-t border-line py-7 md:grid-cols-12 md:gap-8"
        >
          <p class="font-mono text-[0.75rem] tracking-widest text-faint md:col-span-3">
            {{ project.details?.year ?? '' }}
          </p>
          <div class="md:col-span-9">
            <h3 class="font-display text-xl font-medium text-ink">
              <RouterLink
                :to="`/projects/${project.id}`"
                class="transition-colors hover:text-accent"
              >
                {{ project.title[locale as 'en' | 'nb'] }}
              </RouterLink>
            </h3>
            <p class="prose-column mt-3 text-[0.9375rem]">
              {{ project.description[locale as 'en' | 'nb'] }}
            </p>
            <ul class="mt-3 flex flex-wrap gap-1.5">
              <li v-for="tech in project.technologies" :key="tech">
                <TechChip :label="tech" :interactive="false" />
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <!-- Skills + languages -->
    <section class="mt-20">
      <SectionHeading eyebrow="04" ghost="04" :title="t('resume.skills')" />
      <div class="grid gap-10 md:grid-cols-3">
        <div v-for="group in skills" :key="group.label.en">
          <h3 class="font-display text-lg font-medium text-ink">{{ pick(group.label, locale) }}</h3>
          <ul class="mt-4 flex flex-wrap gap-1.5">
            <li v-for="item in group.items" :key="item">
              <TechChip :label="item" :interactive="false" />
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-12 border-t border-line pt-6">
        <h3 class="eyebrow mb-4">{{ t('about.languages') }}</h3>
        <ul class="flex flex-wrap gap-x-10 gap-y-2">
          <li v-for="lang in languages" :key="lang.label.en" class="text-[0.9375rem] text-ink">
            {{ pick(lang.label, locale) }}
            <span class="text-faint">&mdash; {{ pick(lang.level, locale) }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
