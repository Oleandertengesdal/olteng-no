<script setup lang="ts">
import { computed } from 'vue'
import { hueFor, textClasses } from '@/data/tech'

const props = defineProps<{
  items: string[]
  /** Seconds for one full pass. Longer = calmer. */
  duration?: number
}>()

/**
 * The track is rendered twice and translated by exactly -50%, which is what
 * makes the loop seamless — at the end of the animation the second copy sits
 * precisely where the first one started.
 */
const doubled = computed(() =>
  [...props.items, ...props.items].map((label) => ({
    label,
    dot: textClasses[hueFor(label) ?? 'clay'],
  })),
)

const style = computed(() => ({ '--marquee-duration': `${props.duration ?? 48}s` }))
</script>

<template>
  <div class="marquee border-y border-line py-4" :style="style" aria-hidden="true">
    <div class="marquee-track">
      <span v-for="(item, i) in doubled" :key="`${item.label}-${i}`" class="marquee-item">
        {{ item.label }}
        <span :class="item.dot">&middot;</span>
      </span>
    </div>
  </div>
</template>
