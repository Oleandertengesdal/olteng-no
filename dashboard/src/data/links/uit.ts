import type { Institution } from './types.ts'

/**
 * UiT — Norges arktiske universitet.
 *
 * Merk eksamenssystemet: UiT bruker WISEflow, ikke Inspera. Det er den
 * vanligste feilantakelsen om UiT i en slik katalog, og den slags feil er
 * verre enn en manglende lenke — den sender folk til feil sted den dagen de
 * har det travelt.
 */
const uit: Institution = {
  id: 'uit',
  name: 'UiT Norges arktiske universitet',
  shortName: 'UiT',
  city: ['Tromsø', 'Alta', 'Narvik', 'Harstad'],
  reviewed: '2026-08-09',
  groups: [
    {
      id: 'studies',
      links: [
        {
          label: 'Studentportalen',
          url: 'https://uit.no/utdanning/studentportal',
          note: {
            nb: 'UiTs samleside for studenter. Frister, regler, eksamen og praktisk hjelp.',
            en: "UiT's hub for students. Deadlines, rules, exams and practical help.",
          },
          keywords: ['portal', 'min side', 'oversikt'],
        },
        {
          label: 'Canvas',
          url: 'https://uit.instructure.com',
          note: {
            nb: 'Læringsplattformen. Emnesider, pensum, innleveringer og beskjeder fra faglærer.',
            en: 'The learning platform. Course pages, reading, submissions and messages from teachers.',
          },
          keywords: ['lms', 'læringsplattform', 'innlevering'],
        },
        {
          label: 'Studentweb',
          url: 'https://fsweb.no/studentweb/login.jsf?inst=FSUIT',
          note: {
            nb: 'Semesterregistrering, semesteravgift, oppmelding til emner og eksamen, og karakterer.',
            en: 'Semester registration, the fee, signing up for courses and exams, and grades.',
          },
          keywords: ['semesterregistrering', 'karakterer', 'oppmelding'],
        },
        {
          label: 'WISEflow',
          url: 'https://europe.wiseflow.net',
          note: {
            nb: 'Eksamenssystemet ved UiT. Ikke Inspera — her leverer du hjemmeeksamen og tar skoleeksamen.',
            en: 'The exam system at UiT. Not Inspera — hand in take-home exams and sit written exams here.',
          },
          keywords: ['eksamen', 'digital eksamen', 'innlevering', 'inspera'],
        },
        {
          label: 'Timeplan',
          url: 'https://timeplan.uit.no',
          note: {
            nb: 'Timeplanen for emnene dine. Kan eksporteres til kalenderen din.',
            en: 'The timetable for your courses. Can be exported to your own calendar.',
          },
          keywords: ['forelesning', 'undervisning', 'tp', 'ics'],
        },
        {
          label: 'Studier og emner',
          url: 'https://uit.no/utdanning/program',
          note: {
            nb: 'Alle studieprogram og emner med oppbygging, pensum og opptakskrav.',
            en: 'Every programme and course with structure, reading and entry requirements.',
          },
          keywords: ['fag', 'emne', 'studieprogram'],
        },
      ],
    },
    {
      id: 'practical',
      links: [
        {
          label: 'Orakelet',
          url: 'https://uit.no/om/orakelet',
          note: {
            nb: 'UiTs IT-brukerstøtte. Wifi, VPN, passord, Canvas og alt annet teknisk.',
            en: "UiT's IT support. Wifi, VPN, passwords, Canvas and everything else technical.",
          },
          keywords: ['it', 'support', 'wifi', 'eduroam', 'vpn', 'passord', 'brukerstøtte'],
        },
        {
          label: 'Sjekkliste for nye studenter',
          url: 'https://uit.no/utdanning/sjekkliste',
          note: {
            nb: 'Alt som må gjøres før studiestart, i rekkefølge.',
            en: 'Everything to do before term starts, in order.',
          },
          keywords: ['ny student', 'oppstart', 'fadder', 'semesteravgift'],
        },
        {
          label: 'Eksamen',
          url: 'https://uit.no/utdanning/eksamen',
          note: {
            nb: 'Datoer, regler, tilrettelegging, klage på karakter og utsatt eksamen.',
            en: 'Dates, rules, accommodations, appealing a grade and deferred exams.',
          },
          keywords: ['klage', 'stryk', 'konte', 'tilrettelegging'],
        },
      ],
    },
    {
      id: 'library',
      links: [
        {
          label: 'Universitetsbiblioteket',
          url: 'https://uit.no/ub',
          note: {
            nb: 'Bibliotekene ved UiT. Åpningstider, lån, veiledning og skrivehjelp.',
            en: 'The UiT libraries. Opening hours, loans, guidance and writing help.',
          },
          keywords: ['bibliotek', 'ub', 'åpningstider'],
        },
        {
          label: 'Oria',
          url: 'https://uit.oria.no',
          note: {
            nb: 'Søk i alt biblioteket har — bøker, artikler, tidsskrifter. Bestill og lån.',
            en: 'Search everything the library has — books, articles, journals. Order and borrow.',
          },
          keywords: ['søk', 'artikler', 'fjernlån'],
        },
        {
          label: 'Munin',
          url: 'https://munin.uit.no',
          note: {
            nb: 'UiTs åpne arkiv. Master- og doktoravhandlinger, fritt tilgjengelig.',
            en: "UiT's open archive. Master's and doctoral theses, freely available.",
          },
          keywords: ['avhandling', 'masteroppgave', 'arkiv', 'open access'],
        },
      ],
    },
    {
      id: 'campus',
      links: [
        {
          label: 'Kart og campus',
          url: 'https://uit.no/om/campus',
          note: {
            nb: 'De fire campusene, bygg og hvordan du finner fram.',
            en: 'The four campuses, buildings and how to find your way.',
          },
          keywords: ['kart', 'mazemap', 'bygg', 'tromsø', 'narvik', 'alta', 'harstad'],
        },
        {
          label: 'Rombestilling',
          url: 'https://uit.no/om/enhet/artikkel?p_document_id=343156&p_dimension_id=88138',
          note: {
            nb: 'Book grupperom og møterom på campus.',
            en: 'Book group rooms and meeting rooms on campus.',
          },
          keywords: ['grupperom', 'booking', 'kollokvie'],
        },
      ],
    },
    {
      id: 'life',
      links: [
        {
          label: 'Samskipnaden',
          url: 'https://samskipnaden.no',
          note: {
            nb: 'Norges arktiske studentsamskipnad. Bolig, helse, trening, kantiner og barnehage.',
            en: 'The Arctic student welfare organisation. Housing, health, gym, canteens and childcare.',
          },
          keywords: ['samskipnad', 'bolig', 'helse', 'trening', 'kantine'],
        },
        {
          label: 'Studenthelse',
          url: 'https://samskipnaden.no/studenthelse',
          note: {
            nb: 'Psykolog, rådgivning og helsetjenester til studentpris.',
            en: 'Psychologist, counselling and health services at student prices.',
          },
          keywords: ['psykolog', 'lege', 'helse', 'rådgivning'],
        },
        {
          label: 'Utropia',
          url: 'https://www.utropia.no',
          note: {
            nb: 'Studentavisa i Tromsø. Skriver om det lærestedet ikke skriver om.',
            en: 'The student paper in Tromsø. Covers what the institution does not.',
          },
          keywords: ['studentavis', 'nyheter'],
        },
        {
          label: 'Studentparlamentet',
          url: 'https://uit.no/om/studentdemokrati',
          note: {
            nb: 'Studentdemokratiet ved UiT. Hvem som taler saken din, og hvordan du selv kan gjøre det.',
            en: 'Student democracy at UiT. Who speaks for you, and how you can do it yourself.',
          },
          keywords: ['studentparlament', 'tillitsvalgt', 'verv'],
        },
      ],
    },
  ],
}

export default uit
