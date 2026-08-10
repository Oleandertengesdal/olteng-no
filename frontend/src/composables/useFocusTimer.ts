import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { nextPhase, phaseMinutes, formatClock, type Phase, type TimerSettings } from '@/data/study'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LESETIMER
 *
 *  Den viktigste avgjørelsen her er at timeren ikke teller ned.
 *
 *  Den vanlige måten — `setInterval` som trekker ett sekund av gangen — går i
 *  stykker på to måter. Intervaller er ikke presise, så feilen samler seg opp
 *  over en tre kvarters økt. Og nettlesere struper eller stopper tidtakere i
 *  faner som ligger i bakgrunnen, som er nøyaktig der en lesetimer befinner seg
 *  mens du faktisk leser. Du kommer tilbake etter 45 minutter og timeren står
 *  på tolv.
 *
 *  I stedet lagres tidspunktet økta er ferdig, og gjenstående tid regnes ut fra
 *  `Date.now()` hver gang skjermen skal oppdateres. Da spiller det ingen rolle
 *  hvor mange ganger klokka faktisk fikk kjøre — svaret blir riktig uansett, og
 *  det stemmer i det sekundet du bytter tilbake til fanen.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface FocusTimerOptions {
  settings: () => TimerSettings
  /** Kalles når en fase er ferdig, før neste settes opp */
  onPhaseEnd?: (finished: Phase) => void
}

