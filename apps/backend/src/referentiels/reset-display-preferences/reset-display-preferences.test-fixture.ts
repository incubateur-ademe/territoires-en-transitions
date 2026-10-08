import { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  getReferentielIdFromActionId,
  ReferentielId,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { TRPCClient } from '@trpc/client';
import assert from 'assert';
import { getActionStatusCreateForAction } from '../update-action-statut/referentiel-action-statut.test-fixture';
import { ACTION_STATUT_COUNT_THRESHOLD1 } from './compute-referentiel-display.rules';

/**
 * Seed referentiel activity on a collectivite via a single updateStatuts batch.
 * By default, seeds enough statuts to trigger display criteria
 * (e.g. >= 50 statuts + recent modified_at).
 */
export async function seedCollectiviteReferentielDisplayActivity({
  trpcClient,
  collectiviteId,
  referentiel,
  actionStatutCount = ACTION_STATUT_COUNT_THRESHOLD1,
}: {
  trpcClient: TRPCClient<AppRouter>;
  collectiviteId: number;
  referentiel: ReferentielId;
  actionStatutCount?: number;
}): Promise<void> {
  const scoreSnapshot =
    await trpcClient.referentiels.snapshots.getCurrent.query({
      referentielId: referentiel,
      collectiviteId,
    });

  const actionStatusesToCreate = getActionStatusCreateForAction(
    scoreSnapshot.scoresPayload.scores,
    StatutAvancementEnum.FAIT,
    collectiviteId
  )
    .filter(
      (actionStatut) =>
        getReferentielIdFromActionId(actionStatut.actionId) === referentiel
    )
    .slice(0, actionStatutCount);

  assert(
    actionStatusesToCreate.length >= actionStatutCount,
    `Expected at least ${actionStatutCount} actionable ${referentiel} actions, got ${actionStatusesToCreate.length}`
  );

  await trpcClient.referentiels.actions.updateStatuts.mutate({
    actionStatuts: actionStatusesToCreate,
  });
}
