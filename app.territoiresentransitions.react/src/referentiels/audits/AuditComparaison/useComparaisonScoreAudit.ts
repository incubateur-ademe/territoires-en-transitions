import { trpc } from '@/api/utils/trpc/client';
import {
  findActionById,
  flatMapActionsEnfants,
  ReferentielId,
} from '@/domain/referentiels';
import { SnapshotJalonEnum } from '@/domain/referentiels/snapshots';
import { actionNewToDeprecated } from '../../DEPRECATED_scores.types';
import { TComparaisonScoreAudit } from './types';

// charge les comparaisons de potentiels/scores avant/après audit
export const useComparaisonScoreAudit = (
  collectiviteId: number,
  referentielId: ReferentielId
) => {
  return trpc.referentiels.snapshots.listWithScores.useQuery(
    {
      collectiviteId,
      referentielId,
      options: {
        jalons: [SnapshotJalonEnum.PRE_AUDIT, SnapshotJalonEnum.COURANT],
      },
    },
    {
      select(snapshots) {
        const currentSnapshot = snapshots.find(
          (snap) => snap.jalon === SnapshotJalonEnum.COURANT
        );

        const preAuditSnapshot = snapshots.find(
          (snap) => snap.jalon === SnapshotJalonEnum.PRE_AUDIT
        );

        if (!currentSnapshot || !preAuditSnapshot) {
          return [];
        }

        const { scores } = currentSnapshot.scoresPayload;

        const result = flatMapActionsEnfants(scores).map((currentAction) => {
          const preAuditAction = findActionById(
            preAuditSnapshot.scoresPayload.scores,
            currentAction.actionId
          );

          return {
            collectivite_id: collectiviteId,
            referentiel: referentielId,
            action_id: currentAction.actionId,
            courant: actionNewToDeprecated(currentAction),
            pre_audit: actionNewToDeprecated(preAuditAction),
          };
        });

        return result as TComparaisonScoreAudit[];
      },
    }
  );
};
