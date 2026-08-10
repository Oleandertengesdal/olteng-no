/**
 * Valgt lærested.
 *
 * Dette er det første en ny bruker gjør, og deretter aldri igjen. Valget bor
 * på modulnivå fordi lenkesiden, søket og widgeten alle må se det samme — og
 * fordi et lærested som finnes i tre eksemplarer er tre læresteder som kan bli
 * uenige.
 */

import { computed, ref, watch } from 'vue'
import { KEY, read, write } from '@/data/storage.ts'
import { INSTITUTIONS, entriesFor, institutionById, isInstitutionId } from '@/data/links/index.ts'

const selectedId = ref<string | null>(
  read<string | null>(KEY.institution, null, (v): v is string | null =>
    v === null ? true : isInstitutionId(v),
  ),
)

watch(selectedId, (value) => write(KEY.institution, value))

const institution = computed(() =>
  selectedId.value ? (institutionById(selectedId.value) ?? null) : null,
)

/** Alle lenker for valgt lærested, pluss de nasjonale. */
const entries = computed(() => entriesFor(institution.value))

export const useInstitution = () => ({
  selectedId,
  institution,
  institutions: INSTITUTIONS,
  entries,
  choose: (id: string) => {
    selectedId.value = id
  },
  clear: () => {
    selectedId.value = null
  },
})
