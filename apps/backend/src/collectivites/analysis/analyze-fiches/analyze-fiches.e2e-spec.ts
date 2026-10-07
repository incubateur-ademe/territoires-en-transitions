import { INestApplication, INestApplicationContext } from '@nestjs/common';
import { ModulesContainer, NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { FicheActionRepository } from '@tet/backend/plans/fiches/fiche-action.repository';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { success, type Result } from '@tet/backend/utils/result.type';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { categorieActionEnumValues } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { inferRouterInputs } from '@trpc/server';
import { eq, inArray } from 'drizzle-orm';
import { countBy, keyBy } from 'es-toolkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { CollectiviteVoletGesRepository } from '../collectivite-volet-ges.repository';
import { analysisRunTable } from '../models/analysis-run.table';
import { ficheActionAnalysisTable } from '../models/fiche-action-analysis.table';
import { ficheActionVoletGesTable } from '../models/fiche-action-volet-ges.table';
import { FicheAnalysis } from '../models/fiche-analysis';
import { MobilisationState } from '../models/mobilisation-state';
import {
  classificationResponseSchema,
  FicheClassification,
} from '../pipeline/classify-fiches/classify-fiches.schema';
import { toLevierRank } from '../prompts/levier-ranks';
import { VoletError } from '../volet.errors';
import { AnalyzeFichesModule } from './analyze-fiches.module';
import {
  AnalyzeFichesExitCode,
  runAnalyzeFichesScript,
} from './analyze-fiches.script';
import { AnalyzeFichesService } from './analyze-fiches.service';
import { FicheCandidateError } from './analyze-fiches.errors';
import { FicheCandidateRepository } from './fiche-candidate.repository';

type TrpcCaller = ReturnType<TrpcRouter['createCaller']>;

type TestCollectivite = {
  readonly collectiviteId: number;
  readonly caller: TrpcCaller;
};

type FicheToCreate = Pick<
  inferRouterInputs<AppRouter>['plans']['fiches']['create']['fiche'],
  'titre' | 'description' | 'parentId' | 'restreint'
> & { readonly axeId?: number };

type FicheState = {
  readonly ficheId: number;
  readonly status: FicheAnalysis['status'] | 'unanalyzed';
  readonly retryCount: number;
  readonly voletCount: number;
};

const NO_LEVIER_MARKER = 'Sans levier pertinent';

const REJECTED_MARKER = 'Rejetée par le modèle';

const MOBILISATION_PROMPT_MARKER = 'Levier évalué';

const ACTION_BLOCK_PATTERN =
  /<action index="(\d+)" nonce="[^"]*">([\s\S]*?)<\/action>/g;

const WORKFLOW_PATH = path.join(
  __dirname,
  '../../../../../../.github/workflows/analyze-fiches.yml'
);

const TOKENS = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 5,
  thoughtsTokens: 0,
  totalTokens: 15,
};

const VELO_AMENAGEMENT_VOLET = {
  levier: toLevierRank('Vélo et transport en commun'),
  categories: [categorieActionEnumValues.indexOf('amenagement') + 1],
};

const MODEL_NOTE = 2;

let isRejectingMarkedFiches = false;
let llmPrompts: readonly string[] = [];
let collectiviteIdsOfDailyRuns: readonly number[] = [];
let dailyRunStarts: readonly Date[] = [];
let cleanups: readonly (() => Promise<void>)[] = [];

const toFakeFicheClassifications = (prompt: string): FicheClassification[] =>
  classificationResponseSchema.parse(
    [...prompt.matchAll(ACTION_BLOCK_PATTERN)].flatMap(([, index, text]) => {
      const isRejected =
        isRejectingMarkedFiches && text.includes(REJECTED_MARKER);
      if (isRejected) {
        return [];
      }
      const hasNoRelevantLevier = text.includes(NO_LEVIER_MARKER);
      return [
        {
          index: Number(index),
          justification: 'Classement du faux modèle',
          hasNoRelevantLevier,
          volets: hasNoRelevantLevier ? [] : [VELO_AMENAGEMENT_VOLET],
        },
      ];
    })
  );

