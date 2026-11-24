import type { AppliedAssumptions } from '../../application/estimate/estimate-result.ts'
import { ANIMAL_TYPES } from './data/animal-types.ts'
import {
  DIGESTION_METHANE_CONVERSION_FACTOR,
  DIGESTION_NITROUS_OXIDE_FACTOR,
} from './emission-constants.ts'
import type { ElevageDurableRequest } from './elevage-durable-request.ts'
import { DEFAULT_ENTERIC_EMISSION_REDUCTION } from './to-animal-changes.ts'

type RequestedAnimals = ElevageDurableRequest['parameters']['animals']

function toUnchangedAnimalsAssumption(animals: RequestedAnimals): AppliedAssumptions {
  const unchanged = ANIMAL_TYPES.filter((animalType) => animals[animalType] === undefined)
  if (unchanged.length === 0) return {}
  return {
    unchangedAnimals: {
      value: unchanged.join(', '),
      source: 'ElevageDurable : la formule somme sur les types d’animaux que la requête modifie',
      limit:
        'Ces types d’animaux sont absents de la requête : leur effectif, leurs émissions entériques et leur gestion des effluents sont laissés tels quels, ils ne contribuent donc en rien à la réduction',
    },
  }
}

function toDefaultedEntericAssumption(animals: RequestedAnimals): AppliedAssumptions {
  const defaulted = ANIMAL_TYPES.filter((animalType) => {
    const requested = animals[animalType]
    return requested !== undefined && requested.entericEmissionReductionFraction === undefined
  })
  if (defaulted.length === 0) return {}
  return {
    entericEmissionReductionFraction: {
      value: DEFAULT_ENTERIC_EMISSION_REDUCTION.toFixed(),
      source: 'ParametreDeterminants!I9 : valeur par défaut de la réduction du facteur d’émission de la fermentation entérique',
      limit: `Appliquée à : ${defaulted.join(', ')}. Le tableur annonce une borne sur cette réduction (ParametreDeterminants!D9) sans la donner`,
    },
  }
}

function toDigestionAssumption(animals: RequestedAnimals): AppliedAssumptions {
  const isDigestionRequested = ANIMAL_TYPES.some((animalType) => {
    const requested = animals[animalType]
    return requested !== undefined && !requested.targetManureShares.anaerobicDigestion.isZero()
  })
  if (!isDigestionRequested) return {}
  return {
    methanisationFactors: {
      value: `facteur de conversion du méthane ${DIGESTION_METHANE_CONVERSION_FACTOR.toFixed()}, ${DIGESTION_NITROUS_OXIDE_FACTOR.toFixed()} kg N-N2O par kg d’azote excrété`,
      source: 'OMINEA 2026 du CITEPA, bovins et porcins',
      limit:
        'Les documents que cite le tableur ne donnent aucun facteur pour la méthanisation. Non disponible pour les autres types d’animaux : une requête qui méthanise leurs effluents est refusée',
    },
  }
}

function toStaticAssumptions(): AppliedAssumptions {
  return {
    currentManureShares: {
      value: 'parts nationales de lisier, de fumier et de pâturage, méthanisation à 0',
      source:
        'ElevageDurable!B15 et OMINEA 2013 du CITEPA (valeurs 2010, 1990-2011 pour les bovins), Base Carbone, Agriculture - cheptels',
      limit:
        'Une répartition nationale unique pour tous les territoires : aucun effet pédoclimatique, et un territoire qui méthanise déjà une partie de ses effluents n’est pas représenté',
    },
    animalParameters: {
      value: 'facteurs OMINEA 2013, Base Carbone, Agriculture - cheptels',
      source:
        'DonneesReference!D9 à D15 : facteurs entériques, matières volatiles, capacité maximale de méthane, facteurs de conversion, excrétion d’azote (2011)',
      limit:
        'Vieux de treize ans : OMINEA 2026 donne 121,9 à 152,5 kg de CH4 par vache laitière (121 ici) et 118,7 kg d’azote excrété (115,6 ici). Les matières volatiles des bovins sont le milieu de la fourchette publiée',
    },
    livestockHeadcounts: {
      value: 'recensement agricole 2020, effectifs au lieu du siège de l’exploitation',
      source:
        'Agreste, recensement agricole 2020, cheptels ; cartostat pour les vaches laitières (estimées par cartostat là où Agreste est sous secret statistique)',
      limit:
        'Une exploitation sur deux départements est comptée là où se trouve son siège. Une catégorie sous secret statistique compte pour zéro, y compris lorsque sa catégorie parente est publiée (volailles, truies, équidés)',
    },
  }
}

function toAppliedAssumptions(animals: RequestedAnimals): AppliedAssumptions {
  return {
    ...toUnchangedAnimalsAssumption(animals),
    ...toDefaultedEntericAssumption(animals),
    ...toDigestionAssumption(animals),
    ...toStaticAssumptions(),
  }
}

export { toAppliedAssumptions }
