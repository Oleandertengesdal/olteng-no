import { describe, it, expect } from 'vitest'
import {
  breakpointFor,
  clampWidth,
  packRows,
  moveItem,
  moveItemTo,
  resizeItem,
  addItem,
  removeItem,
  isLayout,
  pruneUnknown,
  newInstanceId,
  COLUMNS,
  type Layout,
} from '../grid.ts'

const item = (id: string, w: number, h = 1) => ({ id, widget: 'clock', w, h })

const layout = (...widths: number[]): Layout =>
  widths.map((w, i) => item(String.fromCharCode(97 + i), w))

const ids = (l: Layout) => l.map((i) => i.id).join('')

describe('breakpointFor', () => {
  it('følger de samme knekkpunktene som Tailwind', () => {
    expect(breakpointFor(375)).toBe('mobile')
    expect(breakpointFor(639)).toBe('mobile')
    expect(breakpointFor(640)).toBe('tablet')
    expect(breakpointFor(1023)).toBe('tablet')
    expect(breakpointFor(1024)).toBe('desktop')
    expect(breakpointFor(2560)).toBe('desktop')
  })

  it('gir 12, 6 og 2 kolonner', () => {
    expect(COLUMNS.desktop).toBe(12)
    expect(COLUMNS.tablet).toBe(6)
    expect(COLUMNS.mobile).toBe(2)
  })
})

describe('clampWidth', () => {
  it('lar ingen widget bli bredere enn rutenettet', () => {
    // En 6 celler bred widget på mobil må bli 2, ikke renne ut av skjermen.
    expect(clampWidth(6, 2)).toBe(2)
    expect(clampWidth(4, 12)).toBe(4)
  })

  it('lar ingen widget bli smalere enn én celle', () => {
    expect(clampWidth(0, 12)).toBe(1)
    expect(clampWidth(-3, 12)).toBe(1)
  })
})

describe('packRows', () => {
  it('fyller rader i rekkefølge', () => {
    const rows = packRows(layout(4, 4, 4, 6), 12)
    expect(rows.map((r) => r.map((i) => i.id))).toEqual([['a', 'b', 'c'], ['d']])
  })

  it('bruker klemt bredde, slik at mobilrader stemmer', () => {
    // Tre widgets på 6 celler hver, i et rutenett på 2: én per rad.
    const rows = packRows(layout(6, 6, 6), 2)
    expect(rows).toHaveLength(3)
  })

  it('lar en widget som er bredere enn raden få raden for seg selv', () => {
    const rows = packRows(layout(3, 12, 3), 12)
    expect(rows.map((r) => r.map((i) => i.id))).toEqual([['a'], ['b'], ['c']])
  })

  it('gir ingen rader for et tomt oppsett', () => {
    expect(packRows([], 12)).toEqual([])
  })
})

describe('moveItem', () => {
  it('bytter plass med naboen til venstre og høyre', () => {
    const l = layout(3, 3, 3)
    expect(ids(moveItem(l, 'b', 'left', 12))).toBe('bac')
    expect(ids(moveItem(l, 'b', 'right', 12))).toBe('acb')
  })

  it('lar første og siste bli stående framfor å gå rundt', () => {
    const l = layout(3, 3, 3)
    // Samme referanse tilbake: den som kaller kan se at ingenting skjedde.
    expect(moveItem(l, 'a', 'left', 12)).toBe(l)
    expect(moveItem(l, 'c', 'right', 12)).toBe(l)
  })

  it('flytter til begynnelsen av raden over', () => {
    // Rader: [a b c] [d e f]
    const l = layout(4, 4, 4, 4, 4, 4)
    expect(ids(moveItem(l, 'e', 'up', 12))).toBe('eabcdf')
  })

  it('flytter til slutten av raden under', () => {
    const l = layout(4, 4, 4, 4, 4, 4)
    expect(ids(moveItem(l, 'b', 'down', 12))).toBe('acdefb')
  })

  it('lar øverste rad være øverst og nederste være nederst', () => {
    const l = layout(4, 4, 4, 4)
    expect(moveItem(l, 'a', 'up', 12)).toBe(l)
    expect(moveItem(l, 'd', 'down', 12)).toBe(l)
  })

  it('gjør ingenting for en ukjent id', () => {
    const l = layout(3, 3)
    expect(moveItem(l, 'ukjent', 'left', 12)).toBe(l)
  })

  it('endrer ikke oppsettet som ble sendt inn', () => {
    const l = layout(3, 3, 3)
    const before = ids(l)
    moveItem(l, 'b', 'left', 12)
    expect(ids(l)).toBe(before)
  })
})

