import {
  calculateBusEmissionFactorPerPassengerKm,
  calculateCarEmissionFactorPerPassengerKm,
} from '../../../domain/vehicle-occupancy.ts'
import type { AppliedAssumptions } from '../../estimate/estimate-result.ts'
import { FLEET_SOURCE } from './fleet-source.ts'
import type { TransportInputs } from './transport-inputs.ts'

function toBusEmissionFactorAssumption(transportInputs: TransportInputs): AppliedAssumptions {
  const busEmissionFactorPerPassengerKm = calculateBusEmissionFactorPerPassengerKm(
    transportInputs.busEmissionFactor,
  )
  return {
    busEmissionFactor: {
      value: busEmissionFactorPerPassengerKm.toFixed(),
      source:
        'OMINEA 2024 (CITEPA), bus et cars Euro VI, en kgCO2e par passager.km, pondérés par le parc du territoire. Choix de conception, non validé : la valeur basse est retenue',
      limit:
        'La Base Empreinte donne 0,0874 kgCO2e par passager.km pour un bus diesel, soit 8,6 % de plus que l’OMINEA 0,0805',
    },
  }
}

function toCarFleetUnclassifiedAssumption(transportInputs: TransportInputs): AppliedAssumptions {
  if (transportInputs.carFleetUnclassifiedShare.isZero()) return {}
  return {
    carFleetUnclassifiedShare: {
      value: transportInputs.carFleetUnclassifiedShare.toFixed(),
      source: FLEET_SOURCE,
      limit:
        'Les voitures roulant avec un autre carburant que l’essence, le diesel, le gaz ou l’électricité n’ont pas de facteur d’émission et sont exclues de la moyenne du parc',
    },
  }
}

function toBusFleetUnclassifiedAssumption(transportInputs: TransportInputs): AppliedAssumptions {
  if (transportInputs.busFleetUnclassifiedShare.isZero()) return {}
  return {
    busFleetUnclassifiedShare: {
      value: transportInputs.busFleetUnclassifiedShare.toFixed(),
      source: FLEET_SOURCE,
      limit:
        'Les bus et cars roulant à l’essence ou avec un autre carburant n’ont pas de facteur d’émission et sont exclus de la moyenne du parc',
    },
  }
}

function toNationalCarAssumption(transportInputs: TransportInputs): AppliedAssumptions {
  if (!transportInputs.carFleetClassified.isZero()) return {}
  const carEmissionFactorPerPassengerKm = calculateCarEmissionFactorPerPassengerKm(
    transportInputs.carEmissionFactor,
  )
  return {
    nationalCarEmissionFactor: {
      value: carEmissionFactorPerPassengerKm.toFixed(),
      source: `${FLEET_SOURCE}, France métropolitaine`,
      limit:
        'Le territoire n’a aucune voiture classée dans le parc : la moyenne nationale du parc s’applique, en kgCO2e par passager.km',
    },
  }
}

function toNationalBusAssumption(transportInputs: TransportInputs): AppliedAssumptions {
  if (!transportInputs.busFleetClassified.isZero()) return {}
  const busEmissionFactorPerPassengerKm = calculateBusEmissionFactorPerPassengerKm(
    transportInputs.busEmissionFactor,
  )
  return {
    nationalBusEmissionFactor: {
      value: busEmissionFactorPerPassengerKm.toFixed(),
      source: `${FLEET_SOURCE}, France métropolitaine`,
      limit:
        'Le territoire n’a aucun bus ni car classé dans le parc : la moyenne nationale du parc s’applique, en kgCO2e par passager.km',
    },
  }
}

export {
  toBusEmissionFactorAssumption,
  toBusFleetUnclassifiedAssumption,
  toCarFleetUnclassifiedAssumption,
  toNationalBusAssumption,
  toNationalCarAssumption,
}
