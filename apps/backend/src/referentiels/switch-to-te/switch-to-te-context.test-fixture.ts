import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { ficheActionActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-action.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { actionPiloteTable } from '@tet/backend/referentiels/models/action-pilote.table';
import { actionServiceTable } from '@tet/backend/referentiels/models/action-service.table';
import { snapshotTable } from '@tet/backend/referentiels/snapshots/snapshot.table';
import { SNAPSHOTS } from '@tet/backend/referentiels/snapshots/snapshots.constants';
import { cleanupReferentielActionStatutsAndLabellisations } from '@tet/backend/referentiels/update-action-statut/referentiel-action-statut.test-fixture';
import { type AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { type DatabaseService } from '@tet/backend/utils/database/database.service';
import { type TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { type Result } from '@tet/backend/utils/result.type';
import { type CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import { type ScoreSnapshot } from '@tet/domain/referentiels';
import { and, eq, inArray } from 'drizzle-orm';
import { type BuildSwitchToTeContextService } from './build-switch-to-te-context.service';
import { type CreatePreSwitchSnapshotsService } from './create-pre-switch-snapshots.service';
import { type SwitchToTeContext } from './shared/switch-to-te-context';
import { type SwitchToTeError } from './switch-to-te.errors';

export const prefsEligibleCaeOnly: CollectiviteReferentielPreferences = {
  cae: { display: true, mode: 'write' },
  eci: { display: false, mode: 'archived' },
  te: { display: true, mode: 'readonly' },
};

export const prefsEligibleCaeAndEci: CollectiviteReferentielPreferences = {
  cae: { display: true, mode: 'write' },
  eci: { display: true, mode: 'write' },
  te: { display: true, mode: 'readonly' },
};

export type CleanupSwitchToTeCollectiviteDataOptions = {
  pilotes?: boolean;
  services?: boolean;
  fiches?: boolean;
};

export async function cleanupSwitchToTeCollectiviteData(
  databaseService: DatabaseService,
  collectiviteId: number,
  options: CleanupSwitchToTeCollectiviteDataOptions = {}
): Promise<void> {
  if (options.fiches) {
    const ficheIds = (
      await databaseService.db
        .select({ id: ficheActionTable.id })
        .from(ficheActionTable)
        .where(eq(ficheActionTable.collectiviteId, collectiviteId))
    ).map((row) => row.id);

    if (ficheIds.length > 0) {
      await databaseService.db
        .delete(ficheActionActionTable)
        .where(inArray(ficheActionActionTable.ficheId, ficheIds));
      await databaseService.db
        .delete(ficheActionTable)
        .where(inArray(ficheActionTable.id, ficheIds));
    }
  }

  await cleanupReferentielActionStatutsAndLabellisations(
    databaseService,
    collectiviteId
  );

  if (options.pilotes) {
    await databaseService.db
      .delete(actionPiloteTable)
      .where(eq(actionPiloteTable.collectiviteId, collectiviteId));
    await databaseService.db
      .delete(personneTagTable)
      .where(eq(personneTagTable.collectiviteId, collectiviteId));
  }

  if (options.services) {
    await databaseService.db
      .delete(actionServiceTable)
      .where(eq(actionServiceTable.collectiviteId, collectiviteId));
    await databaseService.db
      .delete(serviceTagTable)
      .where(eq(serviceTagTable.collectiviteId, collectiviteId));
  }

  await databaseService.db
    .delete(snapshotTable)
    .where(
      and(
        eq(snapshotTable.collectiviteId, collectiviteId),
        eq(snapshotTable.ref, SNAPSHOTS.PRE_SWITCH_TE_REF)
      )
    );
}

export async function setActionNonConcerneForCollectivite(
  router: TrpcRouter,
  user: AuthenticatedUser,
  collectiviteId: number,
  actionId: string
): Promise<void> {
  const caller = router.createCaller({ user });
  await caller.referentiels.actions.updateStatuts({
    actionStatuts: [
      {
        collectiviteId,
        actionId,
        statut: 'non_concerne',
      },
    ],
  });
}

export async function buildSwitchToTeContextForTest(
  collectiviteId: number,
  prefs: CollectiviteReferentielPreferences,
  services: {
    createPreSwitchSnapshotsService: CreatePreSwitchSnapshotsService;
    buildSwitchToTeContextService: BuildSwitchToTeContextService;
  },
  options: {
    user: AuthenticatedUser;
    preSwitchSnapshots?: ScoreSnapshot[];
  }
): Promise<Result<SwitchToTeContext, SwitchToTeError>> {
  let preSwitchSnapshots = options.preSwitchSnapshots;

  if (preSwitchSnapshots === undefined) {
    const createResult =
      await services.createPreSwitchSnapshotsService.createPreSwitchSnapshots(
        collectiviteId,
        prefs,
        { user: options.user }
      );

    if (!createResult.success) {
      return createResult;
    }

    preSwitchSnapshots = createResult.data;
  }

  return services.buildSwitchToTeContextService.build(
    collectiviteId,
    prefs,
    preSwitchSnapshots,
    { user: options.user }
  );
}
