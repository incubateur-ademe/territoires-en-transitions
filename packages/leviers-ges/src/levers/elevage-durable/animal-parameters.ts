import type BigNumber from 'bignumber.js'
import { toBig } from '../../domain/big-number.ts'
import type { AnimalType } from './data/animal-types.ts'

type ManureShares = {
  readonly liquid: BigNumber
  readonly solid: BigNumber
  readonly pasture: BigNumber
}

type ManureConversionFactors = {
  readonly liquid: BigNumber | undefined
  readonly solid: BigNumber
  readonly pasture: BigNumber
}

type AnimalParameters = {
  readonly entericEmissionFactor: BigNumber
  readonly volatileSolids: BigNumber
  readonly maximumMethaneCapacity: BigNumber
  readonly nitrogenExcretion: BigNumber
  readonly currentManureShares: ManureShares
  readonly methaneConversionFactors: ManureConversionFactors
  readonly canBeDigested: boolean
}

// Source : Base Carbone de l'ADEME, documentation « Agriculture - cheptels » (OMINEA 2013 du CITEPA, copie dans data/elevage-durable/sources/) : fermentation entérique en kg CH4 par tête et par an, SV en kg par jour (milieu de la plage pour les bovins, 3,46-4,12 et 1,93-1,99), Bo en m3 par kg de SV, Fex 2011 en kg d'azote par place et par an, SG 2010 (valeurs de 1990-2011 pour les bovins) ; FCM : lisier 39 % pour les bovins et les porcins, 1,5 % pour les volailles, non applicable pour les autres ; fumier 1 %, 1,5 % pour les volailles ; pâture 1 % ; lecture des cellules fusionnées du tableau FCM et milieu des plages : choix de conception, non validé
const ANIMAL_PARAMETERS: Readonly<Record<AnimalType, AnimalParameters>> = {
  dairyCows: {
    entericEmissionFactor: toBig('121'),
    volatileSolids: toBig('3.79'),
    maximumMethaneCapacity: toBig('0.24'),
    nitrogenExcretion: toBig('115.6'),
    currentManureShares: { liquid: toBig('0.41'), solid: toBig('0.2'), pasture: toBig('0.39') },
    methaneConversionFactors: { liquid: toBig('0.39'), solid: toBig('0.01'), pasture: toBig('0.01') },
    canBeDigested: true,
  },
  otherCattle: {
    entericEmissionFactor: toBig('51'),
    volatileSolids: toBig('1.96'),
    maximumMethaneCapacity: toBig('0.17'),
    nitrogenExcretion: toBig('59.1'),
    currentManureShares: { liquid: toBig('0.27'), solid: toBig('0.3'), pasture: toBig('0.43') },
    methaneConversionFactors: { liquid: toBig('0.39'), solid: toBig('0.01'), pasture: toBig('0.01') },
    canBeDigested: true,
  },
  sows: {
    entericEmissionFactor: toBig('2.5'),
    volatileSolids: toBig('0.5'),
    maximumMethaneCapacity: toBig('0.45'),
    nitrogenExcretion: toBig('21.2'),
    currentManureShares: { liquid: toBig('0.88'), solid: toBig('0.1'), pasture: toBig('0.02') },
    methaneConversionFactors: { liquid: toBig('0.39'), solid: toBig('0.01'), pasture: toBig('0.01') },
    canBeDigested: true,
  },
  otherPigs: {
    entericEmissionFactor: toBig('0.65'),
    volatileSolids: toBig('0.5'),
    maximumMethaneCapacity: toBig('0.45'),
    nitrogenExcretion: toBig('5.8'),
    currentManureShares: { liquid: toBig('0.93'), solid: toBig('0.06'), pasture: toBig('0.01') },
    methaneConversionFactors: { liquid: toBig('0.39'), solid: toBig('0.01'), pasture: toBig('0.01') },
    canBeDigested: true,
  },
  goats: {
    entericEmissionFactor: toBig('11.7'),
    volatileSolids: toBig('0.28'),
    maximumMethaneCapacity: toBig('0.17'),
    nitrogenExcretion: toBig('14.1'),
    currentManureShares: { liquid: toBig('0'), solid: toBig('0.88'), pasture: toBig('0.12') },
    methaneConversionFactors: { liquid: undefined, solid: toBig('0.01'), pasture: toBig('0.01') },
    canBeDigested: false,
  },
  sheep: {
    entericEmissionFactor: toBig('9.3'),
    volatileSolids: toBig('0.4'),
    maximumMethaneCapacity: toBig('0.19'),
    nitrogenExcretion: toBig('16.7'),
    currentManureShares: { liquid: toBig('0'), solid: toBig('0.26'), pasture: toBig('0.74') },
    methaneConversionFactors: { liquid: undefined, solid: toBig('0.01'), pasture: toBig('0.01') },
    canBeDigested: false,
  },
  horses: {
    entericEmissionFactor: toBig('21.8'),
    volatileSolids: toBig('1.72'),
    maximumMethaneCapacity: toBig('0.33'),
    nitrogenExcretion: toBig('60.2'),
    currentManureShares: { liquid: toBig('0'), solid: toBig('0.42'), pasture: toBig('0.58') },
    methaneConversionFactors: { liquid: undefined, solid: toBig('0.01'), pasture: toBig('0.01') },
    canBeDigested: false,
  },
  mulesAndDonkeys: {
    entericEmissionFactor: toBig('12.1'),
    volatileSolids: toBig('0.94'),
    maximumMethaneCapacity: toBig('0.33'),
    nitrogenExcretion: toBig('17.1'),
    currentManureShares: { liquid: toBig('0'), solid: toBig('0.42'), pasture: toBig('0.58') },
    methaneConversionFactors: { liquid: undefined, solid: toBig('0.01'), pasture: toBig('0.01') },
    canBeDigested: false,
  },
  layingHens: {
    entericEmissionFactor: toBig('0'),
    volatileSolids: toBig('0.1'),
    maximumMethaneCapacity: toBig('0.32'),
    nitrogenExcretion: toBig('0.61'),
    currentManureShares: { liquid: toBig('0.03'), solid: toBig('0.9'), pasture: toBig('0.07') },
    methaneConversionFactors: { liquid: toBig('0.015'), solid: toBig('0.015'), pasture: toBig('0.01') },
    canBeDigested: false,
  },
  broilers: {
    entericEmissionFactor: toBig('0'),
    volatileSolids: toBig('0.1'),
    maximumMethaneCapacity: toBig('0.32'),
    nitrogenExcretion: toBig('0.34'),
    currentManureShares: { liquid: toBig('0.03'), solid: toBig('0.9'), pasture: toBig('0.07') },
    methaneConversionFactors: { liquid: toBig('0.015'), solid: toBig('0.015'), pasture: toBig('0.01') },
    canBeDigested: false,
  },
  otherPoultry: {
    entericEmissionFactor: toBig('0'),
    volatileSolids: toBig('0.1'),
    maximumMethaneCapacity: toBig('0.32'),
    nitrogenExcretion: toBig('0.71'),
    currentManureShares: { liquid: toBig('0.03'), solid: toBig('0.9'), pasture: toBig('0.07') },
    methaneConversionFactors: { liquid: toBig('0.015'), solid: toBig('0.015'), pasture: toBig('0.01') },
    canBeDigested: false,
  },
}

export { ANIMAL_PARAMETERS }
export type { AnimalParameters, ManureConversionFactors, ManureShares }
