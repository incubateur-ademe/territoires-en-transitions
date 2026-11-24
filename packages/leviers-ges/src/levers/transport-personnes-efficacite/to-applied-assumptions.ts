import {
  toBusEmissionFactorAssumption,
  toBusFleetUnclassifiedAssumption,
  toCarFleetUnclassifiedAssumption,
  toNationalBusAssumption,
  toNationalCarAssumption,
} from '../../application/data/transport-personnes/to-fleet-assumptions.ts'
import type { AppliedAssumptions } from '../../application/estimate/estimate-result.ts'
import { ECODRIVING_POTENTIAL } from './calculate-transport-personnes-efficacite-reduction.ts'
import type { RailShare } from '../../application/data/transport-personnes/resolve-rail-share.ts'
import { toRailShareAssumption } from '../../application/data/transport-personnes/to-rail-share-assumption.ts'
import type { TransportInputs } from '../../application/data/transport-personnes/transport-inputs.ts'

function toEcodrivingPotentialAssumption(): AppliedAssumptions {
  return {
    ecodrivingPotential: {
      value: ECODRIVING_POTENTIAL.toFixed(),
      source:
        'Documentation fonctionnelle (juin 2026), 7.3.4.3, p. 61 : le potentiel est le même pour les transports en commun routiers et les voitures, 10 % par défaut (enquête IPSOS) ; le tableur donne environ 15 % (DonneesReference!D29), la documentation prévaut ; confirmé par l’équipe le 19/11/2026',
      limit:
        'Un potentiel moyen unique pour les voitures et pour les bus : le résultat lui est proportionnel. La documentation indique un maximum de 23 % de carburant pour une citadine essence et environ la moitié des gestes d’écoconduite déjà appliqués',
    },
  }
}

function toAppliedAssumptions({
  transportInputs,
  railShare,
}: {
  transportInputs: TransportInputs
  railShare: RailShare
}): AppliedAssumptions {
  return {
    ...toEcodrivingPotentialAssumption(),
    ...toBusEmissionFactorAssumption(transportInputs),
    ...toRailShareAssumption(railShare),
    ...toCarFleetUnclassifiedAssumption(transportInputs),
    ...toBusFleetUnclassifiedAssumption(transportInputs),
    ...toNationalCarAssumption(transportInputs),
    ...toNationalBusAssumption(transportInputs),
  }
}

export { toAppliedAssumptions }
