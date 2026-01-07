import { libreTagTable } from '@tet/backend/collectivites/tags/libre-tag.table';
import { FichesRouter } from '@tet/backend/plans/fiches/fiches.router';
import {
  getAuthUser,
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CibleEnum, PiliersEciEnum, StatutEnum } from '@tet/domain/plans';
import { CollectiviteAccessLevelEnum } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { describe, expect } from 'vitest';
import {
  actionsFixture,
  axesFixture,
  effetsAttendusFixture,
  fichesLieesFixture,
  financeursFixture,
  indicateursFixture,
  libresFixture,
  partenairesFixture,
  pilotesFixture,
  referentsFixture,
  servicesFixture,
  sousThematiquesFixture,
  structuresFixture,
  thematiquesFixture,
} from '../shared/fixtures/fiche-action-relations.fixture';
import { ficheActionFixture } from '../shared/fixtures/fiche-action.fixture';
import { ficheActionActionTable } from '../shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionEffetAttenduTable } from '../shared/models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from '../shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from '../shared/models/fiche-action-indicateur.table';
import { ficheActionLibreTagTable } from '../shared/models/fiche-action-libre-tag.table';
import { ficheActionLienTable } from '../shared/models/fiche-action-lien.table';
import { ficheActionPartenaireTagTable } from '../shared/models/fiche-action-partenaire-tag.table';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '../shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '../shared/models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from '../shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from '../shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from '../shared/models/fiche-action-thematique.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { UpdateFicheRequest } from './update-fiche.request';

const collectiviteId = 1;
const ficheId = 9999;

