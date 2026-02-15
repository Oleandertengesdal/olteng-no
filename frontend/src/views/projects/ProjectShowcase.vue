<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { projects } from '@/data/projects'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const project = computed(() => {
  return projects.find(p => p.id === route.params.id)
})

const getLocalizedText = (text: { en: string; nb: string }) => {
  return text[locale.value as 'en' | 'nb'] || text.en
}

const goBack = () => {
  router.push('/projects')
}

const openGithub = () => {
  if (project.value?.githubUrl) {
    window.open(project.value.githubUrl, '_blank')
  }
}

const openLive = () => {
  if (project.value?.liveUrl) {
    window.open(project.value.liveUrl, '_blank')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="max-w-4xl mx-auto">
      <!-- Back Button -->
      <button
        @click="goBack"
        class="mb-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
      >
        ← {{ t('actions.back') }}
      </button>

      <!-- Project not found -->
      <div v-if="!project" class="text-center py-20">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Project not found
        </h1>
        <button
          @click="goBack"
          class="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {{ t('actions.back') }} to projects
        </button>
      </div>

      <!-- Project Details -->
      <article v-else class="space-y-8">
        <!-- Header Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <header>
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ getLocalizedText(project.title) }}
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
              {{ getLocalizedText(project.description) }}
            </p>
            
            <!-- Project Meta Info -->
            <div v-if="project.details" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div v-if="project.details.year">
                <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ t('projectYear') }}</p>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ project.details.year }}</p>
              </div>
              <div v-if="project.details.duration">
                <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ t('projectDuration') }}</p>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ project.details.duration }}</p>
              </div>
              <div v-if="project.details.role">
                <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ t('projectRole') }}</p>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ project.details.role }}</p>
              </div>
              <div v-if="project.details.status">
                <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ t('projectStatus') }}</p>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ project.details.status }}</p>
              </div>
            </div>

            <!-- Technologies -->
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">{{ t('technologies') }}</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tech in project.technologies"
                  :key="tech"
                  class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full font-medium"
                >
                  {{ tech }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-4">
              <button
                v-if="project.githubUrl"
                @click="openGithub"
                class="px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors font-medium flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                {{ t('viewOnGithub') }}
              </button>
              <button
                v-if="project.liveUrl"
                @click="openLive"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                {{ t('liveDemo') }}
              </button>
            </div>
          </header>
        </div>

        <!-- Overview Section -->
        <div v-if="project.title.overview || project.description.overview" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ t('projectOverview') }}</h2>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
            {{ locale === 'nb' ? project.description.overview : project.title.overview }}
          </p>
        </div>

        <!-- Features Section -->
        <div v-if="project.title.features || project.description.features" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ t('keyFeatures') }}</h2>
          <ul class="space-y-3">
            <li
              v-for="(feature, index) in (locale === 'nb' ? project.description.features : project.title.features)"
              :key="index"
              class="flex items-start gap-3"
            >
              <svg class="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-gray-700 dark:text-gray-300">{{ feature }}</span>
            </li>
          </ul>
        </div>

        <!-- Technical Details Section -->
        <div v-if="project.title.technicalDetails || project.description.technicalDetails" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ t('technicalDetails') }}</h2>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
            {{ locale === 'nb' ? project.description.technicalDetails : project.title.technicalDetails }}
          </p>
        </div>

        <!-- Challenges Section -->
        <div v-if="project.title.challenges || project.description.challenges" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ t('challenges') }}</h2>
          <ul class="space-y-3">
            <li
              v-for="(challenge, index) in (locale === 'nb' ? project.description.challenges : project.title.challenges)"
              :key="index"
              class="flex items-start gap-3"
            >
              <svg class="w-6 h-6 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span class="text-gray-700 dark:text-gray-300">{{ challenge }}</span>
            </li>
          </ul>
        </div>

        <!-- Outcomes Section -->
        <div v-if="project.title.outcomes || project.description.outcomes" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ t('outcomes') }}</h2>
          <ul class="space-y-3">
            <li
              v-for="(outcome, index) in (locale === 'nb' ? project.description.outcomes : project.title.outcomes)"
              :key="index"
              class="flex items-start gap-3"
            >
              <svg class="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-gray-700 dark:text-gray-300">{{ outcome }}</span>
            </li>
          </ul>
        </div>

        <!-- Future Improvements Section -->
        <div v-if="project.title.futureImprovements || project.description.futureImprovements" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ t('futureImprovements') }}</h2>
          <ul class="space-y-3">
            <li
              v-for="(improvement, index) in (locale === 'nb' ? project.description.futureImprovements : project.title.futureImprovements)"
              :key="index"
              class="flex items-start gap-3"
            >
              <svg class="w-6 h-6 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              <span class="text-gray-700 dark:text-gray-300">{{ improvement }}</span>
            </li>
          </ul>
        </div>

        <!-- Back to Projects Button -->
        <div class="flex justify-center pt-4">
          <button
            @click="goBack"
            class="px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            ← {{ t('backToProjects') }}
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
