<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterView } from 'vue-router'
import TheHeader from '@/components/TheHeader.vue'
import TheFooter from '@/components/TheFooter.vue'
import LinkSearchDialog from '@/links/LinkSearchDialog.vue'

const { t } = useI18n()
</script>

<template>
  <a href="#innhold" class="skip">{{ t('a11y.skip') }}</a>

  <TheHeader />

  <main id="innhold" class="min-h-[60vh]">
    <RouterView />
  </main>

  <TheFooter />

  <!-- Søket ligger over alt annet og åpnes med skråstrek fra hvor som helst.
       Det tegnes bare når det er åpent, så det koster ingenting å ha her. -->
  <LinkSearchDialog />
</template>

<style scoped>
/* Hopp til innhold. Usynlig til den får fokus, og da fullt synlig — ikke en
   1×1-piksel noen aldri finner. */
.skip {
  @apply sr-only;
}

.skip:focus {
  @apply not-sr-only fixed left-3 top-3 z-50 border border-accent bg-surface px-3 py-2;
  @apply font-mono text-xs uppercase tracking-[0.1em] text-ink;
}
</style>
