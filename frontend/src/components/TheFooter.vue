<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()

defineProps<{
  isDark: boolean
}>()
</script>

<template>
    <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center">
                
                <!-- Brand / Copyright -->
                <div class="order-3 md:order-1">
                    <h2 class="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">olteng.no</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        &copy; {{ new Date().getFullYear() }} {{ t('footerText') }}
                    </p>
                </div>

                <!-- Navigation Links -->
                <div class="order-1 md:order-2">
                    <h3 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                        {{ t('navigation') || 'Navigation' }}
                    </h3>
                    <nav class="flex flex-wrap justify-center gap-6">
                        <RouterLink to="/" class="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                            {{ t('home') }}
                        </RouterLink>
                        <RouterLink to="/projects" class="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                            {{ t('projects') }}
                        </RouterLink>
                        <RouterLink to="/about" class="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                            {{ t('about') }}
                        </RouterLink>
                        <RouterLink to="/contact" class="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                            {{ t('contact') }}
                        </RouterLink>
                    </nav>
                </div>

                <!-- Social Media -->
                <div class="order-2 md:order-3">
                    <h3 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                        {{ t('followMe') || 'Social' }}
                    </h3>
                    <div class="flex justify-center gap-6">
                        <a href="https://github.com/Oleandertengesdal" target="_blank" rel="noopener noreferrer" 
                            class="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors"
                            title="GitHub">
                            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        </a>
                        <a href="https://www.linkedin.com/in/oleander-tengesdal-215bba333/" target="_blank" rel="noopener noreferrer" 
                            class="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                            title="LinkedIn">
                            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        </a>
                    </div>
                </div>

            </div>
        </div>
    </footer>
</template>