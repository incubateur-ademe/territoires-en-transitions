import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { addTestCollectiviteAndUser } from '../collectivites/collectivites.test-fixture';
import { justificationTable } from './models/justification.table';
import { questionChoixTable } from './models/question-choix.table';
import { questionThematiqueTable } from './models/question-thematique.table';
import { questionTable } from './models/question.table';
import { reponseBinaireTable } from './models/reponse-binaire.table';
import { reponseChoixTable } from './models/reponse-choix.table';
import { reponseProportionTable } from './models/reponse-proportion.table';

export type TestPersonnalisationData = Awaited<
  ReturnType<typeof addTestPersonnalisationData>
>;

// Crée une collectivité, une thématique et des questions de test
export async function addTestPersonnalisationData(
  databaseService: DatabaseServiceInterface
) {
  const runId = randomUUID().substring(0, 12);
  const testDataId = {
    thematiqueId: `test-thematique-${runId}`,
    questionBinaireId: `test-q-binaire-${runId}`,
    questionProportionId: `test-q-proportion-${runId}`,
    questionChoixId: `test-q-choix-${runId}`,
    choixId: `test-choix-1-${runId}`,
  };

  // Créer une collectivité de test
  const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(
    databaseService,
    {
      user: {
        accessLevel: CollectiviteRole.ADMIN,
      },
    }
  );

  const userCredentials = getAuthUserFromUserCredentials(
    testCollectiviteAndUserResult.user
  );

  // Créer une thématique de test
  await databaseService.db
    .insert(questionThematiqueTable)
    .values({
      id: testDataId.thematiqueId,
      nom: 'Thématique de test',
    })
    .onConflictDoNothing();

  // Créer des questions de test pour chaque type
  await databaseService.db
    .insert(questionTable)
    .values([
      {
        id: testDataId.questionBinaireId,
        type: 'binaire',
        description: 'Question binaire de test',
        formulation: 'Est-ce une question binaire ?',
        thematiqueId: testDataId.thematiqueId,
        version: '1.0.0',
      },
      {
        id: testDataId.questionProportionId,
        type: 'proportion',
        description: 'Question proportion de test',
        formulation: 'Quelle est la proportion ?',
        thematiqueId: testDataId.thematiqueId,
        version: '1.0.0',
      },
      {
        id: testDataId.questionChoixId,
        type: 'choix',
        description: 'Question choix de test',
        formulation: 'Quel est votre choix ?',
        thematiqueId: testDataId.thematiqueId,
        version: '1.0.0',
      },
    ])
    .onConflictDoNothing();

  // Créer un choix pour la question de type choix
  await databaseService.db
    .insert(questionChoixTable)
    .values({
      id: testDataId.choixId,
      questionId: testDataId.questionChoixId,
      formulation: 'Choix 1',
      ordonnancement: 1,
      version: '1.0.0',
    })
    .onConflictDoNothing();

  const { user, collectivite, cleanup } = testCollectiviteAndUserResult;
  const cleanupReponses = async () => {
    // Nettoyer les réponses
    await databaseService.db
      .delete(reponseBinaireTable)
      .where(eq(reponseBinaireTable.collectiviteId, collectivite.id));
    await databaseService.db
      .delete(reponseProportionTable)
      .where(eq(reponseProportionTable.collectiviteId, collectivite.id));
    await databaseService.db
      .delete(reponseChoixTable)
      .where(eq(reponseChoixTable.collectiviteId, collectivite.id));

    // et les justifications
    await databaseService.db
      .delete(justificationTable)
      .where(eq(justificationTable.collectiviteId, collectivite.id));
  };

  return {
    ...testDataId,
    user,
    userCredentials,
    collectivite,
    cleanupReponses,
    cleanup: async () => {
      // Nettoyer les réponses
      await cleanupReponses();

      // et les questions
      await databaseService.db
        .delete(questionChoixTable)
        .where(eq(questionChoixTable.questionId, testDataId.questionChoixId));
      await databaseService.db
        .delete(questionTable)
        .where(
          inArray(questionTable.id, [
            testDataId.questionBinaireId,
            testDataId.questionProportionId,
            testDataId.questionChoixId,
          ])
        );
      await databaseService.db
        .delete(questionThematiqueTable)
        .where(eq(questionThematiqueTable.id, testDataId.thematiqueId));

      await cleanup();
    },
  };
}
