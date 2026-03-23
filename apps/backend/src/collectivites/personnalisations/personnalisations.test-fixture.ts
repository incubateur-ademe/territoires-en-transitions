import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { CollectiviteType } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getAuthUserFromUserCredentials } from '../../../test/get-auth-user-from-credentials';
import { addTestCollectiviteAndUser } from '../collectivites/collectivites.test-fixture';
import { justificationTable } from './models/justification.table';
import { questionChoixTable } from './models/question-choix.table';
import { questionThematiqueTable } from './models/question-thematique.table';
import { questionTable } from './models/question.table';
import { reponseBinaireTable } from './models/reponse-binaire.table';
import { reponseChoixTable } from './models/reponse-choix.table';
import { reponseProportionTable } from './models/reponse-proportion.table';

const PERSONNALISATION_QUESTION_VERSION = '1.0.0' as const;

const TE_TEST_ACTION_DEFINITION_BASE = {
  referentielVersion: '0.1.0',
  identifiant: '1.0.0',
  nom: 'Action test',
  description: '',
  contexte: '',
  exemples: '',
  ressources: '',
  reductionPotentiel: '',
  perimetreEvaluation: '',
} as const;

export type TestPersonnalisationData = Awaited<
  ReturnType<typeof addTestPersonnalisationData>
>;

// insère une thématique
export async function addTestThematique(
  { db }: DatabaseServiceInterface,
  data: { id: string; nom: string }
): Promise<{ cleanup: () => Promise<void> }> {
  await db.insert(questionThematiqueTable).values(data).onConflictDoNothing();

  return {
    cleanup: async () => {
      await db
        .delete(questionThematiqueTable)
        .where(eq(questionThematiqueTable.id, data.id));
    },
  };
}

// insère des questions
export async function addTestQuestions(
  { db }: DatabaseServiceInterface,
  questions: (typeof questionTable.$inferInsert)[]
): Promise<{ cleanup: () => Promise<void> }> {
  const ids = questions.map((q) => q.id);
  await db.insert(questionTable).values(questions).onConflictDoNothing();

  return {
    cleanup: async () => {
      if (ids.length > 0) {
        await db.delete(questionTable).where(inArray(questionTable.id, ids));
      }
    },
  };
}

// insère des choix pour une question type "choix"
export async function addTestChoix(
  { db }: DatabaseServiceInterface,
  choix: (typeof questionChoixTable.$inferInsert)[]
): Promise<{ cleanup: () => Promise<void> }> {
  const choixIds = choix.map((c) => c.id);
  await db.insert(questionChoixTable).values(choix).onConflictDoNothing();

  return {
    cleanup: async () => {
      if (choixIds.length > 0) {
        await db
          .delete(questionChoixTable)
          .where(inArray(questionChoixTable.id, choixIds));
      }
    },
  };
}

/**
 * Crée une thématique, 3 questions (binaire, proportion, choix) et 1 choix
 */
export async function addTestThematiqueEtQuestions(
  databaseService: DatabaseServiceInterface,
  collectiviteType: CollectiviteType,
  runId = randomUUID().substring(0, 12)
) {
  const data = {
    thematiqueId: `test-thematique-${runId}`,
    thematiqueNom: 'Thématique de test',
    questionBinaireId: `test-q-binaire-${runId}`,
    questionBinaireFormulation: 'Est-ce une question binaire ?',
    questionProportionId: `test-q-proportion-${runId}`,
    questionProportionFormulation: 'Quelle est la proportion ?',
    questionChoixId: `test-q-choix-${runId}`,
    questionChoixFormulation: 'Quel est votre choix ?',
    choixId: `test-choix-1-${runId}`,
    choixFormulation: 'Choix 1',
  };

  const typesCollectivitesConcernees = [collectiviteType];

  const { cleanup: cleanupThematique } = await addTestThematique(
    databaseService,
    {
      id: data.thematiqueId,
      nom: data.thematiqueNom,
    }
  );

  const questionDefinitions = [
    {
      id: data.questionBinaireId,
      type: 'binaire' as const,
      description: 'Question binaire de test',
      formulation: data.questionBinaireFormulation,
    },
    {
      id: data.questionProportionId,
      type: 'proportion' as const,
      description: 'Question proportion de test',
      formulation: data.questionProportionFormulation,
    },
    {
      id: data.questionChoixId,
      type: 'choix' as const,
      description: 'Question choix de test',
      formulation: data.questionChoixFormulation,
    },
  ];

  const { cleanup: cleanupQuestions } = await addTestQuestions(
    databaseService,
    questionDefinitions.map((q) => ({
      ...q,
      thematiqueId: data.thematiqueId,
      typesCollectivitesConcernees,
      version: PERSONNALISATION_QUESTION_VERSION,
    }))
  );

  const { cleanup: cleanupChoix } = await addTestChoix(databaseService, [
    {
      id: data.choixId,
      questionId: data.questionChoixId,
      formulation: data.choixFormulation,
      ordonnancement: 1,
      version: PERSONNALISATION_QUESTION_VERSION,
    },
  ]);

  return {
    data,
    cleanup: async () => {
      await cleanupChoix();
      await cleanupQuestions();
      await cleanupThematique();
    },
  };
}

type TestActionIds = {
  actionId1: string;
  actionId2: string;
  questionBinaireId: string;
  questionChoixId: string;
};