const fakeLlm = {
  generateStructured: async ({ prompt }: { prompt: string }) => {
    llmPrompts = [...llmPrompts, prompt];
    if (prompt.includes(MOBILISATION_PROMPT_MARKER)) {
      return success({
        data: {
          '1': MODEL_NOTE,
          '2': MODEL_NOTE,
          '3': MODEL_NOTE,
          '4': MODEL_NOTE,
          '5': MODEL_NOTE,
          '6': MODEL_NOTE,
        },
        tokens: TOKENS,
      });
    }
    return success({
      data: toFakeFicheClassifications(prompt),
      tokens: TOKENS,
    });
  },
} as unknown as LlmService;

const keepCollectivitesOfDailyRuns = <Failure>(
  collectiviteIdsResult: Result<number[], Failure>
): Result<number[], Failure> => {
  if (!collectiviteIdsResult.success) {
    return collectiviteIdsResult;
  }
  return success(
    collectiviteIdsResult.data.filter((collectiviteId) =>
      collectiviteIdsOfDailyRuns.includes(collectiviteId)
    )
  );
};

class CollectivitesOfDailyRunsMobilisationRepository extends CollectiviteVoletGesRepository {
  override async listCollectivitesWithMobilisation(): Promise<
    Result<number[], VoletError>
  > {
    return keepCollectivitesOfDailyRuns(
      await super.listCollectivitesWithMobilisation()
    );
  }
}

const toCollectivitesOfDailyRunsFicheCandidates = (
  fiches: FicheActionRepository
): FicheCandidateRepository => ({
  listCollectivitesWithFicheCandidates: async (): Promise<
    Result<number[], FicheCandidateError>
  > =>
    keepCollectivitesOfDailyRuns(
      await fiches.listCollectivitesWithFicheCandidates()
    ),
  listFicheCandidates: (selection) => fiches.listFicheCandidates(selection),
});

const toProcessedWithVolet = (ficheId: number): FicheState => ({
  ficheId,
  status: 'processed',
  retryCount: 0,
  voletCount: 1,
});

const toProcessedWithoutVolet = (ficheId: number): FicheState => ({
  ficheId,
  status: 'processed',
  retryCount: 0,
  voletCount: 0,
});

const toUnanalyzed = (ficheId: number): FicheState => ({
  ficheId,
  status: 'unanalyzed',
  retryCount: 0,
  voletCount: 0,
});

const toClassifiedFicheTexts = (prompts: readonly string[]): string[] =>
  prompts
    .filter((prompt) => !prompt.includes(MOBILISATION_PROMPT_MARKER))
    .flatMap((prompt) =>
      [...prompt.matchAll(ACTION_BLOCK_PATTERN)].map(([, , text]) =>
        text.trim()
      )
    );

let app: INestApplication;
let db: DatabaseService;
let router: TrpcRouter;
let analysisContext: INestApplicationContext;

const registerCleanup = (cleanup: () => Promise<void>): void => {
  cleanups = [cleanup, ...cleanups];
};

const addCollectivite = async (): Promise<TestCollectivite> => {
  const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(db, {
    user: { role: CollectiviteRole.EDITION },
  });
  registerCleanup(async () => {
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.collectiviteId, collectivite.id));
    await cleanup();
  });
  return {
    collectiviteId: collectivite.id,
    caller: router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    }),
  };
};

const createFiche = async (
  { collectiviteId, caller }: TestCollectivite,
  fiche: FicheToCreate
): Promise<number> => {
  const { ficheId } = await createFicheAndCleanupFunction({
    caller,
    ficheInput: { collectiviteId, ...fiche },
  });
  return ficheId;
};

const createFiches = async (
  collectivite: TestCollectivite,
  titres: readonly string[]
): Promise<number[]> =>
  titres.reduce<Promise<number[]>>(async (previous, titre) => {
    const ficheIds = await previous;
    return [...ficheIds, await createFiche(collectivite, { titre })];
  }, Promise.resolve([]));

