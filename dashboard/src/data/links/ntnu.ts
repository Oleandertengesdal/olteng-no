import type { Institution } from './types.ts'

/**
 * NTNU — Trondheim, Gjøvik, Ålesund.
 *
 * Lenkene er hentet fra sidekartet på i.ntnu.no/student, som er NTNUs egen
 * oversikt over studenttjenester. Det er grunnen til at denne katalogen er den
 * mest komplette av de fem: NTNU publiserer alt på ett sted.
 */
const ntnu: Institution = {
  id: 'ntnu',
  name: 'Norges teknisk-naturvitenskapelige universitet',
  shortName: 'NTNU',
  city: ['Trondheim', 'Gjøvik', 'Ålesund'],
  reviewed: '2026-08-09',
  groups: [
    {
      id: 'studies',
      links: [
        {
          label: 'Innsida',
          url: 'https://innsida.ntnu.no/start',
          note: {
            nb: 'NTNUs intranett. Beskjeder, tjenester og inngangen til det meste.',
            en: "NTNU's intranet. Messages, services and the way in to most things.",
          },
          keywords: ['intranett', 'i.ntnu.no'],
        },
        {
          label: 'Canvas',
          url: 'https://canvas.ntnu.no',
          note: {
            nb: 'Læringsplattformen. Emnesider, forelesningsnotater, innleveringer og beskjeder.',
            en: 'The learning platform. Course pages, lecture notes, submissions and messages.',
          },
          keywords: ['lms', 'læringsplattform', 'emnesider', 'innlevering'],
          warning: {
            nb: 'NTNU byttet fra Blackboard til Canvas høsten 2026. Gammelt innhold ligger i Blackboard til 1. oktober 2026.',
            en: 'NTNU moved from Blackboard to Canvas in autumn 2026. Old content stays in Blackboard until 1 October 2026.',
          },
        },
        {
          label: 'Blackboard',
          url: 'https://i.ntnu.no/bb-student',
          note: {
            nb: 'Den gamle læringsplattformen. Hent ut det du trenger før den stenger.',
            en: 'The old learning platform. Get what you need out before it closes.',
          },
          keywords: ['gammel', 'lms'],
          warning: {
            nb: 'Stenger 1. oktober 2026.',
            en: 'Closes 1 October 2026.',
          },
        },
        {
          label: 'Studentweb',
          url: 'https://www.ntnu.no/studentweb',
          note: {
            nb: 'Semesterregistrering, oppmelding til emner og eksamen, karakterer og semesteravgift.',
            en: 'Semester registration, signing up for courses and exams, grades and the semester fee.',
          },
          keywords: ['semesterregistrering', 'karakterer', 'oppmelding', 'semesteravgift'],
        },
        {
          label: 'Timeplan',
          url: 'https://i.ntnu.no/timeplan',
          note: {
            nb: 'Timeplanen for emnene dine. Velg «Min undervisning» etter innlogging med Feide.',
            en: 'The timetable for your courses. Choose “Min undervisning” after logging in with Feide.',
          },
          keywords: ['tp', 'forelesning', 'undervisning', 'ics'],
        },
        {
          label: 'Inspera',
          url: 'https://ntnu.inspera.no',
          note: {
            nb: 'Eksamenssystemet. Her leverer du hjemmeeksamen og tar skoleeksamen.',
            en: 'The exam system. Hand in take-home exams and sit written exams here.',
          },
          keywords: ['eksamen', 'innlevering', 'hjemmeeksamen'],
        },
        {
          label: 'Eksamen',
          url: 'https://i.ntnu.no/eksamen',
          note: {
            nb: 'Datoer, regler, tilrettelegging, klage på karakter og hva som skjer hvis du stryker.',
            en: 'Dates, rules, accommodations, appealing a grade, and what happens if you fail.',
          },
          keywords: ['klage', 'stryk', 'konte', 'tilrettelegging'],
        },
        {
          label: 'Emnesøk',
          url: 'https://www.ntnu.no/studier/emner',
          note: {
            nb: 'Alle emner med beskrivelse, forkunnskaper, studiepoeng og vurderingsform.',
            en: 'Every course with its description, prerequisites, credits and assessment form.',
          },
          keywords: ['fag', 'studiepoeng', 'pensum'],
        },
      ],
    },
    {
      id: 'practical',
      links: [
        {
          label: 'NTNU Hjelp',
          url: 'https://hjelp.ntnu.no',
          note: {
            nb: 'Meld inn saker til IT, bygg, HR og resten. Inngangen når noe ikke virker.',
            en: 'Report issues to IT, buildings, HR and the rest. The way in when something is broken.',
          },
          keywords: ['it', 'support', 'orakel', 'brukerstøtte'],
        },
        {
          label: 'IT-hjelp for studenter',
          url: 'https://i.ntnu.no/it-hjelp',
          note: {
            nb: 'Wifi, VPN, e-post, tofaktor og alt annet som må settes opp én gang.',
            en: 'Wifi, VPN, email, two-factor and everything else you set up once.',
          },
          keywords: ['wifi', 'eduroam', 'vpn', 'tofaktor'],
        },
        {
          label: 'Skift passord',
          url: 'https://bas.ntnu.no/userclient/?lang=nb',
          note: {
            nb: 'Bytt NTNU-passord. Det du bruker på Feide, wifi og alt annet.',
            en: 'Change your NTNU password — the one for Feide, wifi and everything else.',
          },
          keywords: ['feide', 'brukernavn', 'passord', 'bas'],
        },
        {
          label: 'Studentepost',
          url: 'https://outlook.office365.com',
          note: {
            nb: 'NTNU-eposten din i Outlook. Beskjeder fra emner og administrasjon havner her.',
            en: 'Your NTNU email in Outlook. Messages from courses and administration land here.',
          },
          keywords: ['e-post', 'outlook', 'mail'],
        },
        {
          label: 'Utskrift og kopi',
          url: 'https://i.ntnu.no/utskrift-kopi',
          note: {
            nb: 'Skrive ut fra egen maskin, hvor skriverne står og hva det koster.',
            en: 'Printing from your own machine, where the printers are, and what it costs.',
          },
          keywords: ['printer', 'skriver', 'kopi', 'skanning'],
        },
        {
          label: 'Programvare',
          url: 'https://i.ntnu.no/studentprogramvare',
          note: {
            nb: 'Office, MATLAB, Adobe og resten — gratis eller billig fordi du er student her.',
            en: 'Office, MATLAB, Adobe and the rest — free or cheap because you study here.',
          },
          keywords: ['lisens', 'office', 'matlab', 'gratis'],
        },
        {
          label: 'Studentkort',
          url: 'https://i.ntnu.no/studentkort',
          note: {
            nb: 'Adgangskortet. Åpner dører, betaler i kantina og er studentbeviset ditt.',
            en: 'Your access card. Opens doors, pays in the canteen, and is your student ID.',
          },
          keywords: ['adgang', 'kort', 'studentbevis'],
        },
      ],
    },
    {
      id: 'library',
      links: [
        {
          label: 'Universitetsbiblioteket',
          url: 'https://www.ntnu.no/ub',
          note: {
            nb: 'Åpningstider, tjenester og hjelp til oppgaveskriving.',
            en: 'Opening hours, services, and help with writing assignments.',
          },
          keywords: ['bibliotek', 'ub'],
        },
        {
          label: 'Oria',
          url: 'https://ntnu.oria.no',
          note: {
            nb: 'Søk i alt biblioteket har — bøker, artikler, tidsskrifter. Bestill og lån.',
            en: 'Search everything the library has — books, articles, journals. Order and borrow.',
          },
          keywords: ['søk', 'artikler', 'bøker', 'fjernlån'],
        },
        {
          label: 'Pensum',
          url: 'https://i.ntnu.no/pensum',
          note: {
            nb: 'Pensumlistene for emnene dine, med lenke rett til det som finnes digitalt.',
            en: 'Reading lists for your courses, linking straight to what is available digitally.',
          },
          keywords: ['leganto', 'pensumliste', 'bøker'],
        },
        {
          label: 'Oppgaveskriving',
          url: 'https://i.ntnu.no/oppgaveskriving',
          note: {
            nb: 'Kildebruk, referansestiler, plagiat og maler for bachelor og master.',
            en: 'Sources, citation styles, plagiarism, and templates for bachelor and master theses.',
          },
          keywords: ['kilder', 'referanse', 'apa', 'plagiat', 'mal'],
        },
      ],
    },
    {
      id: 'campus',
      links: [
        {
          label: 'Kart og rom',
          url: 'https://i.ntnu.no/kart',
          note: {
            nb: 'MazeMap finner rommet inne i bygget, ikke bare bygget.',
            en: 'MazeMap finds the room inside the building, not just the building.',
          },
          keywords: ['mazemap', 'finn fram', 'rom', 'bygg'],
        },
        {
          label: 'Lesesal og datasal',
          url: 'https://i.ntnu.no/lesesal',
          note: {
            nb: 'Hvor du kan sitte og lese, og hvilke saler som er åpne for hvem.',
            en: 'Where you can sit and read, and which rooms are open to whom.',
          },
          keywords: ['lesesal', 'datasal', 'lese', 'plass'],
        },
        {
          label: 'Reservere rom',
          url: 'https://i.ntnu.no/romreservasjon',
          note: {
            nb: 'Book grupperom til kollokvie eller prosjektmøte.',
            en: 'Book a group room for study groups or project meetings.',
          },
          keywords: ['grupperom', 'booking', 'kollokvie'],
        },
        {
          label: 'Åpningstider',
          url: 'https://i.ntnu.no/apningstider',
          note: {
            nb: 'Når bygg, bibliotek og kantiner er åpne. Endrer seg i eksamensperioden.',
            en: 'When buildings, libraries and canteens are open. Changes during exams.',
          },
          keywords: ['åpent', 'kantine', 'bygg'],
        },
      ],
    },
    {
      id: 'life',
      links: [
        {
          label: 'Sit',
          url: 'https://www.sit.no',
          note: {
            nb: 'Studentsamskipnaden i Trøndelag. Bolig, kantine, helse, trening og barnehage.',
            en: 'The student welfare organisation in Trøndelag. Housing, canteens, health, gym and childcare.',
          },
          keywords: ['samskipnad', 'bolig', 'kantine', 'trening', 'helse'],
        },
        {
          label: 'Bolig',
          url: 'https://i.ntnu.no/bolig',
          note: {
            nb: 'Studentbolig gjennom Sit, og hva du gjør hvis du ikke får noe.',
            en: 'Student housing through Sit, and what to do if you do not get any.',
          },
          keywords: ['hybel', 'leilighet', 'sit'],
        },
        {
          label: 'Helsetjenester',
          url: 'https://i.ntnu.no/helsetjenester',
          note: {
            nb: 'Lege, psykolog, rådgivning og hva du gjør når det haster.',
            en: 'Doctor, psychologist, counselling, and what to do when it is urgent.',
          },
          keywords: ['lege', 'psykolog', 'helse', 'rådgivning'],
        },
        {
          label: 'Studentorganisasjoner',
          url: 'https://i.ntnu.no/studentorg',
          note: {
            nb: 'Linjeforeninger, Samfundet, UKA, idrettslag og alt annet du kan bli med i.',
            en: 'Student societies, Samfundet, UKA, sports clubs and everything else you can join.',
          },
          keywords: ['linjeforening', 'samfundet', 'uka', 'frivillig'],
        },
        {
          label: 'Trening',
          url: 'https://i.ntnu.no/trening',
          note: {
            nb: 'Sit Trening og NTNUI. Studentpris på treningssenter og hundre idrettsgrupper.',
            en: 'Sit Trening and NTNUI. Student-priced gyms and a hundred sports groups.',
          },
          keywords: ['ntnui', 'sit trening', 'idrett', 'gym'],
        },
        {
          label: 'Under Dusken',
          url: 'https://www.underdusken.no',
          note: {
            nb: 'Studentavisa i Trondheim. Skriver om det lærestedet ikke skriver om.',
            en: 'The student paper in Trondheim. Covers what the institution does not.',
          },
          keywords: ['studentavis', 'nyheter'],
        },
        {
          label: 'Si fra',
          url: 'https://i.ntnu.no/sifra',
          note: {
            nb: 'Meld fra om mobbing, trakassering, farlige forhold eller noe som bare er feil.',
            en: 'Report bullying, harassment, unsafe conditions, or something that is simply wrong.',
          },
          keywords: ['varsling', 'mobbing', 'trakassering'],
        },
      ],
    },
  ],
}

export default ntnu
