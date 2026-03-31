import { findActionInTree } from '@tet/domain/referentiels';
import { useEffect, useState } from 'react';
import { useReferentielTeEnabled } from '../../use-referentiel-te-enabled';
import { useSnapshot } from '../../use-snapshot';

export const useHideAction = (actionId: string) => {
  const referentielTeEnabled = useReferentielTeEnabled();
  const [hideAction, setHideAction] = useState<
    | {
        hide: boolean;
        isLoading: false;
      }
    | {
        hide: null;
        isLoading: true;
      }
  >({
    hide: null,
    isLoading: true,
  });

  const { data: snapshot, isPending: isLoadingSnapshot } = useSnapshot({
    actionId,
  });

  useEffect(() => {
    const actionScore = snapshot?.scoresPayload.scores
      ? findActionInTree(
          [snapshot.scoresPayload.scores],
          (a) => a.actionId === actionId
        ) ?? null
      : null;
    if (!actionScore || isLoadingSnapshot) {
      setHideAction({
        hide: null,
        isLoading: true,
      });
    } else {
      setHideAction({
        hide: Boolean(actionScore.score.desactive) && referentielTeEnabled,
        isLoading: false,
      });
    }
  }, [snapshot, isLoadingSnapshot, actionId]);

  return hideAction;
};
