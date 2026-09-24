import { INestApplication } from '@nestjs/common';
import {
  addTestCollectiviteAndUser,
  addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { categorieActionEnumValues } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
} from 'vitest';
import { GenerateAnalysisService } from './generate-analysis/generate-analysis.service';
import { toLevierRank } from './prompts/levier-ranks';
import { AnalysisJobStatusEnum } from './models/analysis-job';
import { analysisJobTable } from './models/analysis-job.table';
import { collectiviteVoletGesTable } from './models/collectivite-volet-ges.table';
import { ficheActionVoletGesTable } from './models/fiche-action-volet-ges.table';

const MODEL_NOTE = 2;
type TerminalStatus =
  | typeof AnalysisJobStatusEnum.DONE
  | typeof AnalysisJobStatusEnum.FAILED;

const TERMINAL_STATUSES: TerminalStatus[] = [
  AnalysisJobStatusEnum.DONE,
  AnalysisJobStatusEnum.FAILED,
];

const isTerminalStatus = (status: string): status is TerminalStatus =>
  TERMINAL_STATUSES.some((terminal) => terminal === status);

type LlmBehaviour =
  | 'nominal'
  | 'classification_down'
  | 'mobilisation_down'
  | 'no_levier';

let llmBehaviour: LlmBehaviour = 'nominal';

const TOKENS = {
  promptTokens: 10,
  cachedTokens: 4,
  candidatesTokens: 5,
  thoughtsTokens: 1,
  totalTokens: 16,
};

const toClassificationResponse = (prompt: string) => {
  const keepsNoLevier = llmBehaviour === 'no_levier';

  return {
    success: true,
    data: {
      data: [...prompt.matchAll(/<action index="(\d+)"/g)].map(([, index]) => ({
        index: Number(index),
        justification: keepsNoLevier
          ? 'Aucun levier pertinent'
          : 'Piste cyclable protégée',
        hasNoRelevantLevier: keepsNoLevier,
        volets: keepsNoLevier
          ? []
          : [
              {
                levier: toLevierRank('Vélo et transport en commun'),
                categories: [
                  categorieActionEnumValues.indexOf('amenagement') + 1,
                ],
              },
            ],
      })),
      tokens: TOKENS,
    },
  };
};

const MOBILISATION_RESPONSE = {
  success: true,
  data: {
    data: {
      '1': MODEL_NOTE,
      '2': MODEL_NOTE,
      '3': MODEL_NOTE,
      '4': MODEL_NOTE,
      '5': MODEL_NOTE,
      '6': MODEL_NOTE,
    },
    tokens: TOKENS,
  },
};

const buildFakeLlm = (): LlmService =>
  ({
    generateStructured: async ({ prompt }: { prompt: string }) => {
      const isMobilisation = prompt.includes('Levier évalué');
      if (isMobilisation) {
        if (llmBehaviour === 'mobilisation_down') {
          return {
            success: false,
            error: { kind: 'api_error', httpStatus: 503 },
          };
        }
        return MOBILISATION_RESPONSE;
      }
      if (llmBehaviour === 'classification_down') {
        return { success: false, error: { kind: 'rate_limited' } };
      }
      return toClassificationResponse(prompt);
    },
  } as unknown as LlmService);

