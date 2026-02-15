export interface ProjectTranslations {
  title: string
  description: string
  overview?: string
  features?: string[]
  technicalDetails?: string
  challenges?: string[]
  outcomes?: string[]
  futureImprovements?: string[]
}

export interface Project {
  id: string
  title: ProjectTranslations
  description: ProjectTranslations
  type: 'live' | 'showcase' // live = interactive tool, showcase = readme-style page
  size: 'large' | 'medium' | 'small' // for sorting
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  component?: string // component name for live projects
  image?: string
  featured?: boolean
  details?: {
    year?: string
    duration?: string
    role?: string
    team?: string
    status?: string
  }
}

export const projects: Project[] = [
  // Large projects
  {
    id: 'biddingwars',
    title: {
      en: 'Budbørsen - Auction Application',
      nb: 'Budbørsen - Auksjonsapplikasjon',
      overview: 'A comprehensive fullstack auction platform enabling users to create, manage, and participate in online auctions with secure authentication and real-time bidding capabilities.',
      features: [
        'User authentication and authorization with JWT tokens',
        'Real-time bid placement and tracking',
        'Image upload and management for auction items',
        'Admin panel for user and auction management',
        'Category-based auction organization',
        'Secure payment integration ready',
        'RESTful API with Swagger documentation'
      ],
      technicalDetails: 'Built with a modern tech stack featuring Spring Boot 3 backend with Spring Security for authentication, SQLite database for data persistence, and Vue 3 with Composition API and TypeScript for a reactive frontend. The application follows clean architecture principles with proper separation of concerns, comprehensive exception handling, and extensive test coverage using JUnit 5 and Mockito.',
      challenges: [
        'Implementing secure JWT-based authentication flow',
        'Managing real-time bid updates across multiple users',
        'Handling concurrent bid submissions to prevent race conditions',
        'Designing a flexible category system for diverse auction types',
        'Creating an intuitive admin interface for content moderation'
      ],
      outcomes: [
        'Successfully deployed auction platform with user authentication',
        'Implemented comprehensive exception handling system',
        'Achieved test coverage for critical business logic',
        'Created detailed API documentation with Swagger',
        'Built responsive UI compatible with mobile and desktop'
      ],
      futureImprovements: [
        'Add Docker Compose for simplified deployment',
        'Implement WebSocket support for live bid notifications',
        'Integrate payment gateway for automated transactions',
        'Add email notifications for auction events',
        'Implement auction scheduling and auto-close functionality'
      ]
    },
    description: {
      en: 'A fullstack web application for creating auctions, uploading images of items, and placing bids in real-time. Features user authentication, image management, and live bidding functionality.',
      nb: 'En fullstack webapplikasjon for å opprette auksjoner, laste opp bilder av gjenstander, og legge inn bud i sanntid. Funksjoner inkluderer brukerautentisering, bildehåndtering og live budgivning.',
      overview: 'En omfattende fullstack auksjonsplattform som gjør det mulig for brukere å opprette, administrere og delta i nettauksjoner med sikker autentisering og sanntids budgivning.',
      features: [
        'Brukerautentisering og autorisasjon med JWT-tokens',
        'Sanntids budplassering og sporing',
        'Bildeopplasting og håndtering for auksjonsobjekter',
        'Adminpanel for bruker- og auksjonsstyring',
        'Kategori-basert auksjonsorganisering',
        'Sikker betalingsintegrasjon klar',
        'RESTful API med Swagger-dokumentasjon'
      ],
      technicalDetails: 'Bygget med en moderne teknologistakk med Spring Boot 3 backend med Spring Security for autentisering, SQLite database for datalagring, og Vue 3 med Composition API og TypeScript for et reaktivt grensesnitt. Applikasjonen følger rene arkitekturprinsipper med korrekt separasjon av bekymringer, omfattende unntakshåndtering, og omfattende testdekning ved bruk av JUnit 5 og Mockito.',
      challenges: [
        'Implementering av sikker JWT-basert autentiseringsflyt',
        'Håndtering av sanntids budoppdateringer på tvers av flere brukere',
        'Håndtering av samtidige budinnsendinger for å forhindre race conditions',
        'Utforming av et fleksibelt kategorisystem for ulike auksjonstyper',
        'Oppretting av et intuitivt admin-grensesnitt for innholdsmoderering'
      ],
      outcomes: [
        'Vellykket distribuert auksjonsplattform med brukerautentisering',
        'Implementert omfattende unntakshåndteringssystem',
        'Oppnådd testdekning for kritisk forretningslogikk',
        'Opprettet detaljert API-dokumentasjon med Swagger',
        'Bygget responsivt brukergrensesnitt kompatibelt med mobil og desktop'
      ],
      futureImprovements: [
        'Legge til Docker Compose for forenklede distribusjoner',
        'Implementere WebSocket-støtte for live budvarsler',
        'Integrere betalingsgateway for automatiserte transaksjoner',
        'Legge til e-postvarsler for auksjonshendelser',
        'Implementere auksjonsplanlegging og auto-lukke funksjonalitet'
      ]
    },
    type: 'showcase',
    size: 'large',
    technologies: ['Java 21', 'Spring Boot 3', 'Vue 3', 'TypeScript', 'Pinia', 'SQLite', 'Spring Security', 'JWT'],
    githubUrl: 'https://github.com/Oleandertengesdal/biddingwars',
    featured: true,
    details: {
      year: '2026',
      duration: '3 weeks',
      role: 'Full-stack Developer',
      team: 'Solo Project',
      status: 'In Development'
    }
  },
  
  // Small projects
  {
    id: 'json2csv',
    title: {
      en: 'JSON to CSV Converter',
      nb: 'JSON til CSV-konverterer'
    },
    description: {
      en: 'A lightweight, browser-based tool to convert JSON data to CSV format and vice versa. All processing happens locally for speed and privacy.',
      nb: 'Et lett nettleserbasert verktøy for å konvertere JSON-data til CSV-format og omvendt. All behandling skjer lokalt for hastighet og personvern.'
    },
    type: 'live',
    size: 'small',
    technologies: ['TypeScript', 'HTML5', 'CSS3'],
    githubUrl: 'https://github.com/Oleandertengesdal/Json2CSV',
    component: 'ProjectJson2CSV',
    featured: false
  }
]

// Sort projects: large first, then medium, then small
export const sortedProjects = projects.sort((a, b) => {
  const sizeOrder = { large: 0, medium: 1, small: 2 }
  return sizeOrder[a.size] - sizeOrder[b.size]
})
