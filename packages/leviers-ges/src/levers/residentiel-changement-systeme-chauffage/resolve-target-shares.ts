import { err, ok, type Result } from 'neverthrow'
import { invalidRequest, type InvalidRequest } from '../../application/estimate/estimation-error.ts'
import { sum } from '../../domain/big-number.ts'
import { quantity, type Fraction } from '../../domain/units.ts'
import type {
  CurrentUsefulShares,
  TargetShares,
} from './calculate-residentiel-changement-systeme-chauffage-reduction.ts'
import type { HeatingVector } from './heating-reference.ts'

type RequestedShares = Readonly<Record<HeatingVector, Fraction | undefined>>

// Source : choix de conception de ce dépôt, non validé : une part non précisée vaut 0 quand il n'y a rien à répartir
const NO_SHARE: Fraction = quantity<'Fraction'>('0')

// Source : choix de conception de ce dépôt, non validé : une seule part non précisée prend tout le reste, la somme des parts cibles valant 100 % (PlanET V1, Residentiel_ChgtSyst!B15)
const SINGLE_SHARE_COUNT = 1

// Source : PlanET V1, Residentiel_ChgtSyst!B15 : la somme des parts cibles vaut 100 %
const WHOLE: Fraction = quantity<'Fraction'>('1')

function resolveTargetShares({
  requested,
  current,
}: {
  requested: RequestedShares
  current: CurrentUsefulShares
}): Result<TargetShares, InvalidRequest> {
  const vectors: readonly HeatingVector[] = ['electricity', 'naturalGas', 'fuelOil', 'wood', 'heat']
  const givenTotal = sum(vectors.map((vector) => requested[vector] ?? NO_SHARE))
  const remainder = WHOLE.minus(givenTotal)
  const unspecifiedCount = vectors.filter((vector) => requested[vector] === undefined).length
  const unspecifiedCurrentTotal = sum(
    vectors.map((vector) => (requested[vector] === undefined ? current.shares[vector] : NO_SHARE)),
  )
  const hasNothingToShare = current.usefulEnergy.isZero() || remainder.isZero()
  const hasSingleUnspecifiedShare = unspecifiedCount === SINGLE_SHARE_COUNT
  if (!hasNothingToShare && !hasSingleUnspecifiedShare && unspecifiedCurrentTotal.isZero())
    return err(
      invalidRequest([
        {
          parameter: 'parameters',
          message:
            'the unspecified target shares have no current use to share the remaining part of the energy: give all but one of them',
        },
      ]),
    )
  const sharedShareOf = (vector: HeatingVector): Fraction => {
    if (hasSingleUnspecifiedShare) return quantity<'Fraction'>(remainder.toFixed())
    const shareOfRemainder = current.shares[vector].times(remainder)
    return quantity<'Fraction'>(shareOfRemainder.dividedBy(unspecifiedCurrentTotal).toFixed())
  }
  const shareOf = (vector: HeatingVector): Fraction =>
    requested[vector] ?? (hasNothingToShare ? NO_SHARE : sharedShareOf(vector))
  return ok({
    electricity: shareOf('electricity'),
    naturalGas: shareOf('naturalGas'),
    fuelOil: shareOf('fuelOil'),
    wood: shareOf('wood'),
    heat: shareOf('heat'),
  })
}

export { resolveTargetShares }
