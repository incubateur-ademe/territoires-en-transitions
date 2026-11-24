import { sum } from '../../domain/big-number.ts'
import { quantity } from '../../domain/units.ts'
import type { Hectares, TCo2ePerHectarePerYear, TonnesCo2ePerYear } from '../../domain/units.ts'

type StockingPracticeSurfaces = {
  readonly intermediateCrops: Hectares
  readonly permanentVineyardGrassing: Hectares
  readonly winterIntercropVineyard: Hectares
  readonly agroforestry: Hectares
  readonly temporaryGrasslandExtension: Hectares
}

type StockingPractice = keyof StockingPracticeSurfaces

// Source : documentation fonctionnelle PlanET (juin 2026), p. 73, étude « A marginal abatement cost curve for climate change
// mitigation by additional carbon storage in French agricultural land » (Bamière et al. 2023) : cultures intermédiaires,
// -0,753 tCO2e/ha/an (émissions nettes, valeur absolue retenue pour exprimer le stockage). PlanET V1, DonneesReference!C19
const INTERMEDIATE_CROPS_STORAGE_FACTOR: TCo2ePerHectarePerYear = quantity<'TCo2ePerHectarePerYear'>('0.753')

// Source : documentation fonctionnelle PlanET, p. 73, même étude : enherbement permanent d'un inter-rang sur deux,
// dans certains vignobles, -1,534 tCO2e/ha/an (valeur absolue)
const PERMANENT_VINEYARD_GRASSING_STORAGE_FACTOR: TCo2ePerHectarePerYear =
  quantity<'TCo2ePerHectarePerYear'>('1.534')

// Source : documentation fonctionnelle PlanET, p. 73, même étude : cultures intercalaires temporaires hivernales,
// dans certains vignobles, -1,087 tCO2e/ha/an (valeur absolue)
const WINTER_INTERCROP_VINEYARD_STORAGE_FACTOR: TCo2ePerHectarePerYear =
  quantity<'TCo2ePerHectarePerYear'>('1.087')

// Source : documentation fonctionnelle PlanET, p. 73, même étude : agroforesterie, -4,078 tCO2e/ha/an (valeur absolue)
const AGROFORESTRY_STORAGE_FACTOR: TCo2ePerHectarePerYear = quantity<'TCo2ePerHectarePerYear'>('4.078')

// Source : documentation fonctionnelle PlanET, p. 73, même étude : accroissement de la durée des prairies temporaires,
// -0,903 tCO2e/ha/an (valeur absolue)
const TEMPORARY_GRASSLAND_EXTENSION_STORAGE_FACTOR: TCo2ePerHectarePerYear =
  quantity<'TCo2ePerHectarePerYear'>('0.903')

// Source : regroupement des cinq constantes précédentes, une par pratique stockante retenue par la documentation fonctionnelle (p. 72)
const STORAGE_FACTORS: Readonly<Record<StockingPractice, TCo2ePerHectarePerYear>> = {
  intermediateCrops: INTERMEDIATE_CROPS_STORAGE_FACTOR,
  permanentVineyardGrassing: PERMANENT_VINEYARD_GRASSING_STORAGE_FACTOR,
  winterIntercropVineyard: WINTER_INTERCROP_VINEYARD_STORAGE_FACTOR,
  agroforestry: AGROFORESTRY_STORAGE_FACTOR,
  temporaryGrasslandExtension: TEMPORARY_GRASSLAND_EXTENSION_STORAGE_FACTOR,
}

function calculatePratiquesStockantesReduction(surfaces: StockingPracticeSurfaces): TonnesCo2ePerYear {
  const intermediateCropsStorage = surfaces.intermediateCrops.times(STORAGE_FACTORS.intermediateCrops)
  const permanentVineyardGrassingStorage = surfaces.permanentVineyardGrassing.times(
    STORAGE_FACTORS.permanentVineyardGrassing,
  )
  const winterIntercropVineyardStorage = surfaces.winterIntercropVineyard.times(
    STORAGE_FACTORS.winterIntercropVineyard,
  )
  const agroforestryStorage = surfaces.agroforestry.times(STORAGE_FACTORS.agroforestry)
  const temporaryGrasslandExtensionStorage = surfaces.temporaryGrasslandExtension.times(
    STORAGE_FACTORS.temporaryGrasslandExtension,
  )
  const totalStorage = sum([
    intermediateCropsStorage,
    permanentVineyardGrassingStorage,
    winterIntercropVineyardStorage,
    agroforestryStorage,
    temporaryGrasslandExtensionStorage,
  ])
  return quantity<'TonnesCo2ePerYear'>(totalStorage.toFixed())
}

export { calculatePratiquesStockantesReduction }
export type { StockingPracticeSurfaces }
