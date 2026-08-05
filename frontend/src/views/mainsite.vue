<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import SectionHeading from '@/components/SectionHeading.vue'
import ProjectRow from '@/components/ProjectRow.vue'
import TechMarquee from '@/components/TechMarquee.vue'
import LocalTime from '@/components/LocalTime.vue'
import TechChip from '@/components/TechChip.vue'
import { sortedProjects } from '@/data/projects'
import { bgClasses, hueAt } from '@/data/tech'
import {
  profile,
  intro,
  now,
  skills,
  education,
  calculateAge,
  isPlaceholder,
  pick,
  pickList,
} from '@/data/profile'

const { t, locale } = useI18n()

const age = calculateAge(profile.birthDate)

/** Falls back to the typographic block if the portrait file is missing */
const portraitFailed = ref(false)
const showPortrait = computed(() => Boolean(profile.portraitUrl) && !portraitFailed.value)

const highlighted = computed(() => sortedProjects.slice(0, 3))
const currentStudy = computed(() => education.find((e) => !e.placeholder))
const nowItems = computed(() => now.items.filter((item) => !isPlaceholder(item.text)))

/** Everything in the toolbox, deduped, for the ticker */
const marqueeItems = computed(() => [...new Set(skills.flatMap((group) => group.items))])

const facts = computed(() => [
  { label: t('home.factStudy'), value: currentStudy.value?.organisation ?? 'NTNU' },
  { label: t('home.factField'), value: pick(intro.field, locale.value) },
  { label: t('home.factBase'), value: pick(profile.location, locale.value) },
  { label: t('home.factAge'), value: String(age) },
])
</script>

