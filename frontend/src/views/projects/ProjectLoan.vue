<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import {
  RATES,
  defaultRates,
  calculate,
  homeVersusAway,
  incomeWhereGrantIsGone,
  formatKr,
  formatPercent,
} from '@/data/lanekassen'

const { t } = useI18n()

const rates = ref(defaultRates())
const livesAtHome = ref(false)
const creditsPassed = ref(60)
const completedDegree = ref(false)
const income = ref(0)

const input = computed(() => ({
  rates: rates.value,
  livesAtHome: livesAtHome.value,
  creditsPassed: creditsPassed.value,
  completedDegree: completedDegree.value,
  income: income.value,
}))

const result = computed(() => calculate(input.value))
const homeDiff = computed(() => homeVersusAway(input.value))
const incomeCeiling = computed(() => incomeWhereGrantIsGone(input.value))

/** Andelene brukt i stolpen: stipend fra sp, stipend fra grad, resten gjeld */
const bar = computed(() => {
  const total = result.value.paidOut
  return [
    { key: 'credit', value: result.value.creditGrant, cls: 'bg-pine' },
    { key: 'degree', value: result.value.degreeGrant, cls: 'bg-iris' },
    { key: 'loan', value: result.value.remainingLoan, cls: 'bg-raised' },
  ].map((part) => ({ ...part, percent: total > 0 ? (part.value / total) * 100 : 0 }))
})
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
      <span class="block h-1 w-16 bg-ochre" aria-hidden="true" />
      <p class="eyebrow mt-6 text-positive">{{ t('live') }}</p>
      <h1 class="mt-5 font-display text-title font-medium text-ink">{{ t('loan.title') }}</h1>
      <p class="prose-column mt-6">{{ t('loan.lead') }}</p>
    </header>

    <p class="mt-8 border-l-2 border-ochre py-2 pl-5 text-[0.9375rem] leading-relaxed text-muted">
      {{ t('loan.disclaimer', { year: rates.year }) }}
    </p>

    <!-- ── Input ───────────────────────────────────────────────────────── -->
    <section class="grid gap-10 border-b border-line py-10 md:grid-cols-12">
      <div class="md:col-span-5">
        <p class="eyebrow">{{ t('loan.living') }}</p>
        <div class="mt-3 flex gap-1.5">
          <button
            v-for="option in [
              { value: false, key: 'loan.away' },
              { value: true, key: 'loan.atHome' },
            ]"
            :key="option.key"
            type="button"
            class="flex-1 rounded-sm border px-3 py-2 font-mono text-[0.75rem] tracking-wide transition-colors"
            :class="
              livesAtHome === option.value
                ? 'border-ink bg-ink text-paper'
                : 'border-line text-muted hover:border-ink hover:text-ink'
            "
            @click="livesAtHome = option.value"
          >
            {{ t(option.key) }}
          </button>
        </div>

        <label class="eyebrow mt-8 block" for="credits">{{ t('loan.credits') }}</label>
        <div class="mt-3 flex items-center gap-4">
          <input
            id="credits"
            v-model.number="creditsPassed"
            type="range"
            min="0"
            :max="rates.fullYearCredits"
            step="7.5"
            class="flex-1 accent-accent"
          />
          <span class="w-16 shrink-0 text-right font-mono text-sm text-ink">
            {{ creditsPassed }} sp
          </span>
        </div>

        <label class="mt-6 flex cursor-pointer items-center gap-2.5">
          <input v-model="completedDegree" type="checkbox" class="h-4 w-4 shrink-0 accent-accent" />
          <span class="text-[0.9375rem] text-ink">{{ t('loan.degree') }}</span>
        </label>

        <label class="eyebrow mt-8 block" for="income">{{ t('loan.income') }}</label>
        <div class="mt-3 flex items-center gap-4">
          <input
            id="income"
            v-model.number="income"
            type="range"
            min="0"
            max="500000"
            step="10000"
            class="flex-1 accent-accent"
          />
          <span class="w-24 shrink-0 text-right font-mono text-sm text-ink">
            {{ formatKr(income) }}
          </span>
        </div>
        <p class="mt-2 font-mono text-[0.688rem] text-faint">
          {{ t('loan.incomeLimit', { limit: formatKr(rates.incomeLimit) }) }}
        </p>

        <label v-if="RATES.length > 1" class="eyebrow mt-8 block" for="year">
          {{ t('loan.year') }}
        </label>
        <select
          v-if="RATES.length > 1"
          id="year"
          v-model="rates"
          class="mt-3 w-full rounded-sm border border-line bg-surface px-3 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
        >
          <option v-for="set in RATES" :key="set.year" :value="set">{{ set.year }}</option>
        </select>
      </div>

      <!-- ── Result ────────────────────────────────────────────────────── -->
      <div class="md:col-span-7">
        <p class="eyebrow">{{ t('loan.becomesGrant') }}</p>
        <p
          class="mt-3 font-display text-[clamp(2.5rem,7vw,4rem)] font-medium leading-none"
          :class="result.grant > 0 ? 'text-pine' : 'text-muted'"
        >
          {{ formatKr(result.grant) }}
          <span class="text-faint">kr</span>
        </p>
        <p class="mt-3 text-[0.9375rem] text-muted">
          {{
            t('loan.ofTotal', {
              percent: formatPercent(result.grantShare),
              total: formatKr(result.paidOut),
            })
          }}
        </p>

        <!-- Proportional bar -->
        <div class="mt-8 flex h-3 w-full overflow-hidden rounded-sm" aria-hidden="true">
          <span
            v-for="part in bar"
            :key="part.key"
            class="h-full transition-all duration-500 ease-editorial"
            :class="part.cls"
            :style="{ width: `${part.percent}%` }"
          />
        </div>

        <dl class="mt-8 grid grid-cols-2 gap-6">
          <div>
            <dt class="eyebrow flex items-center gap-2">
              <span class="h-1.5 w-1.5 shrink-0 bg-pine" aria-hidden="true" />
              {{ t('loan.creditGrant') }}
            </dt>
            <dd class="mt-2 font-mono text-lg text-ink">{{ formatKr(result.creditGrant) }}</dd>
            <dd class="font-mono text-[0.688rem] text-faint">
              {{ formatPercent(rates.creditShare) }} % ·
              {{ formatPercent(result.creditProgress) }} %
              {{ t('loan.ofCredits') }}
            </dd>
          </div>
          <div>
            <dt class="eyebrow flex items-center gap-2">
              <span class="h-1.5 w-1.5 shrink-0 bg-iris" aria-hidden="true" />
              {{ t('loan.degreeGrant') }}
            </dt>
            <dd class="mt-2 font-mono text-lg text-ink">{{ formatKr(result.degreeGrant) }}</dd>
            <dd class="font-mono text-[0.688rem] text-faint">
              {{ formatPercent(rates.degreeShare) }} %
            </dd>
          </div>
          <div>
            <dt class="eyebrow flex items-center gap-2">
              <span class="h-1.5 w-1.5 shrink-0 bg-raised" aria-hidden="true" />
              {{ t('loan.debt') }}
            </dt>
            <dd class="mt-2 font-mono text-lg text-ink">{{ formatKr(result.remainingLoan) }}</dd>
          </div>
          <div>
            <dt class="eyebrow">{{ t('loan.perMonth') }}</dt>
            <dd class="mt-2 font-mono text-lg text-ink">{{ formatKr(result.perMonth) }}</dd>
            <dd class="font-mono text-[0.688rem] text-faint">
              {{ t('loan.months', { months: rates.months }) }}
            </dd>
          </div>
        </dl>

        <p
          v-if="result.incomeCut > 0"
          class="mt-8 border-l-2 border-clay py-1 pl-4 text-[0.9375rem] leading-relaxed text-muted"
        >
          {{ t('loan.incomeCut', { amount: formatKr(result.incomeCut) }) }}
          <template v-if="incomeCeiling">
            {{ t('loan.incomeCeiling', { income: formatKr(incomeCeiling) }) }}
          </template>
        </p>
      </div>
    </section>

    <!-- ── Home vs away ────────────────────────────────────────────────── -->
    <section class="border-b border-line py-10">
      <div class="grid gap-10 md:grid-cols-12">
        <h2 class="font-display text-2xl font-medium text-ink md:col-span-4">
          {{ t('loan.homeHeading') }}
        </h2>
        <div class="md:col-span-8">
          <p class="prose-column">
            {{ t('loan.homeBody', { amount: formatKr(Math.abs(homeDiff)) }) }}
          </p>
          <p class="prose-column mt-5">{{ t('loan.homeBody2') }}</p>
        </div>
      </div>
    </section>

    <!-- ── Rules ───────────────────────────────────────────────────────── -->
    <section class="py-10">
      <div class="grid gap-10 md:grid-cols-12">
        <h2 class="font-display text-2xl font-medium text-ink md:col-span-4">
          {{ t('loan.rulesHeading') }}
        </h2>
        <div class="md:col-span-8">
          <ul>
            <li
              v-for="n in 5"
              :key="n"
              class="flex gap-5 border-t border-line py-3.5 last:border-b"
            >
              <span class="mt-0.5 font-mono text-[0.75rem] tracking-widest text-ochre">
                {{ String(n).padStart(2, '0') }}
              </span>
              <span class="text-[0.9375rem] leading-relaxed text-muted">
                {{ t(`loan.rules.r${n}`) }}
              </span>
            </li>
          </ul>

          <a
            :href="rates.source"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline mt-8"
          >
            {{ t('loan.checkSource') }}
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
