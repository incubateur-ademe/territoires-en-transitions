import { collectiviteBanatic2025TransfertTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-2025-transfert.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { banatic2025CompetenceTable } from '@tet/backend/shared/models/banatic-2025-competence.table';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { CollectiviteType } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getAuthUserFromUserCredentials } from '../../../test/get-auth-user-from-credentials';
import { addTestCollectiviteAndUser } from '../collectivites/collectivites.test-fixture';
import { collectiviteBanatic2025CompetenceTable } from '../shared/models/collectivite-banatic-2025-competence.table';
import { justificationTable } from './models/justification.table';
import { questionChoixTable } from './models/question-choix.table';
import { questionThematiqueTable } from './models/question-thematique.table';
import { questionTable } from './models/question.table';
import { reponseBinaireTable } from './models/reponse-binaire.table';
import { reponseChoixTable } from './models/reponse-choix.table';
import { reponseProportionTable } from './models/reponse-proportion.table';

/**
 * construit un id de test unique tronqué pour respecter la limite varchar(30)
 */
const MAX_PERSONNALISATION_ID_LEN = 30;
function generatePersonnalisationTestId(prefix: string): string {
  const raw = `${prefix}-${randomUUID()}`.replaceAll('-', '_');
  return raw.length <= MAX_PERSONNALISATION_ID_LEN
    ? raw
    : raw.slice(0, MAX_PERSONNALISATION_ID_LEN);
}

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
type QuestionInsertInput = Omit<typeof questionTable.$inferInsert, 'id'>;
export async function addTestQuestions(
  { db }: DatabaseServiceInterface,
  questions: QuestionInsertInput[]
): Promise<{ ids: string[]; cleanup: () => Promise<void> }> {
  const rows = questions.map((q) => {
    const id = generatePersonnalisationTestId('test-q');
    return { ...q, id };
  });
  const ids = rows.map((q) => q.id);
  await db.insert(questionTable).values(rows).onConflictDoNothing();

  return {
    ids,
    cleanup: async () => {
      if (ids.length > 0) {
        // supprime les données liées par FK avant les questions elles-mêmes
        await db
          .delete(reponseBinaireTable)
          .where(inArray(reponseBinaireTable.questionId, ids));
        await db
          .delete(reponseChoixTable)
          .where(inArray(reponseChoixTable.questionId, ids));
        await db
          .delete(reponseProportionTable)
          .where(inArray(reponseProportionTable.questionId, ids));
        await db
          .delete(justificationTable)
          .where(inArray(justificationTable.questionId, ids));
        await db.delete(questionTable).where(inArray(questionTable.id, ids));
      }
    },
  };
}

// insère des choix pour une question type "choix"
type QuestionChoixInsertInput = Omit<
  typeof questionChoixTable.$inferInsert,
  'id'
>;
export async function addTestChoix(
  { db }: DatabaseServiceInterface,
  choix: QuestionChoixInsertInput[]
): Promise<{ ids: string[]; cleanup: () => Promise<void> }> {
  const rows = choix.map((c) => {
    const id = generatePersonnalisationTestId('test-c');
    return { ...c, id };
  });
  const choixIds = rows.map((c) => c.id);
  await db.insert(questionChoixTable).values(rows).onConflictDoNothing();

  return {
    ids: choixIds,
    cleanup: async () => {
      if (choixIds.length > 0) {
        await db
          .delete(questionChoixTable)
          .where(inArray(questionChoixTable.id, choixIds));
      }
    },
  };
}

/** insère une compétence */
export async function addTestBanaticCompetence(
  { db }: DatabaseServiceInterface,
  data: {
    intitule?: string;
    version?: string;
  }
): Promise<{
  competenceCode: number;
  intitule: string;
  cleanup: () => Promise<void>;
}> {
  // plage alignée sur la contrainte banatic_2025_competence_code_format (1000–9999)
  const competenceCode = 1000 + Math.floor(Math.random() * 8999);
  const intitule = data.intitule ?? 'Compétence test';

  const insertedRows = await db
    .insert(banatic2025CompetenceTable)
    .values({
      competenceCode,
      intitule,
    })
    .onConflictDoNothing()
    .returning({ competenceCode: banatic2025CompetenceTable.competenceCode });

  const insertedByFixture = insertedRows.length > 0;

  return {
    competenceCode,
    intitule,
    cleanup: async () => {
      if (insertedByFixture) {
        await db
          .delete(banatic2025CompetenceTable)
          .where(eq(banatic2025CompetenceTable.competenceCode, competenceCode));
      }
    },
  };
}

