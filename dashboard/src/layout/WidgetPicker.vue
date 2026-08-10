<script setup lang="ts">
/**
 * Widget-velgeren.
 *
 * Viser hele katalogen gruppert etter kategori, uten å laste en eneste widget
 * — definisjonene er ren metadata, komponentene ligger bak dynamiske importer.
 *
 * Widgets som trenger nett er merket. Det er ikke en advarsel, det er
 * informasjon: den som skal lese på et tog vet da hva som slutter å virke.
 */

import { computed, ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import { WIDGETS } from '@/widgets/registry.ts'
import { CATEGORIES, CATEGORY_LABEL, type WidgetCategory } from '@/widgets/types.ts'
import { useLayout } from './useLayout.ts'

const emit = defineEmits<{ close: [] }>()

const { t, locale } = useI18n()
const { layout, add } = useLayout()

const query = ref('')
const search = ref<HTMLInputElement | null>(null)
const justAdded = ref<string | null>(null)

const lang = computed(() => locale.value as 'nb' | 'en')

const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return WIDGETS
  return WIDGETS.filter((w) =>
    [w.title.nb, w.title.en, w.description.nb, w.description.en]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
})

const grouped = computed(() =>
  CATEGORIES.map((category: WidgetCategory) => ({
    category,
    label: CATEGORY_LABEL[category][lang.value],
    widgets: matches.value.filter((w) => w.category === category),
  })).filter((group) => group.widgets.length > 0),
)

/** Hvor mange ganger widgeten allerede står på dashbordet. */
const count = (id: string) => layout.value.filter((i) => i.widget === id).length

const onAdd = (id: string) => {
  add(id)
  justAdded.value = id
  window.setTimeout(() => {
    if (justAdded.value === id) justAdded.value = null
  }, 1600)
}

onMounted(() => nextTick(() => search.value?.focus()))
</script>

<template>
  <section
    class="card"
    role="region"
    :aria-label="t('picker.title')"
    @keydown.esc="emit('close')"
  >
    <header class="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
      <h2 class="font-display text-lg">{{ t('picker.title') }}</h2>

      <div class="relative ml-auto flex items-center">
        <AppIcon name="search" :size="15" class="pointer-events-none absolute left-2 text-faint" />
        <input
          ref="search"
          v-model="query"
          type="search"
          :placeholder="t('picker.search')"
          :aria-label="t('picker.search')"
          class="w-48 border border-line bg-paper py-1.5 pl-7 pr-2 font-mono text-xs text-ink placeholder:text-faint"
        />
      </div>

      <button type="button" class="btn" @click="emit('close')">
        <AppIcon name="close" :size="14" />
        {{ t('picker.close') }}
      </button>
    </header>

    <div class="p-4">
      <p v-if="grouped.length === 0" class="py-6 text-sm text-muted">
        {{ t('picker.noResults', { query }) }}
      </p>

      <div v-for="group in grouped" :key="group.category" class="mb-6 last:mb-0">
        <h3 class="eyebrow mb-2">{{ group.label }}</h3>

        <ul class="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="widget in group.widgets" :key="widget.id" class="bg-surface">
            <button
              type="button"
              class="group flex w-full items-start gap-3 p-3 text-left transition-colors duration-150 ease-editorial hover:bg-raised"
              @click="onAdd(widget.id)"
            >
              <AppIcon :name="widget.icon" :size="18" class="mt-0.5 text-faint" />

              <span class="min-w-0 flex-1">
                <span class="flex items-baseline gap-2">
                  <span class="text-sm font-medium text-ink">{{ widget.title[lang] }}</span>
                  <span v-if="count(widget.id) > 0" class="font-mono text-[0.65rem] text-faint">
                    &times;{{ count(widget.id) }}
                  </span>
                </span>
                <span class="mt-0.5 block text-xs leading-relaxed text-muted">
                  {{ widget.description[lang] }}
                </span>
                <span
                  v-if="widget.needsNetwork"
                  class="mt-1.5 inline-flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint"
                >
                  <AppIcon name="offline" :size="12" />
                  {{ t('picker.needsNetwork') }}
                </span>
              </span>

              <span
                class="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.1em]"
                :class="justAdded === widget.id ? 'text-positive' : 'text-faint'"
              >
                {{ justAdded === widget.id ? t('picker.added') : t('picker.add') }}
              </span>
            </button>
          </li>
        </ul>
      </div>

      <!-- Ærlig om hvor langt prosjektet er kommet. Katalogen i beskrivelsen
           har rundt førti widgets; det står ingen steder at de finnes ennå. -->
      <p class="mt-6 border-t border-line pt-3 text-xs text-muted">
        {{ t('picker.progress', { count: WIDGETS.length }) }}
      </p>
    </div>
  </section>
</template>
