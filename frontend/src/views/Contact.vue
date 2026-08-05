<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { profile } from '@/data/profile'

const { t } = useI18n()

const copied = ref(false)

const copyEmail = async () => {
  try {
    await navigator.clipboard.writeText(profile.email)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Clipboard blocked (insecure context or denied permission) — the address
    // is visible on screen anyway, so there is nothing to recover from.
  }
}

const channels = [
  { label: 'GitHub', value: '@Oleandertengesdal', href: profile.github },
  { label: 'LinkedIn', value: 'in/oleander-tengesdal', href: profile.linkedin },
]
</script>

<template>
  <div class="shell py-16 md:py-24">
    <header class="max-w-3xl">
      <p class="eyebrow">{{ t('navigations.contact') }}</p>
      <h1 class="mt-6 font-display text-display font-medium text-ink">
        {{ t('contactPage.title') }}
      </h1>
      <p class="prose-column mt-8 text-[1.1875rem] leading-[1.7]">
        {{ t('contactPage.lead') }}
      </p>
    </header>

    <div class="mt-16 grid gap-14 md:mt-20 md:grid-cols-12">
      <section class="md:col-span-7">
        <p class="eyebrow border-t border-line pt-6">{{ t('contactPage.emailLabel') }}</p>

        <div class="mt-5 flex flex-wrap items-center gap-4">
          <a
            :href="`mailto:${profile.email}?subject=${encodeURIComponent(t('contactPage.mailSubject'))}`"
            class="font-display text-[clamp(1.5rem,3.2vw,2.25rem)] font-medium leading-tight text-ink transition-colors hover:text-accent"
          >
            {{ profile.email }}
          </a>

          <button type="button" class="btn btn-outline shrink-0" @click="copyEmail">
            {{ copied ? t('contactPage.copied') : t('copy') }}
          </button>
        </div>

        <p class="prose-column mt-8">{{ t('contactPage.responseNote') }}</p>
      </section>

      <aside class="md:col-span-4 md:col-start-9">
        <p class="eyebrow border-t border-line pt-6">{{ t('socialMedia') }}</p>

        <ul class="mt-2">
          <li v-for="channel in channels" :key="channel.label">
            <a
              :href="channel.href"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-baseline justify-between gap-6 border-b border-line py-4"
            >
              <span
                class="font-display text-xl font-medium text-ink transition-colors group-hover:text-accent"
              >
                {{ channel.label }}
              </span>
              <span class="font-mono text-[0.688rem] tracking-wide text-faint">
                {{ channel.value }}
                <span
                  aria-hidden="true"
                  class="ml-1 inline-block transition-transform group-hover:translate-x-0.5"
                >
                  &#8599;
                </span>
              </span>
            </a>
          </li>
        </ul>

        <RouterLink to="/cv" class="btn btn-outline mt-8 w-full">
          {{ t('resume.viewFull') }}
        </RouterLink>
      </aside>
    </div>
  </div>
</template>
