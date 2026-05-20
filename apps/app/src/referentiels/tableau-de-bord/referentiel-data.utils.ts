import { getMaxDepth } from '@/app/referentiels/AidePriorisation/queries';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { categorieToLabel } from '@/app/referentiels/utils';
import {
  ActionCategorie,
  ActionId,
  ActionTypeEnum,
  ReferentielId,
} from '@tet/domain/referentiels';
import { divisionOrZero } from '@tet/domain/utils';
import { useCallback, useMemo } from 'react';
import { TableOptions } from 'react-table';

export type ActionsById = Record<ActionId, ActionListItem>;

export function getAxesFromActionsById(
  actionsById: ActionsById,
  referentielId: ReferentielId
): ActionListItem[] {
  const referentiel = actionsById[referentielId];
  return (
    referentiel?.childrenIds
      .map((id) => actionsById[id])
      .filter((action): action is ActionListItem => action != null) ?? []
  );
}

export function getRepartitionPhasesFromActionsById(actionsById: ActionsById) {
  const pointsParCategorie: Record<ActionCategorie, number> = {
    bases: 0,
    'mise en œuvre': 0,
    effets: 0,
  };

  // La catégorie de phase est portée par les sous-actions (pas par les axes
  // dont le score agrège déjà toute la descendance).
  for (const action of Object.values(actionsById)) {
    if (action.categorie && action.actionType === ActionTypeEnum.SOUS_ACTION) {
      pointsParCategorie[action.categorie] += action.score.pointFait;
    }
  }

  return [
    { id: categorieToLabel.bases, value: pointsParCategorie.bases },
    {
      id: categorieToLabel['mise en œuvre'],
      value: pointsParCategorie['mise en œuvre'],
    },
    { id: categorieToLabel.effets, value: pointsParCategorie.effets },
  ];
}

export function hasEtatDesLieuxFromAxes(axes: ActionListItem[]) {
  return axes.some(
    (action) =>
      divisionOrZero(
        action.score.pointNonRenseigne,
        action.score.pointPotentiel
      ) !== 1
  );
}

export function useProgressionTableFromActionsById(
  actionsById: ActionsById,
  referentielId: ReferentielId
): Pick<TableOptions<ActionListItem>, 'data' | 'getRowId' | 'getSubRows'> {
  const axesOnly = useMemo(
    () => getAxesFromActionsById(actionsById, referentielId),
    [actionsById, referentielId]
  );

  const getRowId = useCallback((action: ActionListItem) => action.actionId, []);

  const maxLevel = getMaxDepth(referentielId);

  const getSubRows = useCallback(
    (action: ActionListItem) => {
      if (action.depth > maxLevel - 1) {
        return [];
      }

      return action.childrenIds
        .map((id) => actionsById[id])
        .filter((child): child is ActionListItem => child != null);
    },
    [maxLevel, actionsById]
  );

  return {
    data: axesOnly,
    getRowId,
    getSubRows,
  };
}
