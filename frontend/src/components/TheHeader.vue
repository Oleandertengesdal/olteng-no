<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

const { t, locale } = useI18n()
const route = useRoute()

defineProps<{ isDark: boolean }>()
const emit = defineEmits(['toggle-language', 'toggle-dark-mode'])

const menuOpen = ref(false)

const nav = [
  { to: '/', key: 'navigations.home' },
  { to: '/projects', key: 'navigations.projects' },
  { to: '/about', key: 'navigations.about' },
  { to: '/cv', key: 'navigations.resume' },
  { to: '/contact', key: 'navigations.contact' },
]

// Close the mobile drawer whenever navigation happens
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
    <!-- Four-segment rule: the same colour key used for technologies below -->
    <div class="flex h-0.5 w-full" aria-hidden="true">
      <span class="flex-1 bg-iris" />
      <span class="flex-1 bg-clay" />
      <span class="flex-1 bg-pine" />
      <span class="flex-1 bg-ochre" />
    </div>

    <div class="shell">
      <div class="flex h-16 items-center justify-between gap-6">
        <!-- Wordmark -->
        <RouterLink to="/" class="group flex items-baseline gap-2.5 focus-visible:outline-offset-4">
          <span
            class="font-display text-[1.35rem] font-medium tracking-tight text-ink transition-colors duration-300 group-hover:text-accent"
          >
            Oleander Tengesdal
          </span>
          <span
            class="hidden font-mono text-[0.688rem] tracking-widest text-faint transition-colors group-hover:text-accent sm:inline"
          >
            olteng.no
          </span>
        </RouterLink>

        <!-- Desktop nav -->
        <nav class="hidden items-center gap-7 md:flex" :aria-label="t('navigation')">
          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            active-class="is-active"
          >
            {{ t(item.key) }}
          </RouterLink>
        </nav>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="rounded-sm px-2.5 py-2 font-mono text-[0.75rem] uppercase tracking-widest text-muted transition-colors hover:bg-raised hover:text-ink"
            :title="locale === 'nb' ? 'Switch to English' : 'Bytt til norsk'"
            :aria-label="locale === 'nb' ? 'Switch to English' : 'Bytt til norsk'"
            @click="emit('toggle-language')"
          >
            {{ locale === 'nb' ? 'EN' : 'NO' }}
          </button>

          <button
            type="button"
            class="rounded-sm p-2 text-muted transition-colors hover:bg-raised hover:text-ink"
            :aria-label="isDark ? t('ui.lightMode') : t('ui.darkMode')"
            @click="emit('toggle-dark-mode')"
          >
            <svg
              v-if="isDark"
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path
                stroke-linecap="round"
                d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
              />
            </svg>
            <svg
              v-else
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
              />
            </svg>
          </button>

          <!-- Mobile menu toggle -->
          <button
            type="button"
            class="rounded-sm p-2 text-muted transition-colors hover:bg-raised hover:text-ink md:hidden"
            :aria-expanded="menuOpen"
            aria-controls="mobile-nav"
            :aria-label="t('ui.menu')"
            @click="menuOpen = !menuOpen"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              aria-hidden="true"
            >
              <path v-if="!menuOpen" stroke-linecap="round" d="M3 7h18M3 12h18M3 17h18" />
              <path v-else stroke-linecap="round" d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile drawer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <nav
        v-show="menuOpen"
        id="mobile-nav"
        class="border-t border-line bg-paper md:hidden"
        :aria-label="t('navigation')"
      >
        <div class="shell py-2">
          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="block border-b border-line py-4 font-display text-xl text-ink last:border-b-0"
            active-class="text-accent"
          >
            {{ t(item.key) }}
          </RouterLink>
        </div>
      </nav>
    </Transition>
  </header>
</template>
