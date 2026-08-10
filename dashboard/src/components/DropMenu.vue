<script setup lang="ts">
/**
 * En knapp med et panel under.
 *
 * Ingen meny-bibliotek. Kravene er at den lukker seg på Escape, lukker seg når
 * man klikker utenfor, og at knappen sier fra om panelet er åpent. Det er
 * tretti linjer.
 */

import { onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons.ts'

withDefaults(
  defineProps<{
    label: string
    icon: IconName
    align?: 'left' | 'right'
    /** Skjul teksten på små skjermer og la ikonet stå alene. */
    compact?: boolean
  }>(),
  { align: 'left', compact: false },
)

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

const onPointerDown = (event: PointerEvent) => {
  if (!root.value?.contains(event.target as Node)) open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onPointerDown)
  else document.removeEventListener('pointerdown', onPointerDown)
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))

const close = () => {
  open.value = false
  // Fokus tilbake til knappen. Uten dette havner tastaturbrukeren på toppen av
  // dokumentet etter å ha lukket panelet.
  trigger.value?.focus()
}
</script>

<template>
  <div ref="root" class="relative" @keydown.esc="close">
    <button
      ref="trigger"
      type="button"
      class="btn"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="open = !open"
    >
      <AppIcon :name="icon" :size="14" />
      <span :class="compact ? 'hidden sm:inline' : ''">{{ label }}</span>
    </button>

    <div
      v-if="open"
      class="absolute z-30 mt-1 min-w-[16rem] border border-line bg-surface"
      :class="align === 'right' ? 'right-0' : 'left-0'"
    >
      <slot :close="close" />
    </div>
  </div>
</template>
