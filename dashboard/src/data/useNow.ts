/**
 * Klokka, som noe komponenter kan reagere på.
 *
 * Alt som viser «om 4 min» eller «3 dager igjen» må tegnes på nytt av og til,
 * ellers står det samme tallet der til noe annet tilfeldigvis oppdaterer
 * komponenten.
 *
 * Tiden leses hver gang fra `Date.now()` og telles aldri opp. Det er samme
 * grunn som i klokke-widgeten: nettlesere struper tidtakere i bakgrunnsfaner,
 * og en teller som mister tikk mister dem for godt, mens en avlesning bare
 * kommer litt for sent.
 */

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export const useNow = (intervalMs = 30_000): Ref<number> => {
  const now = ref(Date.now())
  let timer = 0

  const sync = () => {
    now.value = Date.now()
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible') sync()
  }

  onMounted(() => {
    timer = window.setInterval(sync, intervalMs)
    document.addEventListener('visibilitychange', onVisibility)
  })

  onBeforeUnmount(() => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibility)
  })

  return now
}
