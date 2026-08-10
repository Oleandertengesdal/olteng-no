<script setup lang="ts">
/**
 * Eksport og import.
 *
 * Når det ikke finnes noen server, er dette den eneste sikkerhetskopien som
 * finnes. Det er ikke en ekstrafunksjon — det er den funksjonen som gjør at
 * «alt lagres lokalt» er et løfte og ikke en risiko.
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DropMenu from './DropMenu.vue'
import AppIcon from './AppIcon.vue'
import { exportAll, exportFilename, importAll, storageStatus } from '@/data/storage.ts'
import { useLayout } from '@/layout/useLayout.ts'

const { t } = useI18n()
const { reload } = useLayout()

const file = ref<HTMLInputElement | null>(null)
const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)

const download = () => {
  const blob = new Blob([JSON.stringify(exportAll(), null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = exportFilename()
  link.click()

  // Uten dette holder nettleseren på blobben til fanen lukkes.
  URL.revokeObjectURL(url)
  message.value = { kind: 'ok', text: t('data.exported') }
}

const onFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const chosen = input.files?.[0]
  if (!chosen) return

  const result = importAll(await chosen.text())

  if (result.ok) {
    reload()
    message.value = { kind: 'ok', text: t('data.imported', { count: result.keys.length }) }
    // Fargemodus og språk leses ved oppstart. Enkleste ærlige løsning er å
    // laste siden på nytt framfor å påstå at alt er i orden mens halve
    // grensesnittet fortsatt viser det gamle.
    window.setTimeout(() => window.location.reload(), 700)
  } else {
    message.value = { kind: 'error', text: t(`data.error.${result.reason}`, { detail: result.detail ?? '' }) }
  }

  // Nullstill, ellers utløser ikke change hvis man velger samme fil igjen.
  input.value = ''
}
</script>

<template>
  <DropMenu :label="t('data.label')" icon="download" align="right" compact>
    <div class="p-3">
      <button type="button" class="btn w-full justify-center" @click="download">
        <AppIcon name="download" :size="14" />
        {{ t('data.export') }}
      </button>

      <button
        type="button"
        class="btn mt-2 w-full justify-center"
        @click="file?.click()"
      >
        <AppIcon name="upload" :size="14" />
        {{ t('data.import') }}
      </button>

      <input
        ref="file"
        type="file"
        accept="application/json,.json"
        class="sr-only"
        :aria-label="t('data.import')"
        @change="onFile"
      />

      <p class="mt-3 border-t border-line pt-2 text-[0.7rem] leading-relaxed text-muted">
        {{ t('data.note') }}
      </p>

      <p
        v-if="storageStatus() !== 'ok'"
        class="mt-2 border border-warning px-2 py-1.5 text-[0.7rem] leading-relaxed text-ink"
      >
        {{ t(`data.storage.${storageStatus()}`) }}
      </p>

      <p
        v-if="message"
        class="mt-2 text-[0.7rem] leading-relaxed"
        :class="message.kind === 'ok' ? 'text-positive' : 'text-critical'"
        role="status"
      >
        {{ message.text }}
      </p>
    </div>
  </DropMenu>
</template>
