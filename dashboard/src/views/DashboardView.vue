<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import DashboardGrid from '@/layout/DashboardGrid.vue'
import PresetChooser from '@/layout/PresetChooser.vue'
import WidgetPicker from '@/layout/WidgetPicker.vue'
import { useLayout } from '@/layout/useLayout.ts'
import { usePicker } from '@/layout/usePicker.ts'

const { t } = useI18n()
const { layout, configured } = useLayout()
const { pickerOpen, close } = usePicker()
</script>

<template>
  <div class="shell py-6">
    <WidgetPicker v-if="pickerOpen" class="mb-6" @close="close" />

    <PresetChooser v-if="!configured" @open-picker="pickerOpen = true" />

    <section v-else-if="layout.length === 0" class="mx-auto max-w-xl py-16 text-center">
      <h1 class="font-display text-2xl text-ink">{{ t('empty.title') }}</h1>
      <p class="mx-auto mt-3 max-w-prose text-sm leading-relaxed text-muted">
        {{ t('empty.lead') }}
      </p>
      <button type="button" class="btn mt-6" @click="pickerOpen = true">
        <AppIcon name="plus" :size="14" />
        {{ t('empty.add') }}
      </button>
    </section>

    <DashboardGrid v-else />
  </div>
</template>