const runScript = (argv: readonly string[]): Promise<AnalyzeFichesExitCode> =>
  runAnalyzeFichesScript({
    app: analysisContext,
    argv,
    startedAt: new Date(),
  });

const runDailyScript = (): Promise<AnalyzeFichesExitCode> => {
  const startedAt = new Date();
  dailyRunStarts = [...dailyRunStarts, startedAt];
  return runAnalyzeFichesScript({ app: analysisContext, argv: [], startedAt });
};

const readFicheStates = async (
  ficheIds: readonly number[]
): Promise<FicheState[]> => {
  const [analyses, volets] = await Promise.all([
    db.db
      .select({
        ficheId: ficheActionAnalysisTable.ficheId,
        status: ficheActionAnalysisTable.status,
        retryCount: ficheActionAnalysisTable.retryCount,
      })
      .from(ficheActionAnalysisTable)
      .where(inArray(ficheActionAnalysisTable.ficheId, [...ficheIds])),
    db.db
      .select({ ficheId: ficheActionVoletGesTable.ficheId })
      .from(ficheActionVoletGesTable)
      .where(inArray(ficheActionVoletGesTable.ficheId, [...ficheIds])),
  ]);
  const analysesByFicheId = keyBy(analyses, ({ ficheId }) => ficheId);
  const voletCountByFicheId = countBy(volets, ({ ficheId }) => ficheId);
  return ficheIds.map((ficheId) => ({
    ficheId,
    status: analysesByFicheId[ficheId]?.status ?? 'unanalyzed',
    retryCount: analysesByFicheId[ficheId]?.retryCount ?? 0,
    voletCount: voletCountByFicheId[ficheId] ?? 0,
  }));
};

const readMobilisationState = (
  collectiviteId: number
): Promise<Result<MobilisationState, VoletError>> =>
  analysisContext
    .get(CollectiviteVoletGesRepository)
    .getMobilisationState({ collectiviteId });

beforeAll(async () => {
  app = await getTestApp();
  db = await getTestDatabase(app);
  router = await getTestRouter(app);

  const analysisModule = await Test.createTestingModule({
    imports: [AnalyzeFichesModule],
  })
    .overrideProvider(LlmService)
    .useValue(fakeLlm)
    .overrideProvider(FicheCandidateRepository)
    .useFactory({
      factory: toCollectivitesOfDailyRunsFicheCandidates,
      inject: [FicheActionRepository],
    })
    .overrideProvider(CollectiviteVoletGesRepository)
    .useFactory({
      factory: (database: DatabaseService) =>
        new CollectivitesOfDailyRunsMobilisationRepository(database),
      inject: [DatabaseService],
    })
    .compile();
  analysisContext = await analysisModule.init();

  return async () => {
    await app.close();
  };
});

beforeEach(() => {
  isRejectingMarkedFiches = false;
  llmPrompts = [];
  collectiviteIdsOfDailyRuns = [];
});

afterEach(async () => {
  const cleanupsOfTest = cleanups;
  cleanups = [];
  await cleanupsOfTest.reduce<Promise<void>>(async (previous, cleanup) => {
    await previous;
    await cleanup();
  }, Promise.resolve());
});

afterAll(async () => {
  if (dailyRunStarts.length > 0) {
    await db.db
      .delete(analysisRunTable)
      .where(inArray(analysisRunTable.startedAt, [...dailyRunStarts]));
  }
  await analysisContext.close();
});