async function insertTestActionsLieesAuxQuestions(
  databaseService: DatabaseServiceInterface,
  ids: TestActionIds
) {
  const referentielTest = ReferentielIdEnum['TE-TEST'];
  await databaseService.db
    .insert(actionRelationTable)
    .values([
      { id: ids.actionId1, referentiel: referentielTest },
      { id: ids.actionId2, referentiel: referentielTest },
    ])
    .onConflictDoNothing();

  const actionDefinitionValues = {
    ...TE_TEST_ACTION_DEFINITION_BASE,
    referentiel: referentielTest,
    referentielId: referentielTest,
  };
  await databaseService.db
    .insert(actionDefinitionTable)
    .values([
      {
        ...actionDefinitionValues,
        actionId: ids.actionId1,
      },
      {
        ...actionDefinitionValues,
        actionId: ids.actionId2,
      },
    ])
    .onConflictDoNothing();

  await databaseService.db
    .insert(questionActionTable)
    .values([
      {
        actionId: ids.actionId1,
        questionId: ids.questionBinaireId,
      },
      {
        actionId: ids.actionId2,
        questionId: ids.questionChoixId,
      },
    ])
    .onConflictDoNothing();
}

async function deleteTestActionsLieesAuxQuestions(
  databaseService: DatabaseServiceInterface,
  ids: TestActionIds
) {
  await databaseService.db
    .delete(questionActionTable)
    .where(
      inArray(questionActionTable.questionId, [
        ids.questionBinaireId,
        ids.questionChoixId,
      ])
    );
  await databaseService.db
    .delete(actionDefinitionTable)
    .where(
      inArray(actionDefinitionTable.actionId, [ids.actionId1, ids.actionId2])
    );
  await databaseService.db
    .delete(actionRelationTable)
    .where(inArray(actionRelationTable.id, [ids.actionId1, ids.actionId2]));
}

// Crée une collectivité, une thématique et des questions de test
export async function addTestPersonnalisationData(
  databaseService: DatabaseServiceInterface
) {
  const runId = randomUUID().substring(0, 12);
  const testDataId = {
    questionCollectiviteNonConcernee: `test-q-nc-${runId}`,
    // Actions pour tester le filtre actionIds (te-test existe en seed)
    actionId1: `te-test_1-${runId}`,
    actionId2: `te-test_2-${runId}`,
  };

  const { user, collectivite, cleanup } = await addTestCollectiviteAndUser(
    databaseService,
    {
      user: {
        role: CollectiviteRole.ADMIN,
      },
    }
  );

  const userCredentials = getAuthUserFromUserCredentials(user);

  const collectiviteType = collectivite.type;

  const { data: baseData, cleanup: cleanupThematiqueEtQuestions } =
    await addTestThematiqueEtQuestions(
      databaseService,
      collectiviteType,
      runId
    );

  // types exclus du type de la collectivité pour tester le filtre (ex: region si collectivité EPCI)
  const typesCollectivitesNonConcernees = [
    collectiviteType === 'epci' ? 'region' : 'epci',
  ];

  const { cleanup: cleanupQuestionCollectiviteNonConcernee } =
    await addTestQuestions(databaseService, [
      {
        id: testDataId.questionCollectiviteNonConcernee,
        type: 'binaire',
        description:
          "La collectivité de test n'est pas concernée par cette question",
        formulation: 'Ne doit pas apparaitre dans la liste des questions',
        thematiqueId: baseData.thematiqueId,
        typesCollectivitesConcernees: typesCollectivitesNonConcernees,
        version: PERSONNALISATION_QUESTION_VERSION,
      },
    ]);

  const {
    thematiqueId,
    questionBinaireId,
    questionProportionId,
    questionChoixId,
    choixId,
  } = baseData;
  const mergedTestDataId = {
    thematiqueId,
    questionBinaireId,
    questionProportionId,
    questionChoixId,
    choixId,
    ...testDataId,
  };

  await insertTestActionsLieesAuxQuestions(databaseService, {
    actionId1: mergedTestDataId.actionId1,
    actionId2: mergedTestDataId.actionId2,
    questionBinaireId: mergedTestDataId.questionBinaireId,
    questionChoixId: mergedTestDataId.questionChoixId,
  });

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

  const fixtureQuestionIds = [
    mergedTestDataId.questionBinaireId,
    mergedTestDataId.questionProportionId,
    mergedTestDataId.questionChoixId,
  ];

  // isole les questions de la fixture (ignore les données seed et la question "non concernée")
  const isolateFixtureQuestions = <T extends { id: string }>(questions: T[]) =>
    questions.filter((q) => fixtureQuestionIds.includes(q.id));

  return {
    ...mergedTestDataId,
    isolateFixtureQuestions,
    user,
    userCredentials,
    collectivite,
    cleanupReponses,
    cleanup: async () => {
      // Nettoyer les réponses
      await cleanupReponses();

      await deleteTestActionsLieesAuxQuestions(databaseService, {
        actionId1: mergedTestDataId.actionId1,
        actionId2: mergedTestDataId.actionId2,
        questionBinaireId: mergedTestDataId.questionBinaireId,
        questionChoixId: mergedTestDataId.questionChoixId,
      });

      // les questions et thématique
      await cleanupQuestionCollectiviteNonConcernee();
      await cleanupThematiqueEtQuestions();

      await cleanup();
    },
  };
}
