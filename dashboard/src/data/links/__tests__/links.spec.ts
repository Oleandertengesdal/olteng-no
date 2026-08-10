import { describe, it, expect } from 'vitest'
import {
  INSTITUTIONS,
  entriesFor,
  institutionById,
  isInstitutionId,
  totalLinkCount,
} from '../index.ts'
import { NATIONAL_LINKS } from '../national.ts'
import { GROUP_IDS } from '../types.ts'
import { fold, isStaleReview, monthsSince, searchEntries } from '../search.ts'

const all = entriesFor(institutionById('ntnu') ?? null)

describe('katalogen', () => {
  it('har de fem største lærestedene', () => {
    expect(INSTITUTIONS.map((i) => i.id)).toEqual(['ntnu', 'uio', 'oslomet', 'uib', 'uit'])
  })

  it('gir hver lenke en merknad på begge språk', () => {
    // Halvparten av lærestedenes systemer har navn som ikke sier noe. En lenke
    // uten forklaring er en lenke man ikke tør trykke på.
    for (const institution of INSTITUTIONS) {
      for (const group of institution.groups) {
        for (const link of group.links) {
          const where = `${institution.shortName}/${group.id}/${link.label}`
          expect(link.note.nb.length, where).toBeGreaterThan(10)
          expect(link.note.en.length, where).toBeGreaterThan(10)
        }
      }
    }
    for (const link of NATIONAL_LINKS) {
      expect(link.note.nb.length, link.label).toBeGreaterThan(10)
      expect(link.note.en.length, link.label).toBeGreaterThan(10)
    }
  })

  it('bruker https overalt', () => {
    for (const entry of INSTITUTIONS.flatMap((i) => entriesFor(i))) {
      expect(entry.link.url.startsWith('https://'), entry.link.label).toBe(true)
    }
  })

  it('har ingen tomme grupper', () => {
    for (const institution of INSTITUTIONS) {
      for (const group of institution.groups) {
        expect(group.links.length, `${institution.shortName}/${group.id}`).toBeGreaterThan(0)
      }
    }
  })

  it('dekker alle de fem gruppene for hvert lærested', () => {
    for (const institution of INSTITUTIONS) {
      const ids = institution.groups.map((g) => g.id).sort()
      expect(ids, institution.shortName).toEqual([...GROUP_IDS].sort())
    }
  })

  it('har ingen dupliserte adresser innenfor ett lærested', () => {
    for (const institution of INSTITUTIONS) {
      const urls = institution.groups.flatMap((g) => g.links.map((l) => l.url))
      expect(new Set(urls).size, institution.shortName).toBe(urls.length)
    }
  })

  it('har en gjennomgangsdato på hvert lærested', () => {
    for (const institution of INSTITUTIONS) {
      expect(institution.reviewed, institution.shortName).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('finner et lærested på id', () => {
    expect(institutionById('uib')?.shortName).toBe('UiB')
    expect(institutionById('finnes-ikke')).toBeUndefined()
    expect(isInstitutionId('ntnu')).toBe(true)
    expect(isInstitutionId('harvard')).toBe(false)
  })

  it('teller alle lenkene inkludert de nasjonale', () => {
    expect(totalLinkCount()).toBeGreaterThan(80)
  })
})

describe('entriesFor', () => {
  it('tar alltid med de nasjonale lenkene', () => {
    // Lånekassen trengs like mye uansett hvor man studerer.
    expect(all.some((e) => e.link.label === 'Lånekassen')).toBe(true)
  })

  it('gir bare de nasjonale når ingen lærested er valgt', () => {
    expect(entriesFor(null)).toHaveLength(NATIONAL_LINKS.length)
  })

  it('merker hvor hver lenke kommer fra', () => {
    const inspera = all.find((e) => e.link.label === 'Inspera')
    expect(inspera?.institution).toBe('NTNU')
    expect(all.find((e) => e.link.label === 'Lånekassen')?.institution).toBeNull()
  })
})

describe('fold', () => {
  it('folder æ, ø og å', () => {
    expect(fold('Lånekassen')).toBe('lanekassen')
    expect(fold('Ålesund')).toBe('alesund')
    expect(fold('Tromsø')).toBe('tromso')
    expect(fold('Læring')).toBe('laering')
  })

  it('fjerner kombinerende aksenter', () => {
    expect(fold('Café')).toBe('cafe')
  })
})

describe('searchEntries', () => {
  const search = (query: string) => searchEntries(query, all, 'nb').map((e) => e.link.label)

  it('finner et system på navnet', () => {
    expect(search('inspera')[0]).toBe('Inspera')
  })

  it('finner et system på hva det er til', () => {
    // Hele grunnen til at hver lenke har nøkkelord: ingen husker at
    // eksamenssystemet heter Inspera.
    expect(search('eksamen')).toContain('Inspera')
    expect(search('semesterregistrering')).toContain('Studentweb')
    expect(search('psykolog')).toContain('Helsetjenester')
  })

  it('finner Lånekassen uten at man skriver å', () => {
    expect(search('lanekassen')[0]).toBe('Lånekassen')
    expect(search('lån')[0]).toBe('Lånekassen')
  })

  it('setter navnetreff over merknadstreff', () => {
    const results = search('bibliotek')
    const exact = results.indexOf('Universitetsbiblioteket')
    const mention = results.indexOf('Åpningstider')
    expect(exact).toBeGreaterThanOrEqual(0)
    if (mention >= 0) expect(exact).toBeLessThan(mention)
  })

  it('krever at alle ordene treffer', () => {
    // «grupperom booking» skal gi rombestilling, ikke alt om enten rom eller
    // booking.
    const results = search('reservere rom')
    expect(results).toContain('Reservere rom')
    expect(results.length).toBeLessThan(search('rom').length)
  })

  it('gir ingenting for et tomt søk', () => {
    expect(search('')).toEqual([])
    expect(search('   ')).toEqual([])
  })

  it('gir ingenting for noe som ikke finnes', () => {
    expect(search('kvantefysikkbibliotek')).toEqual([])
  })

  it('finner på tvers av grupper', () => {
    expect(search('trening').length).toBeGreaterThan(0)
  })
})

describe('monthsSince', () => {
  it('teller hele kalendermåneder', () => {
    expect(monthsSince('2026-08-09', new Date(2026, 7, 9))).toBe(0)
    expect(monthsSince('2026-08-09', new Date(2026, 8, 8))).toBe(0)
    expect(monthsSince('2026-08-09', new Date(2026, 8, 9))).toBe(1)
    expect(monthsSince('2026-08-09', new Date(2027, 1, 9))).toBe(6)
  })

  it('går ikke i minus for en dato i framtiden', () => {
    expect(monthsSince('2027-01-01', new Date(2026, 7, 9))).toBe(0)
  })

  it('behandler en ugyldig dato som uendelig gammel', () => {
    expect(monthsSince('i fjor', new Date(2026, 7, 9))).toBe(Infinity)
  })
})

describe('isStaleReview', () => {
  it('sier fra etter et halvt år', () => {
    // Omtrent et semester. NTNU rakk å bytte læringsplattform på den tiden.
    expect(isStaleReview('2026-08-09', new Date(2026, 11, 9))).toBe(false)
    expect(isStaleReview('2026-08-09', new Date(2027, 1, 9))).toBe(true)
  })
})
