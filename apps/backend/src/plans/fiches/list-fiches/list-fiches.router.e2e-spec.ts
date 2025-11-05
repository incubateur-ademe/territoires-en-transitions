import { financeurTagTable } from '@/backend/collectivites/tags/financeur-tag.table';
import { libreTagTable } from '@/backend/collectivites/tags/libre-tag.table';
import { partenaireTagTable } from '@/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { structureTagTable } from '@/backend/collectivites/tags/structure-tag.table';
import { ficheActionNoteTable } from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import { FichesRouter } from '@/backend/plans/fiches/fiches.router';
import { ficheActionSharingTable } from '@/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import { axeTable } from '@/backend/plans/fiches/shared/models/axe.table';
import { ficheActionActionTable } from '@/backend/plans/fiches/shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from '@/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionFinanceurTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionLibreTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-libre-tag.table';
import { ficheActionLienTable } from '@/backend/plans/fiches/shared/models/fiche-action-lien.table';
import { ficheActionPartenaireTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-partenaire-tag.table';
import { ficheActionReferentTable } from '@/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { ficheActionSousThematiqueTable } from '@/backend/plans/fiches/shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from '@/backend/plans/fiches/shared/models/fiche-action-thematique.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { sousThematiqueTable } from '@/backend/shared/thematiques/sous-thematique.table';
import { thematiqueTable } from '@/backend/shared/thematiques/thematique.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
  YOULOU_DOUDOU,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { notesDeSuiviEnumSchema, StatutEnum } from '@/domain/plans';
import { eq, inArray } from 'drizzle-orm';

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

    const { data: fiches } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
    });

    if (!fiches) {
      expect.fail();
    }

    expect(fiches.length).toBeGreaterThan(0);

    // Check unicity of all fiches
    const ids = fiches.map((f) => f.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids).toEqual(uniqueIds);
  });

  test('Order by title en natural sort', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    await db.db
      .delete(ficheActionTable)
      .where(inArray(ficheActionTable.id, [9999, 9998, 9997, 9996]));

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
      {
        id: 9996,
        titre: '11 - Fiche-test 4',
        collectiviteId: COLLECTIVITE_ID,
      },
    ]);

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(inArray(ficheActionTable.id, [9999, 9998, 9997, 9996]));
    });

    const { data: fiches } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        texteNomOuDescription: 'Fiche-test',
      },
      queryOptions: {
        sort: [{ field: 'titre', direction: 'asc' }],
        page: 1,
        limit: 3,
      },
    });

    expect(fiches).toBeDefined();
    expect(fiches?.length).toBe(3);

    expect(fiches?.[0].titre).toBe('1 - Fiche-test 1');
    expect(fiches?.[1].titre).toBe('2 - Fiche-test 2');
    expect(fiches?.[2].titre).toBe('10 - Fiche-test 3');
  });

  test('Fetch avec filtre sur une personne', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const { data: fiches } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        personnePiloteIds: [1],
      },
    });

    if (!fiches) {
      expect.fail();
    }

    for (const fiche of fiches) {
      expect(fiche).toMatchObject({
        pilotes: expect.arrayContaining([
          expect.objectContaining({ tagId: 1, nom: 'Lou Piote' }),
        ]),
      });
    }
  });

  test('Fetch avec filtre sur un utilisateur', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const { data: fiches } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        utilisateurPiloteIds: [yoloDodo.id],
      },
    });

    if (!fiches) {
      expect.fail();
    }

    for (const fiche of fiches) {
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

    const { data: fiches } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        utilisateurPiloteIds: [yoloDodo.id],
        personnePiloteIds: [1],
      },
    });

    if (!fiches) {
      expect.fail();
    }

    expect(fiches.length).toBeGreaterThan(0);

    for (const fiche of fiches) {
      expect(fiche.pilotes?.length).toBeGreaterThan(0);
    }
  });

  test('Fetch avec filtre sur un service', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const { data: fiches } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        servicePiloteIds: [2],
      },
    });

    if (!fiches) {
      expect.fail();
    }

    for (const fiche of fiches) {
      expect(fiche).toMatchObject({
        services: expect.arrayContaining([
          { id: 2, nom: 'Ultra service', collectiviteId: 1 },
        ]),
      });
    }
  });

  test('Fetch avec filtre sur un plan', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const { data: fiches } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        texteNomOuDescription:
          'Ajouter caméra de surveillance au parking à vélo 2020-2024',
      },
    });

    if (!fiches) {
      expect.fail();
    }

    expect(fiches).toHaveLength(1);
    expect(fiches[0].plans?.[0]).toMatchObject({
      nom: 'Plan Vélo 2020-2024', // correspond au plan racine
      collectiviteId: 1,
    });
  });

  test('Fetch avec filtre sur une mesure du referentiel associée', async () => {
    // Test avec une action associée à plusieurs fiches
    const caller = router.createCaller({ user: yoloDodo });

    const { data: fichesWithAction } = await caller.listFiches({
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
    const { data: noFichesFound } = await caller.listFiches({
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
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Fiche test pour liens',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionLienTable)
        .where(eq(ficheActionLienTable.ficheUne, testFicheId));
      await db.db
        .delete(ficheActionLienTable)
        .where(eq(ficheActionLienTable.ficheDeux, testFicheId));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    const caller = router.createCaller({ user: yoloDodo });

    // Cette nouvelle fiche n'est liée à aucune autre fiche

    const { data: noFichesFound } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        linkedFicheIds: [testFicheId],
      },
    });

    if (!noFichesFound) {
      expect.fail();
    }

    expect(noFichesFound).toHaveLength(0);

    await db.db.insert(ficheActionLienTable).values([
      { ficheUne: 1, ficheDeux: testFicheId },
      { ficheUne: testFicheId, ficheDeux: 3 },
    ]);

    // Test avec une fiche associée à plusieurs fiches
    const { data: fichesWithFiche } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        linkedFicheIds: [testFicheId],
      },
    });

    if (!fichesWithFiche) {
      expect.fail();
    }

    expect(fichesWithFiche).toHaveLength(2);
  });

  test('Fetch avec filtre sur un statut', async () => {
    const caller = router.createCaller({ user: yoloDodo });
    const { data: emptyData } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        statuts: [StatutEnum.EN_COURS],
      },
    });

    expect(emptyData.length).toBe(0);

    const { data: withData } = await caller.listFiches({
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

    const { data: fiches } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        modifiedSince: 'last-15-days',
      },
    });

    expect(fiches).toMatchObject({});
  });

  /*********************************************************************
   *                                                                   *
   *         FILTRES SUR DES PROPRIETES DE LA FICHE ACTION             *
   *                                                                   *
   ********************************************************************/

  describe('Filtres sur les propriétés de la fiche action', () => {
    test('Fetch avec filtre sur amélioration continue', async () => {
      const [fiche] = await db.db
        .insert(ficheActionTable)
        .values({
          ameliorationContinue: true,
          collectiviteId: COLLECTIVITE_ID,
        })
        .returning();
      const testFicheId = fiche.id;

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, testFicheId));
      });

      const caller = router.createCaller({ user: yoloDodo });

      const { data: ficheWithAmeliorationContinue } = await caller.listFiches({
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
          id: testFicheId,
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

      const [fiche] = await db.db
        .insert(ficheActionTable)
        .values({
          collectiviteId: COLLECTIVITE_ID,
        })
        .returning();
      const testFicheId = fiche.id;

      await db.db.insert(ficheActionActionTable).values({
        ficheId: testFicheId,
        actionId: 'eci_2.1.1',
      });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionActionTable)
          .where(eq(ficheActionActionTable.ficheId, testFicheId));
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, testFicheId));
      });

      const { data: fichesWithMesuresLiees } = await caller.listFiches({
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
          id: testFicheId,
        })
      );
    });

    test("Fetch avec filtre sur le fait d'avoir au moins un indicateur lié", async () => {
      const caller = router.createCaller({ user: yoloDodo });

      const [fiche] = await db.db
        .insert(ficheActionTable)
        .values({
          collectiviteId: COLLECTIVITE_ID,
        })
        .returning();
      const testFicheId = fiche.id;

      await db.db.insert(ficheActionIndicateurTable).values({
        ficheId: testFicheId,
        indicateurId: 1,
      });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionIndicateurTable)
          .where(eq(ficheActionIndicateurTable.ficheId, testFicheId));
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, testFicheId));
      });

      const { data: fichesWithIndicateursLies } = await caller.listFiches({
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
          id: testFicheId,
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

      const [fiche] = await db.db
        .insert(ficheActionTable)
        .values({
          collectiviteId: COLLECTIVITE_ID,
        })
        .returning();
      const testFicheId = fiche.id;

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, testFicheId));
      });

      const { data: fiches } = await caller.listFiches({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          noPilote: true,
        },
      });

      if (!fiches) {
        expect.fail();
      }

      expect(fiches).toContainEqual(
        expect.objectContaining({
          id: testFicheId,
          pilotes: null,
        })
      );
    });

    test('Fetch avec filtre sur aucun service pilote', async () => {
      const caller = router.createCaller({ user: yoloDodo });

      const [fiche] = await db.db
        .insert(ficheActionTable)
        .values({
          collectiviteId: COLLECTIVITE_ID,
        })
        .returning();
      const testFicheId = fiche.id;

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, testFicheId));
      });

      const { data: fiches } = await caller.listFiches({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          noServicePilote: true,
        },
      });

      if (!fiches) {
        expect.fail();
      }

      expect(fiches).toContainEqual(
        expect.objectContaining({
          id: testFicheId,
          services: null,
        })
      );
    });

    test('Fetch avec filtre sur aucun statut', async () => {
      const caller = router.createCaller({ user: yoloDodo });

      const [fiche] = await db.db
        .insert(ficheActionTable)
        .values({
          titre: 'Test aucun statut',
          collectiviteId: COLLECTIVITE_ID,
          statut: null,
        })
        .returning();

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, fiche.id));
      });

      const { data: fichesWithoutStatut } = await caller.listFiches({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          noStatut: true,
        },
      });

      expect(fichesWithoutStatut).toContainEqual(
        expect.objectContaining({
          id: fiche.id,
          statut: null,
        })
      );

      // Now we add the statut to the fiche
      await db.db
        .update(ficheActionTable)
        .set({
          statut: StatutEnum.EN_PAUSE,
        })
        .where(eq(ficheActionTable.id, fiche.id));

      const { data: fichesWithStatut } = await caller.listFiches({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          noStatut: true,
        },
      });

      expect(fichesWithStatut).not.toContainEqual(
        expect.objectContaining({
          id: fiche.id,
          statut: null,
        })
      );
    });
  });

  test('Fetch avec filtre sur budget prévisionnel', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Test budget prévisionnel',
        budgetPrevisionnel: '50000',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    const { data: fichesWithBudget } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        hasBudgetPrevisionnel: true,
      },
    });

    if (!fichesWithBudget) {
      expect.fail();
    }

    expect(fichesWithBudget).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });

  test('Fetch avec filtre sur date de fin prévisionnelle', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Test date de fin prévisionnelle',
        dateFin: '2024-12-31T00:00:00Z',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    const { data: fichesWithDateFin } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        hasDateDeFinPrevisionnelle: true,
      },
    });

    expect(fichesWithDateFin).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });

  test('Fetch avec filtre sur fiche restreinte', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Test fiche restreinte',
        restreint: true,
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    const { data: fichesRestreintes } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        restreint: true,
      },
    });

    if (!fichesRestreintes) {
      expect.fail();
    }

    expect(fichesRestreintes).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
        restreint: true,
      })
    );
  });

  test('Fetch avec filtre sur fiche mutualisée', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Test fiche mutualisée',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionSharingTable)
        .where(eq(ficheActionSharingTable.ficheId, testFicheId));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    const { data: fichesMutualisees } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        sharedWithCollectivites: true,
      },
    });

    expect(fichesMutualisees).not.toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );

    // Now we share the fiche with another collectivite
    await db.db.insert(ficheActionSharingTable).values({
      ficheId: testFicheId,
      collectiviteId: 2,
    });

    const { data: fichesMutualiseesAfterSharing } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        sharedWithCollectivites: true,
      },
    });

    expect(fichesMutualiseesAfterSharing).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
        sharedWithCollectivites: expect.arrayContaining([
          { id: 2, nom: 'Arbent' },
        ]),
      })
    );
  });

  test('Fetch avec filtre sur aucune priorité', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Test aucune priorité',
        priorite: null,
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    const { data: fichesWithoutPriorite } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        noPriorite: true,
      },
    });

    if (!fichesWithoutPriorite) {
      expect.fail();
    }

    expect(fichesWithoutPriorite).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
        priorite: null,
      })
    );
  });

  test('Fetch avec filtre sur aucune note de suivi', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Test aucune note de suivi',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    const { data: fichesWithoutNote } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        notesDeSuivi: notesDeSuiviEnumSchema.enum.WITHOUT,
      },
    });

    if (!fichesWithoutNote) {
      expect.fail();
    }

    expect(fichesWithoutNote).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });

  test('Fetch avec filtre sur ficheIds spécifiques', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const [fiche1, fiche2] = await db.db
      .insert(ficheActionTable)
      .values([
        {
          titre: 'Test ficheIds spécifiques 1',
          collectiviteId: COLLECTIVITE_ID,
        },
        {
          titre: 'Test ficheIds spécifiques 2',
          collectiviteId: COLLECTIVITE_ID,
        },
      ])
      .returning();
    const testFicheId1 = fiche1.id;
    const testFicheId2 = fiche2.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(inArray(ficheActionTable.id, [testFicheId1, testFicheId2]));
    });

    const { data: fichesSpecifiques } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        ficheIds: [testFicheId1, testFicheId2],
      },
    });

    if (!fichesSpecifiques) {
      expect.fail();
    }

    expect(fichesSpecifiques).toHaveLength(2);
    expect(fichesSpecifiques.map((f) => f.id)).toEqual(
      expect.arrayContaining([testFicheId1, testFicheId2])
    );
  });

  test('Fetch avec filtre sur partenaireIds', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // Create a partenaire tag
    const [partenaireTag] = await db.db
      .insert(partenaireTagTable)
      .values({
        nom: 'Partenaire test',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testPartenaireTagId = partenaireTag.id;

    // Create a fiche
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Test partenaireIds',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionPartenaireTagTable)
        .where(eq(ficheActionPartenaireTagTable.ficheId, testFicheId));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
      await db.db
        .delete(partenaireTagTable)
        .where(eq(partenaireTagTable.id, testPartenaireTagId));
    });

    const { data: fichesWithPartenaireBeforeAddingTag } =
      await caller.listFiches({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          partenaireIds: [testPartenaireTagId],
        },
      });

    expect(fichesWithPartenaireBeforeAddingTag).not.toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );

    // Link fiche to partenaire
    await db.db.insert(ficheActionPartenaireTagTable).values({
      ficheId: testFicheId,
      partenaireTagId: testPartenaireTagId,
    });

    const { data: fichesWithPartenaire } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        partenaireIds: [testPartenaireTagId],
      },
    });

    if (!fichesWithPartenaire) {
      expect.fail();
    }

    expect(fichesWithPartenaire).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });

  test('Fetch avec filtre sur financeurIds', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // Create a financeur tag
    const [financeurTag] = await db.db
      .insert(financeurTagTable)
      .values({
        nom: 'Financeur test',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFinanceurTagId = financeurTag.id;

    // Create a fiche
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Test financeurIds',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionFinanceurTagTable)
        .where(eq(ficheActionFinanceurTagTable.ficheId, testFicheId));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
      await db.db
        .delete(financeurTagTable)
        .where(eq(financeurTagTable.id, testFinanceurTagId));
    });

    const { data: fichesWithFinanceurBeforeAddingTag } =
      await caller.listFiches({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          financeurIds: [testFinanceurTagId],
        },
      });

    expect(fichesWithFinanceurBeforeAddingTag).not.toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );

    // Link fiche to financeur
    await db.db.insert(ficheActionFinanceurTagTable).values({
      ficheId: testFicheId,
      financeurTagId: testFinanceurTagId,
      montantTtc: 10000,
    });

    const { data: fichesWithFinanceur } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        financeurIds: [testFinanceurTagId],
      },
    });

    if (!fichesWithFinanceur) {
      expect.fail();
    }

    expect(fichesWithFinanceur).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });

  test('Fetch avec filtre sur thematiqueIds', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // Create a thematique
    const [thematique] = await db.db
      .insert(thematiqueTable)
      .values({
        nom: 'Thématique test',
      })
      .returning();
    const testThematiqueId = thematique.id;

    // Create a fiche
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Test thematiqueIds',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionThematiqueTable)
        .where(eq(ficheActionThematiqueTable.ficheId, testFicheId));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
      await db.db
        .delete(thematiqueTable)
        .where(eq(thematiqueTable.id, testThematiqueId));
    });

    const { data: fichesWithThematiqueBeforeAddingTag } =
      await caller.listFiches({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          thematiqueIds: [testThematiqueId],
        },
      });

    expect(fichesWithThematiqueBeforeAddingTag).not.toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );

    // Link fiche to thematique
    await db.db.insert(ficheActionThematiqueTable).values({
      ficheId: testFicheId,
      thematiqueId: testThematiqueId,
    });

    const { data: fichesWithThematique } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        thematiqueIds: [testThematiqueId],
      },
    });

    expect(fichesWithThematique).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });

  test('Fetch avec filtre sur sousThematiqueIds', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // Create a thematique first
    const [thematique] = await db.db
      .insert(thematiqueTable)
      .values({
        nom: 'Thématique parent test',
      })
      .returning();

    // Create a sous-thematique
    const [sousThematique] = await db.db
      .insert(sousThematiqueTable)
      .values({
        nom: 'Sous-thématique test',
        thematiqueId: thematique.id,
      })
      .returning();
    const testSousThematiqueId = sousThematique.id;

    // Create a fiche
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Test sousThematiqueIds',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionSousThematiqueTable)
        .where(eq(ficheActionSousThematiqueTable.ficheId, testFicheId));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
      await db.db
        .delete(sousThematiqueTable)
        .where(eq(sousThematiqueTable.id, testSousThematiqueId));
      await db.db
        .delete(thematiqueTable)
        .where(eq(thematiqueTable.id, thematique.id));
    });

    const { data: fichesWithSousThematiqueBeforeAddingTag } =
      await caller.listFiches({
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          sousThematiqueIds: [testSousThematiqueId],
        },
      });

    expect(fichesWithSousThematiqueBeforeAddingTag).not.toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );

    // Link fiche to sous-thematique
    await db.db.insert(ficheActionSousThematiqueTable).values({
      ficheId: testFicheId,
      thematiqueId: testSousThematiqueId,
    });

    const { data: fichesWithSousThematique } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        sousThematiqueIds: [testSousThematiqueId],
      },
    });

    if (!fichesWithSousThematique) {
      expect.fail();
    }

    expect(fichesWithSousThematique).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });

  test('Fetch avec filtre sur libreTagsIds', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // Create a libre tag
    const [libreTag] = await db.db
      .insert(libreTagTable)
      .values({
        nom: 'Libre tag test',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testLibreTagId = libreTag.id;

    // Create a fiche
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Test libreTagsIds',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionLibreTagTable)
        .where(eq(ficheActionLibreTagTable.ficheId, testFicheId));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
      await db.db
        .delete(libreTagTable)
        .where(eq(libreTagTable.id, testLibreTagId));
    });

    const { data: fichesWithLibreTagBeforeAddingTag } = await caller.listFiches(
      {
        collectiviteId: COLLECTIVITE_ID,
        filters: {
          libreTagsIds: [testLibreTagId],
        },
      }
    );

    expect(fichesWithLibreTagBeforeAddingTag).not.toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );

    // Link fiche to libre tag
    await db.db.insert(ficheActionLibreTagTable).values({
      ficheId: testFicheId,
      libreTagId: testLibreTagId,
    });

    const { data: fichesWithLibreTag } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        libreTagsIds: [testLibreTagId],
      },
    });

    expect(fichesWithLibreTag).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });

  test('Fetch avec filtre sur aucune personne référente', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const [personneTag] = await db.db
      .insert(personneTagTable)
      .values({
        nom: 'Personne référente test',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();

    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionReferentTable)
        .where(eq(ficheActionReferentTable.ficheId, testFicheId));
      await db.db
        .delete(personneTagTable)
        .where(eq(personneTagTable.id, personneTag.id));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    const { data: fichesWithoutReferent } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        noReferent: true,
      },
    });

    expect(fichesWithoutReferent).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );

    // Now we add the tag to the fiche
    await db.db.insert(ficheActionReferentTable).values({
      ficheId: testFicheId,
      tagId: personneTag.id,
    });

    const { data: fichesWithReferentAfterAddingTag } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        noReferent: true,
      },
    });

    expect(fichesWithReferentAfterAddingTag).not.toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });

  test('Fetch avec filtre sur personne référente', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // Create a personne tag
    const [personneTag] = await db.db
      .insert(personneTagTable)
      .values({
        nom: 'Personne référente test',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();

    const [anotherPersonneTag] = await db.db
      .insert(personneTagTable)
      .values({
        nom: 'Autre personne référente test',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();

    // Create a fiche
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    // Link fiche to personne référente
    await db.db.insert(ficheActionReferentTable).values({
      ficheId: testFicheId,
      tagId: personneTag.id,
    });

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionReferentTable)
        .where(eq(ficheActionReferentTable.ficheId, testFicheId));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
      await db.db
        .delete(personneTagTable)
        .where(eq(personneTagTable.id, personneTag.id));
      await db.db
        .delete(personneTagTable)
        .where(eq(personneTagTable.id, anotherPersonneTag.id));
    });

    const { data: fichesWithReferent } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        personneReferenteIds: [personneTag.id],
      },
    });

    expect(fichesWithReferent).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );

    const { data: fichesWithAnotherReferent } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        personneReferenteIds: [anotherPersonneTag.id],
      },
    });

    expect(fichesWithAnotherReferent).not.toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });

  test('Fetch avec filtre sur utilisateur référent', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // Create a fiche
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    // Link fiche to user référent
    await db.db.insert(ficheActionReferentTable).values({
      ficheId: testFicheId,
      userId: yoloDodo.id,
    });

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionReferentTable)
        .where(eq(ficheActionReferentTable.ficheId, testFicheId));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    const { data: fichesWithUserReferent } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        utilisateurReferentIds: [yoloDodo.id],
      },
    });

    expect(fichesWithUserReferent).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );

    const { data: fichesWithAnotherUserReferent } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        utilisateurReferentIds: [YOULOU_DOUDOU.id],
      },
    });

    expect(fichesWithAnotherUserReferent).not.toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });

  test('Fetch avec filtre sur date de modification après', async () => {
    const caller = router.createCaller({ user: yoloDodo });
    const modifiedDate = new Date('2024-01-01T00:00:00Z');

    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: COLLECTIVITE_ID,
        modifiedAt: modifiedDate.toISOString(),
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    const { data: fichesModifiedAfter } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        modifiedAfter: '2023-12-31T00:00:00Z',
      },
    });

    expect(fichesModifiedAfter).toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );

    const { data: fichesModifiedAfterLater } = await caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        modifiedAfter: '2024-03-01T00:00:00Z',
      },
    });

    expect(fichesModifiedAfterLater).not.toContainEqual(
      expect.objectContaining({
        id: testFicheId,
      })
    );
  });
});

