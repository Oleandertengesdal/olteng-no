<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { profile } from '@/data/profile'

const { t } = useI18n()

defineProps<{ isDark: boolean }>()

const year = new Date().getFullYear()

const nav = [
  { to: '/', key: 'navigations.home' },
  { to: '/projects', key: 'navigations.projects' },
  { to: '/about', key: 'navigations.about' },
  { to: '/cv', key: 'navigations.resume' },
  { to: '/contact', key: 'navigations.contact' },
]
</script>

<template>
  <footer class="mt-24 border-t border-line">
    <div class="shell py-16">
      <!-- Closing call to action -->
      <div class="grid gap-10 md:grid-cols-12 md:gap-8">
        <div class="md:col-span-7">
          <p class="eyebrow mb-4">{{ t('footer.getInTouch') }}</p>
          <p class="font-display text-title font-medium leading-tight text-ink">
            {{ t('footer.ctaLine') }}
          </p>
          <a
            :href="`mailto:${profile.email}`"
            class="link mt-6 inline-block font-mono text-sm tracking-tight"
          >
            {{ profile.email }}
          </a>
        </div>

        <nav class="md:col-span-3" :aria-label="t('navigation')">
          <p class="eyebrow mb-4">{{ t('navigation') }}</p>
          <ul class="space-y-2.5">
            <li v-for="item in nav" :key="item.to">
              <RouterLink :to="item.to" class="text-sm link-quiet">{{ t(item.key) }}</RouterLink>
            </li>
          </ul>
        </nav>

        <div class="md:col-span-2">
          <p class="eyebrow mb-4">{{ t('socialMedia') }}</p>
          <ul class="space-y-2.5">
            <li>
              <a
                :href="profile.github"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm link-quiet"
              >
                GitHub <span aria-hidden="true" class="text-faint">&#8599;</span>
              </a>
            </li>
            <li>
              <a
                :href="profile.linkedin"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm link-quiet"
              >
                LinkedIn <span aria-hidden="true" class="text-faint">&#8599;</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Colophon -->
      <div
        class="mt-16 flex flex-col gap-3 border-t border-line pt-6 font-mono text-[0.688rem] tracking-wide text-faint sm:flex-row sm:items-center sm:justify-between"
      >
        <p>&copy; {{ year }} {{ profile.name }}</p>
        <p>{{ t('footer.colophon') }}</p>
      </div>
    </div>
  </footer>
</template>
