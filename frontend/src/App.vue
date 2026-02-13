<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import TheHeader from './components/TheHeader.vue'
import TheFooter from './components/TheFooter.vue'
import { RouterView } from 'vue-router'

const { t, locale } = useI18n()
const isDark = ref(false)

const toggleLanguage = () => {
  locale.value = locale.value === 'nb' ? 'en' : 'nb'
}

const toggleDarkMode = () => {
  isDark.value = !isDark.value
}

// Watch for changes and update the document class
watch(isDark, (val) => {
  if (val) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}, { immediate: false })

onMounted(() => {
  // Check localStorage or system preference
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <TheHeader 
      :is-dark="isDark" 
      @toggle-language="toggleLanguage" 
      @toggle-dark-mode="toggleDarkMode" 
    />
    
    <main class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <RouterView />
    </main>

    <TheFooter 
      :is-dark="isDark" 
      @toggle-language="toggleLanguage" 
      @toggle-dark-mode="toggleDarkMode"
    />
  </div>
</template>

<style scoped></style>
