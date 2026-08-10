<script setup lang="ts">
/**
 * Språkbytte. To språk, så en bryter holder — en nedtrekksmeny med to valg er
 * ett klikk for mye.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import { setLocale } from '@/i18n/index.ts'
import type { Locale } from '@/data/bilingual.ts'

const { t, locale } = useI18n()

const other = computed<Locale>(() => (locale.value === 'nb' ? 'en' : 'nb'))
</script>

<template>
  <button
    type="button"
    class="btn"
    :aria-label="t('lang.switchTo', { lang: t(`lang.${other}`) })"
    :lang="other"
    @click="setLocale(other)"
  >
    <AppIcon name="language" :size="14" />
    <span class="tnum">{{ other.toUpperCase() }}</span>
  </button>
</template>
