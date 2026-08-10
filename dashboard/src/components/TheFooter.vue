<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()
</script>

<template>
  <footer class="mt-16 border-t border-line">
    <div class="shell flex flex-wrap items-baseline gap-x-6 gap-y-2 py-6">
      <!-- Løftet står på siden, ikke bare i koden. Et personvernløfte man må
           lese kildekoden for å finne, er ikke et løfte til noen. -->
      <p class="text-xs leading-relaxed text-muted">{{ t('footer.promise') }}</p>

      <nav class="ml-auto flex items-center gap-4">
        <RouterLink to="/personvern" class="link">{{ t('nav.privacy') }}</RouterLink>
        <a href="https://olteng.no" class="link">olteng.no</a>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.link {
  @apply font-mono text-[0.7rem] uppercase tracking-[0.1em] text-faint;
  @apply transition-colors duration-150 ease-editorial;
}

.link:hover {
  @apply text-accent;
}
</style>
