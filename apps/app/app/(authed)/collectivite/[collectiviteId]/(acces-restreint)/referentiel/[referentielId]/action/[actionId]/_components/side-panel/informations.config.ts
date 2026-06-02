import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import {
  getReferentielIdFromActionId,
  isNewReferentiel,
} from '@tet/domain/referentiels';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { parseAsArrayOf, parseAsString } from 'nuqs';
import { ActionPanelIdEnum } from './types';

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
export const openedSectionsParser = parseAsArrayOf(parseAsString);

/** génère le search params a ajouter à l'url pour ouvrir automatiquement le panneau informations */
export function getActionInfoPanelSearchParams(
  action: ActionListItem,
  currentSearchParams?: ReadonlyURLSearchParams
) {
  if (
    !hasActionInformationsSections(action) ||
    !isNewReferentiel(getReferentielIdFromActionId(action.actionId)) ||
    currentSearchParams?.has('panel')
  ) {
    return currentSearchParams;
  }

  const searchParams = new URLSearchParams({
    panel: ActionPanelIdEnum.INFORMATIONS,
  });

  // préserve les sections ouvertes dans les params courants
  currentSearchParams
    ?.getAll(OPENED_SECTIONS_QUERY_PARAM)
    ?.forEach((section) =>
      searchParams.append(OPENED_SECTIONS_QUERY_PARAM, section)
    );

  return searchParams;
}
