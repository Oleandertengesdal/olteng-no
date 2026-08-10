import type { Link } from './types.ts'
import type { Bilingual } from '../bilingual.ts'

/**
 * Nasjonale lenker.
 *
 * Disse er like for alle, uansett lærested, og ligger derfor for seg selv
 * framfor å bli kopiert inn i fjorten filer. De er også de eneste lenkene i
 * katalogen som ikke råtner særlig fort — Lånekassen har hatt samme adresse
 * lenge, og kommer til å ha den en stund til.
 */

export const NATIONAL_LABEL: Bilingual = { nb: 'Nasjonalt', en: 'National' }

export const NATIONAL_LINKS: Link[] = [
  {
    label: 'Lånekassen',
    url: 'https://lanekassen.no',
    note: {
      nb: 'Søk om lån og stipend, se utbetalingsplan, meld fra om endringer i inntekt.',
      en: 'Apply for loans and grants, see your payment plan, report changes in income.',
    },
    keywords: ['stipend', 'lån', 'støtte', 'utbetaling', 'fribeløp'],
  },
  {
    label: 'Samordna opptak',
    url: 'https://www.samordnaopptak.no',
    note: {
      nb: 'Søk på studier, se poenggrenser og svar på tilbud om studieplass.',
      en: 'Apply for programmes, see admission points, and respond to offers.',
    },
    keywords: ['opptak', 'poenggrense', 'søknad', 'studieplass'],
  },
  {
    label: 'Vitnemålsportalen',
    url: 'https://www.vitnemalsportalen.no',
    note: {
      nb: 'Hent ut og del resultatene dine digitalt. Det arbeidsgivere ber om.',
      en: 'Retrieve and share your results digitally. What employers ask for.',
    },
    keywords: ['vitnemål', 'karakterutskrift', 'resultater', 'jobbsøknad'],
  },
  {
    label: 'Skatteetaten',
    url: 'https://www.skatteetaten.no',
    note: {
      nb: 'Skattekort, skattemelding og frikort. Husk å sjekke trekket når du får jobb.',
      en: 'Tax card, tax return and exemption card. Check your deduction when you start a job.',
    },
    keywords: ['skattekort', 'frikort', 'skattemelding', 'jobb'],
  },
  {
    label: 'Altinn',
    url: 'https://www.altinn.no',
    note: {
      nb: 'Post fra det offentlige og skjemaer du må fylle ut. Sjekk den av og til.',
      en: 'Mail from public bodies and forms you have to fill in. Check it now and then.',
    },
    keywords: ['post', 'skjema', 'offentlig'],
  },
  {
    label: 'Helsenorge',
    url: 'https://www.helsenorge.no',
    note: {
      nb: 'Bytt fastlege, se resepter og journal, bestill europeisk helsetrygdkort.',
      en: 'Change your GP, see prescriptions and records, order a European health card.',
    },
    keywords: ['fastlege', 'resept', 'helsetrygdkort', 'journal'],
  },
  {
    label: 'NAV',
    url: 'https://www.nav.no',
    note: {
      nb: 'Sykepenger, bostøtte og andre ytelser. Også relevant som student, oftere enn folk tror.',
      en: 'Sick pay, housing benefit and other support. Relevant as a student more often than people think.',
    },
    keywords: ['sykepenger', 'bostøtte', 'dagpenger', 'støtte'],
  },
  {
    label: 'Samskipnadsrådet',
    url: 'https://samskipnadsradet.no',
    note: {
      nb: 'Oversikt over alle studentsamskipnadene i Norge, hvis du flytter eller bytter lærested.',
      en: 'All the Norwegian student welfare organisations, if you move or change institution.',
    },
    keywords: ['samskipnad', 'bolig', 'flytte'],
  },
  {
    label: 'Studentbolig og hybel',
    url: 'https://hybel.no',
    note: {
      nb: 'Privat leiemarked. Brukes når samskipnaden ikke har noe ledig, som er ofte i august.',
      en: 'The private rental market. Used when the welfare organisation has nothing free — often in August.',
    },
    keywords: ['bolig', 'hybel', 'leie', 'flytte'],
  },
]
