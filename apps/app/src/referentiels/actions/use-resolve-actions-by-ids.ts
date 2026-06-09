import {
  getReferentielIdFromActionId,
  ReferentielId,
} from '@tet/domain/referentiels';
import { ActionListItem } from './use-list-actions';
import { useListActionsGroupedById } from './use-list-actions-grouped-by-id';

export type ResolvedActionSummary = Pick<
  ActionListItem,
  'actionId' | 'identifiant' | 'nom' | 'referentiel'
> &
  Partial<Pick<ActionListItem, 'score'>>;

export function useResolveActionsByIds(
  actionIds: string[] | undefined,
  {
    enabled = Boolean(actionIds?.length),
    collectiviteId,
  }: { enabled?: boolean; collectiviteId?: number } = {}
): { data: ResolvedActionSummary[]; isPending: boolean } {
  const ids = actionIds ?? [];
  const referentielIds = [
    ...new Set(ids.map(getReferentielIdFromActionId)),
  ] as ReferentielId[];

  const { data: queryByReferentielId, isPending } = useListActionsGroupedById(
    { referentielIds, collectiviteId },
    { enabled }
  );

  const data = ids
    .map((actionId) => {
      const referentielId = getReferentielIdFromActionId(actionId);
      const result = queryByReferentielId.get(referentielId);
      if (!result) {
        return undefined;
      }
      const visibleAction = result.actionsById[actionId];
      if (visibleAction) {
        return visibleAction;
      }
      const hiddenAction = result.hiddenActions.find(
        (action) => action.actionId === actionId
      );
      if (!hiddenAction) {
        return undefined;
      }
      return {
        ...hiddenAction,
        referentiel: referentielId,
      } satisfies ResolvedActionSummary;
    })
    .filter((action): action is ResolvedActionSummary => action !== undefined);

  return { data, isPending };
}
