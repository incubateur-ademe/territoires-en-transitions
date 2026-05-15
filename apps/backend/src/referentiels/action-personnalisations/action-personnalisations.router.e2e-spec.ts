import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { reponseBinaireTable } from '@tet/backend/collectivites/personnalisations/models/reponse-binaire.table';
import { addTestCollectiviteCompetence } from '@tet/backend/collectivites/personnalisations/personnalisations.test-fixture';
import { PersonnalisationConsequencesService } from '@tet/backend/collectivites/personnalisations/services/personnalisation-consequences.service';
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
import { and, eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { cleanupReferentielActionStatutsAndLabellisations } from '../update-action-statut/referentiel-action-statut.test-fixture';

/** Codes Banatic (import-personnalisation-questions.csv). */
const COMPETENCE_CODE_DECHETS_1 = 2080;
const COMPETENCE_CODE_DECHETS_2 = 2085;

describe('ActionPersonnalisationsRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let personnalisationConsequencesService: PersonnalisationConsequencesService;
  let editionUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    personnalisationConsequencesService = app.get(
      PersonnalisationConsequencesService
    );

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUser(
      databaseService,
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
        databaseService,
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

  /**
   * Les réponses binaires induites via Banatic (sans réponse explicite de la
   * collectivité) doivent être prises en compte dans l'évaludation des
   * conséquences.
   */
  describe('Conséquences et réponses induites par compétence Banatic (CAE)', () => {
    const getCaeConsequences = (collectiviteId: number) =>
      personnalisationConsequencesService.getPersonnalisationConsequencesForCollectivite(
        collectiviteId,
        { referentiel: 'cae' }
      );

    const cleanupReponseBinaire = (
      collectiviteId: number,
      questionId: string
    ) =>
      databaseService.db
        .delete(reponseBinaireTable)
        .where(
          and(
            eq(reponseBinaireTable.collectiviteId, collectiviteId),
            eq(reponseBinaireTable.questionId, questionId)
          )
        );

    test('réduction cae_1.2.3 quand dechets_1/2 sont induits NON (compétence) et dechets_3 répondu NON', async () => {
      const collectiviteId = collectivite.id;
      const caller = router.createCaller({ user: editionUser });

      const { cleanup: cleanupDechets1 } = await addTestCollectiviteCompetence(
        databaseService,
        {
          collectiviteId,
          competenceCode: COMPETENCE_CODE_DECHETS_1,
          exercice: false,
        }
      );
      const { cleanup: cleanupDechets2 } = await addTestCollectiviteCompetence(
        databaseService,
        {
          collectiviteId,
          competenceCode: COMPETENCE_CODE_DECHETS_2,
          exercice: false,
        }
      );
      onTestFinished(async () => {
        await cleanupReponseBinaire(collectiviteId, 'dechets_3');
        await cleanupDechets2();
        await cleanupDechets1();
      });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId,
        questionId: 'dechets_3',
        reponse: false,
      });

      const { consequences } = await getCaeConsequences(collectiviteId);

      expect(consequences['cae_1.2.3']?.potentielPerso).toBe(
        /** Branche « tous NON » de la règle cae_1.2.3. */
        2 / 10
      );
    });

    test('désactivation cae_1.2.3.1.4 quand dechets_1 est induit NON (compétence) sans setReponse', async () => {
      const collectiviteId = collectivite.id;

      const { cleanup: cleanupDechets1 } = await addTestCollectiviteCompetence(
        databaseService,
        {
          collectiviteId,
          competenceCode: COMPETENCE_CODE_DECHETS_1,
          exercice: false,
        }
      );
      onTestFinished(cleanupDechets1);

      const { consequences } = await getCaeConsequences(collectiviteId);

      expect(consequences['cae_1.2.3.1.4']?.desactive).toBe(true);
    });
  });
});
