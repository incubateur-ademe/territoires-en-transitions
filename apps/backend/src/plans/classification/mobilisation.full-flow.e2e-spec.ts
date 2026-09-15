import { getQueueToken } from '@nestjs/bullmq';
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
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenerateMobilisationService } from './generate-mobilisation/generate-mobilisation.service';
import { GenerateMobilisationWorker } from './generate-mobilisation/generate-mobilisation.worker';
import { collectiviteVoletGesTable } from './models/collectivite-volet-ges.table';
import { classificationVoletsJobTable } from './models/classification-volets-job.table';
import { ficheActionVoletGesTable } from './models/fiche-action-volet-ges.table';
import { MOBILISATION_VOLETS_QUEUE_NAME } from './mobilisation-volets.queue';

const MODEL_NOTE = 2;

let isLlmFailing = false;

const buildFakeLlm = (): LlmService =>
  ({
    generateStructured: async () =>
      isLlmFailing
        ? { success: false, error: { kind: 'llm_unavailable' } }
        : {
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
              tokens: {
                promptTokens: 10,
                candidatesTokens: 5,
                thoughtsTokens: 1,
                totalTokens: 16,
              },
            },
          },
  } as unknown as LlmService);

describe('Mobilisation, de bout en bout', { timeout: 60_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let collectiviteId: number;
  let editionUser: AuthenticatedUser;
  let ficheId: number;
  let planId: number;
  let ficheCleanup: () => Promise<void>;

  const callerFor = (user: AuthenticatedUser) =>
    router.createCaller({ user }).plans.classificationVolets;

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

  const insertVolet = () =>
    db.db.insert(ficheActionVoletGesTable).values({
      ficheId,
      levierId: 'velo_transport_commun',
      categorie: 'amenagement',
      createdBy: editionUser.id,
    });

  const runMobilisation = async (): Promise<string> => {
    const { jobId } = await callerFor(editionUser).enqueueMobilisation({
      collectiviteId,
      enjeu: 'ges',
    });
    await app.get(GenerateMobilisationService).generate(jobId);
    return jobId;
  };

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder
          .overrideProvider(GenerateMobilisationWorker)
          .useValue({ onModuleInit: () => undefined });
        moduleBuilder
          .overrideProvider(getQueueToken(MOBILISATION_VOLETS_QUEUE_NAME))
          .useValue({ add: async () => ({ id: 'fake-job' }) });
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

    const fiche = await createFicheAndCleanupFunction({
      caller: fixtureCaller,
      ficheInput: {
        collectiviteId,
        titre: 'Amenager des pistes cyclables',
        description: 'Dix kilometres de pistes protegees',
        axeId: planId,
      },
    });
    ficheId = fiche.ficheId;
    ficheCleanup = fiche.ficheCleanup;
  });

  beforeEach(async () => {
    isLlmFailing = false;
    await db.db
      .delete(classificationVoletsJobTable)
      .where(eq(classificationVoletsJobTable.collectiviteId, collectiviteId));
    await db.db
      .delete(collectiviteVoletGesTable)
      .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));
    await db.db
      .delete(ficheActionVoletGesTable)
      .where(eq(ficheActionVoletGesTable.ficheId, ficheId));
  });

  afterAll(async () => {
    await db.db
      .delete(classificationVoletsJobTable)
      .where(eq(classificationVoletsJobTable.collectiviteId, collectiviteId));
    await db.db
      .delete(collectiviteVoletGesTable)
      .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));
    await db.db
      .delete(ficheActionVoletGesTable)
      .where(eq(ficheActionVoletGesTable.ficheId, ficheId));
    await ficheCleanup();
    await router
      .createCaller({ user: editionUser })
      .plans.plans.delete({ planId });
    await app.close();
  });

  it('note le levier classé, écrit la grille et la rend lisible', async () => {
    await insertVolet();

    const jobId = await runMobilisation();

    const status = await callerFor(editionUser).getClassificationStatus({
      jobId,
    });
    const mobilisation = await callerFor(editionUser).getMobilisation({
      collectiviteId,
    });
    const volets =
      mobilisation.leviers.find(
        ({ levierId }) => levierId === 'velo_transport_commun'
      )?.volets ?? [];

    expect({
      etape: status.etape,
      statut: status.status,
      leviersNotes: mobilisation.leviers.length,
      voletsDuLevier: volets.length,
      categorieAvecFiche: volets.find(
        ({ categorie }) => categorie === 'amenagement'
      ),
      categorieSansFiche: volets.find(
        ({ categorie }) => categorie === 'planification'
      ),
    }).toEqual({
      etape: 'mobilisation',
      statut: 'done',
      leviersNotes: 1,
      voletsDuLevier: 6,
      categorieAvecFiche: {
        categorie: 'amenagement',
        note: MODEL_NOTE,
        ficheIds: [ficheId],
      },
      categorieSansFiche: {
        categorie: 'planification',
        note: 0,
        ficheIds: [],
      },
    });
  });

  it('force à 0 une catégorie sans fiche, quelle que soit la note du modèle', async () => {
    await insertVolet();

    await runMobilisation();

    const rows = await readGrid();
    const notesParCategorie = Object.fromEntries(
      rows.map(({ categorie, note }) => [categorie, note])
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

  it("clôt le job en échec et conserve la grille quand un levier n'aboutit pas", async () => {
    await insertVolet();
    await runMobilisation();
    const grilleAvant = await readGrid();

    isLlmFailing = true;
    const jobId = await runMobilisation();

    const status = await callerFor(editionUser).getClassificationStatus({
      jobId,
    });
    const grilleApres = await readGrid();

    expect({
      statut: status.status,
      message: status.status === 'failed' ? status.error : undefined,
      grilleInchangee:
        JSON.stringify(grilleApres) === JSON.stringify(grilleAvant),
    }).toEqual({
      statut: 'failed',
      message:
        'Mobilisation abandonnée : 1 levier(s) en échec sur 1. La grille précédente est conservée.',
      grilleInchangee: true,
    });
  });

  it('refuse un enfilement sur une collectivité sans aucun volet classé', async () => {
    await expect(
      callerFor(editionUser).enqueueMobilisation({
        collectiviteId,
        enjeu: 'ges',
      })
    ).rejects.toThrowError(/aucun volet classé/);
  });

  it("clôt le job en échec quand les volets disparaissent après l'enfilement", async () => {
    await insertVolet();
    const { jobId } = await callerFor(editionUser).enqueueMobilisation({
      collectiviteId,
      enjeu: 'ges',
    });

    await db.db
      .delete(ficheActionVoletGesTable)
      .where(eq(ficheActionVoletGesTable.ficheId, ficheId));
    await app.get(GenerateMobilisationService).generate(jobId);

    const status = await callerFor(editionUser).getClassificationStatus({
      jobId,
    });

    expect({
      statut: status.status,
      message: status.status === 'failed' ? status.error : undefined,
    }).toEqual({
      statut: 'failed',
      message:
        "Aucun volet classé sur cette collectivité : lancez d'abord la classification.",
    });
  });

  it('ignore une seconde exécution du même job sans réécrire la grille', async () => {
    await insertVolet();
    const jobId = await runMobilisation();
    const grilleApresPremierRun = await readGrid();

    isLlmFailing = true;
    const result = await app.get(GenerateMobilisationService).generate(jobId);

    expect({
      success: result.success,
      grilleInchangee:
        JSON.stringify(await readGrid()) ===
        JSON.stringify(grilleApresPremierRun),
    }).toEqual({ success: true, grilleInchangee: true });
  });

  it('remplace la grille précédente à chaque run réussi', async () => {
    await insertVolet();
    await runMobilisation();

    await db.db.insert(ficheActionVoletGesTable).values({
      ficheId,
      levierId: 'covoiturage',
      categorie: 'gouvernance',
      createdBy: editionUser.id,
    });
    await runMobilisation();

    const rows = await readGrid();
    const leviersNotes = [...new Set(rows.map(({ levierId }) => levierId))];

    expect({
      lignes: rows.length,
      leviers: leviersNotes.sort(),
    }).toEqual({
      lignes: 12,
      leviers: ['covoiturage', 'velo_transport_commun'],
    });
  });

  it("cache la grille d'une collectivité à qui n'en est pas membre", async () => {
    const outsider = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });

    await expect(
      callerFor(getAuthUserFromUserCredentials(outsider.user)).getMobilisation({
        collectiviteId,
      })
    ).rejects.toThrowError(/n'existe pas/);
  });
});
