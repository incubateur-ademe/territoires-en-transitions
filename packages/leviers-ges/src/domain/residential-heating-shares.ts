import type BigNumber from 'bignumber.js'
import { sum, toBig } from './big-number.ts'
import { quantity, type Fraction } from './units.ts'

type ResidentialEnergyVector = 'electricity' | 'naturalGas' | 'fuelOil' | 'liquefiedPetroleumGas' | 'heat'

type NationalUsage = {
  readonly heatingAndHotWater: BigNumber
  readonly allUses: BigNumber
}

function toShare({ heatingAndHotWater, allUses }: NationalUsage): Fraction {
  return quantity<'Fraction'>(heatingAndHotWater.dividedBy(allUses).toFixed())
}

// Source : documentation fonctionnelle PlanET (juin 2026), p. 51 : les consommations impactées par les leviers Rénovation et Changement de système de chauffage sont celles du chauffage et de l'eau chaude sanitaire ; SDES, « Consommation énergétique du secteur résidentiel » (Conso_usage), 2024, à climat réel, TWh PCI :
// électricité de chauffage (hors PAC 34,459046350223204 + PAC 10,5510417675111) et d'ECS (hors PAC 22,920677669989999 + PAC 1,4190073671907901) sur l'électricité tous usages (hors PAC 136,459186710296 + PAC 11,970049134701899). Choix de conception, non validé : la part nationale s'applique à chaque territoire
const ELECTRICITY_HEATING_AND_HOT_WATER_SHARE: Fraction = toShare({
  heatingAndHotWater: sum([
    toBig('34.459046350223204'),
    toBig('10.5510417675111'),
    toBig('22.920677669989999'),
    toBig('1.4190073671907901'),
  ]),
  allUses: toBig('136.459186710296').plus(toBig('11.970049134701899')),
})

// Source : documentation fonctionnelle PlanET (juin 2026), p. 51 ; SDES, Conso_usage, 2024, TWh PCI : gaz naturel, chauffage 81,257758783685603 et ECS 12,973144221213401 sur tous usages 101,76291646815. Choix de conception, non validé
const NATURAL_GAS_HEATING_AND_HOT_WATER_SHARE: Fraction = toShare({
  heatingAndHotWater: toBig('81.257758783685603').plus(toBig('12.973144221213401')),
  allUses: toBig('101.76291646815'),
})

// Source : documentation fonctionnelle PlanET (juin 2026), p. 51 ; SDES, Conso_usage, 2024, TWh PCI : fioul domestique, chauffage 25,893030524875698 et ECS 3,31670289970701 sur tous usages 29,209733424582701. Choix de conception, non validé
const FUEL_OIL_HEATING_AND_HOT_WATER_SHARE: Fraction = toShare({
  heatingAndHotWater: toBig('25.893030524875698').plus(toBig('3.31670289970701')),
  allUses: toBig('29.209733424582701'),
})

// Source : documentation fonctionnelle PlanET (juin 2026), p. 51 ; SDES, Conso_usage, 2024, TWh PCI : chaleur, chauffage 13,401216880281 et ECS 1,30819351940587 sur tous usages 14,709410399686901. Choix de conception, non validé
const HEAT_HEATING_AND_HOT_WATER_SHARE: Fraction = toShare({
  heatingAndHotWater: toBig('13.401216880281').plus(toBig('1.30819351940587')),
  allUses: toBig('14.709410399686901'),
})

// Source : documentation fonctionnelle PlanET (juin 2026), p. 51 ; SDES, Conso_usage, 2024, TWh PCI : GPL, chauffage 3,4440826812716301 et ECS 0,477378867665957 sur tous usages 7,3712892696473302. Choix de conception, non validé
const LIQUEFIED_PETROLEUM_GAS_HEATING_AND_HOT_WATER_SHARE: Fraction = toShare({
  heatingAndHotWater: toBig('3.4440826812716301').plus(toBig('0.477378867665957')),
  allUses: toBig('7.3712892696473302'),
})

// Source : choix de conception de ce dépôt, sans source externe : les parts nationales du chauffage et de l'ECS par vecteur, aucune par territoire (le CEREN n'est pas ouvert)
const HEATING_AND_HOT_WATER_SHARE: Readonly<Record<ResidentialEnergyVector, Fraction>> = {
  electricity: ELECTRICITY_HEATING_AND_HOT_WATER_SHARE,
  naturalGas: NATURAL_GAS_HEATING_AND_HOT_WATER_SHARE,
  fuelOil: FUEL_OIL_HEATING_AND_HOT_WATER_SHARE,
  liquefiedPetroleumGas: LIQUEFIED_PETROLEUM_GAS_HEATING_AND_HOT_WATER_SHARE,
  heat: HEAT_HEATING_AND_HOT_WATER_SHARE,
}

export { HEATING_AND_HOT_WATER_SHARE }
export type { ResidentialEnergyVector }
