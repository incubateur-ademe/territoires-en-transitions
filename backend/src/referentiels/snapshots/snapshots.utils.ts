import { memoize } from 'es-toolkit';
import {
  findActionInTree,
  flatMapActionsEnfants,
  getStatutAvancementBasedOnChildren,
  ReferentielException,
} from '../referentiels.utils';
import { ReferentielId } from './../models/referentiel-id.enum';
import { SnapshotsService } from './snapshots.service';

/**
 * @returns a function that takes an action and returns the action with additional computed status fields
 * This returned function aims to be used in actions.map()
 */
export function getExtendActionWithComputedStatutsFields(
  collectiviteId: number,
  getSnapshot: (
    collectiviteId: number,
    referentielId: ReferentielId
  ) => ReturnType<SnapshotsService['get']>
) {
  const getCurrentSnapshot = memoize((referentielId: ReferentielId) =>
    getSnapshot(collectiviteId, referentielId)
  );

  return async <A extends { actionId: string; referentiel: ReferentielId }>(
    action: A
  ) => {
    const { scores: scoresTree } = await getCurrentSnapshot(action.referentiel);

    const actionWithScore = findActionInTree(
      [scoresTree],
      (a) => a.actionId === action.actionId
    );

    if (!actionWithScore) {
      throw new ReferentielException(
        `Action ${action.actionId} not found in current score`
      );
    }

    const { score } = actionWithScore;

    return {
      ...action,

      desactive: score.desactive,
      concerne: score.concerne,

      statut: getStatutAvancementBasedOnChildren(
        score,
        flatMapActionsEnfants(actionWithScore)
          .map((a) => a.score.avancement)
          .filter((a) => a !== undefined)
      ),
    };
  };
}
