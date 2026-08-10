<script setup lang="ts">
/**
 * Import av timeplan.
 *
 * Fil er hovedveien og virker alltid. Abonnementslenke er tilbudt fordi den er
 * det lærestedene faktisk gir ut — men de aller fleste av dem sender ikke
 * CORS-headere, og da får ikke nettleseren lov til å lese svaret uansett hva
 * vi gjør. Da sier widgeten det rett ut, med hva man gjør i stedet.
 *
 * Alternativet ville vært en server som henter lenken på vegne av
 * nettleseren. Det ville løst problemet og gjort personvernløftet lengre og
 * mindre sant, så det er ikke gjort.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import { parseIcs } from '@/data/ics.ts'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import { looksLikeUrl, normaliseCalendarUrl } from './logic.ts'
import {
  DEFAULT_TIMETABLE_SETTINGS,
  MAX_ICS_BYTES,
  isTimetableSettings,
  type TimetableSettings,
} from './settings.ts'

const props = defineProps<{ instanceId: string }>()
const emit = defineEmits<{ close: [] }>()

const { t, locale } = useI18n()

const settings = useWidgetSettings<TimetableSettings>(
  props.instanceId,
  DEFAULT_TIMETABLE_SETTINGS,
  isTimetableSettings,
)

const file = ref<HTMLInputElement | null>(null)
const url = ref('')
const busy = ref(false)
const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)

const accept = (raw: string, kind: 'file' | 'url', label: string): boolean => {
  if (raw.length > MAX_ICS_BYTES) {
    message.value = { kind: 'error', text: t('timetable.tooBig') }
    return false
  }

  const parsed = parseIcs(raw)
  if (parsed.events.length === 0) {
    // En fil uten hendelser er nesten alltid feil fil, ikke en tom timeplan.
    message.value = { kind: 'error', text: t('timetable.noEvents') }
    return false
  }

  settings.value = {
    ...settings.value,
    raw,
    source: { kind, label, importedAt: Date.now() },
  }
  message.value = { kind: 'ok', text: t('timetable.imported', { count: parsed.events.length }) }
  return true
}

const onFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const chosen = input.files?.[0]
  if (!chosen) return

  busy.value = true
  accept(await chosen.text(), 'file', chosen.name)
  busy.value = false
  input.value = ''
}

const fromUrl = async () => {
  if (!looksLikeUrl(url.value)) {
    message.value = { kind: 'error', text: t('timetable.badUrl') }
    return
  }

  busy.value = true
  message.value = null

  const address = normaliseCalendarUrl(url.value)

  try {
    const response = await fetch(address, { headers: { Accept: 'text/calendar' } })
    if (!response.ok) {
      message.value = { kind: 'error', text: t('timetable.urlStatus', { status: response.status }) }
    } else {
      accept(await response.text(), 'url', address)
    }
  } catch {
    // Så godt som alltid CORS. Nettleseren gir ingen detaljer om hvorfor —
    // den nekter bare — så meldingen sier hva som er mest sannsynlig og hva
    // man gjør i stedet, framfor å gjette på en teknisk årsak.
    message.value = { kind: 'error', text: t('timetable.urlBlocked') }
  }

  busy.value = false
}

const clear = () => {
  settings.value = { ...settings.value, raw: null, source: null }
  message.value = null
}

const importedAt = computed(() =>
  settings.value.source
    ? new Date(settings.value.source.importedAt).toLocaleDateString(
        locale.value === 'nb' ? 'nb-NO' : 'en-GB',
        { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
      )
    : '',
)
</script>

<template>
  <div class="flex h-full flex-col gap-3 overflow-auto p-3">
    <div v-if="settings.source" class="border border-line px-2.5 py-2">
      <p class="truncate text-sm text-ink">{{ settings.source.label }}</p>
      <p class="font-mono text-[0.65rem] text-faint">
        {{ t('timetable.importedAt', { when: importedAt }) }}
      </p>
      <button type="button" class="btn mt-2" @click="clear">
        <AppIcon name="trash" :size="14" />
        {{ t('timetable.remove') }}
      </button>
    </div>

    <div>
      <h3 class="eyebrow mb-1.5">{{ t('timetable.fromFile') }}</h3>
      <button type="button" class="btn" :disabled="busy" @click="file?.click()">
        <AppIcon name="file" :size="14" />
        {{ t('timetable.chooseFile') }}
      </button>
      <input
        ref="file"
        type="file"
        accept=".ics,text/calendar"
        class="sr-only"
        :aria-label="t('timetable.chooseFile')"
        @change="onFile"
      />
      <p class="mt-2 text-[0.7rem] leading-relaxed text-muted">{{ t('timetable.fileNote') }}</p>
    </div>

    <div class="border-t border-line pt-3">
      <h3 class="eyebrow mb-1.5">{{ t('timetable.fromUrl') }}</h3>
      <div class="flex gap-2">
        <input
          v-model="url"
          type="url"
          inputmode="url"
          placeholder="https://cloud.timeedit.net/..."
          :aria-label="t('timetable.fromUrl')"
          class="min-w-0 flex-1 border border-line bg-paper px-2 py-1.5 font-mono text-xs text-ink placeholder:text-faint"
        />
        <button type="button" class="btn shrink-0" :disabled="busy" @click="fromUrl">
          <AppIcon name="link" :size="14" />
          {{ t('timetable.fetch') }}
        </button>
      </div>
      <p class="mt-2 text-[0.7rem] leading-relaxed text-muted">{{ t('timetable.urlNote') }}</p>
    </div>

    <p
      v-if="message"
      class="text-[0.7rem] leading-relaxed"
      :class="message.kind === 'ok' ? 'text-positive' : 'text-critical'"
      role="status"
    >
      {{ message.text }}
    </p>

    <label class="flex items-center gap-2 border-t border-line pt-3 text-sm text-ink">
      <input v-model="settings.showPast" type="checkbox" class="h-4 w-4 accent-accent" />
      {{ t('timetable.showPast') }}
    </label>

    <button type="button" class="btn btn-primary mt-auto self-start" @click="emit('close')">
      {{ t('common.done') }}
    </button>
  </div>
</template>
