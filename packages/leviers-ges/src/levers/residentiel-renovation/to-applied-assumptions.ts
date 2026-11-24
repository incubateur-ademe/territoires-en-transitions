import type { AppliedAssumptions } from '../../application/estimate/estimate-result.ts'

function toAppliedAssumptions(): AppliedAssumptions {
  return {
    nationalHeatingShares: {
      value:
        'énergie du chauffage et de l’eau chaude = consommation du territoire × part nationale (électricité 46,7 %, gaz naturel 92,6 %, fioul 100 %, GPL 53,2 %, chaleur 100 %, 2024) ; la même consommation par mètre carré pour tous les logements utilisant une énergie donnée',
      source:
        'Documentation fonctionnelle (p. 51) : le chauffage et l’eau chaude sont les consommations du levier de rénovation ; SDES, Consommation énergétique du secteur résidentiel (Conso_usage), 2024',
      limit:
        'La consommation CEREN par mètre carré selon le type, l’énergie, la période et le département n’est pas ouverte : chaque territoire est supposé consommer comme la France, et les maisons comme les appartements, les logements anciens comme récents. Le bois est absent des données du territoire',
    },
    flatsAfter1971Excluded: {
      value: 'les appartements construits après 1971 ne sont pas rénovés dans cette estimation',
      source:
        'Documentation fonctionnelle (pp. 53-54) et PlanET V1, Residentiel_Rénovation!B13 : niveau BBC rénovation, 110 kWh d’énergie primaire par m² et par an, pour les appartements construits après 1971 ; réduction de 35 % pour les autres logements',
      limit:
        'Le niveau BBC ne peut pas être comparé aux consommations nationales moyennes en énergie finale sans facteurs d’énergie primaire : le gain des appartements récents n’est pas compté, le total est sous-estimé',
    },
  }
}

export { toAppliedAssumptions }