export const useFocusTimer = (options: FocusTimerOptions) => {
  const phase = ref<Phase>('focus')
  const running = ref(false)
  const completedBlocks = ref(0)
  const focusedMinutes = ref(0)
  const soundOn = ref(true)

  /** Tidspunktet den pågående fasen er ferdig, i millisekunder */
  const endsAt = ref<number | null>(null)
  /** Gjenstående tid når timeren står på pause */
  const pausedRemaining = ref<number | null>(null)

  const now = ref(Date.now())
  let ticker: ReturnType<typeof setInterval> | undefined

  const totalSeconds = computed(() => phaseMinutes(phase.value, options.settings()) * 60)

  const remainingSeconds = computed(() => {
    if (pausedRemaining.value !== null) return pausedRemaining.value
    if (endsAt.value === null) return totalSeconds.value
    return Math.max(0, (endsAt.value - now.value) / 1000)
  })

  const display = computed(() => formatClock(remainingSeconds.value))

  const progress = computed(() =>
    totalSeconds.value <= 0 ? 0 : 1 - remainingSeconds.value / totalSeconds.value,
  )

  /* ── Alarm ────────────────────────────────────────────────────────────────
     Tonen lages med Web Audio i stedet for en lydfil. Ingen nedlasting, ingen
     avhengighet, og den kan ikke feile fordi et bilde av en fil mangler.
     Nettlesere krever at lyd startes av et brukertrykk, så konteksten
     opprettes første gang man trykker start.                                */

  let audio: AudioContext | null = null

  const ensureAudio = () => {
    if (audio) return
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctor) audio = new Ctor()
  }

  const chime = (finished: Phase) => {
    if (!soundOn.value || !audio) return
    if (audio.state === 'suspended') void audio.resume()

    // To toner opp når pausen begynner, to toner ned når lesinga begynner —
    // da hører man forskjell uten å se på skjermen.
    const notes = finished === 'focus' ? [660, 880] : [880, 660]

    notes.forEach((frequency, index) => {
      const start = audio!.currentTime + index * 0.18
      const oscillator = audio!.createOscillator()
      const gain = audio!.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = frequency

      // Mykt inn og ut, ellers knepper det
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.22, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.34)

      oscillator.connect(gain).connect(audio!.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.36)
    })
  }

  /* ── Varsel ─────────────────────────────────────────────────────────────── */

  const notify = (title: string, body: string) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    try {
      new Notification(title, { body, tag: 'olteng-focus' })
    } catch {
      // Enkelte nettlesere krever en service worker for varsler. Lyden og
      // fanetittelen gjør jobben uansett.
    }
  }

  const requestNotifications = async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    return (await Notification.requestPermission()) === 'granted'
  }

  /* ── Overganger ─────────────────────────────────────────────────────────── */

  let onFinished: ((finished: Phase, next: Phase) => void) | null = null

  const setPhase = (next: Phase, autostart: boolean) => {
    phase.value = next
    pausedRemaining.value = null
    endsAt.value = autostart ? Date.now() + phaseMinutes(next, options.settings()) * 60_000 : null
    running.value = autostart
  }

  const finishPhase = () => {
    const finished = phase.value

    if (finished === 'focus') {
      completedBlocks.value += 1
      focusedMinutes.value += options.settings().focusMinutes
    }

    options.onPhaseEnd?.(finished)
    chime(finished)

    const next = nextPhase(finished, completedBlocks.value, options.settings())
    onFinished?.(finished, next)

    // Pausen starter av seg selv — man skal ikke måtte huske å trykke for å
    // få pause. Lesinga etterpå krever derimot et bevisst trykk.
    setPhase(next, next !== 'focus')
  }

  const tick = () => {
    now.value = Date.now()
    if (running.value && endsAt.value !== null && now.value >= endsAt.value) finishPhase()
  }

  const startTicking = () => {
    if (ticker) return
    // Fire ganger i sekundet er nok til at sifrene ikke hopper, og billig nok
    // til at det ikke merkes
    ticker = setInterval(tick, 250)
  }

  const stopTicking = () => {
    clearInterval(ticker)
    ticker = undefined
  }

  /* ── Kontroller ─────────────────────────────────────────────────────────── */

  const start = () => {
    ensureAudio()
    if (audio?.state === 'suspended') void audio.resume()

    const remaining = pausedRemaining.value ?? totalSeconds.value
    endsAt.value = Date.now() + remaining * 1000
    pausedRemaining.value = null
    running.value = true
    startTicking()
  }

  const pause = () => {
    if (!running.value) return
    pausedRemaining.value = remainingSeconds.value
    endsAt.value = null
    running.value = false
  }

  const toggle = () => (running.value ? pause() : start())

  /** Hopp til neste fase uten å vente ut klokka */
  const skip = () => {
    if (running.value || pausedRemaining.value !== null) finishPhase()
    else setPhase(nextPhase(phase.value, completedBlocks.value, options.settings()), false)
  }

  const reset = () => {
    running.value = false
    endsAt.value = null
    pausedRemaining.value = null
    setPhase('focus', false)
  }

  const resetDay = () => {
    completedBlocks.value = 0
    focusedMinutes.value = 0
    reset()
  }

  /* ── Fanen ───────────────────────────────────────────────────────────────
     Nedtellingen speiles i fanetittelen slik at den er synlig uten å bytte
     fane, og kommer man tilbake til fanen regnes tida ut på nytt med én gang
     i stedet for å vente på neste tikk.                                     */

  const originalTitle = typeof document !== 'undefined' ? document.title : ''

  watch([display, running, phase], () => {
    if (typeof document === 'undefined') return
    document.title = running.value
      ? `${display.value} · ${phase.value === 'focus' ? '📖' : '☕'}`
      : originalTitle
  })

  const onVisibility = () => {
    if (document.visibilityState === 'visible') tick()
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility)
  }

  onBeforeUnmount(() => {
    stopTicking()
    document.removeEventListener('visibilitychange', onVisibility)
    if (typeof document !== 'undefined') document.title = originalTitle
    void audio?.close()
  })

  // Justerer man lengden mens timeren står stille, skal tallet følge med
  watch(
    () => options.settings(),
    () => {
      if (!running.value && pausedRemaining.value === null) endsAt.value = null
    },
    { deep: true },
  )

  return {
    phase,
    running,
    completedBlocks,
    focusedMinutes,
    soundOn,
    display,
    progress,
    remainingSeconds,
    start,
    pause,
    toggle,
    skip,
    reset,
    resetDay,
    requestNotifications,
    notify,
    setOnFinished: (handler: (finished: Phase, next: Phase) => void) => {
      onFinished = handler
    },
  }
}
