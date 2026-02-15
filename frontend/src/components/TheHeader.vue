<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import logo from '../assets/logo.svg'

const { t, locale } = useI18n()

defineProps<{
  isDark: boolean
}>()

const emit = defineEmits(['toggle-language', 'toggle-dark-mode'])

const toggleLanguage = () => {
  emit('toggle-language')
}

const toggleDarkMode = () => {
  emit('toggle-dark-mode')
}
</script>

<template>
  <header class="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex-shrink-0 flex items-center">
          <RouterLink to="/" class="flex items-center gap-3 group">
            <img :src="logo" alt="OT Logo" class="h-10 w-10 transition-transform group-hover:scale-110" />
            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Oleander Tengesdal
            </span>
          </RouterLink>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-8">
          <RouterLink 
            to="/" 
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md font-medium"
          >
            {{ t('navigations.home') }}
          </RouterLink>
          <RouterLink 
            to="/projects" 
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md font-medium"
          >
            {{ t('navigations.projects') }}
          </RouterLink>
        </nav>

        <!-- Actions -->
        <div class="flex items-center space-x-4">
          <button 
            @click="toggleLanguage"
            class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            :title="locale === 'nb' ? 'Switch to English' : 'Bytt til norsk'"
          >
            <span class="text-sm font-bold uppercase">{{ locale }}</span>
          </button>

          <button 
            @click="toggleDarkMode"
            class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            <span v-if="isDark">☀️</span>
            <span v-else>🌙</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