test('Fetch avec filtre sur une action du referentiel associée', async () => {
  // Test avec une action associée à plusieurs fiches
  const caller = router.createCaller({ user: yoloDodo });

  const { data: fichesWithAction } = await caller.listFiches({
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
  const { data: noFichesFound } = await caller.listFiches({
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
  const { data: fichesWithFiche } = await caller.listFiches({
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
  const { data: fichesLinkedSeveralTimes } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      ficheIds: [5],
    },
  });

  expect(fichesLinkedSeveralTimes).toHaveLength(1);

  // Test avec une fiche associée à aucune autre fiche
  const { data: noFichesFound } = await caller.listFiches({
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

  const { data: noFichesWithInexistingIndicateur } = await caller.listFiches({
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

  const { data: fichesWithExistingIndicateur } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      indicateurIds: [56],
    },
  });

  expect(fichesWithExistingIndicateur.length).toBeGreaterThan(0);
  const ficheWithIndicateur = fichesWithExistingIndicateur.find(
    (fiche) => fiche.id === 1
  );
  expect(ficheWithIndicateur).toBeDefined();
});

test('Fetch avec filtre sur un statut', async () => {
  const caller = router.createCaller({ user: yoloDodo });
  const { data: emptyData } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      statuts: ['En cours'],
    },
  });

  expect(emptyData.length).toBe(0);

  const { data: withData } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      statuts: ['En cours', 'À venir'],
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

  const { data: fiches } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      modifiedSince: 'last-15-days',
    },
  });

  expect(fiches.length).toBeGreaterThan(0);
});