describe('full-flow', { timeout: 120_000 }, () => {
  it('à la fin du script, chaque fiche des CT demandées a un statut traité et ses volets dans fiche_action_volet_ges', async () => {
    const firstCollectivite = await addCollectivite();
    const secondCollectivite = await addCollectivite();
    const firstFicheIds = await createFiches(firstCollectivite, [
      'Aménager des pistes cyclables',
      'Créer une navette gratuite',
    ]);
    const secondFicheIds = await createFiches(secondCollectivite, [
      'Développer le covoiturage',
    ]);

    const exitCode = await runScript([
      `--collectivites=${firstCollectivite.collectiviteId},${secondCollectivite.collectiviteId}`,
    ]);

    expect({
      exitCode,
      fiches: await readFicheStates([...firstFicheIds, ...secondFicheIds]),
    }).toEqual({
      exitCode: 0,
      fiches: [...firstFicheIds, ...secondFicheIds].map(toProcessedWithVolet),
    });
  });

  it('analyse les fiches hors plan et restreintes, pas les sous-fiches', async () => {
    const collectivite = await addCollectivite();
    const plan = await collectivite.caller.plans.plans.create({
      collectiviteId: collectivite.collectiviteId,
      nom: 'Plan de mobilité',
    });
    registerCleanup(async () => {
      await collectivite.caller.plans.plans.delete({ planId: plan.id });
    });
    const inPlanFicheId = await createFiche(collectivite, {
      titre: 'Aménager des pistes cyclables',
      axeId: plan.id,
    });
    const outOfPlanFicheId = await createFiche(collectivite, {
      titre: 'Créer une navette gratuite',
    });
    const restrictedFicheId = await createFiche(collectivite, {
      titre: 'Développer le covoiturage',
      restreint: true,
    });
    const subFicheId = await createFiche(collectivite, {
      titre: 'Poser des arceaux vélo',
      parentId: inPlanFicheId,
    });

    const exitCode = await runScript([
      `--collectivites=${collectivite.collectiviteId}`,
    ]);

    expect({
      exitCode,
      fiches: await readFicheStates([
        inPlanFicheId,
        outOfPlanFicheId,
        restrictedFicheId,
        subFicheId,
      ]),
    }).toEqual({
      exitCode: 0,
      fiches: [
        toProcessedWithVolet(inPlanFicheId),
        toProcessedWithVolet(outOfPlanFicheId),
        toProcessedWithVolet(restrictedFicheId),
        toUnanalyzed(subFicheId),
      ],
    });
  });
});

describe('fiche-sans-volet', { timeout: 120_000 }, () => {
  it('une fiche classée sans volet a un statut traité et aucune ligne dans fiche_action_volet_ges', async () => {
    const collectivite = await addCollectivite();
    const ficheId = await createFiche(collectivite, {
      titre: 'Réorganiser le service courrier',
      description: NO_LEVIER_MARKER,
    });

    const exitCode = await runScript([
      `--collectivites=${collectivite.collectiviteId}`,
    ]);

    expect({ exitCode, fiches: await readFicheStates([ficheId]) }).toEqual({
      exitCode: 0,
      fiches: [toProcessedWithoutVolet(ficheId)],
    });
  });
});

describe('daily-ct-check', { timeout: 120_000 }, () => {
  it("le passage quotidien classe les fiches créées depuis le dernier passage et recalcule l'engagement de leur CT", async () => {
    const collectivite = await addCollectivite();
    collectiviteIdsOfDailyRuns = [collectivite.collectiviteId];
    const firstFicheId = await createFiche(collectivite, {
      titre: 'Aménager des pistes cyclables',
    });
    const firstExitCode = await runDailyScript();
    const secondFicheId = await createFiche(collectivite, {
      titre: 'Créer une navette gratuite',
    });
    llmPrompts = [];

    const secondExitCode = await runDailyScript();

    expect({
      exitCodes: [firstExitCode, secondExitCode],
      classifiedFicheTextsOfSecondRun: toClassifiedFicheTexts(llmPrompts),
      fiches: await readFicheStates([firstFicheId, secondFicheId]),
      mobilisation: await readMobilisationState(collectivite.collectiviteId),
    }).toMatchObject({
      exitCodes: [0, 0],
      classifiedFicheTextsOfSecondRun: ['Créer une navette gratuite'],
      fiches: [
        toProcessedWithVolet(firstFicheId),
        toProcessedWithVolet(secondFicheId),
      ],
      mobilisation: {
        success: true,
        data: { kind: 'calculated', ficheIds: [firstFicheId, secondFicheId] },
      },
    });
  });
});

