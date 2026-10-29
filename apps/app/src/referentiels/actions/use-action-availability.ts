import {
  getReferentielIdFromActionId,
  isNewReferentiel,
} from '@tet/domain/referentiels';
import { ActionsQueryFailure } from './merge-actions-query-results';
import { ActionListItem } from './use-list-actions';
import { useListActionsGroupedById } from './use-list-actions-grouped-by-id';

export type ActionAvailability =
  | { status: 'pending' }
  | ({ status: 'error' } & ActionsQueryFailure)
  | { status: 'visible'; action: ActionListItem }
  | {
      status: 'hidden';
      action: Pick<ActionListItem, 'actionId' | 'identifiant' | 'nom'>;
    }
  | { status: 'not_found' };

export function useActionAvailability(actionId: string): ActionAvailability {
  const referentielId = getReferentielIdFromActionId(actionId);
  const isReferentielTe = isNewReferentiel(referentielId);

  const { isPending, failure, data } = useListActionsGroupedById({
    referentielIds: [referentielId],
  });

  if (isPending) {
    return { status: 'pending' };
  }
  if (failure) {
    return { status: 'error', ...failure };
  }

  const actionsData = data.get(referentielId);
  const action = actionsData?.actionsById[actionId];
  if (action) {
    return { status: 'visible', action };
  }

  const hiddenAction = actionsData?.hiddenActions.find(
    (candidate) => candidate.actionId === actionId
  );
  if (isReferentielTe && hiddenAction) {
    return { status: 'hidden', action: hiddenAction };
  }

  return { status: 'not_found' };
}
