<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ghostClasses, hueAt, type Hue } from '@/data/tech'

const props = defineProps<{
  /** Small monospaced kicker above the title */
  eyebrow?: string
  /** Oversized ghost numeral behind the title. Usually the same as eyebrow. */
  ghost?: string
  /** Tint for the ghost numeral. Defaults to cycling by the numeral itself. */
  hue?: Hue
  title: string
  /** Optional right-hand link */
  actionLabel?: string
  actionTo?: string
}>()

const ghostTint = computed(() => {
  const fallback = hueAt(Math.max(0, Number(props.ghost ?? 1) - 1))
  return ghostClasses[props.hue ?? fallback]
})
</script>

<template>
  <div class="relative mb-10 border-t border-line pt-6">
    <span v-if="ghost" class="ghost-number" :class="ghostTint" aria-hidden="true">{{ ghost }}</span>

    <div class="relative flex flex-wrap items-baseline justify-between gap-4">
      <div>
        <p v-if="eyebrow" class="eyebrow mb-3">{{ eyebrow }}</p>
        <h2 class="font-display text-title font-medium text-ink">{{ title }}</h2>
      </div>

      <RouterLink
        v-if="actionLabel && actionTo"
        :to="actionTo"
        class="group/action font-mono text-[0.75rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent"
      >
        {{ actionLabel }}
        <span
          aria-hidden="true"
          class="inline-block transition-transform duration-300 group-hover/action:translate-x-1"
        >
          &rarr;
        </span>
      </RouterLink>
    </div>
  </div>
</template>
