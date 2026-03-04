import { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { ReferentielId, StatutAvancementEnum } from '@tet/domain/referentiels';
import { TRPCClient } from '@trpc/client';
import assert from 'assert';
import { getActionStatusCreateForAction } from '../update-action-statut/referentiel-action-statut.test-fixture';
import { ACTION_STATUT_COUNT_THRESHOLD1 } from './compute-referentiel-display.rules';

/**
 * Seed enough referentiel activity on a collectivite to trigger display criteria
 * (e.g. >= 50 statuts + recent modified_at) via a single updateStatuts batch.
 */
export async function seedCollectiviteReferentielDisplayActivity({
  trpcClient,
  collectiviteId,
  referentiel,
}: {
  trpcClient: TRPCClient<AppRouter>;
  collectiviteId: number;
  referentiel: ReferentielId;
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
  ).slice(0, ACTION_STATUT_COUNT_THRESHOLD1);

  assert(
    actionStatusesToCreate.length >= ACTION_STATUT_COUNT_THRESHOLD1,
    `Expected at least ${ACTION_STATUT_COUNT_THRESHOLD1} actionable ${referentiel} actions, got ${actionStatusesToCreate.length}`
  );

  await trpcClient.referentiels.actions.updateStatuts.mutate({
    actionStatuts: actionStatusesToCreate,
  });
}
