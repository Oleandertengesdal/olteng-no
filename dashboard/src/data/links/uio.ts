import type { Institution } from './types.ts'

const uio: Institution = {
  id: 'uio',
  name: 'Universitetet i Oslo',
  shortName: 'UiO',
  city: ['Oslo'],
  reviewed: '2026-08-09',
  groups: [
    {
      id: 'studies',
      links: [
        {
          label: 'Mine studier',
          url: 'https://minestudier.uio.no',
          note: {
            nb: 'Timeplan, beskjeder fra emnene og snarveier samlet på ett sted. Inngangen til studiehverdagen.',
            en: 'Timetable, course messages and shortcuts in one place. The way in to your studies.',
          },
          keywords: ['timeplan', 'beskjeder', 'snarveier', 'portal'],
        },
        {
          label: 'Canvas',
          url: 'https://uio.instructure.com',
          note: {
            nb: 'Læringsplattformen. Emnesider, pensum, innleveringer og beskjeder fra faglærer.',
            en: 'The learning platform. Course pages, reading, submissions and messages from teachers.',
          },
          keywords: ['lms', 'læringsplattform', 'innlevering'],
        },
        {
          label: 'Studentweb',
          url: 'https://studentweb.uio.no/studentweb/',
          note: {
            nb: 'Semesterregistrering, oppmelding til emner og eksamen, karakterer og semesteravgift.',
            en: 'Semester registration, signing up for courses and exams, grades and the semester fee.',
          },
          keywords: ['semesterregistrering', 'karakterer', 'oppmelding'],
        },
        {
          label: 'Inspera',
          url: 'https://uio.inspera.no',
          note: {
            nb: 'Eksamenssystemet. Her leverer du hjemmeeksamen og tar skoleeksamen.',
            en: 'The exam system. Hand in take-home exams and sit written exams here.',
          },
          keywords: ['eksamen', 'hjemmeeksamen', 'innlevering'],
        },
        {
          label: 'Emnesøk',
          url: 'https://www.uio.no/studier/emner/',
          note: {
            nb: 'Alle emner med pensum, undervisning, vurderingsform og tidligere eksamensoppgaver.',
            en: 'Every course with its reading, teaching, assessment form and past exam papers.',
          },
          keywords: ['fag', 'pensum', 'gamle eksamensoppgaver'],
        },
        {
          label: 'Eksamen',
          url: 'https://www.uio.no/studier/eksamen/',
          note: {
            nb: 'Datoer, regler, tilrettelegging, klage på karakter og hva som skjer hvis du stryker.',
            en: 'Dates, rules, accommodations, appealing a grade, and what happens if you fail.',
          },
          keywords: ['klage', 'stryk', 'tilrettelegging', 'utsatt'],
        },
      ],
    },
    {
      id: 'practical',
      links: [
        {
          label: 'IT-tjenester',
          url: 'https://www.uio.no/tjenester/it/',
          note: {
            nb: 'Nett, e-post, VPN, utskrift, programvare og lagring. Én inngang til alt teknisk.',
            en: 'Network, email, VPN, printing, software and storage. One way in to everything technical.',
          },
          keywords: ['vpn', 'wifi', 'eduroam', 'utskrift', 'programvare', 'e-post'],
        },
        {
          label: 'IT-hjelp',
          url: 'https://www.uio.no/tjenester/it/hjelp/',
          note: {
            nb: 'Houston. Meld inn en sak, eller finn svaret før du gjør det.',
            en: 'Houston. Report an issue, or find the answer before you do.',
          },
          keywords: ['support', 'houston', 'brukerstøtte'],
        },
        {
          label: 'Brukernavn og passord',
          url: 'https://www.uio.no/tjenester/it/brukernavn-passord/',
          note: {
            nb: 'UiO-brukeren din. Bytt passord, sett opp tofaktor, hent brukernavnet du glemte.',
            en: 'Your UiO account. Change your password, set up two-factor, recover a forgotten username.',
          },
          keywords: ['feide', 'passord', 'tofaktor', 'innlogging'],
        },
        {
          label: 'Studier — for studenter',
          url: 'https://www.uio.no/studier/',
          note: {
            nb: 'UiOs egen oversikt over alt studierelatert. Nyttig når du ikke vet hva du leter etter.',
            en: "UiO's own overview of everything study-related. Useful when you do not know what you are looking for.",
          },
          keywords: ['oversikt', 'portal'],
        },
      ],
    },
    {
      id: 'library',
      links: [
        {
          label: 'Universitetsbiblioteket',
          url: 'https://www.ub.uio.no',
          note: {
            nb: 'Åtte bibliotek med hver sine åpningstider. Lån, veiledning og hjelp til kildebruk.',
            en: 'Eight libraries with their own opening hours. Loans, guidance and help with sources.',
          },
          keywords: ['bibliotek', 'ub', 'åpningstider'],
        },
        {
          label: 'Oria',
          url: 'https://uio.oria.no',
          note: {
            nb: 'Søk i alt biblioteket har — bøker, artikler, tidsskrifter. Bestill og lån.',
            en: 'Search everything the library has — books, articles, journals. Order and borrow.',
          },
          keywords: ['søk', 'artikler', 'fjernlån'],
        },
        {
          label: 'Skrivehjelp',
          url: 'https://www.ub.uio.no/skrive-referere/',
          note: {
            nb: 'Referansestiler, kildebruk og plagiat. Det du burde lest før innleveringen.',
            en: 'Citation styles, sourcing and plagiarism. What you should have read before handing in.',
          },
          keywords: ['referanse', 'apa', 'kilder', 'plagiat', 'endnote'],
        },
      ],
    },
    {
      id: 'campus',
      links: [
        {
          label: 'Finn fram',
          url: 'https://www.uio.no/om/finn-fram/',
          note: {
            nb: 'Kart over Blindern og de andre campusene, med bygg og rom.',
            en: 'Maps of Blindern and the other campuses, with buildings and rooms.',
          },
          keywords: ['kart', 'blindern', 'bygg', 'rom', 'mazemap'],
        },
        {
          label: 'Lesesaler og grupperom',
          url: 'https://www.uio.no/studier/studiehverdagen/lesesaler/',
          note: {
            nb: 'Hvor du kan sitte, og hvordan du booker grupperom.',
            en: 'Where you can sit, and how to book a group room.',
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
          keywords: ['samskipnad', 'bolig', 'helse', 'trening', 'athletica'],
        },
        {
          label: 'SiO Helse',
          url: 'https://www.sio.no/helse',
          note: {
            nb: 'Lege, psykolog, tannlege og rådgivning til studentpris.',
            en: 'Doctor, psychologist, dentist and counselling at student prices.',
          },
          keywords: ['lege', 'psykolog', 'tannlege', 'helse'],
        },
        {
          label: 'Universitas',
          url: 'https://universitas.no',
          note: {
            nb: 'Studentavisa i Oslo. Skriver om det lærestedet ikke skriver om.',
            en: 'The student paper in Oslo. Covers what the institution does not.',
          },
          keywords: ['studentavis', 'nyheter'],
        },
        {
          label: 'Studentliv',
          url: 'https://www.uio.no/studier/studiehverdagen/',
          note: {
            nb: 'Foreninger, verv, fadderordning og alt annet som skjer utenom forelesningene.',
            en: 'Societies, positions, the buddy scheme, and everything else outside lectures.',
          },
          keywords: ['forening', 'fadder', 'verv', 'frivillig'],
        },
      ],
    },
  ],
}

export default uio