describe('UpdateFicheService', () => {
  let db: DatabaseService;
  let router: FichesRouter;
  let yoloDodo: AuthenticatedUser;

  beforeAll(async () => {
    const app = await getTestApp();
    router = app.get(FichesRouter);
    db = await getTestDatabase(app);
    yoloDodo = await getAuthUser(YOLO_DODO);

    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheId));

    await db.db.insert(ficheActionTable).values(ficheActionFixture);

    await insertFixtures(db, ficheId);

    return async () => {
      await cleanupLibreTags();

      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));

      await app.close();
    };
  });

  describe('Update fiche action fields', () => {
    test('should return 400 when invalid numeric type are provided', async () => {
      const caller = router.createCaller({ user: yoloDodo });

      const data: UpdateFicheRequest = {
        budgetPrevisionnel: 'invalid_number',
      };

      await expect(
        caller.update({
          ficheId: ficheId,
          ficheFields: data,
        })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: expect.stringContaining(
            "Expected 'budgetPrevisionnel' to be a numeric string"
          ),
        })
      );
    });

    test('should return 400 for invalid date format in dateDebut', async () => {
      const caller = router.createCaller({ user: yoloDodo });

      const data: UpdateFicheRequest = { dateDebut: 'not-a-date' };

      await expect(() =>
        caller.update({
          ficheId,
          ficheFields: data,
        })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: expect.stringContaining(
            "Invalid date format for 'dateDebut'"
          ),
        })
      );
    });

    test('should return 400 for invalid boolean type in ameliorationContinue', async () => {
      const caller = router.createCaller({ user: yoloDodo });

      const data = {
        ameliorationContinue: 'not-a-boolean',
      };

      await expect(() =>
        caller.update({
          ficheId,
          // @ts-expect-error invalid type on purpose
          ficheFields: data,
        })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: expect.stringContaining('expected boolean, received string'),
        })
      );
    });

    test('should return 404 when updating a non-existent ficheAction', async () => {
      const caller = router.createCaller({ user: yoloDodo });

      const nonExistentFicheActionId = 121212;
      const data: UpdateFicheRequest = {
        titre: 'New Titre',
      };

      await expect(() =>
        caller.update({
          ficheId: nonExistentFicheActionId,
          ficheFields: data,
        })
      ).rejects.toThrow(
        expect.objectContaining({
          message: `Action non trouvée pour l'id 121212`,
        })
      );
    });

    test('should update fiche action fields', async () => {
      const data: UpdateFicheRequest = {
        collectiviteId: 1,
        titre: 'Construire des pistes cyclables',
        description:
          'Un objectif à long terme sera de construire de nombreuses pistes cyclables dans le centre-ville.',
        dateDebut: '2024-11-14T00:00:00.000Z',
        dateFin: '2025-09-10T00:00:00.000Z',
        instanceGouvernance: null,
        priorite: 'Bas',
        piliersEci: [
          PiliersEciEnum.APPROVISIONNEMENT_DURABLE,
          PiliersEciEnum.ECOCONCEPTION,
        ],
        objectifs:
          'Diminution de 15% de la consommation de feuilles de papier / Indicateurs : Nombre de papiers',
        cibles: [CibleEnum.GRAND_PUBLIC, CibleEnum.ASSOCIATIONS],
        ressources: 'Service numérique',
        financements: 'De 40 000€ à 100 000€',
        budgetPrevisionnel: '35000',
        statut: StatutEnum.EN_PAUSE,
        ameliorationContinue: false,
        calendrier: 'Calendrier prévisionnel',
        majTermine: true,
        tempsDeMiseEnOeuvre: { id: 1 },
        participationCitoyenne:
          'La participation citoyenne a été approuvée en réunion plénière',
        participationCitoyenneType: 'information',
        restreint: false,
      };

      const fiche = await updateFiche(data);

      const body = Object.fromEntries(
        Object.entries(fiche).filter(
          ([key]) =>
            ![
              'id',
              'createdAt',
              'createdBy',
              'modifiedAt',
              'modifiedBy',
            ].includes(key)
        )
      );

      expect(body).toMatchObject({
        ...data,
        tempsDeMiseEnOeuvre: {
          id: 1,
        },
      });

      // Reset fields to null
      const nullData: UpdateFicheRequest = {
        titre: null,
        description: null,
        dateDebut: null,
        dateFin: null,
        instanceGouvernance: null,
        priorite: null,
        piliersEci: null,
        objectifs: null,
        cibles: null,
        ressources: null,
        financements: null,
        budgetPrevisionnel: null,
        statut: null,
        ameliorationContinue: null,
        calendrier: null,
        majTermine: null,
        tempsDeMiseEnOeuvre: null,
        participationCitoyenne: null,
        participationCitoyenneType: null,
        restreint: null,
      };

      const ficheWithNullData = await updateFiche(nullData);

      expect(ficheWithNullData).toMatchObject(nullData);
    });
  });

  describe('Update relations', () => {
    test('should update the axes relations in the database', async () => {
      const data: UpdateFicheRequest = {
        axes: [{ id: 1 }, { id: 2 }],
      };

      const fiche = await updateFiche(data);

      expect(fiche.axes).toContainEqual(expect.objectContaining({ id: 1 }));
      expect(fiche.axes).toContainEqual(
        expect.objectContaining({ id: 2, planId: 1 })
      );
    });

    test('should update the thematiques relations in the database', async () => {
      const data: UpdateFicheRequest = {
        thematiques: [{ id: 1 }, { id: 2 }],
      };

      const fiche = await updateFiche(data);

      expect(fiche.thematiques).toContainEqual(
        expect.objectContaining({ id: 1, nom: expect.any(String) })
      );
      expect(fiche.thematiques).toContainEqual(
        expect.objectContaining({ id: 2, nom: expect.any(String) })
      );
    });

    test('should update the sousThematiques relations in the database', async () => {
      const data: UpdateFicheRequest = {
        sousThematiques: [{ id: 3 }, { id: 4 }],
      };

      const caller = router.createCaller({ user: yoloDodo });

      await caller.update({
        ficheId,
        ficheFields: data,
      });

      const fiche = await caller.get({
        id: ficheId,
      });

      expect(fiche.sousThematiques).toContainEqual(
        expect.objectContaining({
          id: 3,
          nom: expect.any(String),
          thematiqueId: expect.any(Number),
        })
      );
      expect(fiche.sousThematiques).toContainEqual(
        expect.objectContaining({
          id: 4,
          nom: expect.any(String),
          thematiqueId: expect.any(Number),
        })
      );
    });

    test('should update the partenaires relations in the database', async () => {
      const caller = router.createCaller({ user: yoloDodo });

      const ficheFields: UpdateFicheRequest = {
        partenaires: [{ id: 1 }, { id: 2 }],
      };

      await caller.update({
        ficheId,
        ficheFields,
      });

      const ficheWithPartenaires = await caller.get({
        id: ficheId,
      });

      expect(ficheWithPartenaires.partenaires).toStrictEqual([
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
      ]);

      await caller.update({
        ficheId,
        ficheFields: {
          partenaires: [],
        },
      });

      const ficheWithEmptyPartenaires = await caller.get({
        id: ficheId,
      });

      expect(ficheWithEmptyPartenaires.partenaires).toHaveLength(0);

      await caller.update({
        ficheId,
        ficheFields,
      });

      const ficheWithPartenaires2 = await caller.get({
        id: ficheId,
      });

      expect(ficheWithPartenaires2.partenaires).toHaveLength(
        ficheFields.partenaires?.length ?? 0
      );

      await caller.update({
        ficheId,
        ficheFields: {
          partenaires: null,
        },
      });

      const ficheWithNullPartenaires = await caller.get({
        id: ficheId,
      });

      expect(ficheWithNullPartenaires.partenaires).toHaveLength(0);
    });

    it('should update the structures relations in the database', async () => {
      const data: UpdateFicheRequest = {
        structures: [{ id: 1 }, { id: 2 }],
      };

      const caller = router.createCaller({ user: yoloDodo });

      await caller.update({
        ficheId,
        ficheFields: data,
      });

      const fiche = await caller.get({
        id: ficheId,
      });

      expect(fiche.structures).toContainEqual(
        expect.objectContaining({ id: 1 })
      );
      expect(fiche.structures).toContainEqual(
        expect.objectContaining({ id: 2 })
      );
    });

    it('should update the pilotes relations in the database', async () => {
      const data: UpdateFicheRequest = {
        pilotes: [
          {
            tagId: 1,
            userId: '3f407fc6-3634-45ff-a988-301e9088096a',
          },
          {
            tagId: 9,
            userId: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
          },
        ],
      };

      const caller = router.createCaller({ user: yoloDodo });

      await caller.update({
        ficheId,
        ficheFields: data,
      });

      const fiche = await caller.get({
        id: ficheId,
      });

      expect(fiche.pilotes).toContainEqual(
        expect.objectContaining({
          tagId: 1,
          userId: '3f407fc6-3634-45ff-a988-301e9088096a',
        })
      );
      expect(fiche.pilotes).toContainEqual(
        expect.objectContaining({
          tagId: 9,
          userId: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
        })
      );
    });

    it('should update the financeurs relations in the database', async () => {
      const data: UpdateFicheRequest = {
        financeurs: [
          {
            financeurTag: { id: 1 },
            montantTtc: 999,
          },
          {
            financeurTag: { id: 2 },
            montantTtc: 666,
          },
        ],
      };

      const fiche = await updateFiche(data);

      expect(fiche.financeurs).toContainEqual(
        expect.objectContaining({
          financeurTag: expect.objectContaining({ id: 1 }),
          montantTtc: 999,
        })
      );
      expect(fiche.financeurs).toContainEqual(
        expect.objectContaining({
          financeurTag: expect.objectContaining({ id: 2 }),
          montantTtc: 666,
        })
      );
    });

    it('should update the actions relations in the database', async () => {
      const data: UpdateFicheRequest = {
        mesures: [{ id: 'cae_1.1.1' }, { id: 'cae_1.1.2' }],
      };

      const fiche = await updateFiche(data);

      expect(fiche.mesures).toContainEqual(
        expect.objectContaining({
          id: 'cae_1.1.1',
        })
      );
      expect(fiche.mesures).toContainEqual(
        expect.objectContaining({
          id: 'cae_1.1.2',
        })
      );
    });

    it('should update the indicateurs relations in the database', async () => {
      const data: UpdateFicheRequest = {
        indicateurs: [{ id: 1 }, { id: 2 }],
      };

      const fiche = await updateFiche(data);

      expect(fiche.indicateurs).toContainEqual(
        expect.objectContaining({
          id: 1,
        })
      );
      expect(fiche.indicateurs).toContainEqual(
        expect.objectContaining({
          id: 2,
        })
      );
    });

    it('should update the services relations in the database', async () => {
      const data: UpdateFicheRequest = {
        services: [{ id: 1 }, { id: 2 }],
      };

      const fiche = await updateFiche(data);

      expect(fiche.services).toContainEqual(
        expect.objectContaining({
          id: 1,
        })
      );
      expect(fiche.services).toContainEqual(
        expect.objectContaining({
          id: 2,
        })
      );
    });

    it('should update the fiches liees relations in the database', async () => {
      const data: UpdateFicheRequest = {
        fichesLiees: [{ id: 1 }, { id: 2 }],
      };

      const fiche = await updateFiche(data);

      expect(fiche.fichesLiees).toContainEqual(
        expect.objectContaining({
          id: 1,
        })
      );
      expect(fiche.fichesLiees).toContainEqual(
        expect.objectContaining({
          id: 2,
        })
      );
    });

    it('should update the resultats attendus relations in the database', async () => {
      const data: UpdateFicheRequest = {
        effetsAttendus: [{ id: 21 }, { id: 22 }],
      };

      const fiche = await updateFiche(data);

      expect(fiche.effetsAttendus).toContainEqual(
        expect.objectContaining({
          id: 21,
        })
      );
      expect(fiche.effetsAttendus).toContainEqual(
        expect.objectContaining({
          id: 22,
        })
      );
    });

    it('should update libre tag relations in the database when an existing tag is added', async () => {
      // Setup test data
      await db.db
        .insert(libreTagTable)
        .values([{ id: 2, nom: 'Tag 2', collectiviteId }]);

      const data: UpdateFicheRequest = {
        libreTags: [{ id: 1 }, { id: 2 }],
      };
      const fiche = await updateFiche(data);

      expect(fiche.libreTags).toContainEqual(
        expect.objectContaining({
          id: 1,
        })
      );
      expect(fiche.libreTags).toContainEqual(
        expect.objectContaining({
          id: 2,
        })
      );

      onTestFinished(async () => {
        await cleanupLibreTags();
      });
    });

    it('should update notes relations in the database', async () => {
      const data: UpdateFicheRequest = {
        notes: [
          {
            dateNote: '2024-01-15',
            note: 'Première note de suivi',
          },
          {
            dateNote: '2024-02-20',
            note: 'Deuxième note importante',
          },
        ],
      };

      const fiche = await updateFiche(data);

      expect(fiche.notes).toHaveLength(2);
      expect(fiche.notes).toContainEqual(
        expect.objectContaining({
          dateNote: '2024-01-15',
          note: 'Première note de suivi',
        })
      );
      expect(fiche.notes).toContainEqual(
        expect.objectContaining({
          dateNote: '2024-02-20',
          note: 'Deuxième note importante',
        })
      );

      // Test updating with empty array
      const emptyData: UpdateFicheRequest = {
        notes: [],
      };
      const ficheWithEmptyNotes = await updateFiche(emptyData);
      expect(ficheWithEmptyNotes.notes).toBeNull();

      // Test updating with null
      const nullData: UpdateFicheRequest = {
        notes: null,
      };
      const ficheWithNullNotes = await updateFiche(nullData);
      expect(ficheWithNullNotes.notes).toBeNull();
    });

    it('should add and remove a parent relation between two fiches', async () => {
      const [parentFiche] = await db.db
        .insert(ficheActionTable)
        .values({
          titre: 'Fiche parente test',
          collectiviteId,
        })
        .returning();

      let updatedFiche = await updateFiche({ parentId: parentFiche.id });
      expect(updatedFiche.parentId).toBe(parentFiche.id);

      updatedFiche = await updateFiche({ parentId: null });
      expect(updatedFiche.parentId).toBe(null);

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, parentFiche.id));
      });
    });

    it('should return 400 when trying to set a non-existent fiche as parent', async () => {
      const caller = router.createCaller({ user: yoloDodo });

      const nonExistentParentId = 999999;
      await expect(() =>
        caller.update({
          ficheId,
          ficheFields: {
            parentId: nonExistentParentId,
          },
        })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'BAD_REQUEST',
        })
      );
    });

    it('should prevent creating a self-referencing parent relation', async () => {
      const caller = router.createCaller({ user: yoloDodo });

      await expect(() =>
        caller.update({
          ficheId,
          ficheFields: {
            parentId: ficheId, // Trying to set itself as parent
          },
        })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'BAD_REQUEST',
        })
      );
    });
  });

  describe('Access Rights', () => {
    test('should return 401 if an invalid token is provided', async () => {
      const data: UpdateFicheRequest = {
        titre: 'Tentative de mise à jour sans droits',
      };

      const caller = router.createCaller({ user: null });

      await expect(() =>
        caller.update({
          ficheId,
          ficheFields: data,
        })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'UNAUTHORIZED',
        })
      );
    });

    test('should not allow update if fiche action is not in user‘s collectivite', async () => {
      await db.db
        .insert(ficheActionTable)
        .values({ ...ficheActionFixture, id: 10000, collectiviteId: 3 });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, 10000));
      });

      const data: UpdateFicheRequest = {
        titre: 'Construire des pistes cyclables',
      };

      const caller = router.createCaller({ user: yoloDodo });

      await expect(() =>
        caller.update({
          ficheId: 10000,
          ficheFields: data,
        })
      ).rejects.toThrowError(/Droits insuffisants/i);
    });

    test('should allow update if fiche action is in user‘s collectivite', async () => {
      await db.db
        .insert(ficheActionTable)
        .values({ ...ficheActionFixture, id: 10000, collectiviteId: 1 });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, 10000));
      });

      const data: UpdateFicheRequest = {
        titre: 'Titre mis à jour par une utilisatrice autorisée',
      };

      const caller = router.createCaller({ user: yoloDodo });

      await caller.update({
        ficheId,
        ficheFields: data,
      });

      const [fiche] = await db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));

      expect(fiche.titre).toBe(
        'Titre mis à jour par une utilisatrice autorisée'
      );
    });

    test('User with limited edition rights on collectivite can update fiche only if he is pilote', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectiviteId,
        accessLevel: CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
      });

      const adminCaller = router.createCaller({ user: yoloDodo });

      onTestFinished(async () => {
        await cleanup();
      });

      const limitedEditionUser = getAuthUserFromDcp(user);
      const limitedEditionCaller = router.createCaller({
        user: limitedEditionUser,
      });

      // Attempt to update should fail
      await expect(
        limitedEditionCaller.update({
          ficheId: ficheId,
          ficheFields: { titre: 'Tentative de mise à jour sans droits' },
        })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.userId} n'a pas l'autorisation plans.fiches.update sur la ressource Collectivité ${collectiviteId}`
      );

      // Udpate to add it as pilote
      await adminCaller.update({
        ficheId: ficheId,
        ficheFields: { pilotes: [{ tagId: 1, userId: user.userId }] },
      });

      // Update should now succeed
      await limitedEditionCaller.update({
        ficheId: ficheId,
        ficheFields: { titre: 'Mise à jour avec droits pilote' },
      });

      const fiche = await limitedEditionCaller.get({
        id: ficheId,
      });

      expect(fiche.titre).toBe('Mise à jour avec droits pilote');

      // Update to be able to delete the user
      await adminCaller.update({
        ficheId: ficheId,
        ficheFields: { pilotes: [] },
      });
    });
  });

  async function insertFixtures(
    databaseService: DatabaseService,
    ficheId: number
  ) {
    await databaseService.db.insert(ficheActionAxeTable).values({
      ficheId,
      axeId: axesFixture.id,
    });

    await databaseService.db.insert(ficheActionThematiqueTable).values({
      ficheId,
      thematiqueId: thematiquesFixture.id,
    });

    await databaseService.db.insert(ficheActionSousThematiqueTable).values({
      ficheId,
      thematiqueId: sousThematiquesFixture.thematiqueId,
    });

    await databaseService.db.insert(ficheActionPartenaireTagTable).values({
      ficheId,
      partenaireTagId: partenairesFixture.id,
    });

    await databaseService.db.insert(ficheActionStructureTagTable).values({
      ficheId,
      structureTagId: structuresFixture.id,
    });

    await databaseService.db.insert(ficheActionPiloteTable).values({
      ficheId,
      tagId: pilotesFixture.tagId,
      userId: pilotesFixture.userId,
    });

    await databaseService.db.insert(ficheActionReferentTable).values({
      ficheId,
      tagId: referentsFixture.tagId,
      userId: referentsFixture.userId,
    });

    await databaseService.db.insert(ficheActionActionTable).values({
      ficheId,
      actionId: actionsFixture.id,
    });

    await databaseService.db.insert(ficheActionIndicateurTable).values({
      ficheId,
      indicateurId: indicateursFixture.id,
    });

    await databaseService.db.insert(ficheActionServiceTagTable).values({
      ficheId,
      serviceTagId: servicesFixture.id,
    });

    await databaseService.db.insert(ficheActionFinanceurTagTable).values({
      ficheId,
      financeurTagId: financeursFixture.financeurTag.id,
      montantTtc: financeursFixture.montantTtc,
    });

    await databaseService.db.insert(ficheActionLienTable).values({
      ficheUne: ficheId,
      ficheDeux: fichesLieesFixture.id,
    });

    await databaseService.db.insert(ficheActionEffetAttenduTable).values({
      ficheId,
      effetAttenduId: effetsAttendusFixture.id,
    });

    await databaseService.db.insert(libreTagTable).values([
      {
        id: 1,
        nom: 'Tag 1',
        collectiviteId,
      },
    ]);

    await databaseService.db.insert(ficheActionLibreTagTable).values({
      ficheId,
      libreTagId: libresFixture.id,
    });
  }

  async function updateFiche(data: UpdateFicheRequest) {
    const caller = router.createCaller({ user: yoloDodo });

    await caller.update({
      ficheId,
      ficheFields: data,
    });

    const fiche = await caller.get({
      id: ficheId,
    });

    return fiche;
  }

  const cleanupLibreTags = async () => {
    // Always cleanup ficheActionLibreTag first due to foreign key constraints
    await db.db
      .delete(ficheActionLibreTagTable)
      .where(eq(ficheActionLibreTagTable.ficheId, ficheId));

    // Then cleanup all libreTags
    await db.db
      .delete(libreTagTable)
      .where(eq(libreTagTable.collectiviteId, collectiviteId));
  };
});
