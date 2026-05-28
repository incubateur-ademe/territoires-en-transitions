import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { parseAsArrayOf, parseAsString } from 'nuqs';

// les propriétés de l'action a utiliser comme section
export type ActionInfoSectionId = keyof Pick<
  ActionListItem,
  'description' | 'contexte' | 'exemples' | 'ressources' | 'perimetreEvaluation'
>;

export type ActionInfoSection = {
  sectionId: ActionInfoSectionId;
  label: string;
  labelNewReferentiel?: string;
};

// configuration (libellés, ordre) de l'affichage des sections
export const ACTION_INFORMATIONS_SECTIONS: Array<ActionInfoSection> = [
  { sectionId: 'description', label: 'Description' },
  { sectionId: 'contexte', label: 'Contexte et réglementation' },
  {
    sectionId: 'exemples',
    label: 'Exemples d’autres collectivités',
    labelNewReferentiel: 'Inspiration',
  },
  { sectionId: 'ressources', label: 'Ressources' },
  {
    sectionId: 'perimetreEvaluation',
    label: 'Précisions évaluation',
    labelNewReferentiel: "Périmètre de l'évaluation",
  },
];

/** donne la liste des sections pour lesquelles l'action a du contenu */
export function getVisibleInformationsSections(
  action: ActionListItem
): Array<ActionInfoSection> {
  return ACTION_INFORMATIONS_SECTIONS.filter(
    ({ sectionId: property }) => (action[property]?.length ?? 0) > 0
  );
}

/** détermine si l'action a au moins une section info avec du contenu */
export function hasActionInformationsSections(action: ActionListItem): boolean {
  return getVisibleInformationsSections(action).length > 0;
}

/** paramètre des sections ouvertes dans l'url */
export const OPENED_SECTIONS_QUERY_PARAM = 'os';
export const openedSectionsParser = parseAsArrayOf(parseAsString).withDefault([
  'description',
]);