describe('Analyse des leviers, de bout en bout', { timeout: 180_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let collectiviteId: number;
  let editionUser: AuthenticatedUser;
  let lectureUser: AuthenticatedUser;
  let planId: number;
  let ficheIds: number[] = [];
  let ficheCleanups: (() => Promise<void>)[] = [];
  let collectiviteCleanup: () => Promise<void>;

  const callerFor = (user: AuthenticatedUser) =>
    router.createCaller({ user }).collectivites.analysis;

  const readJob = async (jobId: string) => {
    const [job] = await db.db
      .select({
        status: analysisJobTable.status,
        tokenUsage: analysisJobTable.tokenUsage,
        etape: analysisJobTable.etape,
        totalBatches: analysisJobTable.totalBatches,
        error: analysisJobTable.error,
        report: analysisJobTable.report,
      })
      .from(analysisJobTable)
      .where(eq(analysisJobTable.id, jobId));
    return job;
  };

  const readMobilisation = () =>
    db.db
      .select({
        levierId: collectiviteVoletGesTable.levierId,
        categorie: collectiviteVoletGesTable.categorie,
        note: collectiviteVoletGesTable.note,
        ficheIds: collectiviteVoletGesTable.ficheIds,
      })
      .from(collectiviteVoletGesTable)
      .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));

  const readVolets = () =>
    db.db
      .select({ ficheId: ficheActionVoletGesTable.ficheId })
      .from(ficheActionVoletGesTable)
      .where(eq(ficheActionVoletGesTable.ficheId, ficheIds[0]));

  const waitForTerminalStatus = async (
    jobId: string
  ): Promise<TerminalStatus> => {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      const job = await readJob(jobId);
      if (job && isTerminalStatus(job.status)) {
        return job.status;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`Le job ${jobId} n'a pas abouti dans le temps imparti`);
  };

  const runAnalysis = async (): Promise<string> => {
    const { jobId } = await callerFor(editionUser).enqueueAnalysis({
      collectiviteId,
      enjeu: 'ges',
    });
    await waitForTerminalStatus(jobId);
    return jobId;
  };

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder.overrideProvider(LlmService).useValue(buildFakeLlm());
      },
    });
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const { collectivite, users, cleanup } = await addTestCollectiviteAndUsers(
      db,
      {
        users: [
          { role: CollectiviteRole.EDITION },
          { role: CollectiviteRole.LECTURE },
        ],
      }
    );
    const [editionCredentials, lectureCredentials] = users;
    collectiviteCleanup = cleanup;
    collectiviteId = collectivite.id;
    editionUser = getAuthUserFromUserCredentials(editionCredentials);
    lectureUser = getAuthUserFromUserCredentials(lectureCredentials);

    const fixtureCaller = router.createCaller({ user: editionUser });
    const plan = await fixtureCaller.plans.plans.create({
      collectiviteId,
      nom: 'Plan classable',
    });
    planId = plan.id;

    const fiches = await Promise.all(
      ['Amenager des pistes cyclables', 'Navette gratuite'].map((titre) =>
        createFicheAndCleanupFunction({
          caller: fixtureCaller,
          ficheInput: {
            collectiviteId,
            titre,
            description: 'Dix kilometres de pistes protegees',
            axeId: planId,
          },
        })
      )
    );
    ficheIds = fiches.map(({ ficheId }) => ficheId);
    ficheCleanups = fiches.map(({ ficheCleanup }) => ficheCleanup);
  });

  const cleanupAnalysis = async (): Promise<void> => {
    await db.db
      .delete(collectiviteVoletGesTable)
      .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));
    await db.db
      .delete(analysisJobTable)
      .where(eq(analysisJobTable.collectiviteId, collectiviteId));
    for (const ficheId of ficheIds) {
      await db.db
        .delete(ficheActionVoletGesTable)
        .where(eq(ficheActionVoletGesTable.ficheId, ficheId));
    }
  };

  beforeEach(async () => {
    llmBehaviour = 'nominal';
    await cleanupAnalysis();
  });

  afterAll(async () => {
    await cleanupAnalysis();
    for (const cleanup of ficheCleanups) {
      await cleanup();
    }
    await router
      .createCaller({ user: editionUser })
      .plans.plans.delete({ planId });
    await collectiviteCleanup();
    await app.close();
  });

  it('classe chaque fiche, note chaque levier, et rend la mobilisation lisible', async () => {
    const jobId = await runAnalysis();

    const job = await readJob(jobId);
    const lastAnalysis = await callerFor(editionUser).getLastAnalysis({
      collectiviteId,
      enjeu: 'ges',
    });
    const mobilisation = await callerFor(editionUser).getMobilisation({
      collectiviteId,
      enjeu: 'ges',
    });

    expect({
      status: job.status,
      etape: job.etape,
      classifiedFicheCount: job.report?.fiches.length,
      scoredLevierCount: job.totalBatches,
      writtenVoletCount: (await readVolets()).length,
      mobilisationRowCount: (await readMobilisation()).length,
      readableJobId: lastAnalysis?.id,
      readableStatus: lastAnalysis?.status,
      renderedLevierCount: mobilisation.leviers.length,
    }).toEqual({
      status: 'done',
      etape: 'mobilisation',
      classifiedFicheCount: 2,
      scoredLevierCount: 1,
      writtenVoletCount: 1,
      mobilisationRowCount: 6,
      readableJobId: jobId,
      readableStatus: 'done',
      renderedLevierCount: 1,
    });
  });

  it('force à 0 une catégorie sans fiche, quelle que soit la note du modèle', async () => {
    await runAnalysis();

    const notesByCategorie = Object.fromEntries(
      (await readMobilisation()).map(({ categorie, note }) => [categorie, note])
    );

    expect(notesByCategorie).toEqual({
      amenagement: MODEL_NOTE,
      planification: 0,
      financement: 0,
      gouvernance: 0,
      exemplarite: 0,
      sensibilisation: 0,
    });
  });

  it("n'écrit ni volet ni mobilisation quand une fiche épuise ses tentatives", async () => {
    llmBehaviour = 'classification_down';

    const jobId = await runAnalysis();
    const job = await readJob(jobId);

    expect({
      status: job.status,
      etape: job.etape,
      writtenVoletCount: (await readVolets()).length,
      mobilisationRowCount: (await readMobilisation()).length,
    }).toEqual({
      status: 'failed',
      etape: 'classification',
      writtenVoletCount: 0,
      mobilisationRowCount: 0,
    });
  });

  it('enregistre les jetons de la classification meme quand la mobilisation echoue', async () => {
    llmBehaviour = 'mobilisation_down';

    const jobId = await runAnalysis();
    const job = await readJob(jobId);

    expect({
      status: job.status,
      tokenUsage: job.tokenUsage,
    }).toEqual({
      status: 'failed',
      tokenUsage: {
        promptTokens: TOKENS.promptTokens,
        cachedTokens: TOKENS.cachedTokens,
        candidatesTokens: TOKENS.candidatesTokens,
        thoughtsTokens: TOKENS.thoughtsTokens,
        totalTokens: TOKENS.totalTokens,
      },
    });
  });

  it("n'écrit ni volet ni mobilisation quand un levier n'aboutit pas", async () => {
    await runAnalysis();
    const mobilisationBefore = await readMobilisation();
    const voletsBefore = await readVolets();

    llmBehaviour = 'mobilisation_down';
    const jobId = await runAnalysis();
    const job = await readJob(jobId);

    expect({
      status: job.status,
      message: job.error,
      mobilisation: await readMobilisation(),
      volets: await readVolets(),
    }).toEqual({
      status: 'failed',
      message:
        "Mobilisation abandonnée : 1 levier(s) en échec sur 1 — Vélo et transport en commun (api_error). Aucune écriture n'a eu lieu.",
      mobilisation: mobilisationBefore,
      volets: voletsBefore,
    });
  });

  it('efface les volets et la mobilisation du run précédent quand le modèle ne retient plus aucun levier', async () => {
    await runAnalysis();
    const mobilisationRowCountBefore = (await readMobilisation()).length;
    const voletCountBefore = (await readVolets()).length;

    llmBehaviour = 'no_levier';
    const jobId = await runAnalysis();
    const job = await readJob(jobId);

    expect({
      mobilisationRowCountBefore,
      voletCountBefore,
      status: job.status,
      etape: job.etape,
      totalBatches: job.totalBatches,
      reportedFicheCount: job.report?.fiches.length,
      mobilisation: await readMobilisation(),
      volets: await readVolets(),
    }).toEqual({
      mobilisationRowCountBefore: 6,
      voletCountBefore: 1,
      status: 'done',
      etape: 'mobilisation',
      totalBatches: 0,
      reportedFicheCount: ficheIds.length,
      mobilisation: [],
      volets: [],
    });
  });

  it("ignore une re-livraison d'un job déjà terminé sans réécrire la mobilisation", async () => {
    const jobId = await runAnalysis();
    const mobilisationAfterRun = await readMobilisation();

    llmBehaviour = 'mobilisation_down';
    const result = await app.get(GenerateAnalysisService).generate(jobId, []);

    expect({
      success: result.success,
      isMobilisationUnchanged:
        JSON.stringify(await readMobilisation()) ===
        JSON.stringify(mobilisationAfterRun),
    }).toEqual({ success: true, isMobilisationUnchanged: true });
  });

  it("refuse une collectivité qui n'a aucune fiche à classer", async () => {
    const withoutFiche = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    onTestFinished(withoutFiche.cleanup);

    await expect(
      callerFor(
        getAuthUserFromUserCredentials(withoutFiche.user)
      ).enqueueAnalysis({
        collectiviteId: withoutFiche.collectivite.id,
        enjeu: 'ges',
      })
    ).rejects.toThrowError(/aucune fiche/);
  });

  it('rend la mobilisation à un membre en lecture seule', async () => {
    await runAnalysis();

    const [editionView, lectureView] = await Promise.all(
      [editionUser, lectureUser].map((user) =>
        callerFor(user).getMobilisation({ collectiviteId, enjeu: 'ges' })
      )
    );

    expect(lectureView).toEqual(editionView);
  });

  it("rend la mobilisation à un utilisateur vérifié qui n'en est pas membre", async () => {
    await runAnalysis();
    const outsider = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    onTestFinished(outsider.cleanup);

    const [memberView, outsiderView] = await Promise.all(
      [editionUser, getAuthUserFromUserCredentials(outsider.user)].map((user) =>
        callerFor(user).getMobilisation({ collectiviteId, enjeu: 'ges' })
      )
    );

    expect(outsiderView).toEqual(memberView);
  });
});
