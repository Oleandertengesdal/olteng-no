<script setup lang="ts">
/**
 * Én lenke.
 *
 * Navnet står som lærestedet kaller det, med merknaden under. Merknaden er
 * ikke pynt — den er grunnen til at man tør trykke på noe som heter «Leganto».
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import type { Link } from '@/data/links/types.ts'

const props = defineProps<{
  link: Link
  /** Vises når lenken kommer fra et annet sted enn gruppen man ser på. */
  origin?: string | null
}>()

const { locale } = useI18n()
const lang = computed(() => locale.value as 'nb' | 'en')

const host = computed(() => {
  try {
    return new URL(props.link.url).host.replace(/^www\./, '')
  } catch {
    return ''
  }
})
</script>

<template>
  <a
    :href="link.url"
    rel="noreferrer"
    class="group block px-3 py-2 transition-colors duration-150 ease-editorial hover:bg-raised"
  >
    <span class="flex items-baseline gap-2">
      <span class="text-sm text-ink transition-colors duration-150 group-hover:text-accent">
        {{ link.label }}
      </span>
      <span v-if="origin" class="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-faint">
        {{ origin }}
      </span>
      <span class="ml-auto shrink-0 font-mono text-[0.6rem] text-faint">{{ host }}</span>
    </span>

    <span class="mt-0.5 block text-xs leading-relaxed text-muted">{{ link.note[lang] }}</span>

    <!-- Noe som er i endring akkurat nå. Står tydelig, ikke som fotnote:
         «dette systemet byttes ut» er den nyttigste opplysningen på siden den
         dagen det skjer. -->
    <span
      v-if="link.warning"
      class="mt-1 flex items-start gap-1.5 text-[0.7rem] leading-relaxed text-warning"
    >
      <AppIcon name="info" :size="13" class="mt-0.5" />
      {{ link.warning[lang] }}
    </span>
  </a>
</template>
