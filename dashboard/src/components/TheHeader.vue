<script setup lang="ts">
/**
 * Toppfeltet.
 *
 * Rolig i hvile. Det står i veien for dashbordet hver eneste gang siden åpnes,
 * og skal derfor være så lite som det går an uten å bli utilgjengelig.
 */

import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'
import ThemeMenu from './ThemeMenu.vue'
import DataMenu from './DataMenu.vue'
import LangToggle from './LangToggle.vue'
import { useLayout } from '@/layout/useLayout.ts'
import { usePicker } from '@/layout/usePicker.ts'
import { useLinkSearch } from '@/links/useLinkSearch.ts'

const { t } = useI18n()
const { editing, layout } = useLayout()
const { pickerOpen, toggle } = usePicker()
const { open: openSearch } = useLinkSearch()
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
    <div class="shell flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
      <RouterLink to="/" class="group flex items-baseline gap-2">
        <span class="font-display text-lg leading-none text-ink">dashboard</span>
        <span class="font-mono text-[0.7rem] tracking-[0.08em] text-faint">.olteng.no</span>
      </RouterLink>

      <nav class="ml-4 hidden items-center gap-4 sm:flex">
        <RouterLink to="/lenker" class="nav-link">{{ t('nav.links') }}</RouterLink>
      </nav>

      <div class="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
        <!-- Søket har snarvei, men en knapp er den eneste måten noen finner ut
             at snarveien finnes. -->
        <button type="button" class="btn" @click="openSearch()">
          <AppIcon name="search" :size="14" />
          <span class="hidden md:inline">{{ t('links.search') }}</span>
          <kbd class="hidden font-mono text-[0.65rem] text-faint md:inline">/</kbd>
        </button>

        <button
          type="button"
          class="btn"
          :class="pickerOpen ? 'border-accent text-accent' : ''"
          :aria-expanded="pickerOpen"
          @click="toggle"
        >
          <AppIcon name="plus" :size="14" />
          <span class="hidden sm:inline">{{ t('header.add') }}</span>
        </button>

        <button
          v-if="layout.length > 0"
          type="button"
          class="btn"
          :class="editing ? 'btn-primary' : ''"
          :aria-pressed="editing"
          @click="editing = !editing"
        >
          <AppIcon :name="editing ? 'check' : 'grid'" :size="14" />
          <span class="hidden sm:inline">{{ editing ? t('header.done') : t('header.arrange') }}</span>
        </button>

        <ThemeMenu />
        <DataMenu />
        <LangToggle />
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-link {
  @apply font-mono text-[0.7rem] uppercase tracking-[0.1em] text-faint;
  @apply transition-colors duration-150 ease-editorial;
}

.nav-link:hover,
.nav-link.router-link-active {
  @apply text-accent;
}
</style>
