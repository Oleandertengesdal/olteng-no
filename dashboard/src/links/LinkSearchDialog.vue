<script setup lang="ts">
/**
 * Søk over alle lenker.
 *
 * Tastaturet er hovedbetjeningen, ikke et alternativ: piltaster velger, Enter
 * åpner, Escape lukker. Musa virker også, men den som bruker dette tjue ganger
 * om dagen kommer aldri til å flytte hånden dit.
 */

import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import { useInstitution } from './useInstitution.ts'
import { useLinkSearch } from './useLinkSearch.ts'
import { searchEntries } from '@/data/links/search.ts'
import { GROUP_LABEL } from '@/data/links/types.ts'

const { t, locale } = useI18n()
const lang = computed(() => locale.value as 'nb' | 'en')

const { isOpen, close } = useLinkSearch()
const { entries, institution } = useInstitution()

const query = ref('')
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
const list = ref<HTMLUListElement | null>(null)

const results = computed(() =>
  query.value.trim() === '' ? [] : searchEntries(query.value, entries.value, lang.value).slice(0, 12),
)

watch(isOpen, async (open) => {
  if (!open) return
  query.value = ''
  active.value = 0
  await nextTick()
  input.value?.focus()
})

watch(results, () => {
  active.value = 0
})

/** Holder den valgte raden synlig når man går nedover med piltast. */
const scrollActiveIntoView = async () => {
  await nextTick()
  list.value?.children[active.value]?.scrollIntoView({ block: 'nearest' })
}

const move = (delta: number) => {
  if (results.value.length === 0) return
  active.value = (active.value + delta + results.value.length) % results.value.length
  void scrollActiveIntoView()
}

const openActive = () => {
  const entry = results.value[active.value]
  if (!entry) return
  window.location.href = entry.link.url
  close()
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-start justify-center bg-ink/25 px-4 pt-[10vh]"
    @click.self="close"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="t('links.search')"
      class="w-full max-w-xl border border-line bg-surface"
      @keydown.esc.prevent="close"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="openActive"
    >
      <div class="flex items-center gap-2 border-b border-line px-3">
        <AppIcon name="search" :size="16" class="shrink-0 text-faint" />
        <input
          ref="input"
          v-model="query"
          type="text"
          autocomplete="off"
          :placeholder="t('links.searchPlaceholder')"
          :aria-label="t('links.search')"
          class="w-full bg-transparent py-3 text-sm text-ink placeholder:text-faint focus:outline-none"
        />
        <button
          type="button"
          class="shrink-0 text-faint transition-colors duration-150 hover:text-ink"
          :aria-label="t('common.close')"
          @click="close"
        >
          <AppIcon name="close" :size="16" />
        </button>
      </div>

      <p v-if="query.trim() === ''" class="px-3 py-6 text-xs leading-relaxed text-muted">
        {{
          institution
            ? t('links.searchHint', { name: institution.shortName })
            : t('links.searchHintNoInstitution')
        }}
      </p>

      <p v-else-if="results.length === 0" class="px-3 py-6 text-xs leading-relaxed text-muted">
        {{ t('links.noResults', { query }) }}
      </p>

      <ul v-else ref="list" role="listbox" class="max-h-[50vh] divide-y divide-line overflow-auto">
        <li
          v-for="(entry, index) in results"
          :key="`${entry.link.url}-${index}`"
          role="option"
          :aria-selected="index === active"
        >
          <a
            :href="entry.link.url"
            rel="noreferrer"
            class="block px-3 py-2"
            :class="index === active ? 'bg-raised' : ''"
            @mouseenter="active = index"
            @click="close"
          >
            <span class="flex items-baseline gap-2">
              <span class="text-sm" :class="index === active ? 'text-accent' : 'text-ink'">
                {{ entry.link.label }}
              </span>
              <span class="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-faint">
                {{ entry.institution ?? t('links.national') }}
                &middot;
                {{ GROUP_LABEL[entry.group][lang] }}
              </span>
            </span>
            <span class="mt-0.5 block truncate text-xs text-muted">{{ entry.link.note[lang] }}</span>
          </a>
        </li>
      </ul>

      <p class="flex flex-wrap gap-x-4 border-t border-line px-3 py-1.5 font-mono text-[0.65rem] text-faint">
        <span>{{ t('links.keyMove') }}</span>
        <span>{{ t('links.keyOpen') }}</span>
        <span>{{ t('links.keyClose') }}</span>
      </p>
    </div>
  </div>
</template>