<template>
  <div>
    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="shell pb-14 pt-14 md:pb-20 md:pt-20">
      <!--
        Deliberately off-balance: the headline takes eight of twelve columns
        while the portrait sits in a narrower column, dropped four rem below
        the cap line. The stagger is what keeps it from reading as a template.
      -->
      <div class="grid gap-x-10 gap-y-10 md:grid-cols-12 md:grid-rows-[auto_1fr]">
        <div class="animate-rise md:col-span-8 md:row-start-1">
          <p class="eyebrow">{{ pick(intro.role, locale) }}</p>

          <h1 class="mt-6 max-w-[13ch] font-display text-display font-medium text-ink">
            {{ pick(intro.headline, locale) }}
          </h1>
        </div>

        <figure
          class="animate-rise portrait-frame order-last md:order-none md:col-span-4 md:col-start-9 md:row-span-2 md:row-start-1 md:mt-16 md:max-w-[17rem] md:justify-self-end"
        >
          <img
            v-if="showPortrait"
            :src="profile.portraitUrl!"
            :alt="profile.name"
            class="w-full border border-line bg-raised object-cover"
            style="aspect-ratio: 4 / 5"
            loading="eager"
            decoding="async"
            @error="portraitFailed = true"
          />
          <div
            v-else
            class="flex w-full flex-col justify-between border border-line bg-raised p-6"
            style="aspect-ratio: 4 / 5"
          >
            <span class="eyebrow">{{ profile.name }}</span>
            <span
              class="font-display text-[clamp(2.5rem,6vw,3.5rem)] font-medium leading-[0.9] text-ink/20"
            >
              OT
            </span>
            <span class="font-mono text-[0.688rem] tracking-wide text-faint">
              {{ t('picturehereText') }}
            </span>
          </div>
        </figure>

        <!-- Lead + actions stay in the left column, under the headline -->
        <div class="animate-rise md:col-span-7 md:row-start-2">
          <p class="max-w-[44ch] font-display text-lead font-normal text-ink/75">
            {{ pick(intro.lead, locale) }}
          </p>

          <p class="mt-6 font-mono text-[0.8125rem] tracking-wide text-muted">
            {{ profile.name }}
          </p>

          <div class="mt-7 flex flex-wrap items-center gap-3">
            <RouterLink to="/projects" class="btn btn-solid">
              {{ t('home.seeWork') }}
            </RouterLink>
            <RouterLink to="/cv" class="btn btn-outline">
              {{ t('navigations.resume') }}
            </RouterLink>
            <a
              :href="profile.github"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-outline"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>

      <!-- Colophon strip -->
      <dl
        v-reveal="0"
        class="mt-16 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-6 sm:grid-cols-5 md:mt-20"
      >
        <div v-for="(fact, i) in facts" :key="fact.label">
          <dt class="eyebrow flex items-center gap-2">
            <span class="h-1.5 w-1.5 shrink-0" :class="bgClasses[hueAt(i)]" aria-hidden="true" />
            {{ fact.label }}
          </dt>
          <dd class="mt-2 text-[0.9375rem] text-ink">{{ fact.value }}</dd>
        </div>
        <div>
          <dt class="eyebrow flex items-center gap-2">
            <span class="h-1.5 w-1.5 shrink-0 bg-positive" aria-hidden="true" />
            {{ t('home.factTime') }}
          </dt>
          <dd class="mt-2 font-mono text-[0.9375rem] text-ink"><LocalTime /></dd>
        </div>
      </dl>
    </section>

    <!-- ── Teknologi-ticker (full bredde) ────────────────────────────────── -->
    <TechMarquee :items="marqueeItems" class="my-4" />

    <!-- ── Utvalgt arbeid ────────────────────────────────────────────────── -->
    <section class="shell py-20">
      <SectionHeading
        eyebrow="01"
        ghost="01"
        :title="t('home.workHeading')"
        :action-label="t('home.allProjects')"
        action-to="/projects"
      />

      <div class="border-b border-line">
        <ProjectRow
          v-for="(project, i) in highlighted"
          :key="project.id"
          v-reveal="i"
          :project="project"
          :index="i + 1"
        />
      </div>
    </section>

    <!-- ── Kort om meg ───────────────────────────────────────────────────── -->
    <section class="shell pb-20">
      <SectionHeading
        eyebrow="02"
        ghost="02"
        :title="t('home.introHeading')"
        :action-label="t('home.moreAbout')"
        action-to="/about"
      />

      <div class="grid gap-10 md:grid-cols-12">
        <div v-reveal="0" class="md:col-span-7">
          <p
            v-for="(para, i) in pickList(intro.paragraphs, locale)"
            :key="i"
            class="prose-column mb-5 last:mb-0"
          >
            {{ para }}
          </p>
        </div>

        <!-- Nå -->
        <div v-if="nowItems.length" v-reveal="1" class="md:col-span-4 md:col-start-9">
          <p class="eyebrow border-t-2 border-accent pt-4">
            {{ t('home.nowHeading') }} &middot; {{ now.updated }}
          </p>
          <dl class="mt-5 space-y-5">
            <div v-for="item in nowItems" :key="item.label.en">
              <dt class="font-mono text-[0.688rem] uppercase tracking-[0.14em] text-accent">
                {{ pick(item.label, locale) }}
              </dt>
              <dd class="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">
                {{ pick(item.text, locale) }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- ── Verktøykassa ──────────────────────────────────────────────────── -->
    <section class="shell pb-4">
      <SectionHeading eyebrow="03" ghost="03" :title="t('home.skillsHeading')" />

      <div class="grid gap-x-10 gap-y-10 md:grid-cols-3">
        <div v-for="(group, i) in skills" :key="group.label.en" v-reveal="i" class="group">
          <h3 class="font-display text-lg font-medium text-ink">{{ pick(group.label, locale) }}</h3>
          <p v-if="group.note" class="mt-2 text-sm leading-relaxed text-faint">
            {{ pick(group.note, locale) }}
          </p>
          <ul class="mt-4 flex flex-wrap gap-1.5">
            <li v-for="item in group.items" :key="item"><TechChip :label="item" /></li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
