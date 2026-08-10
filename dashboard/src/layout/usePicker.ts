import { ref } from 'vue'

/**
 * Om widget-velgeren er åpen.
 *
 * Ligger utenfor komponentene fordi knappen står i toppfeltet og panelet står
 * i visningen, og de to skal være enige uten at tilstanden må sendes gjennom
 * ruteren.
 */
const pickerOpen = ref(false)

export const usePicker = () => ({
  pickerOpen,
  toggle: () => {
    pickerOpen.value = !pickerOpen.value
  },
  close: () => {
    pickerOpen.value = false
  },
})
