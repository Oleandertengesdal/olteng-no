<script setup lang="ts">
import { computed } from 'vue'
import { hueFor, chipClasses, chipHoverClasses } from '@/data/tech'

const props = defineProps<{
  label: string
  /** Set false inside lists that are not wrapped in a `group` element */
  interactive?: boolean
}>()

const hue = computed(() => hueFor(props.label) ?? 'neutral')

const classes = computed(() => [
  chipClasses[hue.value],
  props.interactive === false ? '' : chipHoverClasses[hue.value],
])
</script>

<template>
  <span
    class="inline-flex items-center rounded-sm border px-2.5 py-1 font-mono text-[0.688rem] tracking-wide transition-colors duration-300"
    :class="classes"
  >
    {{ label }}
  </span>
</template>
