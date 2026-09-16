import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
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
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenerateAnalysisService } from './generate-analysis/generate-analysis.service';
import { RANK_BY_LEVIER } from './prompts/levier-ranks';
import { classificationVoletsJobTable } from './models/classification-volets-job.table';
import { collectiviteVoletGesTable } from './models/collectivite-volet-ges.table';
import { ficheActionVoletGesTable } from './models/fiche-action-volet-ges.table';

const MODEL_NOTE = 2;
const TERMINAL_STATUSES = ['done', 'failed'];

type LlmBehaviour = 'nominal' | 'classification_down' | 'mobilisation_down';

let llmBehaviour: LlmBehaviour = 'nominal';

const TOKENS = {
  promptTokens: 10,
  cachedTokens: 4,
  candidatesTokens: 5,
  thoughtsTokens: 1,
  totalTokens: 16,
};

const toClassificationResponse = (prompt: string) => ({
  success: true,
  data: {
    data: [...prompt.matchAll(/<action index="(\d+)"/g)].map(([, index]) => ({
      index: Number(index),
      justification: 'Piste cyclable protégée',
      hasNoRelevantLevier: false,
      volets: [
        {
          levier: RANK_BY_LEVIER['Vélo et transport en commun'],
          categories: [categorieActionEnumValues.indexOf('amenagement') + 1],
        },
      ],
    })),
    tokens: TOKENS,
  },
});

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
        return llmBehaviour === 'mobilisation_down'
          ? { success: false, error: { kind: 'llm_unavailable' } }
          : MOBILISATION_RESPONSE;
      }
      return llmBehaviour === 'classification_down'
        ? { success: false, error: { kind: 'rate_limited' } }
        : toClassificationResponse(prompt);
    },
  } as unknown as LlmService);

