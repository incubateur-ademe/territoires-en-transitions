import { describe, expect, it } from 'vitest'
import {
  quantity,
  type Hectares,
  type TCo2ePerHectare,
  type TCo2ePerHectarePerYear,
} from '../../domain/units.ts'
import { calculateOccupationDesSolsStorage } from './calculate-occupation-des-sols-storage.ts'
import type {
  ForestAreas,
  GrasslandAreas,
  OccupationAreas,
  OccupationFactors,
} from './data/occupation-data.ts'

const hectares = (value: string): Hectares => quantity<'Hectares'>(value)
const annualFactor = (value: string): TCo2ePerHectarePerYear =>
  quantity<'TCo2ePerHectarePerYear'>(value)
const onceFactor = (value: string): TCo2ePerHectare => quantity<'TCo2ePerHectare'>(value)

function areas({
  cropland = '100',
  grassland = ['10', '30', '60'],
  forest = ['100', '300', '600', '0'],
  artificial = ['40', '60'],
}: {
  cropland?: string
  grassland?: readonly [string, string, string]
  forest?: readonly [string, string, string, string]
  artificial?: readonly [string, string]
}): OccupationAreas {
  const [wooded, herbaceous, shrub] = grassland
  const [mixed, broadleaf, conifer, poplar] = forest
  const grasslandAreas: GrasslandAreas = {
    wooded: hectares(wooded),
    herbaceous: hectares(herbaceous),
    shrub: hectares(shrub),
  }
  const forestAreas: ForestAreas = {
    mixed: hectares(mixed),
    broadleaf: hectares(broadleaf),
    conifer: hectares(conifer),
    poplar: hectares(poplar),
  }
  return {
    cropland: hectares(cropland),
    grassland: grasslandAreas,
    forest: forestAreas,
    artificial: { shrub: hectares(artificial[0]), wooded: hectares(artificial[1]) },
  }
}

const FACTORS: OccupationFactors = {
  grasslandToForest: {
    wooded: {
      mixed: annualFactor('10'),
      broadleaf: annualFactor('20'),
      conifer: annualFactor('30'),
      poplar: annualFactor('40'),
    },
    herbaceous: {
      mixed: annualFactor('20'),
      broadleaf: annualFactor('30'),
      conifer: annualFactor('40'),
      poplar: annualFactor('50'),
    },
    shrub: {
      mixed: annualFactor('30'),
      broadleaf: annualFactor('40'),
      conifer: annualFactor('50'),
      poplar: annualFactor('60'),
    },
  },
  toWetland: {
    cropland: annualFactor('5'),
    grassland: { wooded: annualFactor('15'), herbaceous: annualFactor('25'), shrub: annualFactor('10') },
  },
  imperviousToArtificial: { shrub: onceFactor('50'), wooded: onceFactor('80') },
}

function storage({
  afforestation = '2',
  wetland = '3',
  desealing = '1',
  horizon = '10',
  occupationAreas = areas({}),
  factors = FACTORS,
}: {
  afforestation?: string
  wetland?: string
  desealing?: string
  horizon?: string
  occupationAreas?: OccupationAreas
  factors?: OccupationFactors
}): string {
  return calculateOccupationDesSolsStorage({
    afforestationHectaresPerYear: quantity<'HectaresPerYear'>(afforestation),
    wetlandDevelopmentHectaresPerYear: quantity<'HectaresPerYear'>(wetland),
    desealingHectaresPerYear: quantity<'HectaresPerYear'>(desealing),
    horizonYears: quantity<'Years'>(horizon),
    areas: occupationAreas,
    factors,
  }).toFixed()
}

describe('calculateOccupationDesSolsStorage', () => {
  it('additionne les trois stratégies : 2 × 10 × 40 + 3 × 10 × 10 + 1 × 68 = 1 168 tCO2e', () => {
    expect(storage({})).toBe('1168')
  })

  it('l’afforestation pondère les types de forêt par leur surface et les prairies par la leur : 2 × 10 × 40 = 800', () => {
    expect(storage({ wetland: '0', desealing: '0' })).toBe('800')
  })

  it('les zones humides pondèrent les cultures et les prairies par leur surface : 3 × 10 × 10 = 300', () => {
    expect(storage({ afforestation: '0', desealing: '0' })).toBe('300')
  })

  it('la désimperméabilisation pondère les sols arborés et enherbés par leur surface : 1 × 68 = 68', () => {
    expect(storage({ afforestation: '0', wetland: '0' })).toBe('68')
  })

  it('l’horizon multiplie l’afforestation et les zones humides, pas la désimperméabilisation', () => {
    expect([storage({ horizon: '20' }), storage({ horizon: '1' })]).toEqual(['2268', '178'])
  })

  it('sans rythme, rien n’est stocké', () => {
    expect(storage({ afforestation: '0', wetland: '0', desealing: '0' })).toBe('0')
  })

  it('sans forêt, l’afforestation ne stocke rien', () => {
    const noForest = areas({ forest: ['0', '0', '0', '0'] })
    expect(storage({ wetland: '0', desealing: '0', occupationAreas: noForest })).toBe('0')
  })

  it('sans prairie, l’afforestation ne stocke rien', () => {
    const noGrassland = areas({ grassland: ['0', '0', '0'] })
    expect(storage({ wetland: '0', desealing: '0', occupationAreas: noGrassland })).toBe('0')
  })

  it('sans prairie ni culture, les zones humides ne stockent rien', () => {
    const none = areas({ cropland: '0', grassland: ['0', '0', '0'] })
    expect(storage({ afforestation: '0', desealing: '0', occupationAreas: none })).toBe('0')
  })

  it('sans sol artificiel arboré ni enherbé, la désimperméabilisation ne stocke rien', () => {
    const noArtificial = areas({ artificial: ['0', '0'] })
    expect(storage({ afforestation: '0', wetland: '0', occupationAreas: noArtificial })).toBe('0')
  })

  it('un facteur négatif déstocke : le résultat peut être négatif', () => {
    const destocking: OccupationFactors = {
      ...FACTORS,
      imperviousToArtificial: { shrub: onceFactor('-50'), wooded: onceFactor('-80') },
    }
    expect(
      storage({ afforestation: '0', wetland: '0', desealing: '2', factors: destocking }),
    ).toBe('-136')
  })

  it('garde les décimales d’une moyenne pondérée : 1/3 de la surface à 3 et 2/3 à 0 donnent 1', () => {
    const oneThird = areas({ artificial: ['1', '2'] })
    const factors: OccupationFactors = {
      ...FACTORS,
      imperviousToArtificial: { shrub: onceFactor('3'), wooded: onceFactor('0') },
    }
    expect(
      storage({ afforestation: '0', wetland: '0', desealing: '1', occupationAreas: oneThird, factors }),
    ).toBe('1')
  })
})
