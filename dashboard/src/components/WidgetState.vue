<script setup lang="ts">
/**
 * Tom, laster, feilet.
 *
 * De tre tilstandene ser like ut i hver widget, og det er meningen: når været
 * og avgangene er nede samtidig, skal de to rutene se ut som to ruter uten
 * data — ikke som to forskjellige feil man må tolke hver for seg.
 *
 * Lastetilstanden tegner ikke en spinner. Rutenettet har fast radhøyde, så
 * plassen er allerede reservert; det som mangler er en antydning om at noe er
 * på vei, og en dempet strek gjør den jobben uten å be om oppmerksomhet.
 */

import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import type { RemoteError } from '@/data/remote.ts'

withDefaults(
  defineProps<{
    kind: 'empty' | 'loading' | 'error'
    /** Hva widgeten gjør, i den tomme tilstanden. */
    title?: string
    message?: string
    error?: RemoteError | null
    actionLabel?: string
  }>(),
  { title: '', message: '', error: null, actionLabel: '' },
)

const emit = defineEmits<{ action: [] }>()

const { t } = useI18n()

/** Feilteksten forklarer hva som skjedde, ikke hva brukeren gjorde galt. */
const errorText = (error: RemoteError | null): string => {
  if (!error) return t('remote.error.offline')
  if (error.kind === 'http' && error.status) {
    return t('remote.error.httpStatus', { status: error.status })
  }
  return t(`remote.error.${error.kind}`)
}
</script>

<template>
  <div class="flex h-full flex-col justify-center gap-2 p-4">
    <template v-if="kind === 'loading'">
      <span class="h-2 w-20 bg-raised" aria-hidden="true"></span>
      <span class="h-2 w-32 bg-raised" aria-hidden="true"></span>
      <span class="sr-only">{{ t('remote.loading') }}</span>
    </template>

    <template v-else-if="kind === 'error'">
      <p class="flex items-center gap-2 text-sm text-ink">
        <AppIcon name="offline" :size="15" class="text-faint" />
        {{ errorText(error) }}
      </p>
      <button v-if="actionLabel" type="button" class="btn mt-1 self-start" @click="emit('action')">
        {{ actionLabel }}
      </button>
    </template>

    <template v-else>
      <p v-if="title" class="text-sm text-ink">{{ title }}</p>
      <p v-if="message" class="text-xs leading-relaxed text-muted">{{ message }}</p>
      <button v-if="actionLabel" type="button" class="btn mt-2 self-start" @click="emit('action')">
        {{ actionLabel }}
      </button>
    </template>
  </div>
</template>
