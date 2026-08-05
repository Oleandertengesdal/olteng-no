import { describe, it, expect } from 'vitest'
import {
  ZONE_RINGS,
  ZONE_LABEL_ANCHORS,
  buildProjection,
  project,
  ringToPath,
  type LngLat,
} from '../data/norway'
import type { ZoneId } from '../data/power'

const zoneIds = Object.keys(ZONE_RINGS) as ZoneId[]

/** Ray casting — true when the point lies inside the ring */
const isInside = ([px, py]: LngLat, ring: LngLat[]): boolean => {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

describe('prisområdene som polygoner', () => {
  it('har alle fem områder', () => {
    expect(zoneIds.sort()).toEqual(['NO1', 'NO2', 'NO3', 'NO4', 'NO5'])
  })

  it.each(zoneIds)('%s er et gyldig polygon', (id) => {
    const ring = ZONE_RINGS[id]
    expect(ring.length).toBeGreaterThanOrEqual(4)

    // Ringen skal ikke lukkes eksplisitt — SVG gjør det med Z, og et duplisert
    // sluttpunkt ville gitt en null-lang kant.
    expect(ring[0]).not.toEqual(ring[ring.length - 1])
  })

  it.each(zoneIds)('%s har ingen gjentatte nabopunkter', (id) => {
    const ring = ZONE_RINGS[id]
    for (let i = 1; i < ring.length; i++) {
      expect(ring[i]).not.toEqual(ring[i - 1])
    }
  })

  it.each(zoneIds)('%s holder seg innenfor Norges utstrekning', (id) => {
    for (const [lng, lat] of ZONE_RINGS[id]) {
      expect(lng).toBeGreaterThan(4)
      expect(lng).toBeLessThan(32)
      expect(lat).toBeGreaterThan(57)
      expect(lat).toBeLessThan(72)
    }
  })
})

describe('grenser mellom naboområder', () => {
  const key = ([lng, lat]: LngLat) => `${lng},${lat}`

  // Møtes to områder, må de bruke nøyaktig samme koordinat. Avviker de med en
  // desimal, får du en hårfin hvit stripe mellom polygonene ved enkelte
  // zoomnivåer — en feil som er vanskelig å se og lett å teste.
  const shared: [ZoneId, ZoneId, LngLat][] = [
    ['NO2', 'NO5', [5.55, 59.45]],
    ['NO5', 'NO3', [5.9, 62.2]],
    ['NO3', 'NO4', [12.5, 66.2]],
    ['NO3', 'NO4', [14.6, 66.3]],
    ['NO2', 'NO1', [9.3, 58.75]],
    ['NO3', 'NO1', [12.2, 62.6]],
  ]

  it.each(shared)('%s og %s deler punktet %j', (a, b, corner) => {
    const target = key(corner)
    expect(ZONE_RINGS[a].map(key)).toContain(target)
    expect(ZONE_RINGS[b].map(key)).toContain(target)
  })

  it('lar tre områder møtes i det samme fjellpunktet', () => {
    const haukeli = key([7.5, 59.8])
    for (const id of ['NO1', 'NO2', 'NO5'] as ZoneId[]) {
      expect(ZONE_RINGS[id].map(key)).toContain(haukeli)
    }
  })
})

describe('etikettplassering', () => {
  it.each(zoneIds)('etiketten for %s ligger inne i sitt eget område', (id) => {
    expect(isInside(ZONE_LABEL_ANCHORS[id], ZONE_RINGS[id])).toBe(true)
  })

  it.each(zoneIds)('etiketten for %s ligger ikke inne i noe annet område', (id) => {
    const overlapping = zoneIds.filter(
      (other) => other !== id && isInside(ZONE_LABEL_ANCHORS[id], ZONE_RINGS[other]),
    )
    expect(overlapping).toEqual([])
  })
})

describe('projeksjon', () => {
  it('plasserer nord over sør og øst til høyre for vest', () => {
    const projection = buildProjection(420)
    const [nordkappX, nordkappY] = projection.point([25.78, 71.17])
    const [lindesnesX, lindesnesY] = projection.point([7.05, 58.0])

    // SVG teller y nedover, så «over» betyr lavere y
    expect(nordkappY).toBeLessThan(lindesnesY)
    expect(nordkappX).toBeGreaterThan(lindesnesX)
  })

  it('gir et stående format, slik Norge faktisk er', () => {
    const projection = buildProjection(420)
    expect(projection.height).toBeGreaterThan(projection.width)
  })

  it('holder alle punkter innenfor viewBoxen', () => {
    const projection = buildProjection(420)
    for (const ring of Object.values(ZONE_RINGS)) {
      for (const position of ring) {
        const [x, y] = projection.point(position)
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(projection.width)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(projection.height)
      }
    }
  })

  it('skalerer med bredden den får oppgitt', () => {
    const small = buildProjection(200)
    const large = buildProjection(400)
    expect(large.width / small.width).toBeCloseTo(2, 5)
    // Høyden skal følge med, ellers forvrenges kartet
    expect(large.height / small.height).toBeGreaterThan(1.9)
  })

  it('bruker Mercator, ikke en rett avbildning av breddegrad', () => {
    // Mercator strekker mot polene: ett grad-steg nær 70°N skal bli lengre enn
    // ett grad-steg nær 58°N.
    const nearPole = project([0, 71])[1] - project([0, 70])[1]
    const nearSouth = project([0, 59])[1] - project([0, 58])[1]
    expect(nearPole).toBeGreaterThan(nearSouth)
  })
})

describe('SVG-sti', () => {
  it('starter med M, fortsetter med L og lukkes med Z', () => {
    const projection = buildProjection(420)
    const path = ringToPath(ZONE_RINGS.NO2, projection)

    expect(path.startsWith('M ')).toBe(true)
    expect(path.endsWith(' Z')).toBe(true)
    expect(path.match(/L /g)?.length).toBe(ZONE_RINGS.NO2.length - 1)
  })

  it('inneholder ingen NaN', () => {
    const projection = buildProjection(420)
    for (const id of zoneIds) {
      expect(ringToPath(ZONE_RINGS[id], projection)).not.toContain('NaN')
    }
  })
})
