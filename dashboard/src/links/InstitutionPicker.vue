<script setup lang="ts">
/**
 * Lærestedsvelgeren.
 *
 * Dette er det første man gjør, og det som gjør katalogen til noe annet enn en
 * lenkeliste: velg lærested, og hele settet bytter. En student ved UiB skal
 * ikke se NTNU-lenker.
 */

import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import { useInstitution } from './useInstitution.ts'

const { t } = useI18n()
const { institutions, selectedId, choose } = useInstitution()
</script>

<template>
  <section>
    <h2 class="eyebrow mb-2">{{ t('links.chooseInstitution') }}</h2>

    <ul role="list" class="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="institution in institutions" :key="institution.id" class="bg-surface">
        <button
          type="button"
          class="flex h-full w-full items-start gap-2 p-3 text-left transition-colors duration-150 ease-editorial hover:bg-raised"
          :aria-current="selectedId === institution.id"
          @click="choose(institution.id)"
        >
          <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-accent">
            <AppIcon v-if="selectedId === institution.id" name="check" :size="14" />
          </span>

          <span class="min-w-0">
            <span
              class="block text-sm font-medium"
              :class="selectedId === institution.id ? 'text-accent' : 'text-ink'"
            >
              {{ institution.shortName }}
            </span>
            <span class="block truncate text-xs text-muted">{{ institution.name }}</span>
            <span class="block font-mono text-[0.65rem] text-faint">
              {{ institution.city.join(' · ') }}
            </span>
          </span>
        </button>
      </li>
    </ul>

    <!-- Ærlig om at katalogen ikke er ferdig. Fjorten læresteder er målet;
         fem er det som finnes. -->
    <p class="mt-3 text-xs leading-relaxed text-muted">{{ t('links.moreComing') }}</p>
  </section>
</template>
