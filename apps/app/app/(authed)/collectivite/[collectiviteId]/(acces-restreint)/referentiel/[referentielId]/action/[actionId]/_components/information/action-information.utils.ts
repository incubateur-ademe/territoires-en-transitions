import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { toCamel } from 'ts-case-convert';

// tous les items du sommaire (avant filtrage)
export const TOC_ITEMS = [
  { id: 'desc', label: 'Description' },
  { id: 'contexte', label: 'Contexte et réglementation' },
  { id: 'exemples', label: 'Exemples d’autres collectivités' },
  { id: 'ressources', label: 'Ressources' },
  { id: 'perimetre_evaluation', label: 'Précisions évaluation' },
] as const;

// renvoi les items du sommaire à afficher pour une action donnée
export const getItems = (
  action: ActionDefinitionSummary,
  avecDescription?: boolean
) =>
  TOC_ITEMS
    // filtre les items pour lesquels l'action contient un champ `have<id>` valide
    // (ou si la description doit être inclus)
    .filter(({ id }) =>
      id === 'desc' ? avecDescription : action[toCamel(`have_${id}`)] === true
    )
    // et les numérote
    .map((item, index) => ({ ...item, num: index + 1 }));
