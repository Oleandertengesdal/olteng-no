import { describe, it, expect } from 'vitest'
import { projects, sortedProjects } from '../data/projects'
import { education, experience, skills, calculateAge, pick, pickList } from '../data/profile'

describe('project data', () => {
  it('gives every project a unique id', () => {
    const ids = projects.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('provides both languages for every title and description', () => {
    for (const project of projects) {
      expect(project.title.nb.length).toBeGreaterThan(0)
      expect(project.title.en.length).toBeGreaterThan(0)
      expect(project.description.nb.length).toBeGreaterThan(0)
      expect(project.description.en.length).toBeGreaterThan(0)
    }
  })

  it('sorts large projects before small ones without mutating the source', () => {
    const originalOrder = projects.map((p) => p.id)
    const order = { large: 0, medium: 1, small: 2 } as const
    const sizes = sortedProjects.map((p) => order[p.size])

    expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
    expect(projects.map((p) => p.id)).toEqual(originalOrder)
  })
})

describe('profile data', () => {
  it('keeps bilingual lists the same length in both languages', () => {
    for (const group of [...education, ...experience]) {
      if (!group.highlights) continue
      expect(group.highlights.nb.length).toBe(group.highlights.en.length)
    }
  })

  it('lists at least one skill in every group', () => {
    for (const group of skills) {
      expect(group.items.length).toBeGreaterThan(0)
    }
  })

  it('calculates age from a birth date', () => {
    const twenty = new Date()
    twenty.setFullYear(twenty.getFullYear() - 20)
    expect(calculateAge(twenty.toISOString().slice(0, 10))).toBe(20)
  })

  it('falls back to English for an unknown locale', () => {
    const value = { en: 'English', nb: 'Norsk' }
    expect(pick(value, 'nb')).toBe('Norsk')
    expect(pick(value, 'de')).toBe('English')
    expect(pickList({ en: ['a'], nb: ['b'] }, 'de')).toEqual(['a'])
  })
})