describe('moveItemTo', () => {
  it('slipper en widget på plassen til en annen', () => {
    const l = layout(3, 3, 3, 3)
    expect(ids(moveItemTo(l, 'd', 'a'))).toBe('dabc')
    expect(ids(moveItemTo(l, 'a', 'd'))).toBe('bcda')
  })

  it('gjør ingenting når man slipper på seg selv', () => {
    const l = layout(3, 3)
    expect(moveItemTo(l, 'a', 'a')).toBe(l)
  })
})

describe('resizeItem', () => {
  const sizes = [
    { w: 3, h: 2 },
    { w: 4, h: 2 },
    { w: 6, h: 2 },
  ]

  it('går ett steg opp og ned i widgetens egen liste', () => {
    const l: Layout = [{ id: 'a', widget: 'clock', w: 4, h: 2 }]
    expect(resizeItem(l, 'a', sizes, 'grow')[0]).toMatchObject({ w: 6, h: 2 })
    expect(resizeItem(l, 'a', sizes, 'shrink')[0]).toMatchObject({ w: 3, h: 2 })
  })

  it('stopper i hver ende framfor å gå rundt', () => {
    const smallest: Layout = [{ id: 'a', widget: 'clock', w: 3, h: 2 }]
    const largest: Layout = [{ id: 'a', widget: 'clock', w: 6, h: 2 }]
    expect(resizeItem(smallest, 'a', sizes, 'shrink')).toBe(smallest)
    expect(resizeItem(largest, 'a', sizes, 'grow')).toBe(largest)
  })

  it('begynner på minste når lagret størrelse ikke finnes lenger', () => {
    // Kommer av at en widget har endret sine tillatte størrelser mellom to
    // utgivelser mens brukeren hadde den gamle lagret.
    const stale: Layout = [{ id: 'a', widget: 'clock', w: 5, h: 9 }]
    expect(resizeItem(stale, 'a', sizes, 'grow')[0]).toMatchObject({ w: 4, h: 2 })
  })

  it('regner areal og ikke bredde når den sorterer', () => {
    const mixed = [
      { w: 4, h: 1 },
      { w: 2, h: 2 },
      { w: 3, h: 3 },
    ]
    const l: Layout = [{ id: 'a', widget: 'clock', w: 2, h: 2 }]
    expect(resizeItem(l, 'a', mixed, 'grow')[0]).toMatchObject({ w: 4, h: 1 })
  })
})

describe('legge til og fjerne', () => {
  it('gir hver forekomst sin egen id', () => {
    const a = newInstanceId('clock')
    const b = newInstanceId('clock')
    expect(a).not.toBe(b)
    expect(a.startsWith('clock-')).toBe(true)
  })

  it('legger til bakerst med widgetens standardstørrelse', () => {
    const l = addItem([], 'clock', { w: 4, h: 2 })
    expect(l).toHaveLength(1)
    expect(l[0]).toMatchObject({ widget: 'clock', w: 4, h: 2 })
  })

  it('fjerner bare den ene forekomsten', () => {
    const l = layout(3, 3, 3)
    expect(ids(removeItem(l, 'b'))).toBe('ac')
  })
})

describe('isLayout', () => {
  it('godtar et gyldig oppsett', () => {
    expect(isLayout([])).toBe(true)
    expect(isLayout(layout(3, 4))).toBe(true)
  })

  it('avviser det som ikke kan tegnes', () => {
    expect(isLayout(null)).toBe(false)
    expect(isLayout({})).toBe(false)
    expect(isLayout([{ id: 'a', widget: 'clock', w: 0, h: 1 }])).toBe(false)
    expect(isLayout([{ id: '', widget: 'clock', w: 1, h: 1 }])).toBe(false)
    expect(isLayout([{ id: 'a', widget: 'clock', w: 1.5, h: 1 }])).toBe(false)
    expect(isLayout([{ id: 'a', w: 1, h: 1 }])).toBe(false)
  })
})

describe('pruneUnknown', () => {
  it('luker bort widgets som ikke finnes lenger', () => {
    const stored: Layout = [item('a', 3), { id: 'b', widget: 'fjernet', w: 3, h: 1 }]
    expect(ids(pruneUnknown(stored, new Set(['clock'])))).toBe('a')
  })
})
