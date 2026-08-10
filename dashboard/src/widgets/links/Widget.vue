<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import WidgetState from '@/components/WidgetState.vue'
import { useWidgetSettings } from '../useWidgetSettings.ts'
import type { WidgetProps } from '../types.ts'
import { useInstitution } from '@/links/useInstitution.ts'
import { useLinkSearch } from '@/links/useLinkSearch.ts'
import { DEFAULT_LINKS_SETTINGS, isLinksSettings, type LinksSettings } from './settings.ts'

const props = defineProps<WidgetProps>()
const emit = defineEmits<{ openSettings: [] }>()

const { t } = useI18n()
const router = useRouter()

const settings = useWidgetSettings<LinksSettings>(
  props.instanceId,
  DEFAULT_LINKS_SETTINGS,
  isLinksSettings,
)

const { entries, institution } = useInstitution()
const { open } = useLinkSearch()

/**
 * Festede lenker, i brukerens rekkefølge.
 *
 * Slås opp mot katalogen hver gang framfor å lagres som kopier. Bytter
 * lærestedet navn på et system, følger widgeten etter av seg selv — og en
 * lenke som er tatt ut av katalogen forsvinner stille, som den skal.
 */
const pinned = computed(() =>
  settings.value.pinned
    .map((url) => entries.value.find((entry) => entry.link.url === url))
    .filter((entry) => entry !== undefined),
)
</script>

<template>
  <div class="flex h-full flex-col">
    <WidgetState
      v-if="!institution"
      kind="empty"
      :title="t('linksWidget.noInstitution')"
      :message="t('linksWidget.noInstitutionNote')"
      :action-label="t('linksWidget.toCatalogue')"
      @action="router.push('/lenker')"
    />

    <WidgetState
      v-else-if="pinned.length === 0"
      kind="empty"
      :title="t('linksWidget.empty')"
      :message="t('linksWidget.emptyNote')"
      :action-label="t('linksWidget.choose')"
      @action="emit('openSettings')"
    />

    <template v-else>
      <ul role="list" class="min-h-0 flex-1 divide-y divide-line overflow-auto">
        <li v-for="entry in pinned" :key="entry.link.url">
          <a
            :href="entry.link.url"
            rel="noreferrer"
            class="group flex items-baseline gap-2 px-3 py-1.5 transition-colors duration-150 ease-editorial hover:bg-raised"
          >
            <span class="truncate text-sm text-ink transition-colors duration-150 group-hover:text-accent">
              {{ entry.link.label }}
            </span>
            <span class="ml-auto shrink-0 truncate font-mono text-[0.6rem] uppercase tracking-[0.1em] text-faint">
              {{ entry.institution ?? t('links.national') }}
            </span>
          </a>
        </li>
      </ul>

      <div class="flex shrink-0 items-center gap-3 border-t border-line px-3 py-1.5">
        <button
          type="button"
          class="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-faint transition-colors duration-150 hover:text-accent"
          @click="open()"
        >
          <AppIcon name="search" :size="13" />
          {{ t('links.search') }}
        </button>

        <RouterLink
          to="/lenker"
          class="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.08em] text-faint transition-colors duration-150 hover:text-accent"
        >
          {{ t('linksWidget.all', { count: entries.length }) }}
        </RouterLink>
      </div>
    </template>
  </div>
</template>
