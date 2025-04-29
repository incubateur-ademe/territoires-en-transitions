import { AuthenticatedUser } from '@/backend/auth/models/auth.models';
import {
  ficheActionLienTable,
  statutsEnumSchema,
} from '@/backend/plans/fiches/index-domain';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
} from '@/backend/test';
import { DatabaseService } from '@/backend/utils';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { eq } from 'drizzle-orm';

let router: TrpcRouter;
let yoloDodo: AuthenticatedUser;
let db: DatabaseService;

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.admin;

beforeAll(async () => {
  const app = await getTestApp();
  router = await getTestRouter(app);
  db = await getTestDatabase(app);
  yoloDodo = await getAuthUser(YOLO_DODO);
});

test('Fetch sans filtre', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
  });

  if (!data) {
    expect.fail();
  }

  expect(data.length).toBeGreaterThan(0);
});

test('Fetch avec filtre sur une personne', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      personnePiloteIds: [1],
    },
  });

  if (!data) {
    expect.fail();
  }

  for (const fiche of data) {
    expect(fiche).toMatchObject({
      pilotes: expect.arrayContaining([
        expect.objectContaining({ tagId: 1, nom: 'Lou Piote' }),
      ]),
    });
  }
});

test('Fetch avec filtre sur un utilisateur', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      utilisateurPiloteIds: [yoloDodo.id],
    },
  });

  if (!data) {
    expect.fail();
  }

  for (const fiche of data) {
    expect(fiche).toMatchObject({
      pilotes: expect.arrayContaining([
        expect.objectContaining({
          userId: yoloDodo.id,
          nom: 'Yolo Dodo',
          tagId: null,
        }),
      ]),
    });
  }
});

test('Fetch avec filtre sur un utilisateur et sur personne. Le filtre doit être un OU.', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      utilisateurPiloteIds: [yoloDodo.id],
      personnePiloteIds: [1],
    },
  });

  if (!data) {
    expect.fail();
  }

  expect(data.length).toBeGreaterThan(0);

  for (const fiche of data) {
    expect(fiche.pilotes?.length).toBeGreaterThan(0);
  }
});

test('Fetch avec filtre sur un service', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      servicePiloteIds: [2],
    },
  });

  if (!data) {
    expect.fail();
  }

  for (const fiche of data) {
    expect(fiche).toMatchObject({
      services: expect.arrayContaining([
        { id: 2, nom: 'Ultra service', collectiviteId: 1 },
      ]),
    });
  }
});

test('Fetch avec filtre sur un plan', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      texteNomOuDescription:
        'Ajouter caméra de surveillance au parking à vélo 2020-2024',
    },
  });

  if (!data) {
    expect.fail();
  }

  expect(data).toHaveLength(1);
  expect(data[0].plans?.[0]).toMatchObject({
    nom: 'Plan Vélo 2020-2024', // correspond au plan racine
    collectiviteId: 1,
  });
});

test('Fetch avec filtre sur une action du referentiel associée', async () => {
  // Test avec une action associée à plusieurs fiches
  const caller = router.createCaller({ user: yoloDodo });

  const { data: fichesWithAction } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      mesureIds: ['eci_2.1'],
    },
  });

  if (!fichesWithAction) {
    expect.fail();
  }

  expect(fichesWithAction.length).toBeGreaterThan(1);

  // Test avec une action associée à aucune fiche
  const { data: noFichesFound } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      mesureIds: ['eci_2.2'],
    },
  });

  if (!noFichesFound) {
    expect.fail();
  }

  expect(noFichesFound).toHaveLength(0);
});

test('Fetch avec filtre sur une fiche liée', async () => {
  await db.db.insert(ficheActionLienTable).values([
    { ficheUne: 1, ficheDeux: 5 },
    { ficheUne: 5, ficheDeux: 3 },
  ]);

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionLienTable)
      .where(eq(ficheActionLienTable.ficheUne, 1));
    await db.db
      .delete(ficheActionLienTable)
      .where(eq(ficheActionLienTable.ficheUne, 5));
  });

  const caller = router.createCaller({ user: yoloDodo });

  // Test avec une fiche associée à plusieurs fiches
  const { data: fichesWithFiche } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      linkedFicheActionIds: [5],
    },
  });

  if (!fichesWithFiche) {
    expect.fail();
  }

  expect(fichesWithFiche).toHaveLength(2);

  // Test avec une fiche associée à aucune autre fiche
  const { data: noFichesFound } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      linkedFicheActionIds: [10],
    },
  });

  if (!noFichesFound) {
    expect.fail();
  }

  expect(noFichesFound).toHaveLength(0);
});

test('Fetch avec filtre sur un statut', async () => {
  const caller = router.createCaller({ user: yoloDodo });
  const { data: emptyData } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      statuts: ['En cours'],
    },
  });

  expect(emptyData.length).toBe(0);

  const { data: withData } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      statuts: ['En cours', 'À venir'],
    },
  });

  expect(withData.length).toBeGreaterThan(0);

  // Que des fiches avec un statut 'À venir' dans les seeds de base
  for (const fiche of withData) {
    expect(fiche.statut).toBe(statutsEnumSchema.enum['À venir']);
  }
});

test('Fetch avec filtre sur la date de modification', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data } = await caller.plans.fiches.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      modifiedSince: 'last-15-days',
    },
  });

  expect(data).toMatchObject({});
});
