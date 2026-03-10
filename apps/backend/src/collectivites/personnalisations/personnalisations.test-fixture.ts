import { collectiviteBanatic2025TransfertTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-2025-transfert.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { referentielDefinitionTable } from '@tet/backend/referentiels/models/referentiel-definition.table';
import { banatic2025CompetenceTable } from '@tet/backend/shared/models/banatic-2025-competence.table';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { CollectiviteType } from '@tet/domain/collectivites';
import { ReferentielId, ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getAuthUserFromUserCredentials } from '../../../test/get-auth-user-from-credentials';
import { addTestCollectiviteAndUser } from '../collectivites/collectivites.test-fixture';
import { collectiviteBanatic2025CompetenceTable } from '../shared/models/collectivite-banatic-2025-competence.table';
import { historiqueJustificationTable } from './models/historique-justification.table';
import { historiqueReponseBinaireTable } from './models/historique-reponse-binaire.table';
import { historiqueReponseChoixTable } from './models/historique-reponse-choix.table';
import { historiqueReponseProportionTable } from './models/historique-reponse-proportion.table';
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

const REFERENTIEL_ID = ReferentielIdEnum.TE;
// aligné sur REFERENTIEL_ID : premier segment des actionId (avant _) doit passer getReferentielIdFromActionId (ex. SnapshotsService)
const TEST_ACTION_ID_PREFIX = `${REFERENTIEL_ID}-a`;
async function getReferentielVersion(
  databaseService: DatabaseServiceInterface
) {
  const [referentielDefinition] = await databaseService.db
    .select({ version: referentielDefinitionTable.version })
    .from(referentielDefinitionTable)
    .where(eq(referentielDefinitionTable.id, REFERENTIEL_ID))
    .limit(1);
  return referentielDefinition.version;
}

const TEST_ACTION_DEFINITION_BASE = {
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

export type HistoriqueReponseBinaireRow = {
  id: number;
  modifiedAt: string;
  modifiedBy: string | null;
  collectiviteId: number;
  questionId: string;
  reponse: boolean | null;
  previousReponse: boolean | null;
};

export type HistoriqueReponseChoixRow = {
  id: number;
  modifiedAt: string;
  modifiedBy: string | null;
  collectiviteId: number;
  questionId: string;
  reponse: string | null;
  previousReponse: string | null;
};

export type HistoriqueReponseProportionRow = {
  id: number;
  modifiedAt: string;
  modifiedBy: string | null;
  collectiviteId: number;
  questionId: string;
  reponse: number | null;
  previousReponse: number | null;
};

export type HistoriqueJustificationRow = {
  id: number;
  collectiviteId: number;
  questionId: string;
  modifiedBy: string | null;
  previousModifiedBy: string | null;
  modifiedAt: string;
  previousModifiedAt: string | null;
  texte: string;
  previousTexte: string | null;
};

export async function listHistoriqueReponseBinaire(
  databaseService: DatabaseServiceInterface,
  collectiviteId: number,
  questionId: string
): Promise<HistoriqueReponseBinaireRow[]> {
  return databaseService.db
    .select()
    .from(historiqueReponseBinaireTable)
    .where(
      and(
        eq(historiqueReponseBinaireTable.collectiviteId, collectiviteId),
        eq(historiqueReponseBinaireTable.questionId, questionId)
      )
    ) as unknown as Promise<HistoriqueReponseBinaireRow[]>;
}

export async function listHistoriqueReponseChoix(
  databaseService: DatabaseServiceInterface,
  collectiviteId: number,
  questionId: string
): Promise<HistoriqueReponseChoixRow[]> {
  return databaseService.db
    .select()
    .from(historiqueReponseChoixTable)
    .where(
      and(
        eq(historiqueReponseChoixTable.collectiviteId, collectiviteId),
        eq(historiqueReponseChoixTable.questionId, questionId)
      )
    ) as unknown as Promise<HistoriqueReponseChoixRow[]>;
}

export async function listHistoriqueReponseProportion(
  databaseService: DatabaseServiceInterface,
  collectiviteId: number,
  questionId: string
): Promise<HistoriqueReponseProportionRow[]> {
  return databaseService.db
    .select()
    .from(historiqueReponseProportionTable)
    .where(
      and(
        eq(historiqueReponseProportionTable.collectiviteId, collectiviteId),
        eq(historiqueReponseProportionTable.questionId, questionId)
      )
    ) as unknown as Promise<HistoriqueReponseProportionRow[]>;
}

export async function listHistoriqueJustification(
  databaseService: DatabaseServiceInterface,
  collectiviteId: number,
  questionId: string
): Promise<HistoriqueJustificationRow[]> {
  return databaseService.db
    .select()
    .from(historiqueJustificationTable)
    .where(
      and(
        eq(historiqueJustificationTable.collectiviteId, collectiviteId),
        eq(historiqueJustificationTable.questionId, questionId)
      )
    ) as unknown as Promise<HistoriqueJustificationRow[]>;
}

// insère une thématique
export async function addTestThematique(
  { db }: DatabaseServiceInterface,
  data: { id: string; nom: string }
): Promise<{ cleanup: () => Promise<void> }> {
  await db.insert(questionThematiqueTable).values(data).onConflictDoNothing();

  return {
    cleanup: async () => {
      const questions = await db
        .select({ questionId: questionTable.id })
        .from(questionTable)
        .where(eq(questionTable.thematiqueId, data.id));
      const ids = questions.map((q) => q.questionId);
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
        // supprime les réponses et les justifications avant les questions elles-mêmes
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

  const questionActionLinks = [
    {
      actionId: generatePersonnalisationTestId(TEST_ACTION_ID_PREFIX),
      questionId: questionBinaireId,
    },
    {
      actionId: generatePersonnalisationTestId(TEST_ACTION_ID_PREFIX),
      questionId: questionProportionId,
    },
    {
      actionId: generatePersonnalisationTestId(TEST_ACTION_ID_PREFIX),
      questionId: questionChoixId,
    },
  ];
  const { cleanup: cleanupActionLinks } =
    await insertReferentielActionQuestionLinks(databaseService, {
      referentielId: REFERENTIEL_ID,
      links: questionActionLinks,
    });

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
    questionActionLinks,
  };

  return {
    data,
    cleanup: async () => {
      await cleanupActionLinks();
      await cleanupQuestions();
      await cleanupChoix();
      await cleanupThematique();
    },
  };
}

type ActionQuestionLink = {
  actionId: string;
  questionId: string;
};

/** Insère les liens entre actions et questions */
async function insertReferentielActionQuestionLinks(
  databaseService: DatabaseServiceInterface,
  data: {
    referentielId: ReferentielId;
    links: ActionQuestionLink[];
  }
) {
  const actionIds = Array.from(
    new Set(data.links.map((link) => link.actionId))
  );
  if (actionIds.length === 0) {
    return { cleanup: () => {} };
  }

  const referentielVersion = await getReferentielVersion(databaseService);

  await databaseService.db
    .insert(actionRelationTable)
    .values(
      actionIds.map((id, index) => ({
        id,
        referentiel: data.referentielId,
        identifiant: `1.2.${index}`,
      }))
    )
    .onConflictDoNothing();

  await databaseService.db
    .insert(actionDefinitionTable)
    .values(
      actionIds.map((actionId, index) => ({
        ...TEST_ACTION_DEFINITION_BASE,
        referentielVersion,
        referentiel: data.referentielId,
        referentielId: data.referentielId,
        actionId,
        identifiant: `1.2.${index}`,
      }))
    )
    .onConflictDoNothing();

  await databaseService.db
    .insert(questionActionTable)
    .values(
      data.links.map((link) => ({
        actionId: link.actionId,
        questionId: link.questionId,
      }))
    )
    .onConflictDoNothing();

  return {
    cleanup: async () => {
      const actionIds = Array.from(
        new Set(data.links.map((link) => link.actionId))
      );
      if (actionIds.length === 0) {
        return Promise.resolve();
      }

      await databaseService.db
        .delete(questionActionTable)
        .where(inArray(questionActionTable.actionId, actionIds));
      await databaseService.db
        .delete(actionDefinitionTable)
        .where(inArray(actionDefinitionTable.actionId, actionIds));
      await databaseService.db
        .delete(actionRelationTable)
        .where(inArray(actionRelationTable.id, actionIds));
    },
  };
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

  const actionId = generatePersonnalisationTestId(TEST_ACTION_ID_PREFIX);
  const links = [{ actionId, questionId }];
  const { cleanup: cleanupActionLinks } =
    await insertReferentielActionQuestionLinks(databaseService, {
      referentielId: REFERENTIEL_ID,
      links,
    });

  return {
    questionId,
    cleanup: async () => {
      await cleanupActionLinks();
      await cleanup();
    },
  };
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

  const actionId = generatePersonnalisationTestId(TEST_ACTION_ID_PREFIX);
  const links = [
    {
      actionId,
      questionId: questionBinaireCompetenceBanaticId,
    },
  ];
  const { cleanup: cleanupActionLinks } =
    await insertReferentielActionQuestionLinks(databaseService, {
      referentielId: REFERENTIEL_ID,
      links,
    });

  const cleanup = async () => {
    await cleanupActionLinks();
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

  const exprVisibleActionId = generatePersonnalisationTestId(
    TEST_ACTION_ID_PREFIX
  );
  const { cleanup: cleanupActionLinks } =
    await insertReferentielActionQuestionLinks(databaseService, {
      referentielId: REFERENTIEL_ID,
      links: [
        { actionId: exprVisibleActionId, questionId: questionReferenceId },
        { actionId: exprVisibleActionId, questionId: questionConditionnelleId },
      ],
    });

  return {
    questionReferenceId,
    questionConditionnelleId,
    cleanup: async () => {
      await cleanupActionLinks();
      await cleanupQuestionConditionnelle();
      await cleanupQuestionReference();
    },
  };
}

/** Crée une collectivité, une thématique et des questions de test */
export async function addTestPersonnalisationData(
  databaseService: DatabaseServiceInterface
) {
  const {
    user,
    collectivite,
    cleanup: cleanupCollectiviteAndUser,
  } = await addTestCollectiviteAndUser(databaseService, {
    user: {
      role: CollectiviteRole.ADMIN,
    },
  });

  const userCredentials = getAuthUserFromUserCredentials(user);

  const collectiviteType = collectivite.type;

  const { data: baseData, cleanup: cleanupThematiqueEtQuestions } =
    await addTestThematiqueEtQuestions(databaseService, collectiviteType);

  /** les 3 questions de la thématique de test pour le type de collectivité */
  const fixtureQuestionIds = [
    baseData.questionBinaireId,
    baseData.questionProportionId,
    baseData.questionChoixId,
  ];

  // isole les questions créées par cette fixture (hors données seed)
  const isolateFixtureQuestions = <T extends { id: string }>(questions: T[]) =>
    questions.filter((q) => fixtureQuestionIds.includes(q.id));

  return {
    ...baseData,
    fixtureQuestionIds,
    isolateFixtureQuestions,
    user,
    userCredentials,
    collectivite,
    cleanup: async () => {
      await cleanupThematiqueEtQuestions();
      await cleanupCollectiviteAndUser();
    },
  };
}
