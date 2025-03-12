import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { RouterOutput, trpc } from '@/api/utils/trpc/client';
import {
  findActionById,
  flatMapActionsEnfants,
  ReferentielId,
} from '@/domain/referentiels';
import { SnapshotJalonEnum } from '@/domain/referentiels/snapshots';
import { useQuery } from 'react-query';
import { actionNewToDeprecated } from '../../DEPRECATED_scores.types';
import { useSnapshotFlagEnabled } from '../../use-snapshot';
import { TComparaisonScoreAudit } from './types';

type Snapshot =
  RouterOutput['referentiels']['snapshots']['listWithScores']['snapshots'][number];

// charge les comparaisons de potentiels/scores avant/après audit
export const useComparaisonScoreAudit = (
  collectiviteId: number,
  referentielId: ReferentielId
) => {
  const supabase = useSupabase();

  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();

  const DEPRECATED_query = useQuery(
    ['comparaison_scores_audit', collectiviteId, referentielId],
    () => fetchComparaisonScoreAudit(supabase, collectiviteId, referentielId),
    {
      enabled: !FLAG_isSnapshotEnabled,
    }
  );

  const NEW_query = trpc.referentiels.snapshots.listWithScores.useQuery(
    {
      collectiviteId,
      referentielId,
      options: {
        jalons: [SnapshotJalonEnum.PRE_AUDIT, SnapshotJalonEnum.COURANT],
      },
    },
    {
      enabled: FLAG_isSnapshotEnabled,
      select({ snapshots }) {
        const currentSnapshot = snapshots.find(
          (snap) => snap.jalon === SnapshotJalonEnum.COURANT
        );

        const preAuditSnapshot = snapshots.find(
          (snap) => snap.jalon === SnapshotJalonEnum.PRE_AUDIT
        );

        if (!currentSnapshot || !preAuditSnapshot) {
          return [];
        }

        const scores: Snapshot['scores'] = currentSnapshot.scores;

        const result = flatMapActionsEnfants(scores).map((currentAction) => {
          const preAuditAction = findActionById(
            preAuditSnapshot.scores,
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

  return FLAG_isSnapshotEnabled ? NEW_query : DEPRECATED_query;
};

export const fetchComparaisonScoreAudit = async (
  supabase: DBClient,
  collectivite_id: number | null,
  referentiel: string | null
) => {
  const query = supabase
    .from('comparaison_scores_audit')
    .select('action_id,courant,pre_audit')
    .match({ collectivite_id, referentiel });

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data as TComparaisonScoreAudit[];
};
