import { FichesRouter } from '@/backend/plans/fiches/fiches.router';
import { ficheActionActionTable } from '@/backend/plans/fiches/shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from '@/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionLienTable } from '@/backend/plans/fiches/shared/models/fiche-action-lien.table';
import {
  ficheActionTable,
  statutsEnumSchema,
} from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { planPiloteTable } from '@/backend/plans/fiches/shared/models/plan-pilote.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import { INestApplication } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { StatutEnum } from '../shared/models/fiche-action.table';

let router: FichesRouter;
let yoloDodo: AuthenticatedUser;
let db: DatabaseService;

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.admin;

beforeAll(async () => {
  const app = await getTestApp();
  router = await app.get(FichesRouter);
  db = await getTestDatabase(app);
  yoloDodo = await getAuthUser(YOLO_DODO);
});

describe('Filtres sur les fiches actions', () => {
  test('Fetch sans filtre retourne des fiches uniques', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const { data } = await caller.listResumes({
      collectiviteId: COLLECTIVITE_ID,
    });

    if (!data) {
      expect.fail();
    }

    expect(data.length).toBeGreaterThan(0);

    // Check unicity of all fiches
    const ids = data.map((f) => f.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids).toEqual(uniqueIds);
  });

  test('Order by title en natural sort', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // insert 3 fiches avec des titres différents contenant une numérotation
    await db.db.insert(ficheActionTable).values([
      {
        id: 9999,
        titre: '1 - Fiche-test 1',
        collectiviteId: COLLECTIVITE_ID,
      },
      {
        id: 9998,
        titre: '2 - Fiche-test 2',
        collectiviteId: COLLECTIVITE_ID,
      },
      {
        id: 9997,
        titre: '10 - Fiche-test 3',
        collectiviteId: COLLECTIVITE_ID,
      },
    ]);

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(inArray(ficheActionTable.id, [9999, 9998, 9997]));
    });

    const { data } = await caller.listResumes({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        texteNomOuDescription: 'Fiche-test',
      },
      queryOptions: {
        sort: [{ field: 'titre', direction: 'asc' }],
      },
    });

    expect(data).toBeDefined();
    expect(data?.length).toBe(3);

    expect(data?.[0].titre).toBe('1 - Fiche-test 1');
    expect(data?.[1].titre).toBe('2 - Fiche-test 2');
    expect(data?.[2].titre).toBe('10 - Fiche-test 3');
  });

  test('Fetch avec filtre sur une personne', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const { data } = await caller.listResumes({
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

    const { data } = await caller.listResumes({
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

    const { data } = await caller.listResumes({
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

    const { data } = await caller.listResumes({
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

    const { data } = await caller.listResumes({
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

  test('Fetch avec filtre sur une mesure du referentiel associée', async () => {
    // Test avec une action associée à plusieurs fiches
    const caller = router.createCaller({ user: yoloDodo });

    const { data: fichesWithAction } = await caller.listResumes({
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
    const { data: noFichesFound } = await caller.listResumes({
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
    const { data: fichesWithFiche } = await caller.listResumes({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        linkedFicheIds: [5],
      },
    });

    if (!fichesWithFiche) {
      expect.fail();
    }

    expect(fichesWithFiche).toHaveLength(2);

    // Test avec une fiche associée à aucune autre fiche
    const { data: noFichesFound } = await caller.listResumes({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        linkedFicheIds: [10],
      },
    });

    if (!noFichesFound) {
      expect.fail();
    }

    expect(noFichesFound).toHaveLength(0);
  });

  test('Fetch avec filtre sur un statut', async () => {
    const caller = router.createCaller({ user: yoloDodo });
    const { data: emptyData } = await caller.listResumes({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        statuts: [StatutEnum.EN_COURS],
      },
    });

    expect(emptyData.length).toBe(0);

    const { data: withData } = await caller.listResumes({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        statuts: [StatutEnum.EN_COURS, StatutEnum.A_VENIR],
      },
    });

    expect(withData.length).toBeGreaterThan(0);

    // Que des fiches avec un statut 'À venir' dans les seeds de base
    for (const fiche of withData) {
      expect(fiche.statut).toBe(StatutEnum.A_VENIR);
    }
  });

  test('Fetch avec filtre sur la date de modification', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const { data } = await caller.listResumes({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        modifiedSince: 'last-15-days',
      },
    });

    expect(data).toMatchObject({});
  });

  /*********************************************************************
   *                                                                   *
   *         FILTRES SUR DES PROPRIETES DE LA FICHE ACTION             *
   *                                                                   *
   ********************************************************************/

  describe('Filtres sur les propriétés de la fiche action', () => {
    test('Fetch avec filtre sur amélioration continue', async () => {
      const FICHE_ID = 9999;

      await db.db.insert(ficheActionTable).values({
        id: FICHE_ID,
        ameliorationContinue: true,
        collectiviteId: COLLECTIVITE_ID,
      });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, FICHE_ID));
      });

      const caller = router.createCaller({ user: yoloDodo });

      const { data: ficheWithAmeliorationContinue } = await caller.listResumes({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          ameliorationContinue: true,
        },
      });

      if (!ficheWithAmeliorationContinue) {
        expect.fail();
      }

      expect(ficheWithAmeliorationContinue).toContainEqual(
        expect.objectContaining({
          id: FICHE_ID,
          ameliorationContinue: true,
        })
      );
    });
  });

  /***********************************
   *                                 *
   *         FILTRES HAS             *
   *                                 *
   ***********************************/

  describe('Filtres booléens', () => {
    test("Fetch avec filtre sur le fait d'avoir au moins une mesure liée", async () => {
      const caller = router.createCaller({ user: yoloDodo });

      const FICHE_ID = 9999;

      await db.db.insert(ficheActionTable).values({
        id: FICHE_ID,
        collectiviteId: COLLECTIVITE_ID,
      });

      await db.db.insert(ficheActionActionTable).values({
        ficheId: FICHE_ID,
        actionId: 'eci_2.1.1',
      });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionActionTable)
          .where(eq(ficheActionActionTable.ficheId, FICHE_ID));
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, FICHE_ID));
      });

      const { data: fichesWithMesuresLiees } = await caller.listResumes({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          hasMesuresLiees: true,
        },
      });

      if (!fichesWithMesuresLiees) {
        expect.fail();
      }

      expect(fichesWithMesuresLiees).toContainEqual(
        expect.objectContaining({
          id: FICHE_ID,
        })
      );
    });

    test("Fetch avec filtre sur le fait d'avoir au moins un indicateur lié", async () => {
      const caller = router.createCaller({ user: yoloDodo });

      const FICHE_ID = 9999;

      await db.db.insert(ficheActionTable).values({
        id: FICHE_ID,
        collectiviteId: COLLECTIVITE_ID,
      });

      await db.db.insert(ficheActionIndicateurTable).values({
        ficheId: FICHE_ID,
        indicateurId: 1,
      });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionIndicateurTable)
          .where(eq(ficheActionIndicateurTable.ficheId, FICHE_ID));
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, FICHE_ID));
      });

      const { data: fichesWithIndicateursLies } = await caller.listResumes({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          hasIndicateurLies: true,
        },
      });

      if (!fichesWithIndicateursLies) {
        expect.fail();
      }

      expect(fichesWithIndicateursLies).toContainEqual(
        expect.objectContaining({
          id: FICHE_ID,
        })
      );
    });
  });

  /*********************************
   *                               *
   *         FILTRES NO            *
   *                               *
   *********************************/

  describe('Filtres sur absences', () => {
    test('Fetch avec filtre sur aucun pilote', async () => {
      const caller = router.createCaller({ user: yoloDodo });
      const FICHE_ID = 9999;

      await db.db.insert(ficheActionTable).values({
        id: FICHE_ID,
        collectiviteId: COLLECTIVITE_ID,
      });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, FICHE_ID));
      });

      const { data } = await caller.listResumes({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          noPilote: true,
        },
      });

      if (!data) {
        expect.fail();
      }

      expect(data).toContainEqual(
        expect.objectContaining({
          id: FICHE_ID,
          pilotes: null,
        })
      );
    });

    test('Fetch avec filtre sur aucun service pilote', async () => {
      const caller = router.createCaller({ user: yoloDodo });
      const FICHE_ID = 9999;

      await db.db.insert(ficheActionTable).values({
        id: FICHE_ID,
        collectiviteId: COLLECTIVITE_ID,
      });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, FICHE_ID));
      });

      const { data } = await caller.listResumes({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          noServicePilote: true,
        },
      });

      if (!data) {
        expect.fail();
      }

      expect(data).toContainEqual(
        expect.objectContaining({
          id: FICHE_ID,
          services: null,
        })
      );
    });

    test('Fetch avec filtre sur aucun statut', async () => {
      const caller = router.createCaller({ user: yoloDodo });
      const FICHE_ID = 9999;

      await db.db.insert(ficheActionTable).values({
        id: FICHE_ID,
        collectiviteId: COLLECTIVITE_ID,
        statut: null,
      });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, FICHE_ID));
      });

      const { data: fichesWithoutStatut } = await caller.listResumes({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          noStatut: true,
        },
      });

      if (!fichesWithoutStatut) {
        expect.fail();
      }

      expect(fichesWithoutStatut).toContainEqual(
        expect.objectContaining({
          id: FICHE_ID,
          statut: null,
        })
      );
    });
  });
});

