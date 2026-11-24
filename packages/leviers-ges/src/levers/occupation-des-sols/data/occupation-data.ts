import type { Hectares, TCo2ePerHectare, TCo2ePerHectarePerYear } from '../../../domain/units.ts'

type GrasslandAreas = {
  readonly wooded: Hectares
  readonly herbaceous: Hectares
  readonly shrub: Hectares
}

type ForestAreas = {
  readonly mixed: Hectares
  readonly broadleaf: Hectares
  readonly conifer: Hectares
  readonly poplar: Hectares
}

type ArtificialAreas = {
  readonly shrub: Hectares
  readonly wooded: Hectares
}

type OccupationAreas = {
  readonly cropland: Hectares
  readonly grassland: GrasslandAreas
  readonly forest: ForestAreas
  readonly artificial: ArtificialAreas
}

type GrasslandFactors<F> = {
  readonly wooded: F
  readonly herbaceous: F
  readonly shrub: F
}

type ForestFactors<F> = {
  readonly mixed: F
  readonly broadleaf: F
  readonly conifer: F
  readonly poplar: F
}

type OccupationFactors = {
  readonly grasslandToForest: GrasslandFactors<ForestFactors<TCo2ePerHectarePerYear>>
  readonly toWetland: {
    readonly cropland: TCo2ePerHectarePerYear
    readonly grassland: GrasslandFactors<TCo2ePerHectarePerYear>
  }
  readonly imperviousToArtificial: {
    readonly shrub: TCo2ePerHectare
    readonly wooded: TCo2ePerHectare
  }
}

export type {
  ArtificialAreas,
  ForestAreas,
  ForestFactors,
  GrasslandAreas,
  OccupationAreas,
  OccupationFactors,
}
