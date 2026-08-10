<script setup lang="ts">
/**
 * Ramma rundt én widget.
 *
 * To jobber: å laste innholdet, og å ta imot feilen hvis innholdet ikke lar
 * seg laste. Den andre jobben er den viktige. En widget som ikke kan lastes
 * skal gi en rolig tilstand i sin egen rute — ikke rive med seg dashbordet.
 *
 * I redigeringsmodus er ramma i tillegg et gripepunkt. Den kan dras med
 * pekeren og flyttes med piltastene, og begge deler gjør nøyaktig det samme.
 */

import { computed, ref, shallowRef, watch, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import type { WidgetDefinition } from '@/widgets/types.ts'
import type { LayoutItem } from './grid.ts'

const props = defineProps<{
  item: LayoutItem
  definition: WidgetDefinition
  editing: boolean
  columns: number
}>()

const emit = defineEmits<{
  move: [direction: 'left' | 'right' | 'up' | 'down']
  resize: [direction: 'grow' | 'shrink']
  remove: []
  dropOn: [id: string]
}>()

const { t, locale } = useI18n()

const title = computed(() => props.definition.title[locale.value as 'nb' | 'en'])

/* ── Lasting ───────────────────────────────────────────────────────────────  */

const view = shallowRef<Component | null>(null)
const failed = ref(false)
const showSettings = ref(false)
const settingsView = shallowRef<Component | null>(null)

props.definition
  .component()
  .then((module) => {
    view.value = module.default
  })
  .catch(() => {
    // Nettet forsvant midt i en dynamisk import, eller filen ble borte i en
    // utgivelse mens fanen sto åpen. Begge deler er den ene widgetens problem.
    failed.value = true
  })

// Innstillingsskjemaet lastes først når noen åpner det, og bare én gang.
const loadSettings = () => {
  const loader = props.definition.settings
  if (!loader) return
  loader()
    .then((module) => {
      settingsView.value = module.default
    })
    .catch(() => {
      failed.value = true
    })
}

watch(showSettings, (open) => {
  if (open && !settingsView.value) loadSettings()
})

/* ── Plassering ────────────────────────────────────────────────────────────  */

const span = computed(() => ({
  gridColumn: `span ${Math.min(props.item.w, props.columns)}`,
  gridRow: `span ${props.item.h}`,
}))

/* ── Tastatur ──────────────────────────────────────────────────────────────
   Ikke et alternativ til dra-og-slipp, men den samme handlingen. Piltastene
   flytter, pluss og minus endrer størrelse, Delete fjerner. Det står i
   hjelpeteksten over rutenettet i redigeringsmodus.                          */

const onKeydown = (event: KeyboardEvent) => {
  if (!props.editing) return

  const moves: Record<string, 'left' | 'right' | 'up' | 'down'> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
  }

  const direction = moves[event.key]
  if (direction) {
    event.preventDefault()
    emit('move', direction)
    return
  }

  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    emit('resize', 'grow')
  } else if (event.key === '-') {
    event.preventDefault()
    emit('resize', 'shrink')
  } else if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    emit('remove')
  }
}

/* ── Peker ─────────────────────────────────────────────────────────────────  */

const dragOver = ref(false)

