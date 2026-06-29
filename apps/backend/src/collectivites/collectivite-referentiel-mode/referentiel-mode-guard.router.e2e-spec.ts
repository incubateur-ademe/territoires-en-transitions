import { INestApplication } from '@nestjs/common';
import { REFERENTIEL_NOT_WRITABLE_MESSAGE } from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { addTestPersonnalisationData } from '@tet/backend/collectivites/personnalisations/personnalisations.test-fixture';
import { cleanupReferentielActionStatutsAndLabellisations } from '@tet/backend/referentiels/update-action-statut/referentiel-action-statut.test-fixture';
import {
  getAuthUser,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addAndEnableUserSuperAdminMode } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  Collectivite,
  type CollectiviteReferentielPreferences,
} from '@tet/domain/collectivites';
import {
  ActionTypeEnum,
  findActionInTree,
  ReferentielIdEnum,
  type TreeOfActionsIncludingScore,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';

function findFirstLeafActionId(root: TreeOfActionsIncludingScore): string {
  const action = findActionInTree([root], (node) => {
    return (
      node.actionType === ActionTypeEnum.TACHE ||
      (node.actionType === ActionTypeEnum.SOUS_ACTION &&
        node.actionsEnfant.length === 0)
    );
  });
  if (!action) {
    throw new Error('Aucune action feuille trouvée dans le référentiel');
  }
  return action.actionId;
}

describe('ReferentielModeGuard', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let supportUser: AuthenticatedUser;
  let editorUser: AuthenticatedUser;
  let collectivite: Collectivite;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    supportUser = await getAuthUser();
    databaseService = await getTestDatabase(app);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          role: CollectiviteRole.EDITION,
        },
      }
    );

    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUserResult.user
    );
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

  async function setReferentielPreferences(
    referentiels: CollectiviteReferentielPreferences,
    targetCollectiviteId: number = collectivite.id
  ) {
    const supportCaller = router.createCaller({ user: supportUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller: supportCaller,
      userId: supportUser.id,
    });
    onTestFinished(cleanup);

    await supportCaller.collectivites.preferences.update({
      collectiviteId: targetCollectiviteId,
      preferences: { referentiels },
    });
  }

  test('Refuse updateStatut sur TE en mode readonly', async () => {
    await setReferentielPreferences({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });

    const editorCaller = router.createCaller({ user: editorUser });
    const teSnapshot = await editorCaller.referentiels.snapshots.getCurrent({
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.TE,
    });
    const teActionId = findFirstLeafActionId(teSnapshot.scoresPayload.scores);

    await expect(
      editorCaller.referentiels.actions.updateStatut({
        collectiviteId: collectivite.id,
        actionId: teActionId,
        statut: 'fait',
      })
    ).rejects.toThrow(REFERENTIEL_NOT_WRITABLE_MESSAGE);
  });

  test('Autorise updateStatut sur CAE en mode write', async () => {
    await setReferentielPreferences({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });

    const editorCaller = router.createCaller({ user: editorUser });

    await expect(
      editorCaller.referentiels.actions.updateStatut({
        collectiviteId: collectivite.id,
        actionId: 'cae_1.1.1.1.2',
        statut: 'fait',
      })
    ).resolves.toBeDefined();
  });

  test('Refuse updateCommentaire sur CAE en mode archived', async () => {
    await setReferentielPreferences({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });

    const editorCaller = router.createCaller({ user: editorUser });

    await expect(
      editorCaller.referentiels.actions.updateCommentaire({
        collectiviteId: collectivite.id,
        actionId: 'cae_1.1.1.1.2',
        commentaire: 'commentaire bloqué',
      })
    ).rejects.toThrow(REFERENTIEL_NOT_WRITABLE_MESSAGE);
  });

  test('Autorise setReponse personnalisation sur TE en mode readonly', async () => {
    const personnalisationData =
      await addTestPersonnalisationData(databaseService);
    onTestFinished(() => personnalisationData.cleanup());

    await setReferentielPreferences(
      {
        cae: { display: true, mode: 'write' },
        eci: { display: false, mode: 'archived' },
        te: { display: true, mode: 'readonly' },
      },
      personnalisationData.collectivite.id
    );

    const caller = router.createCaller({
      user: personnalisationData.userCredentials,
    });

    await expect(
      caller.collectivites.personnalisations.setReponse({
        collectiviteId: personnalisationData.collectivite.id,
        questionId: personnalisationData.questionBinaireId,
        reponse: true,
      })
    ).resolves.toBeDefined();
  });
});
