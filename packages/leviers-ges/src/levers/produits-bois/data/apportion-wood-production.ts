import { sum, toBig } from '../../../domain/big-number.ts'
import { quantity, type Hectares } from '../../../domain/units.ts'
import type { WoodProduction } from './wood-production.ts'

// Source : choix de conception, non validé : un département sans forêt (Paris, 75) n'apporte aucune récolte à l'EPCI plutôt qu'une division par zéro
const NO_FOREST_SHARE = toBig('0')

type DepartementContribution = {
  readonly epciForest: Hectares
  readonly departementForest: Hectares
  readonly departementProduction: WoodProduction
}

function toForestShare({ epciForest, departementForest }: DepartementContribution) {
  return departementForest.isZero() ? NO_FOREST_SHARE : epciForest.dividedBy(departementForest)
}

function apportionWoodProduction(contributions: readonly DepartementContribution[]): WoodProduction {
  const weighted = contributions.map((contribution) => ({
    production: contribution.departementProduction,
    share: toForestShare(contribution),
  }))
  const logs = weighted.map(({ production, share }) => production.logs.times(share))
  const industrialWood = weighted.map(({ production, share }) =>
    production.industrialWood.times(share),
  )
  return {
    logs: quantity<'ThousandCubicMetres'>(sum(logs).toFixed()),
    industrialWood: quantity<'ThousandCubicMetres'>(sum(industrialWood).toFixed()),
  }
}

export { apportionWoodProduction }
export type { DepartementContribution }