const onDragStart = (event: DragEvent) => {
  event.dataTransfer?.setData('text/plain', props.item.id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

const onDrop = (event: DragEvent) => {
  dragOver.value = false
  const id = event.dataTransfer?.getData('text/plain')
  if (id && id !== props.item.id) emit('dropOn', id)
}
</script>

<template>
  <article
    class="card relative flex min-h-0 flex-col animate-rise"
    :class="[
      editing ? 'cursor-grab' : '',
      dragOver ? 'border-accent' : '',
    ]"
    :style="span"
    :draggable="editing"
    :tabindex="editing ? 0 : -1"
    :aria-label="editing ? t('frame.editable', { title }) : undefined"
    @keydown="onKeydown"
    @dragstart="onDragStart"
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
    @drop.prevent="onDrop"
  >
    <header class="flex items-center gap-2 border-b border-line px-3 py-2">
      <AppIcon :name="definition.icon" :size="15" class="text-faint" />
      <h2 class="eyebrow truncate">{{ title }}</h2>

      <div class="ml-auto flex items-center gap-0.5">
        <button
          v-if="definition.settings && !editing"
          type="button"
          class="frame-btn"
          :aria-label="t('frame.settings', { title })"
          :aria-expanded="showSettings"
          @click="showSettings = !showSettings"
        >
          <AppIcon :name="showSettings ? 'close' : 'settings'" :size="15" />
        </button>

        <template v-if="editing">
          <button
            type="button"
            class="frame-btn"
            :aria-label="t('frame.moveLeft', { title })"
            @click="emit('move', 'left')"
          >
            <AppIcon name="chevronLeft" :size="15" />
          </button>
          <button
            type="button"
            class="frame-btn"
            :aria-label="t('frame.moveRight', { title })"
            @click="emit('move', 'right')"
          >
            <AppIcon name="chevronRight" :size="15" />
          </button>
          <button
            type="button"
            class="frame-btn"
            :aria-label="t('frame.moveUp', { title })"
            @click="emit('move', 'up')"
          >
            <AppIcon name="chevronUp" :size="15" />
          </button>
          <button
            type="button"
            class="frame-btn"
            :aria-label="t('frame.moveDown', { title })"
            @click="emit('move', 'down')"
          >
            <AppIcon name="chevronDown" :size="15" />
          </button>

          <span class="mx-1 h-4 w-px bg-line" aria-hidden="true"></span>

          <button
            v-if="definition.sizes.length > 1"
            type="button"
            class="frame-btn font-mono text-[0.8rem] leading-none"
            :aria-label="t('frame.shrink', { title })"
            @click="emit('resize', 'shrink')"
          >
            &minus;
          </button>
          <button
            v-if="definition.sizes.length > 1"
            type="button"
            class="frame-btn font-mono text-[0.8rem] leading-none"
            :aria-label="t('frame.grow', { title })"
            @click="emit('resize', 'grow')"
          >
            +
          </button>
          <button
            type="button"
            class="frame-btn hover:text-critical"
            :aria-label="t('frame.remove', { title })"
            @click="emit('remove')"
          >
            <AppIcon name="trash" :size="15" />
          </button>
        </template>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-auto">
      <!-- Feilet -->
      <div v-if="failed" class="flex h-full flex-col justify-center gap-2 p-4">
        <p class="text-sm text-ink">{{ t('frame.failed') }}</p>
        <p class="text-xs text-muted">{{ t('frame.failedNote') }}</p>
      </div>

      <!-- Innstillinger -->
      <component
        :is="settingsView"
        v-else-if="showSettings && settingsView"
        :instance-id="item.id"
        @close="showSettings = false"
      />

      <!-- Laster. Plassen er reservert på forhånd, slik at rutenettet ikke
           hopper når innholdet kommer. -->
      <div v-else-if="!view" class="flex h-full items-center px-4" aria-hidden="true">
        <span class="h-3 w-24 bg-raised"></span>
      </div>

      <!-- Innhold. En widget som mangler noe brukeren må fylle ut kan be om å
           få åpnet sitt eget innstillingsskjema — ellers måtte den tomme
           tilstanden si «trykk på tannhjulet oppe til høyre». -->
      <component
        :is="view"
        v-else
        :instance-id="item.id"
        :size="{ w: item.w, h: item.h }"
        @open-settings="showSettings = true"
      />
    </div>
  </article>
</template>

<style scoped>
.frame-btn {
  @apply flex h-6 w-6 items-center justify-center text-faint;
  @apply transition-colors duration-150 ease-editorial;
}

.frame-btn:hover {
  @apply text-ink;
}
</style>