test('Fetch avec filtre sur aucun plan', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data: initialWithoutData } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      noPlan: true,
    },
  });

  const initialNumberOfFichesWithoutPlan = initialWithoutData.length;

  const { data: withPlan } = await caller.listFiches({
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
    if (ficheWithPlan.axes && ficheWithPlan.axes.length > 0) {
      await db.db
        .insert(ficheActionAxeTable)
        .values({ axeId: ficheWithPlan.axes[0].id, ficheId: ficheWithPlan.id });
    }
  });

  const { data: withoutPlan } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      noPlan: true,
    },
  });

  expect(withoutPlan).toHaveLength(initialNumberOfFichesWithoutPlan + 1);
  expect(withoutPlan.map((f) => f.id)).toContain(ficheWithPlan.id);
});

test('Fetch avec filtre les plansIds', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const { data: withPlan } = await caller.listFiches({
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

  const firstPlanId = ficheWithPlan.plans?.find(
    (p) => p.collectiviteId === COLLECTIVITE_ID
  )?.id;

  if (!firstPlanId) {
    expect.fail();
  }

  const { data: withPlanId } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      planActionIds: [firstPlanId],
    },
  });

  expect(withPlanId.length).toBeGreaterThan(0);

  const planNotFound = withPlanId.find(
    (f) => !f.plans?.find((p) => p.id === firstPlanId)
  );

  expect(planNotFound).toBeUndefined();
});

