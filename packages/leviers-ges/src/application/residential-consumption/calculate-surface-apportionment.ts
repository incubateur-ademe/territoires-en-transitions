import { sum, toBig } from '../../domain/big-number.ts'
import { quantity, type MegawattHours, type SquareMetres } from '../../domain/units.ts'

type SurfaceContribution = {
  readonly epciSurface: SquareMetres
  readonly departementSurface: SquareMetres
  readonly departementConsumption: MegawattHours
}

// Source : choix de conception, non validé : un département sans surface chauffée avec ce combustible n'apporte aucune consommation à l'EPCI plutôt qu'une division par zéro
const NO_SURFACE_SHARE = toBig('0')

function toSurfaceShare({ epciSurface, departementSurface }: SurfaceContribution) {
  return departementSurface.isZero() ? NO_SURFACE_SHARE : epciSurface.dividedBy(departementSurface)
}

function apportionBySurface(contributions: readonly SurfaceContribution[]): MegawattHours {
  const shares = contributions.map((contribution) =>
    contribution.departementConsumption.times(toSurfaceShare(contribution)),
  )
  return quantity<'MegawattHours'>(sum(shares).toFixed())
}

export { apportionBySurface }
export type { SurfaceContribution }
