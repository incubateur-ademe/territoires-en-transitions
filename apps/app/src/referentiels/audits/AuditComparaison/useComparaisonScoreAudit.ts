import { useTRPC } from '@/api';
import {
  findActionById,
  flatMapActionsEnfants,
  ReferentielId,
  SnapshotJalonEnum,
} from '@/domain/referentiels';
import { useQuery } from '@tanstack/react-query';
import { actionNewToDeprecated } from '../../DEPRECATED_scores.types';
import { TComparaisonScoreAudit } from './types';

// charge les comparaisons de potentiels/scores avant/après audit
export const useComparaisonScoreAudit = (
  collectiviteId: number,
  referentielId: ReferentielId
) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.referentiels.snapshots.listWithScores.queryOptions(
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
    )
  );
};
