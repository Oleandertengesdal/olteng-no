<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Wall clock in Trondheim, regardless of where the visitor is reading from. */
const time = ref('')
let timer: ReturnType<typeof setInterval> | undefined

const format = () =>
  new Intl.DateTimeFormat('nb-NO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Oslo',
  }).format(new Date())

onMounted(() => {
  time.value = format()
  // Minute precision — no reason to wake up every second
  timer = setInterval(() => (time.value = format()), 15_000)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <span class="tabular-nums">{{ time }}</span>
</template>
