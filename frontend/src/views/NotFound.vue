<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()
</script>

<template>
  <div class="shell flex min-h-[60vh] flex-col justify-center py-20">
    <p class="eyebrow">404</p>
    <h1 class="mt-6 max-w-3xl font-display text-display font-medium text-ink">
      {{ t('notFound.title') }}
    </h1>
    <p class="prose-column mt-6">{{ t('notFound.body') }}</p>

    <div class="mt-10 flex flex-wrap gap-3">
      <RouterLink to="/" class="btn btn-solid">{{ t('navigations.home') }}</RouterLink>
      <RouterLink to="/projects" class="btn btn-outline">{{
        t('navigations.projects')
      }}</RouterLink>
    </div>
  </div>
</template>
