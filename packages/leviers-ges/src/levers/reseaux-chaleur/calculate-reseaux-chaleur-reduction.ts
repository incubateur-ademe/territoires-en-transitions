import { sum } from '../../domain/big-number.ts'
import type { HeatNetwork } from '../../domain/heat-network.ts'
import { quantity } from '../../domain/units.ts'
import type { Fraction, TonnesCo2ePerYear } from '../../domain/units.ts'

function calculateReseauxChaleurReduction({
  reductionFraction,
  networks,
}: {
  reductionFraction: Fraction
  networks: readonly HeatNetwork[]
}): TonnesCo2ePerYear {
  const emissionsInTonnes = sum(
    networks.map((network) => network.deliveredMwh.times(network.emissionFactor)),
  )
  return quantity<'TonnesCo2ePerYear'>(emissionsInTonnes.times(reductionFraction).toFixed())
}

export { calculateReseauxChaleurReduction }