test('Fetch avec selectAll retourne tous les IDs correspondant aux filtres', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  // Récupérer toutes les fiches sans pagination pour avoir la référence
  const { data: fichesFromSimpleSelect } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      statuts: ['À venir'],
    },
    queryOptions: {
      page: 1,
      limit: 1000, // Un nombre élevé pour récupérer toutes les fiches
    },
  });

  // Récupérer les fiches avec pagination (page 1, 5 éléments)
  const { data: fichesFromSelectAll } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      statuts: ['À venir'],
    },
    queryOptions: {
      limit: 'all',
    },
  });

  expect(fichesFromSelectAll).toEqual(
    expect.arrayContaining(fichesFromSimpleSelect)
  );
});

test('Fetch avec filtre sur les années de notes de suivi', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  // Créer une fiche de test
  const [fiche] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Fiche test pour notes de suivi',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();
  const testFicheId = fiche.id;

  // Créer des notes de suivi pour différentes années
  const now = new Date();
  await db.db.insert(ficheActionNoteTable).values([
    {
      ficheId: testFicheId,
      dateNote: '2023-01-01T00:00:00Z',
      note: 'Note de suivi 2023',
      createdBy: yoloDodo.id,
      modifiedBy: yoloDodo.id,
      createdAt: now.toISOString(),
      modifiedAt: now.toISOString(),
    },
    {
      ficheId: testFicheId,
      dateNote: '2024-01-01T00:00:00Z',
      note: 'Note de suivi 2024',
      createdBy: yoloDodo.id,
      modifiedBy: yoloDodo.id,
      createdAt: now.toISOString(),
      modifiedAt: now.toISOString(),
    },
    {
      ficheId: testFicheId,
      dateNote: '2025-01-01T00:00:00Z',
      note: 'Note de suivi 2025',
      createdBy: yoloDodo.id,
      modifiedBy: yoloDodo.id,
      createdAt: now.toISOString(),
      modifiedAt: now.toISOString(),
    },
  ]);

  // Nettoyage à la fin du test
  onTestFinished(async () => {
    await db.db
      .delete(ficheActionNoteTable)
      .where(eq(ficheActionNoteTable.ficheId, testFicheId));
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, testFicheId));
  });

  // Test avec filtre sur l'année 2023
  const { data: fiches2023 } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      anneesNoteDeSuivi: ['2023'],
    },
  });

  if (!fiches2023) {
    expect.fail();
  }

  expect(fiches2023.length).toBeGreaterThan(0);
  const ficheTest2023 = fiches2023.find((f) => f.id === testFicheId);
  expect(ficheTest2023).toBeDefined();

  // Test avec filtre sur plusieurs années
  const { data: fichesMultiples } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      anneesNoteDeSuivi: ['2024', '2025'],
    },
  });

  if (!fichesMultiples) {
    expect.fail();
  }

  expect(fichesMultiples.length).toBeGreaterThan(0);
  const ficheTestMultiples = fichesMultiples.find((f) => f.id === testFicheId);
  expect(ficheTestMultiples).toBeDefined();

  // Test avec une année qui n'existe pas
  const { data: fichesInexistantes } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      anneesNoteDeSuivi: ['2020'],
    },
  });

  const ficheTestInexistante = fichesInexistantes.find(
    (f) => f.id === testFicheId
  );
  expect(ficheTestInexistante).toBeUndefined();
});

