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
  | { status: 'hidden'; action: ActionListItem };

export function useActionAvailability(actionId: string): ActionAvailability {
  const referentielId = getReferentielIdFromActionId(actionId);
  const includeDesactive = isNewReferentiel(referentielId);

  const [query] = useListActionsGroupedById({
    referentielIds: [referentielId],
    // TE : inclut les mesures désactivées pour distinguer masquée vs introuvable
    includeDesactive,
  });

  if (query.isPending) {
    return { status: 'pending' };
  }
  if (query.isError) {
    throw new Error(`Erreur de lecture de ${actionId}`);
  }

  const action = query.data?.[actionId];
  if (!action) {
    throw new Error(`${actionId} non trouvée`);
  }

  if (includeDesactive && isActionHidden(action.score.desactive, true)) {
    return { status: 'hidden', action };
  }

  return { status: 'visible', action };
}
