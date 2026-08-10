import type { Institution } from './types.ts'

const uib: Institution = {
  id: 'uib',
  name: 'Universitetet i Bergen',
  shortName: 'UiB',
  city: ['Bergen'],
  reviewed: '2026-08-09',
  groups: [
    {
      id: 'studies',
      links: [
        {
          label: 'Mitt UiB',
          url: 'https://mitt.uib.no',
          note: {
            nb: 'Læringsplattformen. Emnesider, pensum, innleveringer og beskjeder fra faglærer.',
            en: 'The learning platform. Course pages, reading, submissions and messages from teachers.',
          },
          keywords: ['canvas', 'lms', 'læringsplattform', 'innlevering'],
        },
        {
          label: 'Verktøy og tjenester',
          url: 'https://www4.uib.no/for-studenter/verktoy-og-tjenester',
          note: {
            nb: 'UiBs egen oversikt over studentverktøyene. Nyttig når du ikke vet hva systemet heter.',
            en: "UiB's own overview of the student tools. Useful when you do not know what the system is called.",
          },
          keywords: ['oversikt', 'portal', 'systemer'],
        },
        {
          label: 'Studentweb',
          url: 'https://fsweb.no/studentweb/login.jsf?inst=FSUIB',
          note: {
            nb: 'Semesterregistrering, semesteravgift, oppmelding til emner og eksamen, og karakterer.',
            en: 'Semester registration, the fee, signing up for courses and exams, and grades.',
          },
          keywords: ['semesterregistrering', 'karakterer', 'oppmelding'],
        },
        {
          label: 'Inspera',
          url: 'https://uib.inspera.no',
          note: {
            nb: 'Eksamenssystemet. Her leverer du hjemmeeksamen og tar skoleeksamen.',
            en: 'The exam system. Hand in take-home exams and sit written exams here.',
          },
          keywords: ['eksamen', 'hjemmeeksamen', 'innlevering'],
        },
        {
          label: 'Timeplan',
          url: 'https://tp.educloud.no/uib/timeplan/',
          note: {
            nb: 'Timeplanen for emnene dine. Kan eksporteres til kalenderen din.',
            en: 'The timetable for your courses. Can be exported to your own calendar.',
          },
          keywords: ['tp', 'forelesning', 'undervisning', 'ics'],
        },
        {
          label: 'Emnesøk',
          url: 'https://www.uib.no/emne',
          note: {
            nb: 'Alle emner med pensum, undervisning, vurderingsform og forkunnskaper.',
            en: 'Every course with reading, teaching, assessment form and prerequisites.',
          },
          keywords: ['fag', 'pensum', 'studiepoeng'],
        },
      ],
    },
    {
      id: 'practical',
      links: [
        {
          label: 'IT-hjelp',
          url: 'https://hjelp.uib.no',
          note: {
            nb: 'Meld inn en sak til IT. Wifi, VPN, passord, programvare og alt annet teknisk.',
            en: 'Report an IT issue. Wifi, VPN, passwords, software and everything else technical.',
          },
          keywords: ['it', 'support', 'wifi', 'eduroam', 'vpn', 'passord'],
        },
        {
          label: 'For studenter',
          url: 'https://www4.uib.no/for-studenter',
          note: {
            nb: 'UiBs samleside for studenter. Frister, regler, tilrettelegging og praktisk hjelp.',
            en: "UiB's hub for students. Deadlines, rules, accommodations and practical help.",
          },
          keywords: ['portal', 'frister', 'regler'],
        },
        {
          label: 'Ny student',
          url: 'https://www.uib.no/student/ny-student',
          note: {
            nb: 'Sjekklisten før studiestart: brukerkonto, semesteravgift, studentbevis og fadderuke.',
            en: 'The checklist before you start: account, semester fee, student ID and induction week.',
          },
          keywords: ['sjekkliste', 'oppstart', 'fadder'],
        },
      ],
    },
    {
      id: 'library',
      links: [
        {
          label: 'Universitetsbiblioteket',
          url: 'https://www.uib.no/ub',
          note: {
            nb: 'Bibliotekene ved UiB. Åpningstider, lån, veiledning og skrivehjelp.',
            en: 'The UiB libraries. Opening hours, loans, guidance and writing help.',
          },
          keywords: ['bibliotek', 'ub', 'åpningstider'],
        },
        {
          label: 'Oria',
          url: 'https://uib.oria.no',
          note: {
            nb: 'Søk i alt biblioteket har — bøker, artikler, tidsskrifter, avhandlinger. Bestill og lån.',
            en: 'Search everything the library has — books, articles, journals, theses. Order and borrow.',
          },
          keywords: ['søk', 'artikler', 'fjernlån', 'avhandling'],
        },
        {
          label: 'Pensum',
          url: 'https://www4.uib.no/for-studenter/verktoy-og-tjenester/lane-eller-kjope-pensum',
          note: {
            nb: 'Låne eller kjøpe pensum, og hva som finnes digitalt gjennom biblioteket.',
            en: 'Borrowing or buying course literature, and what the library has digitally.',
          },
          keywords: ['pensum', 'bøker', 'leganto'],
        },
      ],
    },
    {
      id: 'campus',
      links: [
        {
          label: 'Kart og bygg',
          url: 'https://www.uib.no/kart',
          note: {
            nb: 'MazeMap over campus. Finner rommet inne i bygget, ikke bare bygget.',
            en: 'MazeMap of campus. Finds the room inside the building, not just the building.',
          },
          keywords: ['mazemap', 'kart', 'rom', 'bygg', 'finn fram'],
        },
        {
          label: 'Lesesaler og lesesalsplasser',
          url: 'https://www4.uib.no/for-studenter/verktoy-og-tjenester/lesesaler-og-arbeidsplasser-pa-campus',
          note: {
            nb: 'Hvor du kan sitte og lese på campus, og hvilke plasser som kan reserveres.',
            en: 'Where you can sit and read on campus, and which spaces can be reserved.',
          },
          keywords: ['lesesal', 'grupperom', 'plass', 'arbeidsplass'],
        },
      ],
    },
    {
      id: 'life',
      links: [
        {
          label: 'Sammen',
          url: 'https://www.sammen.no',
          note: {
            nb: 'Studentsamskipnaden på Vestlandet. Bolig, helse, trening, kantiner og barnehage.',
            en: 'The student welfare organisation in Western Norway. Housing, health, gym, canteens and childcare.',
          },
          keywords: ['samskipnad', 'bolig', 'helse', 'trening', 'kantine'],
        },
        {
          label: 'Sammen Helse',
          url: 'https://www.sammen.no/helse',
          note: {
            nb: 'Psykolog, rådgivning og helsetjenester til studentpris.',
            en: 'Psychologist, counselling and health services at student prices.',
          },
          keywords: ['psykolog', 'lege', 'helse', 'rådgivning'],
        },
        {
          label: 'Studvest',
          url: 'https://www.studvest.no',
          note: {
            nb: 'Studentavisa i Bergen. Skriver om det lærestedet ikke skriver om.',
            en: 'The student paper in Bergen. Covers what the institution does not.',
          },
          keywords: ['studentavis', 'nyheter'],
        },
        {
          label: 'Studentliv og foreninger',
          url: 'https://www.uib.no/student/studentliv',
          note: {
            nb: 'Fagutvalg, foreninger, verv og alt som skjer utenom forelesningene.',
            en: 'Subject committees, societies, positions, and everything outside lectures.',
          },
          keywords: ['forening', 'fagutvalg', 'verv', 'frivillig'],
        },
      ],
    },
  ],
}

export default uib
