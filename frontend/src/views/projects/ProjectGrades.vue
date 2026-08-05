<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import {
  LETTER_GRADES,
  GRADE_POINTS,
  summarise,
  distribution,
  requiredForTarget,
  parseCourses,
  emptyCourse,
  formatAverage,
  formatCredits,
  type Course,
  type Grade,
} from '@/data/grades'

const { t, locale } = useI18n()

const STORAGE_KEY = 'olteng.grades.v1'

/* ── State ─────────────────────────────────────────────────────────────── */

const courses = ref<Course[]>([])
const includeFailed = ref(false)
const pasteOpen = ref(false)
const pasteInput = ref('')
const skippedLines = ref<string[]>([])

const targetAverage = ref(4)
const remainingCredits = ref(60)

/* Saved locally so a semester of typing survives a reload. Nothing leaves
   the browser — there is no server behind this page. */
onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) courses.value = JSON.parse(saved) as Course[]
  } catch {
    // Corrupt or blocked storage — start from an empty list rather than crash
  }
})

watch(
  courses,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Private mode or a full quota: the calculator still works, it just forgets
    }
  },
  { deep: true },
)

/* ── Derived ───────────────────────────────────────────────────────────── */

const summary = computed(() => summarise(courses.value, includeFailed.value))
const spread = computed(() => distribution(courses.value))
const maxInSpread = computed(() => Math.max(...spread.value.map((item) => item.credits), 1))

const target = computed(() =>
  requiredForTarget(summary.value, remainingCredits.value, targetAverage.value),
)

const gradeOptions: { value: Grade; label: string }[] = [
  ...LETTER_GRADES.map((grade) => ({ value: grade, label: grade })),
  { value: 'pass', label: '✓' },
  { value: 'fail', label: '✗' },
]

/* ── Actions ───────────────────────────────────────────────────────────── */

const addCourse = () => courses.value.push(emptyCourse())
const removeCourse = (id: string) => {
  courses.value = courses.value.filter((course) => course.id !== id)
}
const clearAll = () => {
  courses.value = []
  skippedLines.value = []
}

const applyPaste = () => {
  const result = parseCourses(pasteInput.value)
  courses.value = [...courses.value, ...result.courses]
  skippedLines.value = result.skipped
  if (result.courses.length > 0) {
    pasteInput.value = ''
    pasteOpen.value = false
  }
}