describe('cron-action-management', { timeout: 120_000 }, () => {
  it('une fiche dont la description a changé depuis le dernier passage est reclassée', async () => {
    const collectivite = await addCollectivite();
    collectiviteIdsOfDailyRuns = [collectivite.collectiviteId];
    const ficheId = await createFiche(collectivite, {
      titre: 'Aménager des pistes cyclables',
      description: 'Dix kilomètres de pistes protégées',
    });
    const firstExitCode = await runDailyScript();
    const fichesAfterFirstRun = await readFicheStates([ficheId]);
    await collectivite.caller.plans.fiches.update({
      ficheId,
      ficheFields: { description: NO_LEVIER_MARKER },
    });

    const secondExitCode = await runDailyScript();

    expect({
      exitCodes: [firstExitCode, secondExitCode],
      fichesAfterFirstRun,
      fichesAfterSecondRun: await readFicheStates([ficheId]),
    }).toEqual({
      exitCodes: [0, 0],
      fichesAfterFirstRun: [toProcessedWithVolet(ficheId)],
      fichesAfterSecondRun: [toProcessedWithoutVolet(ficheId)],
    });
  });
});

describe('retry-on-failure', { timeout: 120_000 }, () => {
  it('une fiche que le LLM rejette 3 fois est en erreur avec un compteur à 1, puis reclassée au passage suivant', async () => {
    const collectivite = await addCollectivite();
    const [classifiedFicheId, rejectedFicheId] = await createFiches(
      collectivite,
      ['Aménager des pistes cyclables', REJECTED_MARKER]
    );
    const argv = [`--collectivites=${collectivite.collectiviteId}`];
    isRejectingMarkedFiches = true;
    const firstExitCode = await runScript(argv);
    const fichesAfterFirstRun = await readFicheStates([
      classifiedFicheId,
      rejectedFicheId,
    ]);
    const rejectedFicheAttemptsInFirstRun = toClassifiedFicheTexts(
      llmPrompts
    ).filter((ficheText) => ficheText.includes(REJECTED_MARKER)).length;
    isRejectingMarkedFiches = false;

    const secondExitCode = await runScript(argv);

    expect({
      exitCodes: [firstExitCode, secondExitCode],
      rejectedFicheAttemptsInFirstRun,
      fichesAfterFirstRun,
      fichesAfterSecondRun: await readFicheStates([
        classifiedFicheId,
        rejectedFicheId,
      ]),
    }).toEqual({
      exitCodes: [0, 0],
      rejectedFicheAttemptsInFirstRun: 3,
      fichesAfterFirstRun: [
        toProcessedWithVolet(classifiedFicheId),
        {
          ficheId: rejectedFicheId,
          status: 'failed',
          retryCount: 1,
          voletCount: 0,
        },
      ],
      fichesAfterSecondRun: [
        toProcessedWithVolet(classifiedFicheId),
        toProcessedWithVolet(rejectedFicheId),
      ],
    });
  });
});