describe('Analyse des leviers, de bout en bout', { timeout: 180_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let collectiviteId: number;
  let editionUser: AuthenticatedUser;
  let planId: number;
  let ficheIds: number[] = [];
  let ficheCleanups: (() => Promise<void>)[] = [];

  const callerFor = (user: AuthenticatedUser) =>
    router.createCaller({ user }).plans.classificationVolets;

  const readJob = async (jobId: string) => {
    const [job] = await db.db
      .select({
        status: classificationVoletsJobTable.status,
        etape: classificationVoletsJobTable.etape,
        totalBatches: classificationVoletsJobTable.totalBatches,
        error: classificationVoletsJobTable.error,
        draft: classificationVoletsJobTable.draft,
      })
      .from(classificationVoletsJobTable)
      .where(eq(classificationVoletsJobTable.id, jobId));
    return job;
  };

  const readGrid = () =>
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

  const waitForTerminalStatus = async (jobId: string): Promise<string> => {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      const job = await readJob(jobId);
      if (job && TERMINAL_STATUSES.includes(job.status)) {
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

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    collectiviteId = collectivite.id;
    editionUser = getAuthUserFromUserCredentials(user);

    const fixtureCaller = router.createCaller({ user: editionUser });
    const plan = await fixtureCaller.plans.plans.create({
      collectiviteId,
      nom: 'Plan classable',
    });
    planId = plan.id;

    for (const titre of ['Amenager des pistes cyclables', 'Navette gratuite']) {
      const fiche = await createFicheAndCleanupFunction({
        caller: fixtureCaller,
        ficheInput: {
          collectiviteId,
          titre,
          description: 'Dix kilometres de pistes protegees',
          axeId: planId,
        },
      });
      ficheIds = [...ficheIds, fiche.ficheId];
      ficheCleanups = [...ficheCleanups, fiche.ficheCleanup];
    }
  });

  const cleanupAnalysis = async (): Promise<void> => {
    await db.db
      .delete(collectiviteVoletGesTable)
      .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));
    await db.db
      .delete(classificationVoletsJobTable)
      .where(eq(classificationVoletsJobTable.collectiviteId, collectiviteId));
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
    await app.close();
  });

  it('classe chaque fiche, note chaque levier, et rend la grille lisible', async () => {
    const jobId = await runAnalysis();

    const job = await readJob(jobId);
    const status = await callerFor(editionUser).getAnalysisStatus({ jobId });
    const mobilisation = await callerFor(editionUser).getMobilisation({
      collectiviteId,
      enjeu: 'ges',
    });

    expect({
      statut: job.status,
      etape: job.etape,
      fichesClassees: job.draft?.fiches.length,
      leviersNotes: job.totalBatches,
      voletsEcrits: (await readVolets()).length,
      lignesDeGrille: (await readGrid()).length,
      statutLisible: status.status,
      leviersRendus: mobilisation.leviers.length,
    }).toEqual({
      statut: 'done',
      etape: 'mobilisation',
      fichesClassees: 2,
      leviersNotes: 1,
      voletsEcrits: 1,
      lignesDeGrille: 6,
      statutLisible: 'done',
      leviersRendus: 1,
    });
  });

  it('force à 0 une catégorie sans fiche, quelle que soit la note du modèle', async () => {
    await runAnalysis();

    const notesParCategorie = Object.fromEntries(
      (await readGrid()).map(({ categorie, note }) => [categorie, note])
    );

    expect(notesParCategorie).toEqual({
      amenagement: MODEL_NOTE,
      planification: 0,
      financement: 0,
      gouvernance: 0,
      exemplarite: 0,
      sensibilisation: 0,
    });
  });

  it("n'écrit ni volet ni grille quand une fiche épuise ses tentatives", async () => {
    llmBehaviour = 'classification_down';

    const jobId = await runAnalysis();
    const job = await readJob(jobId);

    expect({
      statut: job.status,
      etape: job.etape,
      voletsEcrits: (await readVolets()).length,
      lignesDeGrille: (await readGrid()).length,
    }).toEqual({
      statut: 'failed',
      etape: 'classification',
      voletsEcrits: 0,
      lignesDeGrille: 0,
    });
  });

  it("conserve la grille précédente quand un levier n'aboutit pas", async () => {
    await runAnalysis();
    const grilleAvant = await readGrid();

    llmBehaviour = 'mobilisation_down';
    const jobId = await runAnalysis();
    const job = await readJob(jobId);

    expect({
      statut: job.status,
      message: job.error,
      grilleInchangee:
        JSON.stringify(await readGrid()) === JSON.stringify(grilleAvant),
    }).toEqual({
      statut: 'failed',
      message:
        'Mobilisation abandonnée : 1 levier(s) en échec sur 1. La grille précédente est conservée.',
      grilleInchangee: true,
    });
  });

  it("ignore une re-livraison d'un job déjà terminé sans réécrire la grille", async () => {
    const jobId = await runAnalysis();
    const grilleApresRun = await readGrid();

    llmBehaviour = 'mobilisation_down';
    const result = await app.get(GenerateAnalysisService).generate(jobId, []);

    expect({
      success: result.success,
      grilleInchangee:
        JSON.stringify(await readGrid()) === JSON.stringify(grilleApresRun),
    }).toEqual({ success: true, grilleInchangee: true });
  });

  it("refuse une collectivité qui n'a aucune fiche à classer", async () => {
    const vide = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });

    await expect(
      callerFor(getAuthUserFromUserCredentials(vide.user)).enqueueAnalysis({
        collectiviteId: vide.collectivite.id,
        enjeu: 'ges',
      })
    ).rejects.toThrowError(/aucune fiche/);
  });

  it("cache la grille d'une collectivité à qui n'en est pas membre", async () => {
    const outsider = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });

    await expect(
      callerFor(getAuthUserFromUserCredentials(outsider.user)).getMobilisation({
        collectiviteId,
        enjeu: 'ges',
      })
    ).rejects.toThrowError(/n'existe pas/);
  });
});
