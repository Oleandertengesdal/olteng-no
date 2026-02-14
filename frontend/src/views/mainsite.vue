<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const calculateAge = (birthDate: string) => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const age = calculateAge('2003-09-09')
</script>

<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="flex flex-col md:flex-row items-center gap-12">
            <!-- Text Content -->
            <div class="flex-1 order-2 md:order-1 text-center md:text-left">
                <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                    {{ t('welcome') }}
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                    {{ t('aboutMeText', { age }) }}
                </p>
            </div>

            <!-- Picture / Placeholder -->
            <div class="flex-1 order-1 md:order-2 w-full max-w-sm mx-auto">
                <div class="aspect-square rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700">
                    <!-- Replace this with your actual <img> tag when ready -->
                    <span class="text-gray-400 italic">{{ t('picturehereText') }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>