test('Fetch avec filtre sur priorites', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const [fiche] = await db.db
    .insert(ficheActionTable)
    .values({
      priorite: 'Élevé',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();
  const testFicheId = fiche.id;

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, testFicheId));
  });

  const { data: fichesWithPriorite } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      priorites: ['Élevé'],
    },
  });

  if (!fichesWithPriorite) {
    expect.fail();
  }

  expect(fichesWithPriorite).toContainEqual(
    expect.objectContaining({
      id: testFicheId,
      priorite: 'Élevé',
    })
  );

  const { data: fichesWithAnotherPriorite } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      priorites: ['Moyen'],
    },
  });

  expect(fichesWithAnotherPriorite).not.toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );
});

test('Fetch avec filtre sur cibles', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const [fiche] = await db.db
    .insert(ficheActionTable)
    .values({
      cibles: ['Elus locaux', 'Agents'],
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();
  const testFicheId = fiche.id;

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, testFicheId));
  });

  const { data: fichesWithCibles } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      cibles: ['Elus locaux'],
    },
  });

  if (!fichesWithCibles) {
    expect.fail();
  }

  expect(fichesWithCibles).toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );

  // Try with another cible which should not be found
  const { data: fichesWithAnotherCible } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      cibles: ['Partenaires'],
    },
  });

  expect(fichesWithAnotherCible).not.toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );
});