const gradeLabel = (grade: Grade) =>
  grade === 'pass' ? t('grades.passed') : grade === 'fail' ? t('grades.notPassed') : grade
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
      <span class="block h-1 w-16 bg-pine" aria-hidden="true" />
      <p class="eyebrow mt-6 text-positive">{{ t('live') }}</p>
      <h1 class="mt-5 font-display text-title font-medium text-ink">{{ t('grades.title') }}</h1>
      <p class="prose-column mt-6">{{ t('grades.lead') }}</p>
    </header>

    <!-- ── Summary ─────────────────────────────────────────────────────── -->
    <section class="grid gap-10 border-b border-line py-10 md:grid-cols-12">
      <div class="md:col-span-5">
        <p class="eyebrow">{{ t('grades.average') }}</p>
        <p class="mt-3 font-display text-[clamp(3rem,9vw,5rem)] font-medium leading-none text-pine">
          {{ summary.average === null ? '—' : formatAverage(summary.average) }}
          <span v-if="summary.letter" class="text-faint">{{ summary.letter }}</span>
        </p>
        <p class="mt-3 text-[0.9375rem] text-muted">
          {{
            t('grades.basedOn', {
              courses: summary.counted,
              credits: formatCredits(summary.weightedCredits),
            })
          }}
        </p>
      </div>

      <div class="md:col-span-7">
        <p class="eyebrow mb-4">{{ t('grades.spread') }}</p>
        <ul>
          <li
            v-for="item in spread"
            :key="item.grade"
            class="flex items-center gap-4 border-t border-line py-2 last:border-b"
          >
            <span class="w-4 shrink-0 font-mono text-[0.8125rem] text-ink">{{ item.grade }}</span>
            <span class="relative h-1.5 flex-1 bg-raised" aria-hidden="true">
              <span
                class="absolute inset-y-0 left-0 bg-pine transition-all duration-500 ease-editorial"
                :style="{ width: `${(item.credits / maxInSpread) * 100}%` }"
              />
            </span>
            <span class="w-16 shrink-0 text-right font-mono text-[0.75rem] text-muted">
              {{ formatCredits(item.credits) }} sp
            </span>
          </li>
        </ul>

        <label class="mt-5 flex cursor-pointer items-center gap-2.5">
          <input v-model="includeFailed" type="checkbox" class="h-4 w-4 shrink-0 accent-accent" />
          <span class="font-mono text-[0.75rem] tracking-wide text-muted">
            {{ t('grades.includeFailed') }}
          </span>
        </label>
      </div>
    </section>

    <!-- ── Courses ─────────────────────────────────────────────────────── -->
    <section class="border-b border-line py-10">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 class="font-display text-2xl font-medium text-ink">{{ t('grades.courses') }}</h2>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-outline" @click="pasteOpen = !pasteOpen">
            {{ t('grades.paste') }}
          </button>
          <button type="button" class="btn btn-solid" @click="addCourse">
            {{ t('grades.addCourse') }}
          </button>
        </div>
      </div>

      <!-- Paste import -->
      <div v-if="pasteOpen" class="mb-8 border border-line p-5">
        <label class="eyebrow block" for="paste">{{ t('grades.pasteLabel') }}</label>
        <textarea
          id="paste"
          v-model="pasteInput"
          rows="6"
          spellcheck="false"
          class="mt-3 w-full resize-y rounded-sm border border-line bg-surface p-3 font-mono text-[0.8125rem] leading-relaxed text-ink placeholder:text-faint focus:border-ink focus:outline-none"
          :placeholder="t('grades.pastePlaceholder')"
        />
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-solid" @click="applyPaste">
            {{ t('grades.pasteApply') }}
          </button>
          <p class="font-mono text-[0.688rem] leading-relaxed text-faint">
            {{ t('grades.pasteNote') }}
          </p>
        </div>
      </div>

      <p v-if="skippedLines.length" class="mb-6 font-mono text-[0.75rem] text-clay">
        {{ t('grades.skipped', { count: skippedLines.length }) }}
      </p>

      <!-- Course list -->
      <ul v-if="courses.length">
        <li
          v-for="course in courses"
          :key="course.id"
          class="grid grid-cols-12 items-center gap-3 border-t border-line py-3 last:border-b"
        >
          <input
            v-model="course.code"
            type="text"
            spellcheck="false"
            class="col-span-4 rounded-sm border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.8125rem] text-ink focus:border-ink focus:outline-none sm:col-span-2"
            :placeholder="t('grades.code')"
            :aria-label="t('grades.code')"
          />
          <input
            v-model="course.name"
            type="text"
            class="col-span-8 rounded-sm border border-line bg-surface px-2.5 py-1.5 text-[0.875rem] text-ink focus:border-ink focus:outline-none sm:col-span-5"
            :placeholder="t('grades.name')"
            :aria-label="t('grades.name')"
          />
          <div class="col-span-4 flex items-center gap-2 sm:col-span-2">
            <input
              v-model.number="course.credits"
              type="number"
              min="0"
              max="60"
              step="0.5"
              class="w-full rounded-sm border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.8125rem] text-ink focus:border-ink focus:outline-none"
              :aria-label="t('grades.credits')"
            />
            <span class="shrink-0 font-mono text-[0.688rem] text-faint">sp</span>
          </div>
          <select
            v-model="course.grade"
            class="col-span-5 rounded-sm border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.8125rem] text-ink focus:border-ink focus:outline-none sm:col-span-2"
            :aria-label="t('grades.grade')"
          >
            <option v-for="option in gradeOptions" :key="option.value" :value="option.value">
              {{ gradeLabel(option.value) }}
            </option>
          </select>
          <button
            type="button"
            class="col-span-3 text-right font-mono text-[0.688rem] uppercase tracking-widest text-faint transition-colors hover:text-clay sm:col-span-1"
            :aria-label="`${t('actions.delete')} ${course.code || course.name}`"
            @click="removeCourse(course.id)"
          >
            {{ t('actions.delete') }}
          </button>
        </li>
      </ul>

      <p v-else class="py-10 text-center font-mono text-sm text-faint">{{ t('grades.empty') }}</p>

      <button v-if="courses.length" type="button" class="btn btn-outline mt-6" @click="clearAll">
        {{ t('clearall') }}
      </button>
    </section>

    <!-- ── Target ──────────────────────────────────────────────────────── -->
    <section class="border-b border-line py-10">
      <div class="grid gap-10 md:grid-cols-12">
        <div class="md:col-span-4">
          <h2 class="font-display text-2xl font-medium text-ink">
            {{ t('grades.targetHeading') }}
          </h2>
          <p class="prose-column mt-4 text-[0.9375rem]">{{ t('grades.targetLead') }}</p>
        </div>

        <div class="md:col-span-7 md:col-start-6">
          <label class="eyebrow block" for="target">{{ t('grades.targetAverage') }}</label>
          <div class="mt-3 flex items-center gap-4">
            <input
              id="target"
              v-model.number="targetAverage"
              type="range"
              min="1"
              max="5"
              step="0.1"
              class="flex-1 accent-accent"
            />
            <span class="w-20 shrink-0 text-right font-mono text-sm text-ink">
              {{ formatAverage(targetAverage) }}
            </span>
          </div>

          <label class="eyebrow mt-6 block" for="remaining">{{ t('grades.remaining') }}</label>
          <div class="mt-3 flex items-center gap-4">
            <input
              id="remaining"
              v-model.number="remainingCredits"
              type="range"
              min="7.5"
              max="180"
              step="7.5"
              class="flex-1 accent-accent"
            />
            <span class="w-20 shrink-0 text-right font-mono text-sm text-ink">
              {{ formatCredits(remainingCredits) }} sp
            </span>
          </div>

          <div
            v-if="target"
            class="mt-8 border-l-2 py-1 pl-5"
            :class="target.achievable ? 'border-pine' : 'border-clay'"
          >
            <p v-if="target.alreadyReached" class="text-[1.0625rem] leading-relaxed text-ink">
              {{ t('grades.targetReached') }}
            </p>
            <p v-else-if="!target.achievable" class="text-[1.0625rem] leading-relaxed text-ink">
              {{ t('grades.targetImpossible', { average: formatAverage(target.requiredAverage) }) }}
            </p>
            <p v-else class="text-[1.0625rem] leading-relaxed text-ink">
              {{
                t('grades.targetRequires', {
                  average: formatAverage(target.requiredAverage),
                  letter: target.requiredLetter,
                  credits: formatCredits(remainingCredits),
                })
              }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Notes ───────────────────────────────────────────────────────── -->
    <section class="py-10">
      <div class="grid gap-10 md:grid-cols-12">
        <h2 class="font-display text-2xl font-medium text-ink md:col-span-4">
          {{ t('grades.notesHeading') }}
        </h2>
        <div class="md:col-span-8">
          <ul>
            <li
              v-for="n in 4"
              :key="n"
              class="flex gap-5 border-t border-line py-3.5 last:border-b"
            >
              <span class="mt-0.5 font-mono text-[0.75rem] tracking-widest text-pine">
                {{ String(n).padStart(2, '0') }}
              </span>
              <span class="text-[0.9375rem] leading-relaxed text-muted">
                {{ t(`grades.notes.n${n}`) }}
              </span>
            </li>
          </ul>
          <p class="mt-6 font-mono text-[0.688rem] leading-relaxed text-faint">
            {{
              t('grades.scale', {
                scale: LETTER_GRADES.map((g) => `${g}=${GRADE_POINTS[g] ?? '—'}`).join('  '),
              })
            }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
