import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
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
    questionCollectiviteNonConcernee: `test-q-nc-${runId}`,
    choixId: `test-choix-1-${runId}`,
    // Actions pour tester le filtre actionIds (te-test existe en seed)
    actionId1: `te-test_1-${runId}`,
    actionId2: `te-test_2-${runId}`,
  };

  // Créer une collectivité de test
  const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(
    databaseService,
    {
      user: {
        role: CollectiviteRole.ADMIN,
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
  const collectiviteType = testCollectiviteAndUserResult.collectivite.type;
  const typesCollectivitesConcernees = [collectiviteType];
  // types exclus du type de la collectivité pour tester le filtre (ex: region si collectivité EPCI)
  const typesCollectivitesNonConcernees = [
    collectiviteType === 'epci' ? 'region' : 'epci',
  ];
  await databaseService.db
    .insert(questionTable)
    .values([
      {
        id: testDataId.questionBinaireId,
        type: 'binaire',
        description: 'Question binaire de test',
        formulation: 'Est-ce une question binaire ?',
        thematiqueId: testDataId.thematiqueId,
        typesCollectivitesConcernees,
        version: '1.0.0',
      },
      {
        id: testDataId.questionProportionId,
        type: 'proportion',
        description: 'Question proportion de test',
        formulation: 'Quelle est la proportion ?',
        thematiqueId: testDataId.thematiqueId,
        typesCollectivitesConcernees,
        version: '1.0.0',
      },
      {
        id: testDataId.questionChoixId,
        type: 'choix',
        description: 'Question choix de test',
        formulation: 'Quel est votre choix ?',
        thematiqueId: testDataId.thematiqueId,
        typesCollectivitesConcernees,
        version: '1.0.0',
      },
      {
        id: testDataId.questionCollectiviteNonConcernee,
        type: 'binaire',
        description:
          "La collectivité de test n'est pas concernée par cette question",
        formulation: 'Ne doit pas apparaitre dans la liste des questions',
        thematiqueId: testDataId.thematiqueId,
        typesCollectivitesConcernees: typesCollectivitesNonConcernees,
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

  // Créer des actions de test pour le filtre actionIds (te-test existe en seed)
  // action_definition référence action_relation, donc insérer action_relation en premier
  const referentielTeTest = ReferentielIdEnum['TE-TEST'];
  await databaseService.db
    .insert(actionRelationTable)
    .values([
      { id: testDataId.actionId1, referentiel: referentielTeTest },
      { id: testDataId.actionId2, referentiel: referentielTeTest },
    ])
    .onConflictDoNothing();

  const actionDefinitionValues = {
    referentiel: referentielTeTest,
    referentielId: referentielTeTest,
    referentielVersion: '0.1.0',
    identifiant: '1.0.0',
    nom: 'Action test',
    description: '',
    contexte: '',
    exemples: '',
    ressources: '',
    reductionPotentiel: '',
    perimetreEvaluation: '',
  };
  await databaseService.db
    .insert(actionDefinitionTable)
    .values([
      {
        ...actionDefinitionValues,
        actionId: testDataId.actionId1,
      },
      {
        ...actionDefinitionValues,
        actionId: testDataId.actionId2,
      },
    ])
    .onConflictDoNothing();

  // Lie actionId1 à questionBinaire, actionId2 à questionChoix
  await databaseService.db
    .insert(questionActionTable)
    .values([
      {
        actionId: testDataId.actionId1,
        questionId: testDataId.questionBinaireId,
      },
      {
        actionId: testDataId.actionId2,
        questionId: testDataId.questionChoixId,
      },
    ])
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

  // isole les questions de la fixture (ignore les données seed et la question "non concernée")
  const isolateFixtureQuestions = <T extends { id: string }>(
    questions: T[],
    questionIds = [
      testDataId.questionBinaireId,
      testDataId.questionProportionId,
      testDataId.questionChoixId,
    ]
  ) => questions.filter((q) => questionIds.includes(q.id));

  return {
    ...testDataId,
    isolateFixtureQuestions,
    user,
    userCredentials,
    collectivite,
    cleanupReponses,
    cleanup: async () => {
      // Nettoyer les réponses
      await cleanupReponses();

      // les liens entre question et mesure
      await databaseService.db
        .delete(questionActionTable)
        .where(
          inArray(questionActionTable.questionId, [
            testDataId.questionBinaireId,
            testDataId.questionChoixId,
          ])
        );
      await databaseService.db
        .delete(actionDefinitionTable)
        .where(
          inArray(actionDefinitionTable.actionId, [
            testDataId.actionId1,
            testDataId.actionId2,
          ])
        );
      await databaseService.db
        .delete(actionRelationTable)
        .where(
          inArray(actionRelationTable.id, [
            testDataId.actionId1,
            testDataId.actionId2,
          ])
        );

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
            testDataId.questionCollectiviteNonConcernee,
          ])
        );
      await databaseService.db
        .delete(questionThematiqueTable)
        .where(eq(questionThematiqueTable.id, testDataId.thematiqueId));

      await cleanup();
    },
  };
}
