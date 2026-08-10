/**
 * Lenkesøket, og snarveien som åpner det.
 *
 * Søket er måten folk kommer til å bruke katalogen når de først har lært seg
 * den, og en snarvei man må lete etter er ingen snarvei. Derfor er den global:
 * skråstrek fra hvor som helst i appen, eller Ctrl/Cmd + K for dem som har den
 * i fingrene fra andre verktøy.
 *
 * Lytteren står på modulnivå og registreres én gang. Den holder seg unna
 * tastetrykk som havner i et tekstfelt — ellers ville man ikke kunne skrive
 * skråstrek i et søkefelt, og det er en verre feil enn ingen snarvei.
 */

import { ref } from 'vue'

const isOpen = ref(false)

const inTextField = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return

    const shortcut =
      (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) ||
      (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey))

    if (!shortcut) return
    if (inTextField(event.target)) return

    event.preventDefault()
    isOpen.value = true
  })
}

export const useLinkSearch = () => ({
  isOpen,
  open: () => {
    isOpen.value = true
  },
  close: () => {
    isOpen.value = false
  },
})
