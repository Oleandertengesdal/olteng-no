<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { sortedProjects, type Project } from '@/data/projects'

const { t, locale } = useI18n()
const router = useRouter()

const largeProjects = computed(() => sortedProjects.filter(p => p.size === 'large'))
const mediumProjects = computed(() => sortedProjects.filter(p => p.size === 'medium'))
const smallProjects = computed(() => sortedProjects.filter(p => p.size === 'small'))

const getLocalizedText = (text: { en: string; nb: string }) => {
  return text[locale.value as 'en' | 'nb'] || text.en
}

const openProject = (project: Project) => {
  if (project.type === 'live') {
    router.push(`/projects/${project.id}`)
  } else {
    router.push(`/projects/${project.id}`)
  }
}

const openGithub = (url: string, event: Event) => {
  event.stopPropagation()
  window.open(url, '_blank')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {{ t('navigations.projects') }}
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400">
          {{ t('projectsPageDescription') }}
        </p>
      </div>

      <!-- Large Projects -->
      <section v-if="largeProjects.length > 0" class="mb-16">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
          {{ t('featuredProjects') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="project in largeProjects"
            :key="project.id"
            @click="openProject(project)"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700 group"
          >
            <div v-if="project.image" class="h-48 bg-gradient-to-br from-blue-500 to-purple-600"></div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {{ getLocalizedText(project.title) }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                {{ getLocalizedText(project.description) }}
              </p>
              <div class="flex flex-wrap gap-2 mb-4">
                <span
                  v-for="tech in project.technologies"
                  :key="tech"
                  class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                >
                  {{ tech }}
                </span>
              </div>
              <div class="flex gap-3">
                <button
                  v-if="project.githubUrl"
                  @click="openGithub(project.githubUrl, $event)"
                  class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  GitHub →
                </button>
                <span class="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {{ project.type === 'live' ? t('tryItLive') : t('actions.readMore') }} →
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Medium Projects -->
      <section v-if="mediumProjects.length > 0" class="mb-16">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
          {{ t('projects') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="project in mediumProjects"
            :key="project.id"
            @click="openProject(project)"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer p-5 border border-gray-200 dark:border-gray-700 group"
          >
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {{ getLocalizedText(project.title) }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
              {{ getLocalizedText(project.description) }}
            </p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tech in project.technologies.slice(0, 3)"
                :key="tech"
                class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Small Projects & Tools -->
      <section v-if="smallProjects.length > 0">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
          {{ t('toolsAndUtilities') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="project in smallProjects"
            :key="project.id"
            @click="openProject(project)"
            class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all duration-300 cursor-pointer p-4 border border-gray-200 dark:border-gray-700 group"
          >
            <div class="flex items-start justify-between mb-2">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {{ getLocalizedText(project.title) }}
              </h3>
              <span v-if="project.type === 'live'" class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                {{ t('live') }}
              </span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
              {{ getLocalizedText(project.description) }}
            </p>
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
              <span>{{ project.technologies[0] }}</span>
              <span v-if="project.githubUrl" class="hover:text-gray-700 dark:hover:text-gray-300">GitHub</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="sortedProjects.length === 0" class="text-center py-20">
        <p class="text-gray-500 dark:text-gray-400">
          {{ t('noProjectsYet') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any additional styles if needed */
</style>