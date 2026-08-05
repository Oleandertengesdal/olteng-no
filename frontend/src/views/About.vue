<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import SectionHeading from '@/components/SectionHeading.vue'
import {
  profile,
  intro,
  offScreen,
  languages,
  education,
  calculateAge,
  isPlaceholder,
  pick,
  pickList,
} from '@/data/profile'

const { t, locale } = useI18n()
const age = calculateAge(profile.birthDate)

const realOffScreen = offScreen.filter((item) => !isPlaceholder(item))
const study = education.find((e) => !e.placeholder)
</script>

<template>
  <div class="shell py-16 md:py-24">
    <!-- Page header -->
    <header class="max-w-3xl">
      <p class="eyebrow">{{ t('navigations.about') }}</p>
      <h1 class="mt-6 font-display text-display font-medium text-ink">
        {{ t('about.title') }}
      </h1>
    </header>

    <!-- Main narrative -->
    <section class="mt-14 grid gap-12 md:mt-20 md:grid-cols-12">
      <div class="md:col-span-7">
        <p class="prose-column mb-5 text-[1.1875rem] leading-[1.7] text-ink/80">
          {{ t('about.lead', { age }) }}
        </p>
        <p
          v-for="(para, i) in pickList(intro.paragraphs, locale)"
          :key="i"
          class="prose-column mb-5"
        >
          {{ para }}
        </p>
        <p class="prose-column">{{ t('about.siteNote') }}</p>
      </div>

      <!-- Sidebar facts -->
      <aside class="md:col-span-4 md:col-start-9">
        <dl class="space-y-6 border-t border-line pt-6">
          <div>
            <dt class="eyebrow">{{ t('about.based') }}</dt>
            <dd class="mt-1.5 text-[0.9375rem] text-ink">{{ pick(profile.location, locale) }}</dd>
          </div>
          <div v-if="study">
            <dt class="eyebrow">{{ t('about.studying') }}</dt>
            <dd class="mt-1.5 text-[0.9375rem] text-ink">
              {{ pick(study.title, locale) }}, {{ study.organisation }}
            </dd>
          </div>
          <div>
            <dt class="eyebrow">{{ t('about.languages') }}</dt>
            <dd class="mt-1.5 space-y-1">
              <p v-for="lang in languages" :key="lang.label.en" class="text-[0.9375rem] text-ink">
                {{ pick(lang.label, locale) }}
                <span class="text-faint">&mdash; {{ pick(lang.level, locale) }}</span>
              </p>
            </dd>
          </div>
          <div>
            <dt class="eyebrow">{{ t('about.elsewhere') }}</dt>
            <dd class="mt-1.5 space-y-1">
              <p>
                <a
                  :href="profile.github"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[0.9375rem] link-quiet"
                >
                  GitHub <span aria-hidden="true" class="text-faint">&#8599;</span>
                </a>
              </p>
              <p>
                <a
                  :href="profile.linkedin"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[0.9375rem] link-quiet"
                >
                  LinkedIn <span aria-hidden="true" class="text-faint">&#8599;</span>
                </a>
              </p>
            </dd>
          </div>
        </dl>
      </aside>
    </section>

    <!-- How I work -->
    <section class="mt-20 md:mt-28">
      <SectionHeading eyebrow="01" ghost="01" :title="t('about.howIWork')" />
      <div class="grid gap-x-10 gap-y-8 md:grid-cols-3">
        <div v-for="n in 3" :key="n" v-reveal="n - 1">
          <p class="font-mono text-[0.75rem] tracking-widest text-faint">
            {{ String(n).padStart(2, '0') }}
          </p>
          <h3 class="mt-3 font-display text-xl font-medium text-ink">
            {{ t(`about.principles.p${n}.title`) }}
          </h3>
          <p class="mt-3 text-[0.9375rem] leading-relaxed text-muted">
            {{ t(`about.principles.p${n}.body`) }}
          </p>
        </div>
      </div>
    </section>

    <!-- Off screen -->
    <section v-if="realOffScreen.length" class="mt-20 md:mt-28">
      <SectionHeading eyebrow="02" ghost="02" :title="t('about.offScreen')" />
      <ul class="grid gap-x-10 md:grid-cols-2">
        <li
          v-for="(item, i) in realOffScreen"
          :key="i"
          class="border-t border-line py-4 text-[0.9375rem] leading-relaxed text-muted"
        >
          {{ pick(item, locale) }}
        </li>
      </ul>
    </section>

    <!-- Closing CTA -->
    <section class="mt-20 border-t border-line pt-10 md:mt-28">
      <p class="max-w-prose font-display text-title font-medium leading-tight text-ink">
        {{ t('about.closing') }}
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <RouterLink to="/projects" class="btn btn-solid">
          {{ t('navigations.projects') }}
        </RouterLink>
        <RouterLink to="/contact" class="btn btn-outline">
          {{ t('navigations.contact') }}
        </RouterLink>
      </div>
    </section>
  </div>
</template>
