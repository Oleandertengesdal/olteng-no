<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView } from 'vue-router'
import TheHeader from './components/TheHeader.vue'
import TheFooter from './components/TheFooter.vue'

const { t, locale } = useI18n()
const isDark = ref(false)

const toggleLanguage = () => {
  locale.value = locale.value === 'nb' ? 'en' : 'nb'
  localStorage.setItem('locale', locale.value)
  document.documentElement.lang = locale.value === 'nb' ? 'nb' : 'en'
}

const toggleDarkMode = () => {
  isDark.value = !isDark.value
}

watch(isDark, (val) => {
  document.documentElement.classList.toggle('dark', val)
  localStorage.setItem('theme', val ? 'dark' : 'light')
})

onMounted(() => {
  // The inline script in index.html already applied the class before first
  // paint — here we only sync the reactive flag to whatever it decided.
  isDark.value = document.documentElement.classList.contains('dark')

  const savedLocale = localStorage.getItem('locale')
  if (savedLocale === 'nb' || savedLocale === 'en') {
    locale.value = savedLocale
  }
  document.documentElement.lang = locale.value === 'nb' ? 'nb' : 'en'
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:border focus:border-ink focus:bg-paper focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest"
    >
      {{ t('ui.skipToContent') }}
    </a>

    <TheHeader
      :is-dark="isDark"
      @toggle-language="toggleLanguage"
      @toggle-dark-mode="toggleDarkMode"
    />

    <main id="main" class="flex-grow">
      <RouterView v-slot="{ Component }">
        <Transition
          mode="out-in"
          enter-active-class="transition-opacity duration-300 ease-out"
          enter-from-class="opacity-0"
          leave-active-class="transition-opacity duration-150 ease-in"
          leave-to-class="opacity-0"
        >
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <TheFooter
      :is-dark="isDark"
      @toggle-language="toggleLanguage"
      @toggle-dark-mode="toggleDarkMode"
    />
  </div>
</template>
