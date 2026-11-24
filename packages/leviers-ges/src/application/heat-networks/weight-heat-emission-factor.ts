import { sum } from '../../domain/big-number.ts'
import type { HeatNetwork } from '../../domain/heat-network.ts'
import { quantity, type KgCo2ePerKwh } from '../../domain/units.ts'

// Source : choix de conception, non validé : un territoire sans réseau de chaleur n'a pas de facteur
// d'émission de la chaleur, sa contribution est nulle (décision du 2026-10-08, à arbitrer avec l'ADEME)
const NO_NETWORK_EMISSION_FACTOR: KgCo2ePerKwh = quantity<'KgCo2ePerKwh'>('0')

function weightHeatEmissionFactor(networks: readonly HeatNetwork[]): KgCo2ePerKwh {
  const deliveredTotal = sum(networks.map((network) => network.deliveredMwh))
  if (deliveredTotal.isZero()) return NO_NETWORK_EMISSION_FACTOR
  const emissionsTotal = sum(
    networks.map((network) => network.deliveredMwh.times(network.emissionFactor)),
  )
  return quantity<'KgCo2ePerKwh'>(emissionsTotal.dividedBy(deliveredTotal).toFixed())
}

export { weightHeatEmissionFactor }
