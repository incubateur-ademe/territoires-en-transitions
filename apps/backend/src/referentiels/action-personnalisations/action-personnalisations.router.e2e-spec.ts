import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { cleanupReferentielActionStatutsAndLabellisations } from '../update-action-statut/referentiel-action-statut.test-fixture';

describe('ActionPersonnalisationsRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let editionUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUser(
      db,
      {
        user: {
          role: CollectiviteRole.EDITION,
        },
      }
    );
    collectivite = testCollectiviteAndUsersResult.collectivite;
    const editionUserFixture = testCollectiviteAndUsersResult.user;
    editionUser = getAuthUserFromUserCredentials(editionUserFixture);

    return async () => {
      await cleanupReferentielActionStatutsAndLabellisations(
        db,
        collectivite.id
      );

      await testCollectiviteAndUsersResult.cleanup();

      if (app) {
        await app.close();
      }
    };
  });

  test('getNeededPersonnalisationQuestionsStatus for eci_1.2 and dev_eco_1', async () => {
    const caller = router.createCaller({ user: editionUser });

    const collectiviteId = collectivite.id;
    const actionId = 'eci_1.2';
    const questionId = 'dev_eco_1';

    const initialStatus =
      await caller.referentiels.actions.getNeededPersonnalisationQuestionsStatus(
        {
          collectiviteId,
          actionId,
        }
      );

    // The question should be referenced by personnalisation rules
    expect(Object.keys(initialStatus.questionStatusById)).toContain(questionId);

    // Initially, the question is not answered
    expect(initialStatus.missingNeededQuestionIds).toContain(questionId);

    // Answer the question via existing personnalisation endpoint
    await caller.collectivites.personnalisations.setReponse({
      collectiviteId,
      questionId,
      reponse: true,
    });

    const updatedStatus =
      await caller.referentiels.actions.getNeededPersonnalisationQuestionsStatus(
        {
          collectiviteId,
          actionId,
        }
      );

    // After answering, the question should no longer be missing
    expect(updatedStatus.missingNeededQuestionIds).not.toContain(questionId);
    expect(updatedStatus.questionStatusById[questionId].response).toBe(true);
  });
});
