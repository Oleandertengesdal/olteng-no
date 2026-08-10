<script setup lang="ts">
/**
 * Velg hvilke lenker som skal stå i widgeten.
 *
 * Hele katalogen listes gruppert, med en avkryssing per lenke. Rekkefølgen
 * følger den man huker av i — den første man velger står øverst, fordi det
 * som regel er den man bruker mest.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import { useInstitution } from '@/links/useInstitution.ts'
import { GROUP_IDS, GROUP_LABEL, type GroupId } from '@/data/links/types.ts'
import { searchEntries } from '@/data/links/search.ts'
import {
  DEFAULT_LINKS_SETTINGS,
  MAX_PINNED,
  isLinksSettings,
  type LinksSettings,
} from './settings.ts'

const props = defineProps<{ instanceId: string }>()
const emit = defineEmits<{ close: [] }>()

const { t, locale } = useI18n()
const lang = computed(() => locale.value as 'nb' | 'en')

const settings = useWidgetSettings<LinksSettings>(
  props.instanceId,
  DEFAULT_LINKS_SETTINGS,
  isLinksSettings,
)

const { entries, institution } = useInstitution()

const query = ref('')

const shown = computed(() =>
  query.value.trim() === '' ? entries.value : searchEntries(query.value, entries.value, lang.value),
)

const grouped = computed(() =>
  GROUP_IDS.map((group: GroupId) => ({
    group,
    label: GROUP_LABEL[group][lang.value],
    items: shown.value.filter((entry) => entry.group === group),
  })).filter((section) => section.items.length > 0),
)

const isPinned = (url: string) => settings.value.pinned.includes(url)
const full = computed(() => settings.value.pinned.length >= MAX_PINNED)

const toggle = (url: string) => {
  const pinned = settings.value.pinned
  if (pinned.includes(url)) {
    settings.value = { pinned: pinned.filter((u) => u !== url) }
  } else if (pinned.length < MAX_PINNED) {
    settings.value = { pinned: [...pinned, url] }
  }
}
</script>

<template>
  <div class="flex h-full flex-col gap-3 overflow-auto p-3">
    <p v-if="!institution" class="text-xs leading-relaxed text-muted">
      {{ t('linksWidget.noInstitutionNote') }}
    </p>

    <div class="relative flex items-center">
      <AppIcon name="search" :size="15" class="pointer-events-none absolute left-2 text-faint" />
      <input
        v-model="query"
        type="search"
        :placeholder="t('links.search')"
        :aria-label="t('links.search')"
        class="w-full border border-line bg-paper py-1.5 pl-7 pr-2 text-sm text-ink placeholder:text-faint"
      />
    </div>

    <p class="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-faint">
      {{ t('linksWidget.pinnedCount', { count: settings.pinned.length, max: MAX_PINNED }) }}
    </p>

    <div v-for="section in grouped" :key="section.group">
      <h3 class="eyebrow mb-1.5">{{ section.label }}</h3>
      <ul role="list" class="divide-y divide-line border border-line">
        <li v-for="entry in section.items" :key="entry.link.url">
          <button
            type="button"
            class="flex w-full items-start gap-2 px-2.5 py-1.5 text-left transition-colors duration-150 hover:bg-raised"
            :aria-pressed="isPinned(entry.link.url)"
            :disabled="full && !isPinned(entry.link.url)"
            @click="toggle(entry.link.url)"
          >
            <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-accent">
              <AppIcon v-if="isPinned(entry.link.url)" name="check" :size="14" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm text-ink">{{ entry.link.label }}</span>
              <span class="block truncate text-xs text-muted">{{ entry.link.note[lang] }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>

    <button type="button" class="btn btn-primary mt-auto self-start" @click="emit('close')">
      {{ t('common.done') }}
    </button>
  </div>
</template>