test('Fetch avec filtre sur aucune tag personnalisé', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const [fiche] = await db.db
    .insert(ficheActionTable)
    .values({
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();
  const testFicheId = fiche.id;

  const [tag] = await db.db
    .insert(libreTagTable)
    .values({
      nom: 'Test Tag',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionLibreTagTable)
      .where(eq(ficheActionLibreTagTable.ficheId, testFicheId));
    await db.db.delete(libreTagTable).where(eq(libreTagTable.id, tag.id));
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, testFicheId));
  });

  const { data: fichesWithoutTag } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      noTag: true,
    },
  });

  expect(fichesWithoutTag).toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );

  // Now we add the tag to the fiche
  await db.db.insert(ficheActionLibreTagTable).values({
    ficheId: testFicheId,
    libreTagId: tag.id,
  });

  const { data: fichesWithTag } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      libreTagsIds: [tag.id],
    },
  });

  expect(fichesWithTag).toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );

  const { data: fichesWithoutTagAfterAddingTag } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      noTag: true,
    },
  });

  expect(fichesWithoutTagAfterAddingTag).not.toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );
});

test('Fetch avec filtre sur actions dans plusieurs plans', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const [fiche] = await db.db
    .insert(ficheActionTable)
    .values({
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();
  const testFicheId = fiche.id;

  const plans = await db.db
    .insert(axeTable)
    .values([
      {
        nom: 'Test Plan 1',
        collectiviteId: COLLECTIVITE_ID,
      },
      {
        nom: 'Test Plan 2',
        collectiviteId: COLLECTIVITE_ID,
      },
    ])
    .returning();

  await db.db.insert(ficheActionAxeTable).values([
    {
      ficheId: testFicheId,
      axeId: plans[0].id,
    },
    {
      ficheId: testFicheId,
      axeId: plans[1].id,
    },
  ]);

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionAxeTable)
      .where(eq(ficheActionAxeTable.ficheId, testFicheId));
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, testFicheId));
    await db.db.delete(axeTable).where(
      inArray(
        axeTable.id,
        plans.map((p) => p.id)
      )
    );
  });

  const { data: fichesWithSeveralPlans } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      doesBelongToSeveralPlans: true,
    },
  });

  expect(fichesWithSeveralPlans).toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );

  const { data: fichesWithoutSeveralPlans } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      doesBelongToSeveralPlans: false,
    },
  });

  expect(fichesWithoutSeveralPlans).not.toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );
});