describe('reclassification-on-deletion', { timeout: 120_000 }, () => {
  it("une fiche supprimée en douce perd ses volets et son statut, et sort de l'engagement de sa CT", async () => {
    const collectivite = await addCollectivite();
    const [deletedFicheId, keptFicheId] = await createFiches(collectivite, [
      'Aménager des pistes cyclables',
      'Créer une navette gratuite',
    ]);
    const argv = [`--collectivites=${collectivite.collectiviteId}`];
    const firstExitCode = await runScript(argv);
    const mobilisationAfterFirstRun = await readMobilisationState(
      collectivite.collectiviteId
    );
    await collectivite.caller.plans.fiches.delete({ ficheId: deletedFicheId });

    const secondExitCode = await runScript(argv);

    expect({
      exitCodes: [firstExitCode, secondExitCode],
      mobilisationAfterFirstRun,
      fiches: await readFicheStates([deletedFicheId, keptFicheId]),
      mobilisation: await readMobilisationState(collectivite.collectiviteId),
    }).toMatchObject({
      exitCodes: [0, 0],
      mobilisationAfterFirstRun: {
        success: true,
        data: { kind: 'calculated', ficheIds: [deletedFicheId, keptFicheId] },
      },
      fiches: [toUnanalyzed(deletedFicheId), toProcessedWithVolet(keptFicheId)],
      mobilisation: {
        success: true,
        data: { kind: 'calculated', ficheIds: [keptFicheId] },
      },
    });
  });

  it("une fiche supprimée physiquement sort de l'engagement de sa CT au passage suivant", async () => {
    const collectivite = await addCollectivite();
    const deletedFicheId = await createFiche(collectivite, {
      titre: 'Aménager des pistes cyclables',
    });
    const keptFicheId = await createFiche(collectivite, {
      titre: 'Créer une navette gratuite',
    });
    const argv = [`--collectivites=${collectivite.collectiviteId}`];
    const firstExitCode = await runScript(argv);
    const mobilisationAfterFirstRun = await readMobilisationState(
      collectivite.collectiviteId
    );
    await collectivite.caller.plans.fiches.delete({
      ficheId: deletedFicheId,
      deleteMode: 'hard',
    });

    const secondExitCode = await runScript(argv);

    expect({
      exitCodes: [firstExitCode, secondExitCode],
      mobilisationAfterFirstRun,
      mobilisation: await readMobilisationState(collectivite.collectiviteId),
    }).toMatchObject({
      exitCodes: [0, 0],
      mobilisationAfterFirstRun: {
        success: true,
        data: { kind: 'calculated', ficheIds: [deletedFicheId, keptFicheId] },
      },
      mobilisation: {
        success: true,
        data: { kind: 'calculated', ficheIds: [keptFicheId] },
      },
    });
  });

  it("l'engagement d'une CT dont la dernière fiche analysée est supprimée est vidé au passage suivant", async () => {
    const collectivite = await addCollectivite();
    const ficheId = await createFiche(collectivite, {
      titre: 'Aménager des pistes cyclables',
    });
    const argv = [`--collectivites=${collectivite.collectiviteId}`];
    const firstExitCode = await runScript(argv);
    const mobilisationAfterFirstRun = await readMobilisationState(
      collectivite.collectiviteId
    );
    await collectivite.caller.plans.fiches.delete({ ficheId });

    const secondExitCode = await runScript(argv);

    expect({
      exitCodes: [firstExitCode, secondExitCode],
      mobilisationAfterFirstRun,
      mobilisation: await readMobilisationState(collectivite.collectiviteId),
    }).toMatchObject({
      exitCodes: [0, 0],
      mobilisationAfterFirstRun: {
        success: true,
        data: { kind: 'calculated', ficheIds: [ficheId] },
      },
      mobilisation: { success: true, data: { kind: 'never_calculated' } },
    });
  });
});

describe(
  'full-flow-behavior-on-already-processed-action',
  { timeout: 120_000 },
  () => {
    it('relancer le script sur une CT déjà analysée sans changement ne rappelle pas le LLM', async () => {
      const collectivite = await addCollectivite();
      await createFiches(collectivite, [
        'Aménager des pistes cyclables',
        'Créer une navette gratuite',
      ]);
      const argv = [`--collectivites=${collectivite.collectiviteId}`];
      const firstExitCode = await runScript(argv);
      const llmCallCountOfFirstRun = llmPrompts.length;
      llmPrompts = [];

      const secondExitCode = await runScript(argv);

      expect({
        exitCodes: [firstExitCode, secondExitCode],
        hasFirstRunCalledLlm: llmCallCountOfFirstRun > 0,
        llmCallCountOfSecondRun: llmPrompts.length,
      }).toEqual({
        exitCodes: [0, 0],
        hasFirstRunCalledLlm: true,
        llmCallCountOfSecondRun: 0,
      });
    });
  }
);

