import type BigNumber from 'bignumber.js'
import { sum, toBig } from '../../domain/big-number.ts'
import {
  quantity,
  type HectaresPerYear,
  type TonnesCo2ePerYear,
  type Years,
} from '../../domain/units.ts'
import type { OccupationAreas, OccupationFactors } from './data/occupation-data.ts'

type WeightedFactor = { readonly area: BigNumber; readonly factor: BigNumber }

// Source : choix de conception, non validé : sans aucune surface à convertir (ni prairie, ni forêt, ni prairie et culture, ni sol artificiel arboré et enherbé), le facteur moyen d'un terme vaut 0 plutôt qu'une division par zéro
const NO_FACTOR: BigNumber = toBig('0')

function calculateAverageFactor(entries: readonly WeightedFactor[]): BigNumber {
  const totalArea = sum(entries.map(({ area }) => area))
  if (totalArea.isZero()) return NO_FACTOR
  const weightedFactors = sum(entries.map(({ area, factor }) => area.times(factor)))
  return weightedFactors.dividedBy(totalArea)
}

type OccupationFactorsInput = { areas: OccupationAreas; factors: OccupationFactors }

type ForestType = keyof OccupationAreas['forest']

function calculateFactorToForest({
  type,
  areas,
  factors,
}: OccupationFactorsInput & { type: ForestType }): BigNumber {
  const { grassland } = areas
  const { grasslandToForest } = factors
  return calculateAverageFactor([
    { area: grassland.wooded, factor: grasslandToForest.wooded[type] },
    { area: grassland.herbaceous, factor: grasslandToForest.herbaceous[type] },
    { area: grassland.shrub, factor: grasslandToForest.shrub[type] },
  ])
}

function calculateAfforestationFactor(input: OccupationFactorsInput): BigNumber {
  const { forest } = input.areas
  return calculateAverageFactor([
    { area: forest.mixed, factor: calculateFactorToForest({ ...input, type: 'mixed' }) },
    { area: forest.broadleaf, factor: calculateFactorToForest({ ...input, type: 'broadleaf' }) },
    { area: forest.conifer, factor: calculateFactorToForest({ ...input, type: 'conifer' }) },
    { area: forest.poplar, factor: calculateFactorToForest({ ...input, type: 'poplar' }) },
  ])
}

function calculateWetlandFactor({ areas, factors }: OccupationFactorsInput): BigNumber {
  const { cropland, grassland } = areas
  return calculateAverageFactor([
    { area: cropland, factor: factors.toWetland.cropland },
    { area: grassland.wooded, factor: factors.toWetland.grassland.wooded },
    { area: grassland.herbaceous, factor: factors.toWetland.grassland.herbaceous },
    { area: grassland.shrub, factor: factors.toWetland.grassland.shrub },
  ])
}

function calculateDesealingFactor({ areas, factors }: OccupationFactorsInput): BigNumber {
  return calculateAverageFactor([
    { area: areas.artificial.shrub, factor: factors.imperviousToArtificial.shrub },
    { area: areas.artificial.wooded, factor: factors.imperviousToArtificial.wooded },
  ])
}

function calculateOccupationDesSolsStorage({
  afforestationHectaresPerYear,
  wetlandDevelopmentHectaresPerYear,
  desealingHectaresPerYear,
  horizonYears,
  areas,
  factors,
}: {
  afforestationHectaresPerYear: HectaresPerYear
  wetlandDevelopmentHectaresPerYear: HectaresPerYear
  desealingHectaresPerYear: HectaresPerYear
  horizonYears: Years
  areas: OccupationAreas
  factors: OccupationFactors
}): TonnesCo2ePerYear {
  const input = { areas, factors }
  const afforestedHectares = afforestationHectaresPerYear.times(horizonYears)
  const afforestationStorage = afforestedHectares.times(calculateAfforestationFactor(input))
  const wetlandHectares = wetlandDevelopmentHectaresPerYear.times(horizonYears)
  const wetlandStorage = wetlandHectares.times(calculateWetlandFactor(input))
  const desealingStorage = desealingHectaresPerYear.times(calculateDesealingFactor(input))
  const storage = sum([afforestationStorage, wetlandStorage, desealingStorage])
  return quantity<'TonnesCo2ePerYear'>(storage.toFixed())
}

export { calculateOccupationDesSolsStorage }
