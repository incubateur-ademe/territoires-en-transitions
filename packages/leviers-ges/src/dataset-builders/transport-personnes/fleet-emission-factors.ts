import {
  ELECTRIC_BUS_EMISSION_FACTOR,
  ELECTRIC_CAR_EMISSION_FACTOR,
} from '../../domain/emission-factors.ts'

// Source : fiche d'analyse 11, calcul d'essai sur OMINEA v23.1 de mars 2026 (CO2 + 28 CH4 + 265 N2O, 50 % route et 50 % ville, normes Euro choisies par Crit'Air, parc métropolitain 2025) : diesel, 163,6 g/véh.km
const CAR_DIESEL_EMISSION_FACTOR = '0.1636'

// Source : fiche d'analyse 11, même calcul d'essai sur OMINEA v23.1 : essence, 171,1 g/véh.km
const CAR_PETROL_EMISSION_FACTOR = '0.1711'

// Source : fiche d'analyse 11, même calcul d'essai sur OMINEA v23.1 : gaz, par correspondance avec l'essence (choix de conception, non validé : le gaz dépasse l'essence), 231,5 g/véh.km
const CAR_GAS_EMISSION_FACTOR = '0.2315'

// Source : OMINEA 2024 (CITEPA), bus et cars Euro VI, NAPFUE 205, CO2 seul, moyenne de 070302BC (route) et 070303BC (ville), 804,5 g/véh.km. Choix de conception, non validé : la valeur basse est retenue, Base Empreinte donne 0,0874 kgCO2e/passager.km contre 0,0805 ici avec 10 passagers
const BUS_DIESEL_EMISSION_FACTOR = '0.8045'

// Source : OMINEA 2024 (CITEPA), bus et cars Euro VI, NAPFUE 302, CO2 seul, moyenne de 070302BC (route) et 070303BC (ville), 709,8 g/véh.km
const BUS_GAS_EMISSION_FACTOR = '0.7098'

// Source : les trois carburants thermiques des voitures de la fiche d'analyse 11 ; les hybrides sont rangés avec leur carburant (FE_transports!A15:A17)
const CAR_THERMAL_EMISSION_FACTORS_KG_PER_KM = {
  diesel: CAR_DIESEL_EMISSION_FACTOR,
  essence: CAR_PETROL_EMISSION_FACTOR,
  gaz: CAR_GAS_EMISSION_FACTOR,
}

// Source : les deux carburants thermiques des bus et cars qui ont un facteur : le diesel et le gaz (GNV) ; l'essence n'a aucune ligne OMINEA
const BUS_THERMAL_EMISSION_FACTORS_KG_PER_KM = {
  diesel: BUS_DIESEL_EMISSION_FACTOR,
  gaz: BUS_GAS_EMISSION_FACTOR,
}

// Source : les carburants thermiques des voitures et l'électrique ; le carburant autre n'a pas de facteur et est exclu de la moyenne
const CAR_EMISSION_FACTORS_KG_PER_KM = {
  ...CAR_THERMAL_EMISSION_FACTORS_KG_PER_KM,
  electrique: ELECTRIC_CAR_EMISSION_FACTOR.toFixed(),
}

// Source : les carburants thermiques des bus et cars et l'électrique ; l'essence et le carburant autre sont exclus de la moyenne
const BUS_EMISSION_FACTORS_KG_PER_KM = {
  ...BUS_THERMAL_EMISSION_FACTORS_KG_PER_KM,
  electrique: ELECTRIC_BUS_EMISSION_FACTOR.toFixed(),
}

export {
  BUS_EMISSION_FACTORS_KG_PER_KM,
  BUS_THERMAL_EMISSION_FACTORS_KG_PER_KM,
  CAR_EMISSION_FACTORS_KG_PER_KM,
  CAR_THERMAL_EMISSION_FACTORS_KG_PER_KM,
}
