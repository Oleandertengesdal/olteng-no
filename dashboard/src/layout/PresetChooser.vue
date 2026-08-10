<script setup lang="ts">
/**
 * Førstegangsvalget.
 *
 * En ny bruker møter tre forslag framfor en tom side med en knapp. Det er
 * forskjellen mellom et verktøy man forstår på ti sekunder og et man må sette
 * opp før man skjønner hva det er.
 *
 * Forslagene sier hvor mange av widgetene sine som finnes ennå. Katalogen i
 * prosjektbeskrivelsen har rundt førti; etappe 1 har én. Å late som noe annet
 * ville gitt et «Morgen»-oppsett som bare inneholder en klokke, uten at det
 * står noe sted hvorfor.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PRESETS, buildPreset, presetCoverage, type Preset } from './presets.ts'
import { useLayout } from './useLayout.ts'
import AppIcon from '@/components/AppIcon.vue'

const emit = defineEmits<{ openPicker: [] }>()

const { t, locale } = useI18n()
const { applyPreset, clear } = useLayout()

const lang = computed(() => locale.value as 'nb' | 'en')

const choose = (preset: Preset) => {
  applyPreset(preset)
  // Ga forslaget ingen widgets fordi ingen av dem finnes ennå, er velgeren
  // eneste vei videre. Da åpner vi den framfor å levere en tom side.
  if (buildPreset(preset).length === 0) emit('openPicker')
}
</script>

<template>
  <section class="mx-auto max-w-3xl py-10">
    <p class="eyebrow">{{ t('onboarding.eyebrow') }}</p>
    <h1 class="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
      {{ t('onboarding.title') }}
    </h1>
    <p class="mt-3 max-w-prose text-sm leading-relaxed text-muted">
      {{ t('onboarding.lead') }}
    </p>

    <ul role="list" class="mt-8 grid gap-px border border-line bg-line sm:grid-cols-3">
      <li v-for="preset in PRESETS" :key="preset.id" class="bg-surface">
        <button
          type="button"
          class="flex h-full w-full flex-col items-start gap-2 p-4 text-left transition-colors duration-150 ease-editorial hover:bg-raised"
          @click="choose(preset)"
        >
          <span class="font-display text-lg text-ink">{{ preset.name[lang] }}</span>
          <span class="text-xs leading-relaxed text-muted">{{ preset.note[lang] }}</span>
          <span class="mt-auto pt-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint">
            {{
              t('onboarding.coverage', {
                available: presetCoverage(preset).available,
                total: presetCoverage(preset).total,
              })
            }}
          </span>
        </button>
      </li>
    </ul>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <button type="button" class="btn" @click="emit('openPicker')">
        <AppIcon name="plus" :size="14" />
        {{ t('onboarding.pickYourself') }}
      </button>
      <button type="button" class="btn" @click="clear()">
        {{ t('onboarding.startEmpty') }}
      </button>
    </div>

    <p class="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-muted">
      {{ t('onboarding.stage') }}
    </p>
  </section>
</template>