test('Fetch avec filtre sur structurePiloteIds', async () => {
  const caller = router.createCaller({ user: yoloDodo });
  // Create a structure tag
  const [structureTag] = await db.db
    .insert(structureTagTable)
    .values({
      nom: 'Structure test',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();

  // Create a fiche
  const [fiche] = await db.db
    .insert(ficheActionTable)
    .values({
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();
  const testFicheId = fiche.id;

  // Link fiche to structure
  await db.db.insert(ficheActionStructureTagTable).values({
    ficheId: testFicheId,
    structureTagId: structureTag.id,
  });

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionStructureTagTable)
      .where(eq(ficheActionStructureTagTable.ficheId, testFicheId));
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, testFicheId));
    await db.db
      .delete(structureTagTable)
      .where(eq(structureTagTable.id, structureTag.id));
  });

  const { data: fichesWithStructure } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      structurePiloteIds: [structureTag.id],
    },
  });

  expect(fichesWithStructure).toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );

  const { data: fichesWithAnotherStructure } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      structurePiloteIds: [structureTag.id - 1],
    },
  });
  expect(fichesWithAnotherStructure).not.toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );
});

test('Fetch avec filtre sur debutPeriode et finPeriode', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const [fiche] = await db.db
    .insert(ficheActionTable)
    .values({
      dateDebut: '2024-06-01T00:00:00Z',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();
  const testFicheId = fiche.id;

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, testFicheId));
  });

  const { data: fichesWithPeriode } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      typePeriode: 'debut',
      debutPeriode: '2024-05-01T00:00:00Z',
      finPeriode: '2024-07-01T00:00:00Z',
    },
  });

  expect(fichesWithPeriode).toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );

  const { data: fichesWithAnotherPeriode } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      typePeriode: 'debut',
      debutPeriode: '2024-07-01T00:00:00Z',
      finPeriode: '2024-09-01T00:00:00Z',
    },
  });
  expect(fichesWithAnotherPeriode).not.toContainEqual(
    expect.objectContaining({
      id: testFicheId,
    })
  );
});

test('Fetch sans filtre exclut les sous-fiches par défaut', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const [parentFiche] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Fiche parente test',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();

  const [subFiche] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Sous-fiche test',
      collectiviteId: COLLECTIVITE_ID,
      parentId: parentFiche.id,
    })
    .returning();

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, subFiche.id));
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, parentFiche.id));
  });

  // Sans withChildren, les sous-fiches ne doivent pas apparaître
  const { data: fichesWithoutChildren } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      texteNomOuDescription: 'test',
    },
  });

  expect(fichesWithoutChildren).toContainEqual(
    expect.objectContaining({
      id: parentFiche.id,
      titre: 'Fiche parente test',
    })
  );

  expect(fichesWithoutChildren).not.toContainEqual(
    expect.objectContaining({
      id: subFiche.id,
      titre: 'Sous-fiche test',
    })
  );
});

test('Fetch avec withChildren inclut les sous-fiches', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const [parentFiche] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Fiche parente avec children',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();

  const [subFiche] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Sous-fiche avec children',
      collectiviteId: COLLECTIVITE_ID,
      parentId: parentFiche.id,
    })
    .returning();

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, subFiche.id));
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, parentFiche.id));
  });

  // Avec withChildren, les sous-fiches doivent apparaître
  const { data: fichesWithChildren } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      texteNomOuDescription: 'children',
      withChildren: true,
    },
  });

  expect(fichesWithChildren).toContainEqual(
    expect.objectContaining({
      id: parentFiche.id,
      titre: 'Fiche parente avec children',
    })
  );

  expect(fichesWithChildren).toContainEqual(
    expect.objectContaining({
      id: subFiche.id,
      titre: 'Sous-fiche avec children',
    })
  );

  const { data: fichesWithChildren2 } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      ficheIds: [parentFiche.id],
      withChildren: true,
    },
  });

  expect(fichesWithChildren2).toEqual(fichesWithChildren);
});

