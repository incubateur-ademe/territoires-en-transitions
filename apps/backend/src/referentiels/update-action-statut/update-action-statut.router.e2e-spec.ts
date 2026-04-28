import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Collectivite } from '@tet/domain/collectivites';
import { ActionScore, ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { addAuditeurPermission } from '../labellisations/labellisations.test-fixture';
import { historiqueActionStatutTable } from '../models/historique-action-statut.table';
import { createAuditWithOnTestFinished } from '../referentiels.test-fixture';
import { cleanupReferentielActionStatutsAndLabellisations } from './referentiel-action-statut.test-fixture';

type Input = inferProcedureInput<
  AppRouter['referentiels']['actions']['updateStatut']
>;

const expectedCaeRootScoreAfterStatutUpdate: ActionScore = {
  actionId: 'cae',
  etoiles: 1,
  pointReferentiel: 500,
  pointPotentiel: 500,
  pointPotentielPerso: null,
  pointFait: 0.3,
  pointPasFait: 0,
  pointNonRenseigne: 499.7,
  pointProgramme: 0,
  concerne: true,
  completedTachesCount: 8,
  totalTachesCount: 1111,
  faitTachesAvancement: 1,
  programmeTachesAvancement: 0,
  pasFaitTachesAvancement: 0,
  pasConcerneTachesAvancement: 7,
  desactive: false,
  renseigne: false,
};

describe('UpdateActionStatutRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let editorUser: AuthenticatedUser;
  let readerUser: AuthenticatedUser;
  let adminUser: AuthenticatedUser;
  let collectivite: Collectivite;
  let databaseService: DatabaseService;
  let input: Input;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      databaseService,
      {
        users: [
          {
            role: CollectiviteRole.EDITION,
          },
          {
            role: CollectiviteRole.LECTURE,
          },
          {
            role: CollectiviteRole.ADMIN,
          },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    editorUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[0]
    );
    readerUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[1]
    );
    adminUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[2]
    );

    input = {
      collectiviteId: collectivite.id,
      actionId: 'cae_1.1.1.1.2',
      statut: 'detaille',
      statutDetailleAuPourcentage: [1, 0, 0],
    };
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await cleanupReferentielActionStatutsAndLabellisations(
      databaseService,
      collectivite.id
    );
  });

  test('not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.referentiels.actions.updateStatut(input)
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('not authorized: accès en lecture uniquement', async () => {
    const caller = router.createCaller({ user: readerUser });

    await expect(() =>
      caller.referentiels.actions.updateStatut(input)
    ).rejects.toThrowError(/Droits insuffisants/i);
  });

  test('Action inexistante', async () => {
    const caller = router.createCaller({ user: editorUser });

    await expect(() =>
      caller.referentiels.actions.updateStatut({
        ...input,
        actionId: 'cae_1.1.1.11',
      })
    ).rejects.toThrowError(
      'Action with id cae_1.1.1.11 not found in action tree'
    );
  });

  test("Mise à jour du score courant lors de la mise à jour du statut d'une action", async () => {
    const caller = router.createCaller({ user: editorUser });

    const currentFullScoreStatutUpdateResponse =
      await caller.referentiels.actions.updateStatut(input);

    expect(
      currentFullScoreStatutUpdateResponse.scoresPayload.scores.score
    ).toEqual(expectedCaeRootScoreAfterStatutUpdate);

    // Check that the current score has been correctly updated & saved
    const currentFullCurentScore =
      await caller.referentiels.snapshots.getCurrent({
        referentielId: ReferentielIdEnum.CAE,
        collectiviteId: collectivite.id,
      });
    expect(currentFullCurentScore.scoresPayload.scores.score).toEqual(
      expectedCaeRootScoreAfterStatutUpdate
    );
  });

  test('Not authorized when audit is started but user is not auditeur', async () => {
    const caller = router.createCaller({ user: editorUser });

    await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
    });

    await expect(
      caller.referentiels.actions.updateStatut(input)
    ).rejects.toThrowError(/AUDIT_STARTED_BUT_NOT_AUDITEUR/i);
  });

  test('Not authorized when audit is not started yet and user is auditeur', async () => {
    const caller = router.createCaller({ user: readerUser });

    const audit = await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      dateDebut: null,
    });
    await addAuditeurPermission({
      databaseService,
      auditId: audit.audit.id,
      userId: readerUser.id,
    });

    await expect(
      caller.referentiels.actions.updateStatut(input)
    ).rejects.toThrowError(/Droits insuffisants/i);
  });

  test('Authorized when audit is started and user is auditeur', async () => {
    const caller = router.createCaller({ user: readerUser });

    const audit = await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
    });
    await addAuditeurPermission({
      databaseService,
      auditId: audit.audit.id,
      userId: readerUser.id,
    });

    const response = await caller.referentiels.actions.updateStatut(input);
    expect(response.scoresPayload.scores.score).toEqual(
      expectedCaeRootScoreAfterStatutUpdate
    );
  });

  test("L'historique est créé lors de la mise à jour du statut", async () => {
    const caller = router.createCaller({ user: editorUser });
    await caller.referentiels.actions.updateStatut(input);

    const historyRows = await databaseService.db
      .select()
      .from(historiqueActionStatutTable)
      .where(
        and(
          eq(historiqueActionStatutTable.collectiviteId, collectivite.id),
          eq(historiqueActionStatutTable.actionId, 'cae_1.1.1.1.2')
        )
      );

    expect(historyRows).toHaveLength(1);
    expect(historyRows[0].avancement).toBe('detaille');
    expect(historyRows[0].previousAvancement).toBeNull();
    expect(historyRows[0].modifiedBy).toBe(editorUser.id);
    expect(historyRows[0].previousModifiedBy).toBeNull();
  });

  test("L'historique est dédupliqué pour les modifications rapprochées par le même utilisateur", async () => {
    const caller = router.createCaller({ user: editorUser });

    // First update
    await caller.referentiels.actions.updateStatut(input);
    // Second update within 1 hour
    await caller.referentiels.actions.updateStatut({
      ...input,
      statut: 'fait',
      statutDetailleAuPourcentage: null,
    });

    const historyRows = await databaseService.db
      .select()
      .from(historiqueActionStatutTable)
      .where(
        and(
          eq(historiqueActionStatutTable.collectiviteId, collectivite.id),
          eq(historiqueActionStatutTable.actionId, 'cae_1.1.1.1.2')
        )
      );

    expect(historyRows).toHaveLength(1);
    expect(historyRows[0].avancement).toBe('fait');

    // Third update by admin user
    const adminCaller = router.createCaller({ user: adminUser });
    await adminCaller.referentiels.actions.updateStatut({
      ...input,
      statut: 'pas_fait',
      statutDetailleAuPourcentage: null,
    });

    const historyRowsAfterAdminUpdate = await databaseService.db
      .select()
      .from(historiqueActionStatutTable)
      .where(
        and(
          eq(historiqueActionStatutTable.collectiviteId, collectivite.id),
          eq(historiqueActionStatutTable.actionId, 'cae_1.1.1.1.2')
        )
      );

    expect(historyRowsAfterAdminUpdate).toHaveLength(2);
    const adminHistoryRow = historyRowsAfterAdminUpdate.find(
      (row) => row.modifiedBy === adminUser.id
    );
    expect(adminHistoryRow).toMatchObject({
      avancement: 'pas_fait',
      avancementDetaille: null,
      modifiedBy: adminUser.id,
      previousAvancement: 'fait',
      previousModifiedBy: editorUser.id,
      previousAvancementDetaille: null,
    });
    const editorHistoryRow = historyRowsAfterAdminUpdate.find(
      (row) => row.modifiedBy === editorUser.id
    );
    expect(editorHistoryRow?.avancement).toBe('fait');
  });
});