test('Fetch avec filtre sur une action du referentiel associée', async () => {
  // Test avec une action associée à plusieurs fiches
  const caller = router.createCaller({ user: yoloDodo });

  const { data: fichesWithAction } = await caller.listResumes({
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
  const { data: noFichesFound } = await caller.listResumes({
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
  const { data: fichesWithFiche } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      linkedFicheIds: [5],
    },
    queryOptions: {
      sort: [{ field: 'created_at', direction: 'asc' }],
    },
  });

  if (!fichesWithFiche) {
    expect.fail();
  }

  expect(fichesWithFiche).toHaveLength(2);

  // Test qu'une fiche associée à plusieurs fiches n'est pas retournée plusieurs fois
  const { data: fichesLinkedSeveralTimes } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      ficheIds: [5],
    },
  });

  expect(fichesLinkedSeveralTimes).toHaveLength(1);

  // Test avec une fiche associée à aucune autre fiche
  const { data: noFichesFound } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      linkedFicheIds: [10],
    },
  });

  if (!noFichesFound) {
    expect.fail();
  }

  expect(noFichesFound).toHaveLength(0);
});

test('Fetch avec filtre sur un indicateur lié', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data: noFichesWithInexistingIndicateur } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      indicateurIds: [9999],
    },
  });

  expect(noFichesWithInexistingIndicateur).toHaveLength(0);

  // Lie un indicateur à une fiche
  await db.db.insert(ficheActionIndicateurTable).values({
    ficheId: 1,
    indicateurId: 56,
  });

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionIndicateurTable)
      .where(eq(ficheActionIndicateurTable.ficheId, 1));
  });

  const fichesWithExistingIndicateur = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      indicateurIds: [56],
    },
  });

  expect(fichesWithExistingIndicateur.data.length).toBeGreaterThan(0);
  const ficheWithIndicateur = fichesWithExistingIndicateur.data.find(
    (fiche) => fiche.id === 1
  );
  expect(ficheWithIndicateur).toBeDefined();
});

