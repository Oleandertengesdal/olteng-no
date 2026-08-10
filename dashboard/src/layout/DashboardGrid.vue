<script setup lang="ts">
/**
 * Rutenettet.
 *
 * 12 kolonner på skrivebord, 6 på nettbrett, 2 på mobil. Radhøyden er fast,
 * slik at en widget som venter på data opptar nøyaktig like mye plass som en
 * som har fått dem — rutenettet skal ikke hoppe.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLayout } from './useLayout.ts'
import { widgetById } from '@/widgets/registry.ts'
import WidgetFrame from './WidgetFrame.vue'
import type { LayoutItem, MoveDirection, ResizeDirection } from './grid.ts'

const { t, locale } = useI18n()
const { layout, editing, columns, move, resize, remove, dropOn } = useLayout()

const lang = computed(() => locale.value as 'nb' | 'en')

/**
 * Det som skjer i rutenettet, sagt med ord.
 *
 * Å flytte en widget er en visuell endring, og en visuell endring alene er
 * ingen endring for den som bruker skjermleser. Posisjonen leses opp som
 * «3 av 7», som er det tallet som faktisk betyr noe.
 */
const announcement = ref('')

const titleOf = (item: LayoutItem) => widgetById(item.widget)?.title[lang.value] ?? item.widget

const announcePosition = (item: LayoutItem) => {
  const index = layout.value.findIndex((i) => i.id === item.id)
  announcement.value = t('a11y.moved', {
    title: titleOf(item),
    position: index + 1,
    total: layout.value.length,
  })
}

const onMove = (item: LayoutItem, direction: MoveDirection) => {
  move(item.id, direction)
  announcePosition(item)
}

const onResize = (item: LayoutItem, direction: ResizeDirection) => {
  resize(item.id, direction)
  const updated = layout.value.find((i) => i.id === item.id)
  if (updated) {
    announcement.value = t('a11y.resized', {
      title: titleOf(item),
      w: updated.w,
      h: updated.h,
    })
  }
}

const onRemove = (item: LayoutItem) => {
  const title = titleOf(item)
  remove(item.id)
  announcement.value = t('a11y.removed', { title })
}
</script>

<template>
  <div>
    <!-- Hjelpetekst i redigeringsmodus. Nevner tastaturet eksplisitt, fordi et
         tastaturalternativ ingen vet om er det samme som ingen. -->
    <p
      v-if="editing"
      class="mb-4 border border-line bg-raised px-3 py-2 font-mono text-[0.7rem] leading-relaxed text-muted"
    >
      {{ t('edit.hint') }}
    </p>

    <div
      class="grid items-stretch gap-3 sm:gap-4"
      :style="{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: 'var(--row-height)',
      }"
    >
      <template v-for="item in layout" :key="item.id">
        <WidgetFrame
          v-if="widgetById(item.widget)"
          :item="item"
          :definition="widgetById(item.widget)!"
          :editing="editing"
          :columns="columns"
          @move="onMove(item, $event)"
          @resize="onResize(item, $event)"
          @remove="onRemove(item)"
          @drop-on="dropOn($event, item.id)"
        />
      </template>
    </div>

    <p aria-live="polite" class="sr-only">{{ announcement }}</p>
  </div>
</template>