/** affecte une compétence à une collectivité */
export async function addTestCollectiviteCompetence(
  { db }: DatabaseServiceInterface,
  data: {
    collectiviteId: number;
    competenceCode: number;
    exercice: boolean;
  }
): Promise<{ cleanup: () => Promise<void> }> {
  await db
    .insert(collectiviteBanatic2025CompetenceTable)
    .values(data)
    .onConflictDoNothing();

  return {
    cleanup: async () => {
      await db
        .delete(collectiviteBanatic2025CompetenceTable)
        .where(
          and(
            eq(
              collectiviteBanatic2025CompetenceTable.collectiviteId,
              data.collectiviteId
            ),
            eq(
              collectiviteBanatic2025CompetenceTable.competenceCode,
              data.competenceCode
            )
          )
        );
    },
  };
}

/** ajoute un transfert de compétence pour une collectivité */
export async function addTestCollectiviteTransfertCompetence(
  { db }: DatabaseServiceInterface,
  data: {
    collectiviteId: number;
    competenceCode: number;
    natureTransfert?: string;
  }
): Promise<{ cleanup: () => Promise<void> }> {
  await db
    .insert(collectiviteBanatic2025TransfertTable)
    .values(data)
    .onConflictDoNothing();

  return {
    cleanup: async () => {
      await db
        .delete(collectiviteBanatic2025TransfertTable)
        .where(
          and(
            eq(
              collectiviteBanatic2025TransfertTable.collectiviteId,
              data.collectiviteId
            ),
            eq(
              collectiviteBanatic2025TransfertTable.competenceCode,
              data.competenceCode
            )
          )
        );
    },
  };
}

