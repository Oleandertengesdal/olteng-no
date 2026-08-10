<script setup lang="ts">
/**
 * Personvernsiden.
 *
 * Den finnes fordi løftet skal stå skrevet et sted brukeren kan lese det, og
 * fordi et løfte som bare finnes i kildekoden ikke er et løfte til noen.
 *
 * Hvert punkt er formulert slik at det går an å kontrollere. «Vi respekterer
 * personvernet ditt» er ikke en påstand man kan sjekke; «åpne nettverksfanen
 * og se etter» er det.
 */

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const sections = ['local', 'noAccounts', 'network', 'backup', 'verify'] as const
</script>

<template>
  <article class="shell max-w-prose py-10">
    <p class="eyebrow">{{ t('privacy.eyebrow') }}</p>
    <h1 class="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
      {{ t('privacy.title') }}
    </h1>
    <p class="mt-4 text-base leading-relaxed text-muted">{{ t('privacy.lead') }}</p>

    <section v-for="key in sections" :key="key" class="mt-8 border-t border-line pt-5">
      <h2 class="font-display text-xl text-ink">{{ t(`privacy.${key}.title`) }}</h2>
      <p class="mt-2 text-sm leading-relaxed text-muted">{{ t(`privacy.${key}.body`) }}</p>
    </section>

    <p class="mt-10 border-t border-line pt-4 text-xs leading-relaxed text-faint">
      {{ t('privacy.footnote') }}
    </p>
  </article>
</template>
