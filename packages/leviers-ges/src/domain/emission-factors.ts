import type BigNumber from 'bignumber.js'
import { toBig } from './big-number.ts'
import { quantity } from './units.ts'
import type {
  Fraction,
  KgCo2ePerGigajoule,
  KgCo2ePerKwh,
  KgCo2ePerVehicleKilometre,
} from './units.ts'

// Source : Base Empreinte, élément 43642 (« Electricité 2024 - mix moyen », consommation, France continentale),
// validité de l'année 2024 : 0,0519 kgCO2e/kWh. PlanET V1, onglets Bâtiment&MachinesAgricoles et Residentiel_Sobriete :
// « Electricité mix moyen », renvoi au jeu de données de la Base Empreinte sans valeur figée
const ELECTRICITY_EMISSION_FACTOR: KgCo2ePerKwh = quantity<'KgCo2ePerKwh'>('0.0519')

// Source : documentation fonctionnelle PlanET (juin 2026), pp. 43, 50, 52 et 56 : 67,4 % est la part « combustion à la centrale »
// du facteur de la Base Empreinte, valeur 2024 (0,0350 ÷ 0,0519, élément 43642). PlanET V1, forme « FE de l'électricité * 67,4% » ;
// la documentation applique le même ratio à l'amont de l'électricité du ferré (p. 65)
const ELECTRICITY_EMISSION_FACTOR_SHARE: Fraction = quantity<'Fraction'>('0.674')

// Source : produit des deux constantes précédentes : 0,0519 × 67,4 % = 0,0349806 kgCO2e/kWh
const ELECTRICITY_APPLIED_EMISSION_FACTOR: KgCo2ePerKwh = quantity<'KgCo2ePerKwh'>(
  ELECTRICITY_EMISSION_FACTOR.times(ELECTRICITY_EMISSION_FACTOR_SHARE).toFixed(),
)

// Source : OMINEA, base BDD_OMINEA_A_EF, NAPFUE 301 (gaz naturel), 2024 : 55,88 kg CO2/GJ PCI (SNAP 020302, agriculture).
// Pour le résidentiel (SNAP 020202) OMINEA donne 55,8796, arrondi à 55,88 (choix de conception, non validé). PlanET V1, DonneesReference
const NATURAL_GAS_EMISSION_FACTOR: KgCo2ePerGigajoule = quantity<'KgCo2ePerGigajoule'>('55.88')

// Source : OMINEA, base BDD_OMINEA_A_EF, NAPFUE 204 (fioul domestique), SNAP 020202 (chauffage résidentiel), 2024 :
// 74,5229 kg CO2/GJ PCI, arrondi à 74,52 (choix de conception, non validé)
const FUEL_OIL_EMISSION_FACTOR: KgCo2ePerGigajoule = quantity<'KgCo2ePerGigajoule'>('74.52')

// Source : OMINEA, base BDD_OMINEA_A_EF, NAPFUE 303 (GPL), SNAP 020202 (chauffage résidentiel), 2024 :
// 63,1 kg CO2/GJ PCI
const LIQUEFIED_PETROLEUM_GAS_EMISSION_FACTOR: KgCo2ePerGigajoule =
  quantity<'KgCo2ePerGigajoule'>('63.1')

// Source : PlanET V1, DonneesReference!D16 « convertir GJ en kWh » : 1 kWh = 3,6 MJ = 0,0036 GJ
const GIGAJOULES_PER_KILOWATT_HOUR: BigNumber = toBig('0.0036')

// Source : Base Empreinte, élément 28007, voiture électrique compacte, amont seul, 13,345 g/véh.km (assumptions.md, electricVehicleEmissionFactors)
const ELECTRIC_CAR_EMISSION_FACTOR: KgCo2ePerVehicleKilometre =
  quantity<'KgCo2ePerVehicleKilometre'>('0.013345')

// Source : Base Empreinte, bus électrique, amont seul, 0,0095 kgCO2e/passager.km × 10 passagers par bus (assumptions.md, electricVehicleEmissionFactors)
const ELECTRIC_BUS_EMISSION_FACTOR: KgCo2ePerVehicleKilometre =
  quantity<'KgCo2ePerVehicleKilometre'>('0.095')

function convertToKgPerKwh(emissionFactor: KgCo2ePerGigajoule): KgCo2ePerKwh {
  return quantity<'KgCo2ePerKwh'>(emissionFactor.times(GIGAJOULES_PER_KILOWATT_HOUR).toFixed())
}

export {
  convertToKgPerKwh,
  ELECTRIC_BUS_EMISSION_FACTOR,
  ELECTRIC_CAR_EMISSION_FACTOR,
  ELECTRICITY_APPLIED_EMISSION_FACTOR,
  ELECTRICITY_EMISSION_FACTOR_SHARE,
  FUEL_OIL_EMISSION_FACTOR,
  LIQUEFIED_PETROLEUM_GAS_EMISSION_FACTOR,
  NATURAL_GAS_EMISSION_FACTOR,
}
