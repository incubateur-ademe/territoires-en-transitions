import {
  getReferentielIdFromActionId,
  isActionHidden,
  isNewReferentiel,
} from '@tet/domain/referentiels';
import { ActionListItem } from './use-list-actions';
import { useListActionsGroupedById } from './use-list-actions-grouped-by-id';

export type ActionAvailability =
  | { status: 'pending' }
  | { status: 'visible'; action: ActionListItem }
  | { status: 'hidden'; action: Pick<ActionListItem, 'actionId' | 'identifiant' | 'nom'> }
  | { status: 'not_found' };

export function useActionAvailability(actionId: string): ActionAvailability {
  const referentielId = getReferentielIdFromActionId(actionId);
  const isReferentielTe = isNewReferentiel(referentielId);

  const [query] = useListActionsGroupedById({
    referentielIds: [referentielId],
  });

  if (query.isPending) {
    return { status: 'pending' };
  }
  if (query.isError) {
    throw new Error(`Erreur de lecture de ${actionId}`);
  }

  const action = query.data?.actionsById[actionId];
  if (action) {
    return { status: 'visible', action };
  }

  const hiddenAction = query.data?.hiddenActions.find(
    (candidate) => candidate.actionId === actionId
  );
  if (isReferentielTe && hiddenAction && isActionHidden(true, true)) {
    return { status: 'hidden', action: hiddenAction };
  }

  return { status: 'not_found' };
}
