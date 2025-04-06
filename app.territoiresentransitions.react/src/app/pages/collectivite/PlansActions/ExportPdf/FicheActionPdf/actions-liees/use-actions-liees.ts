import { useListActionsWithStatuts } from '@/app/referentiels/actions/use-list-actions';
import { findByActionId, useSnapshot } from '@/app/referentiels/use-snapshot';

export const useActionsLiees = (actionIds: string[]) => {
  const actionsByReferentiel = {
    cae: actionIds.filter((id) => id.startsWith('cae_')),
    eci: actionIds.filter((id) => id.startsWith('eci_')),
  };

  const { data: caeSnapshot, isLoading: isLoadingCae } = useSnapshotConditional(
    'cae_1',
    actionsByReferentiel.cae.length > 0
  );
  const { data: eciSnapshot, isLoading: isLoadingEci } = useSnapshotConditional(
    'eci_1',
    actionsByReferentiel.eci.length > 0
  );

  const { data: detailedActions, isLoading: isLoadingActions } =
    useListActionsWithStatuts({
      actionIds,
    });

  const isLoading = isLoadingCae || isLoadingEci || isLoadingActions;
  if (isLoading) {
    return { actions: [], isLoading: true };
  }

  const actionsWithScores =
    detailedActions?.map((action) => ({
      ...action,
      score: (action.referentiel === 'cae'
        ? findByActionId(caeSnapshot?.scoresPayload.scores, action.actionId)
        : findByActionId(eciSnapshot?.scoresPayload.scores, action.actionId)
      )?.score,
    })) ?? [];

  const actionsWithValidScores = actionsWithScores.filter(
    (action): action is ActionWithStatutAndScore => action.score !== undefined
  );

};

const useSnapshotConditional = (actionId: string, condition: boolean) => {
  const snapshot = useSnapshot({ actionId });

  if (!condition) {
    return { data: undefined, isLoading: false };
  }

  return snapshot;
};
