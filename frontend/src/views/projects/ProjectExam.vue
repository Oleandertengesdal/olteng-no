<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useFocusTimer } from '@/composables/useFocusTimer'
import { hueAt, bgClasses, textClasses } from '@/data/tech'
import {
  buildPlan,
  totalBlocksPerExam,
  daysBetween,
  toIsoDate,
  formatClock,
  formatFocusTotal,
  DEFAULT_TIMER,
  type Exam,
  type TimerSettings,
} from '@/data/study'

const { t } = useI18n()

const STORAGE_KEY = 'olteng.exams.v1'

/* ── Exams ─────────────────────────────────────────────────────────────── */

const exams = ref<Exam[]>([])
const blocksPerDay = ref(4)
const settings = ref<TimerSettings>({ ...DEFAULT_TIMER })

let counter = 0
const addExam = () => {
  exams.value.push({
    id: `exam-${Date.now()}-${counter++}`,
    subject: '',
    date: '',
    credits: 7.5,
  })
}

const removeExam = (id: string) => {
  exams.value = exams.value.filter((exam) => exam.id !== id)
}

/* Everything is stored locally — this page has no server behind it. */
onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    const parsed = JSON.parse(saved) as {
      exams?: Exam[]
      blocksPerDay?: number
      settings?: TimerSettings
    }
    exams.value = parsed.exams ?? []
    blocksPerDay.value = parsed.blocksPerDay ?? 4
    settings.value = { ...DEFAULT_TIMER, ...parsed.settings }
  } catch {
    // Corrupt or blocked storage — start clean rather than crash
  }
})

watch(
  [exams, blocksPerDay, settings],
  () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          exams: exams.value,
          blocksPerDay: blocksPerDay.value,
          settings: settings.value,
        }),
      )
    } catch {
      // Private mode: the planner still works, it just forgets
    }
  },
  { deep: true },
)

/* ── Plan ──────────────────────────────────────────────────────────────── */

const today = toIsoDate(new Date())
const validExams = computed(() => exams.value.filter((exam) => exam.subject && exam.date))

const plan = computed(() => buildPlan(validExams.value, blocksPerDay.value, today))
const totals = computed(() => totalBlocksPerExam(plan.value))

const todayPlan = computed(() => plan.value[0] ?? null)
const upcomingDays = computed(() => plan.value.slice(0, 14))

const hueForExam = (id: string) => hueAt(validExams.value.findIndex((exam) => exam.id === id))

const daysLeft = (date: string) => daysBetween(today, date)

const maxBlocksInDay = computed(() =>
  Math.max(
    1,
    ...upcomingDays.value.map((day) => day.allocation.reduce((sum, item) => sum + item.blocks, 0)),
  ),
)

/* ── Timer ─────────────────────────────────────────────────────────────── */

/** Which subject the current block is for — picked from today's plan */
const activeSubject = ref<string | null>(null)
const doneToday = ref(0)

const timer = useFocusTimer({
  settings: () => settings.value,
  onPhaseEnd: (finished) => {
    if (finished === 'focus') doneToday.value += 1
  },
})

timer.setOnFinished((finished, next) => {
  timer.notify(
    finished === 'focus' ? t('exam.notifyBreakTitle') : t('exam.notifyFocusTitle'),
    finished === 'focus'
      ? t('exam.notifyBreakBody', {
          minutes:
            next === 'longBreak' ? settings.value.longBreakMinutes : settings.value.breakMinutes,
        })
      : t('exam.notifyFocusBody', { minutes: settings.value.focusMinutes }),
  )
})

const startWith = async (subject: string) => {
  activeSubject.value = subject
  await timer.requestNotifications()
  timer.start()
}

const plannedToday = computed(
  () => todayPlan.value?.allocation.reduce((sum, item) => sum + item.blocks, 0) ?? 0,
)

const phaseLabel = computed(() =>
  timer.phase.value === 'focus'
    ? t('exam.phaseFocus')
    : timer.phase.value === 'break'
      ? t('exam.phaseBreak')
      : t('exam.phaseLongBreak'),
)

