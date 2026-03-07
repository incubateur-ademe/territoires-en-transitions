import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  findActionById,
  flatMapActionsEnfants,
  ReferentielId,
  SnapshotJalonEnum,
} from '@tet/domain/referentiels';
import { toComparaisonRowFromSnapshot } from './snapshot-to-tabular';
import type { TScoreAuditRowData } from './types';

// charge les comparaisons de potentiels/scores avant/après audit (depuis snapshots)
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
        select(snapshots): TScoreAuditRowData[] {
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

          return flatMapActionsEnfants(scores).map((currentAction) => {
            const preAuditAction = findActionById(
              preAuditSnapshot.scoresPayload.scores,
              currentAction.actionId
            );
            return toComparaisonRowFromSnapshot(currentAction, preAuditAction);
          });
        },
      }
    )
  );
};