test('Fetch avec filtre sur un statut', async () => {
  const caller = router.createCaller({ user: yoloDodo });
  const { data: emptyData } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      statuts: ['En cours'],
    },
  });

  expect(emptyData.length).toBe(0);

  const { data: withData } = await caller.listResumes({
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

  const { data } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      modifiedSince: 'last-15-days',
    },
  });

  expect(data.length).toBeGreaterThan(0);
});

test('Fetch avec filtre sur aucun plan', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data: initialWithoutData } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      noPlan: true,
    },
  });

  const initialNumberOfFichesWithoutPlan = initialWithoutData.length;

  const { data: withPlan } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      noPlan: false,
    },
  });

  expect(withPlan.length).toBeGreaterThan(0);

  const ficheWithPlan = withPlan.at(0);
  if (!ficheWithPlan) {
    expect.fail();
  }

  // On supprime le plan de la première fiche
  await db.db
    .delete(ficheActionAxeTable)
    .where(eq(ficheActionAxeTable.ficheId, ficheWithPlan.id));

  // On ré-associe le plan à la fiche en fin de test
  onTestFinished(async () => {
    await db.db
      .insert(ficheActionAxeTable)
      .values({ axeId: ficheWithPlan.axes![0].id, ficheId: ficheWithPlan.id });
  });

  const { data: withoutPlan } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      noPlan: true,
    },
  });

  expect(withoutPlan).toHaveLength(initialNumberOfFichesWithoutPlan + 1);
  expect(withoutPlan.map((f) => f.id)).toContain(ficheWithPlan.id);
});