/** Crée une thématique, 3 questions (binaire, proportion, choix) et 1 choix. */
export async function addTestThematiqueEtQuestions(
  databaseService: DatabaseServiceInterface,
  collectiviteType: CollectiviteType
) {
  const thematiqueId = generatePersonnalisationTestId('test-thematique');
  const thematiqueNom = 'Thématique de test';
  const questionBinaireFormulation = 'Est-ce une question binaire ?';
  const questionProportionFormulation = 'Quelle est la proportion ?';
  const questionChoixFormulation = 'Quel est votre choix ?';
  const choixFormulation = 'Choix 1';

  const typesCollectivitesConcernees = [collectiviteType];

  const { cleanup: cleanupThematique } = await addTestThematique(
    databaseService,
    {
      id: thematiqueId,
      nom: thematiqueNom,
    }
  );

  const questionDefinitions: QuestionInsertInput[] = [
    {
      type: 'binaire',
      description: 'Question binaire de test',
      formulation: questionBinaireFormulation,
    },
    {
      type: 'proportion',
      description: 'Question proportion de test',
      formulation: questionProportionFormulation,
    },
    {
      type: 'choix',
      description: 'Question choix de test',
      formulation: questionChoixFormulation,
    },
  ];

  const { ids: questionIds, cleanup: cleanupQuestions } =
    await addTestQuestions(
      databaseService,
      questionDefinitions.map((q) => ({
        ...q,
        thematiqueId,
        typesCollectivitesConcernees,
      }))
    );

  const [questionBinaireId, questionProportionId, questionChoixId] =
    questionIds;

  const { ids: choixIds, cleanup: cleanupChoix } = await addTestChoix(
    databaseService,
    [
      {
        questionId: questionChoixId,
        formulation: choixFormulation,
        ordonnancement: 1,
      },
    ]
  );
  const [choixId] = choixIds;

  const data = {
    thematiqueId,
    thematiqueNom,
    questionBinaireId,
    questionBinaireFormulation,
    questionProportionId,
    questionProportionFormulation,
    questionChoixId,
    questionChoixFormulation,
    choixId,
    choixFormulation,
  };

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

/** Insère les liens entre actions et questions */
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

/** Supprime les liens entre actions et questions */
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

/** Ajoute une question pour tester le filtre par type de collectivité concernée */
export async function addTestQuestionCollectiviteNonConcernee(
  databaseService: DatabaseServiceInterface,
  data: { thematiqueId: string; collectiviteType: CollectiviteType }
): Promise<{ questionId: string; cleanup: () => Promise<void> }> {
  const typesCollectivitesNonConcernees = [
    data.collectiviteType === 'epci' ? 'region' : 'epci',
  ];
  const {
    ids: [questionId],
    cleanup,
  } = await addTestQuestions(databaseService, [
    {
      type: 'binaire',
      description:
        "La collectivité de test n'est pas concernée par cette question",
      formulation: 'Ne doit pas apparaitre dans la liste des questions',
      thematiqueId: data.thematiqueId,
      typesCollectivitesConcernees: typesCollectivitesNonConcernees,
    },
  ]);
  return { questionId, cleanup };
}

/** Ajoute une question associée à une compétence */
export async function addTestQuestionBanaticCompetencePourCollectivite(
  databaseService: DatabaseServiceInterface,
  data: {
    collectiviteId: number;
    thematiqueId: string;
    collectiviteType: CollectiviteType;
  }
): Promise<{
  questionBinaireCompetenceBanaticId: string;
  competenceBanaticTestCode: number;
  competenceIntitule: string;
  cleanup: () => Promise<void>;
}> {
  const {
    competenceCode,
    intitule: competenceIntitule,
    cleanup: cleanupBanaticCompetence,
  } = await addTestBanaticCompetence(databaseService, {
    intitule: 'Compétence test personnalisation',
  });

  const { cleanup: cleanupCollectiviteBanaticCompetence } =
    await addTestCollectiviteCompetence(databaseService, {
      collectiviteId: data.collectiviteId,
      competenceCode,
      exercice: true,
    });

  const { cleanup: cleanupCollectiviteTransfertCompetence } =
    await addTestCollectiviteTransfertCompetence(databaseService, {
      collectiviteId: data.collectiviteId,
      competenceCode,
      natureTransfert: 'transfert de test',
    });

  const {
    ids: [questionBinaireCompetenceBanaticId],
    cleanup: cleanupQuestionBinaireBanatic,
  } = await addTestQuestions(databaseService, [
    {
      type: 'binaire',
      description: 'Question binaire liée à une compétence Banatic',
      formulation: 'Question binaire compétence Banatic',
      thematiqueId: data.thematiqueId,
      typesCollectivitesConcernees: [data.collectiviteType],
      competenceCode,
    },
  ]);

  const cleanup = async () => {
    await cleanupQuestionBinaireBanatic();
    await cleanupCollectiviteBanaticCompetence();
    await cleanupCollectiviteTransfertCompetence();
    await cleanupBanaticCompetence();
  };

  return {
    questionBinaireCompetenceBanaticId,
    competenceBanaticTestCode: competenceCode,
    competenceIntitule,
    cleanup,
  };
}

/** Ajoute les questions pour tester les questions conditionnelles */
export async function addTestQuestionsExprVisible(
  databaseService: DatabaseServiceInterface,
  data: {
    thematiqueId: string;
    collectiviteType: CollectiviteType;
  }
): Promise<{
  questionReferenceId: string;
  questionConditionnelleId: string;
  cleanup: () => Promise<void>;
}> {
  /**
   * Ajoute deux questions :
   * - une question de référence toujours visible
   * - une question conditionnelle visible uniquement lorsque la réponse
   *   à la question de référence est NON (false)
   */

  // ajoute une question de référence toujours visible
  const {
    ids: [questionReferenceId],
    cleanup: cleanupQuestionReference,
  } = await addTestQuestions(databaseService, [
    {
      thematiqueId: data.thematiqueId,
      type: 'binaire',
      description: 'Question de référence pour tests expr_visible',
      formulation: 'Référence expr_visible',
    },
  ]);

  // une question conditionnelle visible uniquement lorsque la réponse à la
  // question de référence est NON (false)
  const {
    ids: [questionConditionnelleId],
    cleanup: cleanupQuestionConditionnelle,
  } = await addTestQuestions(databaseService, [
    {
      thematiqueId: data.thematiqueId,
      type: 'binaire',
      description: 'Question affichée seulement si expr_visible est vérifiée',
      formulation: 'Question conditionnelle expr_visible',
      exprVisible: `Si reponse(${questionReferenceId}, NON) alors VRAI`,
    },
  ]);

  return {
    questionReferenceId,
    questionConditionnelleId,
    cleanup: async () => {
      await cleanupQuestionConditionnelle();
      await cleanupQuestionReference();
    },
  };
}

/** Crée une collectivité, une thématique et des questions de test */
export async function addTestPersonnalisationData(
  databaseService: DatabaseServiceInterface
) {
  const testDataId = {
    // Actions pour tester le filtre actionIds (te-test existe en seed)
    actionId1: generatePersonnalisationTestId('test-a'),
    actionId2: generatePersonnalisationTestId('test-a'),
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
    await addTestThematiqueEtQuestions(databaseService, collectiviteType);

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

  /** les 3 questions de la thématique de test pour le type de collectivité */
  const fixtureQuestionIds = [
    mergedTestDataId.questionBinaireId,
    mergedTestDataId.questionProportionId,
    mergedTestDataId.questionChoixId,
  ];

  // isole les questions créées par cette fixture (hors données seed)
  const isolateFixtureQuestions = <T extends { id: string }>(questions: T[]) =>
    questions.filter((q) => fixtureQuestionIds.includes(q.id));

  return {
    ...mergedTestDataId,
    fixtureQuestionIds,
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

      await cleanupThematiqueEtQuestions();

      await cleanup();
    },
  };
}