/* Ring geometry for the countdown dial */
const RADIUS = 86
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const dashOffset = computed(() => CIRCUMFERENCE * (1 - timer.progress.value))
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
      <span class="block h-1 w-16 bg-clay" aria-hidden="true" />
      <p class="eyebrow mt-6 text-positive">{{ t('live') }}</p>
      <h1 class="mt-5 font-display text-title font-medium text-ink">{{ t('exam.title') }}</h1>
      <p class="prose-column mt-6">{{ t('exam.lead') }}</p>
    </header>

    <!-- ── Timer ───────────────────────────────────────────────────────── -->
    <section class="grid items-center gap-10 border-b border-line py-10 md:grid-cols-12">
      <div class="md:col-span-5 md:justify-self-center">
        <svg
          viewBox="0 0 200 200"
          class="mx-auto w-full max-w-[15rem]"
          role="img"
          :aria-label="t('exam.dialAria', { time: timer.display.value, phase: phaseLabel })"
        >
          <circle cx="100" cy="100" :r="RADIUS" fill="none" class="stroke-line" stroke-width="6" />
          <circle
            cx="100"
            cy="100"
            :r="RADIUS"
            fill="none"
            :class="timer.phase.value === 'focus' ? 'stroke-clay' : 'stroke-pine'"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 100 100)"
            style="transition: stroke-dashoffset 0.3s linear"
          />
          <text
            x="100"
            y="98"
            text-anchor="middle"
            class="fill-ink font-mono"
            style="font-size: 34px"
          >
            {{ timer.display.value }}
          </text>
          <text
            x="100"
            y="122"
            text-anchor="middle"
            class="fill-faint font-mono"
            style="font-size: 11px; letter-spacing: 2px"
          >
            {{ phaseLabel.toUpperCase() }}
          </text>
        </svg>
      </div>

      <div class="md:col-span-6 md:col-start-7">
        <p v-if="activeSubject" class="eyebrow">
          {{ t('exam.working', { subject: activeSubject }) }}
        </p>
        <p v-else class="eyebrow">{{ t('exam.timerHeading') }}</p>

        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="btn btn-solid" @click="timer.toggle()">
            {{ timer.running.value ? t('exam.pause') : t('exam.start') }}
          </button>
          <button type="button" class="btn btn-outline" @click="timer.skip()">
            {{ t('exam.skip') }}
          </button>
          <button type="button" class="btn btn-outline" @click="timer.reset()">
            {{ t('exam.reset') }}
          </button>
          <button
            type="button"
            class="btn btn-outline"
            :aria-pressed="timer.soundOn.value"
            @click="timer.soundOn.value = !timer.soundOn.value"
          >
            {{ timer.soundOn.value ? t('exam.soundOn') : t('exam.soundOff') }}
          </button>
        </div>

        <dl class="mt-8 grid grid-cols-3 gap-6">
          <div>
            <dt class="eyebrow">{{ t('exam.blocksToday') }}</dt>
            <dd class="mt-2 font-mono text-lg text-ink">
              {{ doneToday }}<span v-if="plannedToday" class="text-faint">/{{ plannedToday }}</span>
            </dd>
          </div>
          <div>
            <dt class="eyebrow">{{ t('exam.focusedToday') }}</dt>
            <dd class="mt-2 font-mono text-lg text-ink">
              {{ formatFocusTotal(timer.focusedMinutes.value) }}
            </dd>
          </div>
          <div>
            <dt class="eyebrow">{{ t('exam.nextLongBreak') }}</dt>
            <dd class="mt-2 font-mono text-lg text-ink">
              {{
                settings.blocksBeforeLongBreak -
                (timer.completedBlocks.value % settings.blocksBeforeLongBreak)
              }}
            </dd>
          </div>
        </dl>

        <!-- Lengths -->
        <div class="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-4">
          <label
            v-for="field in [
              { key: 'focusMinutes', label: 'exam.focusLength', min: 10, max: 90 },
              { key: 'breakMinutes', label: 'exam.breakLength', min: 3, max: 30 },
              { key: 'longBreakMinutes', label: 'exam.longBreakLength', min: 10, max: 60 },
              { key: 'blocksBeforeLongBreak', label: 'exam.beforeLong', min: 2, max: 8 },
            ]"
            :key="field.key"
            class="block"
          >
            <span class="eyebrow">{{ t(field.label) }}</span>
            <input
              v-model.number="settings[field.key as keyof TimerSettings]"
              type="number"
              :min="field.min"
              :max="field.max"
              class="mt-2 w-full rounded-sm border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.8125rem] text-ink focus:border-ink focus:outline-none"
            />
          </label>
        </div>

        <p class="mt-4 font-mono text-[0.688rem] leading-relaxed text-faint">
          {{ t('exam.lengthNote') }}
        </p>
      </div>
    </section>

    <!-- ── Today ───────────────────────────────────────────────────────── -->
    <section v-if="todayPlan && todayPlan.allocation.length" class="border-b border-line py-10">
      <h2 class="font-display text-2xl font-medium text-ink">{{ t('exam.todayHeading') }}</h2>
      <p class="prose-column mt-3 text-[0.9375rem]">{{ t('exam.todayLead') }}</p>

      <ul class="mt-6">
        <li
          v-for="item in todayPlan.allocation"
          :key="item.examId"
          class="flex flex-wrap items-center gap-4 border-t border-line py-4 last:border-b"
        >
          <span
            class="h-2 w-2 shrink-0"
            :class="bgClasses[hueForExam(item.examId)]"
            aria-hidden="true"
          />
          <span class="flex-1 font-display text-xl font-medium text-ink">{{ item.subject }}</span>
          <span class="font-mono text-[0.8125rem] text-muted">
            {{ t('exam.blocks', { count: item.blocks }) }}
          </span>
          <button type="button" class="btn btn-outline shrink-0" @click="startWith(item.subject)">
            {{ t('exam.startThis') }}
          </button>
        </li>
      </ul>
    </section>

    <!-- ── Exams ───────────────────────────────────────────────────────── -->
    <section class="border-b border-line py-10">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 class="font-display text-2xl font-medium text-ink">{{ t('exam.examsHeading') }}</h2>
        <button type="button" class="btn btn-solid" @click="addExam">
          {{ t('exam.addExam') }}
        </button>
      </div>

      <ul v-if="exams.length">
        <li
          v-for="exam in exams"
          :key="exam.id"
          class="grid grid-cols-12 items-center gap-3 border-t border-line py-3 last:border-b"
        >
          <input
            v-model="exam.subject"
            type="text"
            class="col-span-12 rounded-sm border border-line bg-surface px-2.5 py-1.5 text-[0.875rem] text-ink focus:border-ink focus:outline-none sm:col-span-4"
            :placeholder="t('exam.subject')"
            :aria-label="t('exam.subject')"
          />
          <input
            v-model="exam.date"
            type="date"
            class="col-span-6 rounded-sm border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.8125rem] text-ink focus:border-ink focus:outline-none sm:col-span-3"
            :aria-label="t('exam.date')"
          />
          <div class="col-span-4 flex items-center gap-2 sm:col-span-2">
            <input
              v-model.number="exam.credits"
              type="number"
              min="0"
              max="60"
              step="0.5"
              class="w-full rounded-sm border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.8125rem] text-ink focus:border-ink focus:outline-none"
              :aria-label="t('exam.credits')"
            />
            <span class="shrink-0 font-mono text-[0.688rem] text-faint">sp</span>
          </div>
          <span
            class="col-span-6 font-mono text-[0.75rem] sm:col-span-2"
            :class="exam.date && daysLeft(exam.date) < 0 ? 'text-faint' : 'text-muted'"
          >
            <template v-if="exam.date">
              {{
                daysLeft(exam.date) < 0
                  ? t('exam.past')
                  : t('exam.daysLeft', { days: daysLeft(exam.date) })
              }}
            </template>
          </span>
          <button
            type="button"
            class="col-span-6 text-right font-mono text-[0.688rem] uppercase tracking-widest text-faint transition-colors hover:text-clay sm:col-span-1"
            :aria-label="`${t('actions.delete')} ${exam.subject}`"
            @click="removeExam(exam.id)"
          >
            {{ t('actions.delete') }}
          </button>
        </li>
      </ul>

      <p v-else class="py-10 text-center font-mono text-sm text-faint">{{ t('exam.empty') }}</p>

      <div class="mt-8 flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <label class="eyebrow" for="perday">{{ t('exam.blocksPerDay') }}</label>
        <input
          id="perday"
          v-model.number="blocksPerDay"
          type="range"
          min="1"
          max="10"
          class="max-w-xs flex-1 accent-accent"
        />
        <span class="font-mono text-sm text-ink">{{ blocksPerDay }}</span>
        <span class="font-mono text-[0.688rem] text-faint">
          {{
            t('exam.perDayHours', {
              hours: ((blocksPerDay * settings.focusMinutes) / 60).toFixed(1),
            })
          }}
        </span>
      </div>
    </section>

    <!-- ── Two weeks ahead ─────────────────────────────────────────────── -->
    <section v-if="upcomingDays.length" class="border-b border-line py-10">
      <h2 class="font-display text-2xl font-medium text-ink">{{ t('exam.aheadHeading') }}</h2>
      <p class="prose-column mt-3 text-[0.9375rem]">{{ t('exam.aheadLead') }}</p>

      <ul class="mt-6">
        <li
          v-for="day in upcomingDays"
          :key="day.date"
          class="flex items-center gap-4 border-t border-line py-2.5 last:border-b"
        >
          <span class="w-24 shrink-0 font-mono text-[0.75rem] text-muted">
            {{ day.offset === 0 ? t('exam.todayShort') : day.date.slice(5) }}
          </span>

          <span class="flex h-3 flex-1 overflow-hidden rounded-sm bg-raised" aria-hidden="true">
            <span
              v-for="item in day.allocation"
              :key="item.examId"
              class="h-full"
              :class="bgClasses[hueForExam(item.examId)]"
              :style="{ width: `${(item.blocks / maxBlocksInDay) * 100}%` }"
            />
          </span>

          <span
            v-if="day.examsToday.length"
            class="shrink-0 font-mono text-[0.688rem] uppercase tracking-widest text-clay"
          >
            {{ day.examsToday.map((exam) => exam.subject).join(', ') }}
          </span>
        </li>
      </ul>

      <ul class="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        <li
          v-for="exam in validExams"
          :key="exam.id"
          class="flex items-center gap-2 font-mono text-[0.688rem] text-muted"
        >
          <span
            class="h-1.5 w-1.5 shrink-0"
            :class="bgClasses[hueForExam(exam.id)]"
            aria-hidden="true"
          />
          <span :class="textClasses[hueForExam(exam.id)]">{{ exam.subject }}</span>
          <span class="text-faint">{{ t('exam.blocks', { count: totals[exam.id] ?? 0 }) }}</span>
        </li>
      </ul>
    </section>

    <!-- ── How it works ────────────────────────────────────────────────── -->
    <section class="py-10">
      <div class="grid gap-10 md:grid-cols-12">
        <h2 class="font-display text-2xl font-medium text-ink md:col-span-4">
          {{ t('exam.howHeading') }}
        </h2>
        <div class="md:col-span-8">
          <ul>
            <li
              v-for="n in 4"
              :key="n"
              class="flex gap-5 border-t border-line py-3.5 last:border-b"
            >
              <span class="mt-0.5 font-mono text-[0.75rem] tracking-widest text-clay">
                {{ String(n).padStart(2, '0') }}
              </span>
              <span class="text-[0.9375rem] leading-relaxed text-muted">{{
                t(`exam.how.h${n}`)
              }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