test('Fetch avec allIds retourne tous les IDs correspondant aux filtres', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  // Récupérer toutes les fiches sans pagination pour avoir la référence
  const { data: allFiches } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    queryOptions: {
      page: 1,
      limit: 1000, // Un nombre élevé pour récupérer toutes les fiches
    },
  });

  // Récupérer les fiches avec pagination (page 1, 5 éléments)
  const { data: paginatedFiches, allIds } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    queryOptions: {
      page: 1,
      limit: 5,
    },
  });

  expect(paginatedFiches).toBeDefined();
  expect(allIds).toBeDefined();
  expect(paginatedFiches.length).toBeLessThanOrEqual(5);
  expect(allIds.length).toBe(allFiches.length);

  // Vérifier que tous les IDs des fiches paginées sont dans allIds
  for (const fiche of paginatedFiches) {
    expect(allIds).toContain(fiche.id);
  }

  // Vérifier que allIds contient tous les IDs de toutes les fiches
  const allFicheIds = allFiches.map((f) => f.id);
  expect(allIds).toEqual(expect.arrayContaining(allFicheIds));
  expect(allIds.length).toBe(allFicheIds.length);

  // Test avec un filtre
  const { data: filteredFiches, allIds: filteredAllIds } =
    await caller.listResumes({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        statuts: ['À venir'],
      },
      queryOptions: {
        page: 1,
        limit: 3,
      },
    });

  expect(filteredFiches).toBeDefined();
  expect(filteredAllIds).toBeDefined();
  expect(filteredFiches.length).toBeLessThanOrEqual(3);

  // Vérifier que les fiches filtrées ont bien le statut attendu
  for (const fiche of filteredFiches) {
    expect(fiche.statut).toBe('À venir');
  }

  // Vérifier que allIds contient tous les IDs des fiches avec le statut 'À venir'
  const fichesAvenir = allFiches.filter((f) => f.statut === 'À venir');
  const fichesAvenirIds = fichesAvenir.map((f) => f.id);

  expect(filteredAllIds).toEqual(expect.arrayContaining(fichesAvenirIds));
  expect(filteredAllIds.length).toBe(fichesAvenirIds.length);

  // Vérifier que les IDs des fiches paginées sont bien dans allIds
  for (const fiche of filteredFiches) {
    expect(filteredAllIds).toContain(fiche.id);
  }
});


test('Fetch retourne si le user connecté peut modifier la fiche si il est pilote de la fiche', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data: allFiches } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    queryOptions: {
      page: 1,
      limit: 1000,
    },
  });

  for (let index = 0; index < allFiches.length; index++) {
    if (index === 0) {
      expect(allFiches[index].canBeModifiedByCurrentUser).equal(true);
    } else {
      expect(allFiches[index].canBeModifiedByCurrentUser).equal(false);
    }
  }
});


test('Fetch retourne si le user connecté peut modifier la fiche si il est pilote du plan', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const app: INestApplication = await getTestApp();
  const databaseService: DatabaseService = app.get<DatabaseService>(DatabaseService);

  const PLAN_ID = 23;
  const COLLECTIVITE_ID = 3;

  await databaseService.db
    .insert(planPiloteTable)
    .values(
      {
        planId: PLAN_ID,
        userId: yoloDodo.id,
        createdBy: yoloDodo.id,
        createdAt: new Date().toISOString(),
      }).returning()

  const { data: allFichesOf } = await caller.listResumes({
    collectiviteId: COLLECTIVITE_ID,
    queryOptions: {
      page: 1,
      limit: 1000,
    },
  });
  for (let index = 0; index < allFichesOf.length; index++) {
    expect(allFichesOf[index].canBeModifiedByCurrentUser).equal(true);
  }
  await databaseService.db
    .delete(planPiloteTable).where(eq(planPiloteTable.planId, PLAN_ID));
});
