/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FARGEKODING AV TEKNOLOGIER
 *
 *  Fargene på siden betyr noe. Hver teknologi hører til én kategori, og
 *  kategorien bestemmer fargen — så en bedrift som skanner prosjektlista ser
 *  med én gang om et prosjekt er tungt på språk, rammeverk eller infrastruktur,
 *  uten å lese en eneste etikett.
 *
 *  Legger du til en ny teknologi som ikke står her, blir den grå. Det er en
 *  helt grei fallback, men det er raskt gjort å plassere den riktig nedenfor.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Hue = 'clay' | 'pine' | 'iris' | 'ochre'

/** Kategoriene, i den rekkefølgen de vises i tegnforklaringen. */
export const categories: { hue: Hue; label: { en: string; nb: string } }[] = [
  { hue: 'iris', label: { en: 'Languages', nb: 'Språk' } },
  { hue: 'clay', label: { en: 'Frameworks', nb: 'Rammeverk' } },
  { hue: 'pine', label: { en: 'Data & infrastructure', nb: 'Data og infrastruktur' } },
  { hue: 'ochre', label: { en: 'Tooling', nb: 'Verktøy' } },
]

const membership: Record<Hue, string[]> = {
  iris: ['Java', 'Java 21', 'Kotlin', 'TypeScript', 'JavaScript', 'Python', 'SQL', 'HTML5', 'CSS3'],
  clay: [
    'Spring Boot',
    'Spring Boot 3',
    'Spring Security',
    'Vue',
    'Vue 3',
    'Pinia',
    'Tailwind CSS',
    'REST',
    'JUnit',
  ],
  pine: ['SQLite', 'PostgreSQL', 'JWT', 'Docker', 'Kubernetes'],
  ochre: ['Git', 'Vite', 'CI/CD', 'System design'],
}

/** Reverse index, built once — lookups are by exact technology name. */
const hueByTech = new Map<string, Hue>(
  Object.entries(membership).flatMap(([hue, items]) =>
    items.map((item) => [item.toLowerCase(), hue as Hue] as const),
  ),
)

export const hueFor = (tech: string): Hue | null => hueByTech.get(tech.trim().toLowerCase()) ?? null

/**
 * Tailwind scans source files for complete class strings, so these have to be
 * written out in full — a template literal like `text-${hue}` would be dropped
 * from the stylesheet at build time.
 */
export const chipClasses: Record<Hue | 'neutral', string> = {
  clay: 'border-clay/40 text-clay',
  pine: 'border-pine/40 text-pine',
  iris: 'border-iris/40 text-iris',
  ochre: 'border-ochre/40 text-ochre',
  neutral: 'border-line text-muted',
}

export const chipHoverClasses: Record<Hue | 'neutral', string> = {
  clay: 'group-hover:bg-clay/10 group-hover:border-clay/70',
  pine: 'group-hover:bg-pine/10 group-hover:border-pine/70',
  iris: 'group-hover:bg-iris/10 group-hover:border-iris/70',
  ochre: 'group-hover:bg-ochre/10 group-hover:border-ochre/70',
  neutral: 'group-hover:border-ink/40 group-hover:text-ink',
}

export const textClasses: Record<Hue, string> = {
  clay: 'text-clay',
  pine: 'text-pine',
  iris: 'text-iris',
  ochre: 'text-ochre',
}

export const hoverTextClasses: Record<Hue, string> = {
  clay: 'group-hover:text-clay',
  pine: 'group-hover:text-pine',
  iris: 'group-hover:text-iris',
  ochre: 'group-hover:text-ochre',
}

export const bgClasses: Record<Hue, string> = {
  clay: 'bg-clay',
  pine: 'bg-pine',
  iris: 'bg-iris',
  ochre: 'bg-ochre',
}

export const borderClasses: Record<Hue, string> = {
  clay: 'border-clay',
  pine: 'border-pine',
  iris: 'border-iris',
  ochre: 'border-ochre',
}

/** Very low opacity, for the oversized numerals sitting behind headings */
export const ghostClasses: Record<Hue, string> = {
  clay: 'text-clay/[0.11]',
  pine: 'text-pine/[0.11]',
  iris: 'text-iris/[0.11]',
  ochre: 'text-ochre/[0.11]',
}

/** Deterministic hue for anything without an explicit one — same input, same colour. */
export const hueCycle: Hue[] = ['clay', 'iris', 'pine', 'ochre']

export const hueAt = (index: number): Hue => hueCycle[index % hueCycle.length]!
