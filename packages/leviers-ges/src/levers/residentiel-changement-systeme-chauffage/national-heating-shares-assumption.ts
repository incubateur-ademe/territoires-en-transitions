import type { AppliedAssumption } from '../../application/estimate/estimate-result.ts'

// Source : choix de conception de ce dépôt, sans source externe : valeurs, source et limite de la part nationale du chauffage, non validé
const NATIONAL_HEATING_SHARES_ASSUMPTION: AppliedAssumption = {
  value:
    'électricité 46,7 %, gaz naturel 92,6 %, fioul 100 %, chaleur 100 %, bois 0 (parts nationales du chauffage et de l’eau chaude dans la consommation résidentielle, 2024)',
  source:
    'SDES, Consommation énergétique du secteur résidentiel (Conso_usage), 2024, à climat réel, PCI ; le bois et le GPL ne sont pas calculés (documentation fonctionnelle PlanET, pp. 52-53 ; pas de rendement pour le GPL dans ADEME Rénovation performante par étapes, p. 156)',
  limit:
    'L’énergie CEREN de chauffage et d’eau chaude par département n’est pas ouverte : chaque territoire est supposé utiliser ces énergies dans la même proportion que la France. La consommation de GPL est laissée inchangée. Le bois est absent des données du territoire : une cible bois ne prélève donc de l’énergie que sur les autres vecteurs.',
}

export { NATIONAL_HEATING_SHARES_ASSUMPTION }
