<script setup lang="ts">
/**
 * Lenkekatalogen.
 *
 * Instabart-delen av prosjektet, og halve verdien av dashbordet: alle lenkene
 * en student trenger, gruppert, med forklaring på hva hvert system faktisk er
 * til, og med et lærestedsvalg som bytter hele settet.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import InstitutionPicker from '@/links/InstitutionPicker.vue'
import LinkRow from '@/links/LinkRow.vue'
import { useInstitution } from '@/links/useInstitution.ts'
import { useLinkSearch } from '@/links/useLinkSearch.ts'
import { reportUrl } from '@/links/report.ts'
import { GROUP_LABEL, NATIONAL_LABEL, NATIONAL_LINKS } from '@/data/links/index.ts'
import { isStaleReview, monthsSince } from '@/data/links/search.ts'

const { t, locale } = useI18n()
const lang = computed(() => locale.value as 'nb' | 'en')
const { institution, selectedId, clear } = useInstitution()
const { open } = useLinkSearch()

/** Vis velgeren igjen når man vil bytte, uten å måtte nullstille valget. */
const changing = ref(false)

const reviewed = computed(() => {
  const value = institution.value
  if (!value) return null
  const now = new Date()
  return {
    date: new Date(value.reviewed).toLocaleDateString(lang.value === 'nb' ? 'nb-NO' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    months: monthsSince(value.reviewed, now),
    stale: isStaleReview(value.reviewed, now),
  }
})
</script>

<template>
  <div class="shell max-w-5xl py-8">
    <p class="eyebrow">{{ t('links.eyebrow') }}</p>
    <h1 class="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
      {{ t('links.title') }}
    </h1>
    <p class="mt-3 max-w-prose text-sm leading-relaxed text-muted">{{ t('links.lead') }}</p>

    <div class="mt-6 flex flex-wrap items-center gap-2">
      <button type="button" class="btn" @click="open()">
        <AppIcon name="search" :size="14" />
        {{ t('links.search') }}
        <kbd class="ml-1 font-mono text-[0.65rem] text-faint">/</kbd>
      </button>

      <button v-if="institution && !changing" type="button" class="btn" @click="changing = true">
        {{ t('links.change', { name: institution.shortName }) }}
      </button>
    </div>

    <!-- Ingen lærested valgt, eller brukeren vil bytte -->
    <div v-if="!institution || changing" class="mt-8">
      <InstitutionPicker />
      <button
        v-if="institution && changing"
        type="button"
        class="btn mt-4"
        @click="changing = false"
      >
        {{ t('common.done') }}
      </button>
    </div>

    <template v-if="institution">
      <div class="mt-10 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line pb-2">
        <h2 class="font-display text-2xl text-ink">{{ institution.shortName }}</h2>
        <p class="text-sm text-muted">{{ institution.name }}</p>
      </div>

      <section v-for="group in institution.groups" :key="group.id" class="mt-8">
        <h3 class="eyebrow mb-2">{{ GROUP_LABEL[group.id][lang] }}</h3>
        <ul role="list" class="divide-y divide-line border border-line">
          <li v-for="link in group.links" :key="link.url">
            <LinkRow :link="link" />
          </li>
        </ul>
      </section>

      <section class="mt-8">
        <h3 class="eyebrow mb-2">{{ NATIONAL_LABEL[lang] }}</h3>
        <ul role="list" class="divide-y divide-line border border-line">
          <li v-for="link in NATIONAL_LINKS" :key="link.url">
            <LinkRow :link="link" />
          </li>
        </ul>
      </section>

      <!-- Ferskhet. En lenkekatalog råtner, og den råtner stille — datoen er
           det som gjør råtningen synlig. -->
      <footer class="mt-10 border-t border-line pt-4">
        <p class="text-xs leading-relaxed" :class="reviewed?.stale ? 'text-warning' : 'text-muted'">
          <template v-if="reviewed?.stale">
            {{ t('links.reviewedStale', { date: reviewed.date, months: reviewed.months }) }}
          </template>
          <template v-else>
            {{ t('links.reviewed', { date: reviewed?.date }) }}
          </template>
        </p>
        <p class="mt-1 text-xs leading-relaxed text-muted">{{ t('links.reviewedNote') }}</p>

        <div class="mt-3 flex flex-wrap gap-2">
          <a
            :href="reportUrl({ institution: institution.shortName })"
            rel="noreferrer"
            class="btn"
          >
            <AppIcon name="pencil" :size="14" />
            {{ t('links.report') }}
          </a>
          <button type="button" class="btn" @click="clear(); changing = false">
            {{ t('links.forget') }}
          </button>
        </div>
      </footer>
    </template>

    <p v-else-if="!selectedId" class="mt-10 text-sm leading-relaxed text-muted">
      {{ t('links.pickFirst') }}
    </p>
  </div>
</template>
