import type { Institution } from './types.ts'

const oslomet: Institution = {
  id: 'oslomet',
  name: 'OsloMet — storbyuniversitetet',
  shortName: 'OsloMet',
  city: ['Oslo', 'Lillestrøm'],
  reviewed: '2026-08-09',
  groups: [
    {
      id: 'studies',
      links: [
        {
          label: 'Min side',
          url: 'https://student.oslomet.no',
          note: {
            nb: 'OsloMets studentportal. Beskjeder, tjenester og inngangen til det meste.',
            en: "OsloMet's student portal. Messages, services and the way in to most things.",
          },
          keywords: ['portal', 'studentportal', 'minside'],
        },
        {
          label: 'Canvas',
          url: 'https://oslomet.instructure.com',
          note: {
            nb: 'Læringsplattformen. Pensum, arbeidskrav, innleveringer og beskjeder fra emneansvarlig.',
            en: 'The learning platform. Reading, coursework requirements, submissions and messages.',
          },
          keywords: ['lms', 'læringsplattform', 'arbeidskrav', 'innlevering'],
        },
        {
          label: 'Studentweb',
          url: 'https://fsweb.no/studentweb/login.jsf?inst=FSOSLOMET',
          note: {
            nb: 'Semesterregistrering, semesteravgift, oppmelding og karakterer.',
            en: 'Semester registration, the semester fee, signing up and grades.',
          },
          keywords: ['semesterregistrering', 'semesteravgift', 'karakterer'],
        },
        {
          label: 'Timeplan',
          url: 'https://tp.educloud.no/oslomet/timeplan/',
          note: {
            nb: 'Timeplanen for emnene dine. Kan også eksporteres til kalenderen din.',
            en: 'The timetable for your courses. Can also be exported to your own calendar.',
          },
          keywords: ['tp', 'forelesning', 'undervisning', 'ics'],
        },
        {
          label: 'Inspera',
          url: 'https://oslomet.inspera.no',
          note: {
            nb: 'Eksamenssystemet. Her leverer du hjemmeeksamen og tar skoleeksamen.',
            en: 'The exam system. Hand in take-home exams and sit written exams here.',
          },
          keywords: ['eksamen', 'hjemmeeksamen', 'innlevering'],
        },
        {
          label: 'Studier og emner',
          url: 'https://www.oslomet.no/studier',
          note: {
            nb: 'Alle studieprogram og emner med beskrivelse, oppbygging og opptakskrav.',
            en: 'Every programme and course with description, structure and entry requirements.',
          },
          keywords: ['fag', 'emne', 'studieprogram'],
        },
      ],
    },
    {
      id: 'practical',
      links: [
        {
          label: 'Semesterstart',
          url: 'https://student.oslomet.no/semesterstart',
          note: {
            nb: 'Sjekklisten for ny student: brukerkonto, semesteravgift, studentbevis og resten.',
            en: 'The checklist for new students: account, semester fee, student ID and the rest.',
          },
          keywords: ['ny student', 'sjekkliste', 'fadder', 'oppstart'],
        },
        {
          label: 'IT-hjelp',
          url: 'https://student.oslomet.no/it-hjelp',
          note: {
            nb: 'Wifi, VPN, e-post, passord og programvare. Inngangen når noe teknisk ikke virker.',
            en: 'Wifi, VPN, email, passwords and software. The way in when something technical breaks.',
          },
          keywords: ['it', 'wifi', 'eduroam', 'vpn', 'passord', 'support'],
        },
        {
          label: 'Utskrift',
          url: 'https://student.oslomet.no/utskrift',
          note: {
            nb: 'Skrive ut, kopiere og skanne. Hvor skriverne står og hva det koster.',
            en: 'Printing, copying and scanning. Where the printers are and what it costs.',
          },
          keywords: ['printer', 'skriver', 'kopi', 'skanning'],
        },
        {
          label: 'Studentbevis',
          url: 'https://student.oslomet.no/studentbevis',
          note: {
            nb: 'Appen som beviser at du er student. Gjelder på Ruter, Vy og hos SiO.',
            en: 'The app that proves you are a student. Valid on Ruter, Vy and with SiO.',
          },
          keywords: ['studentkort', 'app', 'ruter', 'rabatt'],
        },
      ],
    },
    {
      id: 'library',
      links: [
        {
          label: 'Biblioteket',
          url: 'https://www.oslomet.no/om/bibliotek',
          note: {
            nb: 'Bibliotekene på Pilestredet og Kjeller. Lån, veiledning og hjelp til oppgaveskriving.',
            en: 'The libraries at Pilestredet and Kjeller. Loans, guidance and help with assignments.',
          },
          keywords: ['bibliotek', 'pilestredet', 'kjeller'],
        },
        {
          label: 'Oria',
          url: 'https://oslomet.oria.no',
          note: {
            nb: 'Søk i alt biblioteket har — bøker, artikler, tidsskrifter. Bestill og lån.',
            en: 'Search everything the library has — books, articles, journals. Order and borrow.',
          },
          keywords: ['søk', 'artikler', 'fjernlån'],
        },
      ],
    },
    {
      id: 'campus',
      links: [
        {
          label: 'Campus og kart',
          url: 'https://www.oslomet.no/om/campus',
          note: {
            nb: 'Bygg, adresser og hvordan du finner fram på Pilestredet og Kjeller.',
            en: 'Buildings, addresses and how to find your way at Pilestredet and Kjeller.',
          },
          keywords: ['kart', 'mazemap', 'bygg', 'adresse'],
        },
        {
          label: 'Lesesaler og grupperom',
          url: 'https://student.oslomet.no/lesesaler-grupperom',
          note: {
            nb: 'Hvor du kan sitte og lese, og hvordan du booker grupperom.',
            en: 'Where you can sit and read, and how to book a group room.',
          },
          keywords: ['lesesal', 'grupperom', 'booking', 'plass'],
        },
      ],
    },
    {
      id: 'life',
      links: [
        {
          label: 'SiO',
          url: 'https://www.sio.no',
          note: {
            nb: 'Studentsamskipnaden i Oslo. Bolig, helse, trening, kantiner og barnehage.',
            en: 'The student welfare organisation in Oslo. Housing, health, gym, canteens and childcare.',
          },
          keywords: ['samskipnad', 'bolig', 'helse', 'trening'],
        },
        {
          label: 'SiO Helse',
          url: 'https://www.sio.no/helse',
          note: {
            nb: 'Lege, psykolog, tannlege og rådgivning til studentpris.',
            en: 'Doctor, psychologist, dentist and counselling at student prices.',
          },
          keywords: ['lege', 'psykolog', 'helse'],
        },
        {
          label: 'Studentparlamentet',
          url: 'https://student.oslomet.no/studentdemokrati',
          note: {
            nb: 'Studentdemokratiet. Hvem som taler saken din, og hvordan du selv kan gjøre det.',
            en: 'Student democracy. Who speaks for you, and how you can do it yourself.',
          },
          keywords: ['studentparlament', 'tillitsvalgt', 'verv'],
        },
        {
          label: 'Khrono',
          url: 'https://www.khrono.no',
          note: {
            nb: 'Uavhengig avis om høyere utdanning, utgitt ved OsloMet.',
            en: 'Independent newspaper on higher education, published at OsloMet.',
          },
          keywords: ['avis', 'nyheter', 'studentavis'],
        },
      ],
    },
  ],
}

export default oslomet
