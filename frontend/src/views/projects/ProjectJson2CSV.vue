<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()

const input = ref('')
const output = ref('')
const fileInput = ref<HTMLInputElement>()

/** Inline status instead of alert() — feedback without hijacking the page */
const status = ref<{ type: 'ok' | 'error'; message: string } | null>(null)

const setStatus = (type: 'ok' | 'error', message: string) => {
  status.value = { type, message }
  setTimeout(() => (status.value = null), 3000)
}

/** Convert an array of flat objects to CSV, quoting every field. */
function jsonToCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''

  // Union of keys across all rows — objects in the wild are rarely uniform
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]

  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`

  return [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\n')
}

/** Parse CSV into objects. Handles quoted fields containing commas and newlines. */
function csvToJSON(csv: string): Record<string, string>[] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]

    if (inQuotes) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && csv[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      field = ''
      row = []
    } else {
      field += char
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const nonEmpty = rows.filter((r) => r.some((cell) => cell.trim() !== ''))
  const headers = nonEmpty.shift()
  if (!headers) return []

  return nonEmpty.map((cells) =>
    Object.fromEntries(headers.map((header, i) => [header.trim(), (cells[i] ?? '').trim()])),
  )
}

const convertToCSV = () => {
  const raw = input.value.trim()
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    output.value = jsonToCSV(Array.isArray(parsed) ? parsed : [parsed])
    setStatus('ok', t('json2csv.convertedToCsv'))
  } catch {
    setStatus('error', t('json2csv.invalidJson'))
  }
}

const convertToJSON = () => {
  const raw = input.value.trim()
  if (!raw) return
  try {
    output.value = JSON.stringify(csvToJSON(raw), null, 2)
    setStatus('ok', t('json2csv.convertedToJson'))
  } catch {
    setStatus('error', t('json2csv.invalidCsv'))
  }
}

const clearAll = () => {
  input.value = ''
  output.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const copyToClipboard = async () => {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
    setStatus('ok', t('json2csv.copied'))
  } catch {
    setStatus('error', t('json2csv.copyFailed'))
  }
}

const downloadFile = () => {
  const content = output.value
  if (!content) return

  const isJson = content.trimStart().startsWith('[') || content.trimStart().startsWith('{')
  const blob = new Blob([content], { type: isJson ? 'application/json' : 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = isJson ? 'converted-data.json' : 'converted-data.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    input.value = (e.target?.result as string) ?? ''
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="shell py-16 md:py-24">
    <RouterLink
      to="/projects"
      class="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-faint transition-colors hover:text-accent"
    >
      <span aria-hidden="true">&larr;</span> {{ t('backToProjects') }}
    </RouterLink>

    <header class="mt-10 max-w-3xl border-b border-line pb-10">
      <p class="eyebrow text-positive">{{ t('live') }}</p>
      <h1 class="mt-5 font-display text-title font-medium text-ink">{{ t('Json2CSV') }}</h1>
      <p class="prose-column mt-6">{{ t('Json2CSVText') }}</p>
    </header>

    <div class="mt-10 grid gap-8 lg:grid-cols-2">
      <!-- Input -->
      <section>
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <label for="json2csv-input" class="eyebrow">{{ t('inputData') }}</label>
          <input
            id="json2csv-file"
            ref="fileInput"
            type="file"
            accept=".json,.csv,.txt"
            class="max-w-[15rem] font-mono text-[0.688rem] text-muted file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-line file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-[0.688rem] file:uppercase file:tracking-widest file:text-ink hover:file:border-ink"
            @change="handleFileUpload"
          />
        </div>
        <textarea
          id="json2csv-input"
          v-model="input"
          spellcheck="false"
          :placeholder="t('json2csv.inputPlaceholder')"
          class="h-80 w-full resize-y rounded-sm border border-line bg-surface p-4 font-mono text-[0.8125rem] leading-relaxed text-ink placeholder:text-faint focus:border-ink focus:outline-none"
        />
      </section>

      <!-- Output -->
      <section>
        <p class="mb-3 eyebrow">{{ t('output') }}</p>
        <textarea
          id="json2csv-output"
          v-model="output"
          readonly
          spellcheck="false"
          :placeholder="t('json2csv.outputPlaceholder')"
          class="h-80 w-full resize-y rounded-sm border border-line bg-raised p-4 font-mono text-[0.8125rem] leading-relaxed text-ink placeholder:text-faint focus:outline-none"
        />
      </section>
    </div>

    <!-- Actions -->
    <div class="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-8">
      <button type="button" class="btn btn-solid" @click="convertToCSV">
        JSON <span aria-hidden="true">&rarr;</span> CSV
      </button>
      <button type="button" class="btn btn-solid" @click="convertToJSON">
        CSV <span aria-hidden="true">&rarr;</span> JSON
      </button>

      <span class="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />

      <button type="button" class="btn btn-outline" :disabled="!output" @click="copyToClipboard">
        {{ t('copy') }}
      </button>
      <button type="button" class="btn btn-outline" :disabled="!output" @click="downloadFile">
        {{ t('download') }}
      </button>
      <button
        type="button"
        class="btn border-transparent text-muted hover:text-accent"
        @click="clearAll"
      >
        {{ t('clearall') }}
      </button>

      <p
        v-if="status"
        class="font-mono text-[0.75rem] tracking-wide"
        :class="status.type === 'ok' ? 'text-positive' : 'text-accent'"
        role="status"
        aria-live="polite"
      >
        {{ status.message }}
      </p>
    </div>

    <p class="mt-10 max-w-prose font-mono text-[0.75rem] leading-relaxed text-faint">
      {{ t('json2csv.privacyNote') }}
    </p>
  </div>
</template>