test('Fetch avec parentsId retourne uniquement les sous-fiches des parents spécifiés', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const [parentFiche1] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Parent 1',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();

  const [parentFiche2] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Parent 2',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();

  const [subFiche1] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Sous-fiche Parent 1',
      collectiviteId: COLLECTIVITE_ID,
      parentId: parentFiche1.id,
    })
    .returning();

  const [subFiche2] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Sous-fiche Parent 2',
      collectiviteId: COLLECTIVITE_ID,
      parentId: parentFiche2.id,
    })
    .returning();

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionTable)
      .where(inArray(ficheActionTable.id, [subFiche1.id, subFiche2.id]));
    await db.db
      .delete(ficheActionTable)
      .where(inArray(ficheActionTable.id, [parentFiche1.id, parentFiche2.id]));
  });

  // Avec parentsId pour parentFiche1, seules ses sous-fiches doivent apparaître
  const { data: fichesWithParentsId } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      parentsId: [parentFiche1.id],
    },
  });

  expect(fichesWithParentsId).toContainEqual(
    expect.objectContaining({
      id: subFiche1.id,
      titre: 'Sous-fiche Parent 1',
    })
  );

  expect(fichesWithParentsId).not.toContainEqual(
    expect.objectContaining({
      id: parentFiche1.id,
    })
  );

  expect(fichesWithParentsId).not.toContainEqual(
    expect.objectContaining({
      id: parentFiche2.id,
    })
  );

  expect(fichesWithParentsId).not.toContainEqual(
    expect.objectContaining({
      id: subFiche2.id,
    })
  );
});

test('Fetch avec les filtres parentsId et withChildren génère une erreur', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const [parentFiche] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Parent pour test withChildren',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();

  const [subFiche] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Sous-fiche pour test withChildren',
      collectiviteId: COLLECTIVITE_ID,
      parentId: parentFiche.id,
    })
    .returning();

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, subFiche.id));
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, parentFiche.id));
  });

  await expect(
    caller.listFiches({
      collectiviteId: COLLECTIVITE_ID,
      filters: {
        parentsId: [parentFiche.id],
        withChildren: true,
      },
    })
  ).rejects.toThrow(
    'Les filtres `parentsId` et `withChildren` sont mutuellement exclusifs et ne peuvent pas être utilisés simultanément.'
  );
});

test("Fetch avec parentsId combiné avec d'autres filtres", async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const [parentFiche] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Parent avec restriction',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();

  const [subFiche1] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Sous-fiche 1 restreinte',
      collectiviteId: COLLECTIVITE_ID,
      parentId: parentFiche.id,
      restreint: true,
    })
    .returning();

  const [subFiche2] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Sous-fiche 2 non restreinte',
      collectiviteId: COLLECTIVITE_ID,
      parentId: parentFiche.id,
      restreint: false,
    })
    .returning();

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionTable)
      .where(inArray(ficheActionTable.id, [subFiche1.id, subFiche2.id]));
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, parentFiche.id));
  });

  // Filtrer par parentsId ET restreint
  const { data: fichesRestreintes } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      parentsId: [parentFiche.id],
      restreint: true,
    },
  });

  expect(fichesRestreintes).toContainEqual(
    expect.objectContaining({
      id: subFiche1.id,
      titre: 'Sous-fiche 1 restreinte',
    })
  );

  expect(fichesRestreintes).not.toContainEqual(
    expect.objectContaining({
      id: subFiche2.id,
    })
  );
});

test('Fetch avec filtre sur axeIds', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  // Create a plan
  const [plan] = await db.db
    .insert(axeTable)
    .values({
      nom: 'Test Plan',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();

  // Create test axes (plans)
  const [axe] = await db.db
    .insert(axeTable)
    .values([
      {
        nom: 'Test Axe 1',
        collectiviteId: COLLECTIVITE_ID,
        plan: plan.id,
      },
    ])
    .returning();

  // Create test fiches
  const [fiche1] = await db.db
    .insert(ficheActionTable)
    .values({
      titre: 'Fiche test axeIds 1',
      collectiviteId: COLLECTIVITE_ID,
    })
    .returning();

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionAxeTable)
      .where(eq(ficheActionAxeTable.ficheId, fiche1.id));
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, fiche1.id));
    await db.db.delete(axeTable).where(eq(axeTable.id, axe.id));
    await db.db.delete(axeTable).where(eq(axeTable.id, plan.id));
  });

  // Test filtering by first axe
  const { data: fichesWithAxe1 } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      axesId: [axe.id],
    },
  });

  expect(fichesWithAxe1).not.toContainEqual(
    expect.objectContaining({
      id: fiche1.id,
    })
  );

  // Link fiche to axes
  await db.db.insert(ficheActionAxeTable).values([
    {
      ficheId: fiche1.id,
      axeId: axe.id,
    },
  ]);

  const { data: fichesWithAxe1AfterAddingFiche } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {
      axesId: [axe.id],
    },
  });

  expect(fichesWithAxe1AfterAddingFiche).toContainEqual(
    expect.objectContaining({
      id: fiche1.id,
    })
  );
});

test('Exclut les fiches supprimées (soft delete)', async () => {
  const caller = router.createCaller({ user: yoloDodo });

  const [ficheActive, ficheDeleted] = await db.db
    .insert(ficheActionTable)
    .values([
      {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Fiche active',
      },
      {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Fiche supprimée',
        deleted: true,
      },
    ])
    .returning();

  onTestFinished(async () => {
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheActive.id));
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheDeleted.id));
  });

  const { data } = await caller.listFiches({
    collectiviteId: COLLECTIVITE_ID,
    filters: {},
    queryOptions: { page: 1, limit: 50 },
  });

  const ids = data.map((f) => f.id);
  expect(ids).toContain(ficheActive.id);
  expect(ids).not.toContain(ficheDeleted.id);
});
