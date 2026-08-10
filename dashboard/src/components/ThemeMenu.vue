<script setup lang="ts">
/**
 * Fargemodusvelgeren.
 *
 * «Følg systemet» står øverst og er et eget valg, ikke en sjette modus. Velger
 * man Papir eksplisitt, skal siden bli værende lys når mobilen slår om til
 * mørk modus klokka ti om kvelden.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DropMenu from './DropMenu.vue'
import AppIcon from './AppIcon.vue'
import { useTheme } from '@/design/useTheme.ts'
import { THEMES } from '@/design/themes.ts'

const { t, locale } = useI18n()
const { choice, active, setTheme, systemResolvesTo } = useTheme()

const lang = computed(() => locale.value as 'nb' | 'en')

const label = computed(() =>
  choice.value === 'system'
    ? t('theme.follow')
    : (THEMES.find((th) => th.id === active.value)?.name[lang.value] ?? ''),
)
</script>

<template>
  <DropMenu :label="label" icon="theme" align="right" compact>
    <template #default="{ close }">
      <ul role="list" class="divide-y divide-line">
        <li>
          <button
            type="button"
            class="menu-item"
            :aria-current="choice === 'system'"
            @click="setTheme('system')"
          >
            <span class="menu-check">
              <AppIcon v-if="choice === 'system'" name="check" :size="14" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm text-ink">{{ t('theme.follow') }}</span>
              <span class="block text-xs text-muted">
                {{
                  t('theme.followNote', {
                    theme: THEMES.find((th) => th.id === systemResolvesTo)?.name[lang],
                  })
                }}
              </span>
            </span>
          </button>
        </li>

        <li v-for="theme in THEMES" :key="theme.id">
          <button
            type="button"
            class="menu-item"
            :aria-current="choice === theme.id"
            @click="setTheme(theme.id)"
          >
            <span class="menu-check">
              <AppIcon v-if="choice === theme.id" name="check" :size="14" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm text-ink">{{ theme.name[lang] }}</span>
              <span class="block text-xs leading-relaxed text-muted">{{ theme.note[lang] }}</span>
            </span>
          </button>
        </li>
      </ul>

      <p class="border-t border-line px-3 py-2 text-[0.7rem] leading-relaxed text-faint">
        {{ t('theme.measured') }}
      </p>

      <div class="sr-only" aria-live="polite">{{ label }}</div>
      <button type="button" class="sr-only" @click="close">{{ t('common.close') }}</button>
    </template>
  </DropMenu>
</template>

<style scoped>
.menu-item {
  @apply flex w-full items-start gap-2 px-3 py-2 text-left;
  @apply transition-colors duration-150 ease-editorial hover:bg-raised;
}

.menu-check {
  @apply flex h-4 w-4 shrink-0 items-center justify-center pt-0.5 text-accent;
}
</style>