describe('only-github-action', () => {
  it("le router analysis n'expose plus que getMobilisation", () => {
    const analysisPaths = Object.keys(router.appRouter._def.procedures).filter(
      (path) => path.startsWith('collectivites.analysis.')
    );

    expect(analysisPaths).toEqual(['collectivites.analysis.getMobilisation']);
  });

  it("aucune procédure tRPC ne déclenche l'analyse, quel que soit le rôle", () => {
    const analysisPaths = Object.keys(router.appRouter._def.procedures).filter(
      (path) => /analys/i.test(path)
    );

    expect({
      analysisPaths,
      getMobilisationType:
        router.appRouter.collectivites.analysis.getMobilisation._def.type,
    }).toEqual({
      analysisPaths: ['collectivites.analysis.getMobilisation'],
      getMobilisationType: 'query',
    });
  });
});

describe('llm-issue', { timeout: 120_000 }, () => {
  const runWithRejectedFiches = async (
    rejectedFicheCount: number
  ): Promise<{ exitCode: AnalyzeFichesExitCode; fiches: FicheState[] }> => {
    const collectivite = await addCollectivite();
    const ficheIds = await createFiches(
      collectivite,
      Array.from(
        { length: rejectedFicheCount },
        (_, position) => `${REJECTED_MARKER} ${position + 1}`
      )
    );
    isRejectingMarkedFiches = true;
    const exitCode = await runScript([
      `--collectivites=${collectivite.collectiviteId}`,
    ]);
    return { exitCode, fiches: await readFicheStates(ficheIds) };
  };

  const toFailedOnce = (fiches: readonly FicheState[]): FicheState[] =>
    fiches.map(({ ficheId }) => ({
      ficheId,
      status: 'failed',
      retryCount: 1,
      voletCount: 0,
    }));

  it('le script sort avec un code non nul quand 10 fiches échouent définitivement', async () => {
    const { exitCode, fiches } = await runWithRejectedFiches(10);

    expect({ exitCode, fiches }).toEqual({
      exitCode: 1,
      fiches: toFailedOnce(fiches),
    });
  });

  it('le script sort avec un code nul quand 9 fiches échouent définitivement', async () => {
    const { exitCode, fiches } = await runWithRejectedFiches(9);

    expect({ exitCode, fiches }).toEqual({
      exitCode: 0,
      fiches: toFailedOnce(fiches),
    });
  });
});

describe('wiring', () => {
  it('AnalyzeFichesModule démarre en contexte applicatif sans BullMQ', async () => {
    const standaloneAnalyzeFichesContext =
      await NestFactory.createApplicationContext(AnalyzeFichesModule, {
        logger: false,
      });
    const moduleNames = [
      ...standaloneAnalyzeFichesContext.get(ModulesContainer).values(),
    ].map(({ metatype }) => metatype.name);
    const hasAnalyzeFichesService =
      standaloneAnalyzeFichesContext.get(AnalyzeFichesService) instanceof
      AnalyzeFichesService;
    await standaloneAnalyzeFichesContext.close();

    expect({
      hasAnalyzeFichesService,
      bullModuleNames: moduleNames.filter((name) => name.startsWith('Bull')),
    }).toEqual({ hasAnalyzeFichesService: true, bullModuleNames: [] });
  });

  it('le workflow analyze-fiches.yml lance le script à la demande, sans cron, avec une liste de CT ou all obligatoire', async () => {
    const workflow = await readFile(WORKFLOW_PATH, 'utf8');

    expect({
      hasSchedule: /^\s+schedule:/m.test(workflow),
      hasManualDispatch: /workflow_dispatch:\s+inputs:\s+collectivites:/.test(
        workflow
      ),
      isCollectivitesRequired: /collectivites:[\s\S]*?required: true/.test(
        workflow
      ),
      hasDefaultCollectivites: /^\s+default:/m.test(workflow),
      scriptCommand: workflow.match(
        /node (\S+analyze-fiches\.script\.js) "--collectivites=\$COLLECTIVITES"/
      )?.[1],
    }).toEqual({
      hasSchedule: false,
      hasManualDispatch: true,
      isCollectivitesRequired: true,
      hasDefaultCollectivites: false,
      scriptCommand:
        'apps/backend/dist/collectivites/analysis/analyze-fiches/analyze-fiches.script.js',
    });
  });
});
