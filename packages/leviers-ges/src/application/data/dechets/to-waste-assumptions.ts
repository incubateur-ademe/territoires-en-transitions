import type BigNumber from 'bignumber.js'
import { sum } from '../../../domain/big-number.ts'
import type { WasteTypeTreatment } from '../../../domain/waste-treatment.ts'
import type { AppliedAssumptions } from '../../estimate/estimate-result.ts'

function tonnesWithoutEmissionFactor(wasteTypes: readonly WasteTypeTreatment[]): BigNumber {
  const withoutStorageFactor = wasteTypes
    .filter(({ storageEmissionFactor }) => storageEmissionFactor === undefined)
    .map(({ storageTonnes }) => storageTonnes)
  const withoutIncinerationFactor = wasteTypes
    .filter(({ incinerationEmissionFactor }) => incinerationEmissionFactor === undefined)
    .map(({ incinerationTonnes }) => incinerationTonnes)
  return sum([...withoutStorageFactor, ...withoutIncinerationFactor])
}

function toWasteScopeAssumption(): AppliedAssumptions {
  return {
    wasteScope: {
      value: 'sites de traitement situés dans le territoire',
      source:
        'DonneesTerritoires!L21 : tous les sites de traitement du territoire sont consolidés ; registre IREP 2022 (Géorisques), déchets non dangereux du chapitre 20, sites rattachés au territoire par leur commune',
      limit:
        'Les tonnes sont celles traitées dans le territoire, non celles qu’il produit : un territoire sans site de traitement a un résultat nul quels que soient les pourcentages, et une région dotée de grands sites pour ses voisines est surestimée. Un seul millésime (2022)',
    },
  }
}

function toUncoveredWasteAssumption(wasteTypes: readonly WasteTypeTreatment[]): AppliedAssumptions {
  const uncoveredTonnes = tonnesWithoutEmissionFactor(wasteTypes)
  if (uncoveredTonnes.isZero()) return {}
  return {
    wasteTonnesWithoutEmissionFactor: {
      value: uncoveredTonnes.toFixed(),
      source:
        'FE_déchets : la Base Empreinte n’a pas de facteur d’émission pour certains codes de déchets (surtout 20 02 02, terres et pierres, qui n’a pas de facteur de stockage)',
      limit:
        'Ces tonnes, stockées ou incinérées, sont ignorées par la formule : leurs émissions ne sont ni comptées ni évitées',
    },
  }
}

function toWasteAssumptions(wasteTypes: readonly WasteTypeTreatment[]): AppliedAssumptions {
  return { ...toWasteScopeAssumption(), ...toUncoveredWasteAssumption(wasteTypes) }
}

export { toWasteAssumptions }
