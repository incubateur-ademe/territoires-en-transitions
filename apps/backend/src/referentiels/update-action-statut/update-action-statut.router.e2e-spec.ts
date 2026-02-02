import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getAuthUserFromDcp } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Collectivite } from '@tet/domain/collectivites';
import { ActionScore, ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { addAuditeurPermission } from '../labellisations/labellisations.test-fixture';
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
  let router: TrpcRouter;
  let editorUser: AuthenticatedUser;
  let readerUser: AuthenticatedUser;
  let collectivite: Collectivite;
  let databaseService: DatabaseService;
  let input: Input;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      databaseService,
      {
        users: [
          {
            accessLevel: CollectiviteRole.EDITION,
          },
          {
            accessLevel: CollectiviteRole.LECTURE,
          },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    editorUser = getAuthUserFromDcp(testCollectiviteAndUsersResult.users[0]);
    readerUser = getAuthUserFromDcp(testCollectiviteAndUsersResult.users[1]);

    input = {
      collectiviteId: collectivite.id,
      actionId: 'cae_1.1.1.1.2',
      avancement: 'detaille',
      avancementDetaille: [1, 0, 0],
      concerne: true,
    };

    return async () => {
      await testCollectiviteAndUsersResult.cleanup();
    };
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
});
