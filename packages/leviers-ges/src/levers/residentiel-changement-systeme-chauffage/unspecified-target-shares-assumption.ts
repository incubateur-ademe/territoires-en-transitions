import type { AppliedAssumption } from '../../application/estimate/estimate-result.ts'

// Source : choix de conception de ce dépôt, non validé : la documentation fonctionnelle (p. 55) donne le mix actuel par défaut des parts cibles sans dire comment répartir ce qui reste quand une part est modifiée ; PlanET V1, Residentiel_ChgtSyst!B15 : la somme des parts cibles vaut 100 %
const UNSPECIFIED_TARGET_SHARES_ASSUMPTION: AppliedAssumption = {
  value:
    'une part cible non précisée conserve sa proportion actuelle de l’énergie utile parmi les parts non précisées, qui se partagent ce que laissent les parts données ; une part non précisée unique prend tout le reste',
  source:
    'Documentation fonctionnelle (p. 55) : le mix actuel est la valeur par défaut des parts cibles ; PlanET V1, Residentiel_ChgtSyst!B15 : modifier la part d’un système modifie les parts des autres',
  limit:
    'Choix de conception, non validé : la documentation ne dit pas comment les autres parts évoluent. Le mix actuel est estimé à partir des parts nationales du chauffage et de l’eau chaude, le bois valant 0',
}

export { UNSPECIFIED_TARGET_SHARES_ASSUMPTION }
