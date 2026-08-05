import type { Directive } from 'vue'

/**
 * v-reveal — fades an element up the first time it scrolls into view.
 *
 * Pass a number to stagger siblings: `v-reveal="2"` waits two beats longer
 * than `v-reveal="0"`. The animation itself lives in assets/main.css, keyed
 * off the `data-reveal` attribute, so nothing here touches inline styles
 * beyond the delay variable.
 *
 * Anyone who has asked their system to reduce motion never gets the pending
 * state, so the content is simply visible from the start.
 */

const observers = new WeakMap<HTMLElement, IntersectionObserver>()

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return

    const beat = 70
    el.dataset.reveal = 'pending'
    el.style.setProperty('--reveal-delay', `${(binding.value ?? 0) * beat}ms`)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          el.dataset.reveal = 'visible'
          observer.unobserve(el)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.06 },
    )

    observer.observe(el)
    observers.set(el, observer)
  },

  unmounted(el) {
    observers.get(el)?.disconnect()
    observers.delete(el)
  },
}
