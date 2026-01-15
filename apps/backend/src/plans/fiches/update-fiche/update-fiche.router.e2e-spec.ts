import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { financeurTagTable } from '@tet/backend/collectivites/tags/financeur-tag.table';
import { instanceGouvernanceTagTable } from '@tet/backend/collectivites/tags/instance-gouvernance-tag.table';
import { libreTagTable } from '@tet/backend/collectivites/tags/libre-tag.table';
import { partenaireTagTable } from '@tet/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@tet/backend/collectivites/tags/structure-tag.table';
import { FichesRouter } from '@tet/backend/plans/fiches/fiches.router';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CibleEnum, PiliersEciEnum, StatutEnum } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { describe, expect, onTestFinished } from 'vitest';
import {
  actionsFixture,
  effetsAttendusFixture,
  financeursFixture,
  indicateursFixture,
  sousThematiquesFixture,
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
import { UpdateFicheInput } from './update-fiche.input';

const ficheId = 9999;

describe('UpdateFicheService', () => {
  let db: DatabaseService;
  let app: INestApplication;
  let fichesRouter: FichesRouter;
  let testUser: AuthenticatedUser;
  let userWithNoRights: AuthenticatedUser;
  let collectiviteId: number;

  // IDs des entités créées sur la collectivité isolée
  let axeId1: number;
  let axeId2: number;
  let personneTagId1: number;
  let personneTagId2: number;
  let structureTagId1: number;
  let structureTagId2: number;
  let partenaireTagId1: number;
  let partenaireTagId2: number;
  let serviceTagId1: number;
  let serviceTagId2: number;
  let financeurTagId1: number;
  let financeurTagId2: number;
  let libreTagId1: number;
  let libreTagId2: number;
  let linkedFicheId: number;

  beforeAll(async () => {
    app = await getTestApp();
    fichesRouter = app.get(FichesRouter);
    db = await getTestDatabase(app);

    // Collectivité isolée
    const { collectivite } = await addTestCollectivite(db);
    collectiviteId = collectivite.id;

    const testUserResult = await addTestUser(db);
    testUser = getAuthUserFromUserCredentials(testUserResult.user);
    await setUserCollectiviteRole(db, {
      userId: testUserResult.user.id,
      collectiviteId,
      role: CollectiviteRole.ADMIN,
    });

    const noAccessResult = await addTestUser(db);
    userWithNoRights = getAuthUserFromUserCredentials(noAccessResult.user);

    await insertFixtures(db, ficheId);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Update fiche action fields', () => {
    test('should return 400 when invalid numeric type are provided', async () => {
      const caller = fichesRouter.createCaller({ user: testUser });

      const data: UpdateFicheInput = {
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
      const caller = fichesRouter.createCaller({ user: testUser });

      const data: UpdateFicheInput = { dateDebut: 'not-a-date' };

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
      const caller = fichesRouter.createCaller({ user: testUser });

      const data = {
        ameliorationContinue: 'not-a-boolean',
      };

      await expect(() =>
        caller.update({
          ficheId,
          ficheFields: data as unknown as UpdateFicheInput,
        })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: expect.stringContaining('expected boolean, received string'),
        })
      );
    });

    test('should return 404 when updating a non-existent ficheAction', async () => {
      const caller = fichesRouter.createCaller({ user: testUser });

      const nonExistentFicheActionId = 121212;
      const data: UpdateFicheInput = {
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
      const data: UpdateFicheInput = {
        collectiviteId,
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
      const nullData: UpdateFicheInput = {
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
        majTermine: null,
        tempsDeMiseEnOeuvre: null,
        participationCitoyenne: null,
        participationCitoyenneType: null,
        restreint: null,
      };

      const ficheWithNullData = await updateFiche(nullData);

      expect(ficheWithNullData).toMatchObject(nullData);
    });

    test('should update a sous-fiche (fiche with parentId referencing a parent fiche)', async () => {
      // Crée une fiche parente (parentId = null)
      const [parentFiche] = await db.db
        .insert(ficheActionTable)
        .values({
          titre: 'Fiche parente pour sous-fiche',
          collectiviteId,
        })
        .returning();

      // Crée une sous-fiche (parentId = parentFiche.id)
      const [sousFiche] = await db.db
        .insert(ficheActionTable)
        .values({
          titre: 'Sous-fiche initiale',
          collectiviteId,
          parentId: parentFiche.id,
        })
        .returning();

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, sousFiche.id));
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, parentFiche.id));
      });

      // Vérifie que la sous-fiche a bien un parentId
      expect(sousFiche.parentId).toBe(parentFiche.id);

      // Met à jour la sous-fiche avec différents champs
      const caller = fichesRouter.createCaller({ user: testUser });
      const updateData: UpdateFicheInput = {
        titre: 'Sous-fiche mise à jour',
        description: 'Description de la sous-fiche mise à jour',
        statut: StatutEnum.EN_COURS,
        budgetPrevisionnel: '50000',
      };

      await caller.update({
        ficheId: sousFiche.id,
        ficheFields: updateData,
      });

      // Récupère la fiche mise à jour
      const updatedFiche = await caller.get({
        id: sousFiche.id,
      });

      // Vérifie que les champs ont été mis à jour
      expect(updatedFiche.titre).toBe('Sous-fiche mise à jour');
      expect(updatedFiche.description).toBe(
        'Description de la sous-fiche mise à jour'
      );
      expect(updatedFiche.statut).toBe(StatutEnum.EN_COURS);
      expect(updatedFiche.budgetPrevisionnel).toBe('50000');

      // Vérifie que le parentId est toujours présent et correct
      expect(updatedFiche.parentId).toBe(parentFiche.id);

      // Vérifie que la fiche parente existe toujours et a un parentId null
      const [parentFicheAfterUpdate] = await db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, parentFiche.id));

      expect(parentFicheAfterUpdate.parentId).toBeNull();
    });
  });

  describe('Update relations', () => {
    test('should update the axes relations in the database', async () => {
      const data: UpdateFicheInput = {
        axes: [{ id: axeId1 }, { id: axeId2 }],
      };

      const fiche = await updateFiche(data);

      expect(fiche.axes).toContainEqual(
        expect.objectContaining({ id: axeId1 })
      );
      expect(fiche.axes).toContainEqual(
        expect.objectContaining({ id: axeId2 })
      );
    });

    test('should update the thematiques relations in the database', async () => {
      const data: UpdateFicheInput = {
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
      const data: UpdateFicheInput = {
        sousThematiques: [{ id: 3 }, { id: 4 }],
      };

      const caller = fichesRouter.createCaller({ user: testUser });

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
      const caller = fichesRouter.createCaller({ user: testUser });

      const ficheFields: UpdateFicheInput = {
        partenaires: [{ id: partenaireTagId1 }, { id: partenaireTagId2 }],
      };

      await caller.update({
        ficheId,
        ficheFields,
      });

      const ficheWithPartenaires = await caller.get({
        id: ficheId,
      });

      expect(ficheWithPartenaires.partenaires).toStrictEqual([
        expect.objectContaining({ id: partenaireTagId1 }),
        expect.objectContaining({ id: partenaireTagId2 }),
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
      const data: UpdateFicheInput = {
        structures: [{ id: structureTagId1 }, { id: structureTagId2 }],
      };

      const caller = fichesRouter.createCaller({ user: testUser });

      await caller.update({
        ficheId,
        ficheFields: data,
      });

      const fiche = await caller.get({
        id: ficheId,
      });

      expect(fiche.structures).toContainEqual(
        expect.objectContaining({ id: structureTagId1 })
      );
      expect(fiche.structures).toContainEqual(
        expect.objectContaining({ id: structureTagId2 })
      );
    });

    it('should update the pilotes relations in the database', async () => {
      const data: UpdateFicheInput = {
        pilotes: [{ tagId: personneTagId1 }, { tagId: personneTagId2 }],
      };

      const caller = fichesRouter.createCaller({ user: testUser });

      await caller.update({
        ficheId,
        ficheFields: data,
      });

      const fiche = await caller.get({
        id: ficheId,
      });

      expect(fiche.pilotes).toContainEqual(
        expect.objectContaining({ tagId: personneTagId1 })
      );
      expect(fiche.pilotes).toContainEqual(
        expect.objectContaining({ tagId: personneTagId2 })
      );
    });

    it('should update the financeurs relations in the database', async () => {
      const data: UpdateFicheInput = {
        financeurs: [
          {
            financeurTag: { id: financeurTagId1 },
            montantTtc: 999,
          },
          {
            financeurTag: { id: financeurTagId2 },
            montantTtc: 666,
          },
        ],
      };

      const fiche = await updateFiche(data);

      expect(fiche.financeurs).toContainEqual(
        expect.objectContaining({
          financeurTag: expect.objectContaining({ id: financeurTagId1 }),
          montantTtc: 999,
        })
      );
      expect(fiche.financeurs).toContainEqual(
        expect.objectContaining({
          financeurTag: expect.objectContaining({ id: financeurTagId2 }),
          montantTtc: 666,
        })
      );
    });

    it('should update the actions relations in the database', async () => {
      const data: UpdateFicheInput = {
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
      const data: UpdateFicheInput = {
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
      const data: UpdateFicheInput = {
        services: [{ id: serviceTagId1 }, { id: serviceTagId2 }],
      };

      const fiche = await updateFiche(data);

      expect(fiche.services).toContainEqual(
        expect.objectContaining({
          id: serviceTagId1,
        })
      );
      expect(fiche.services).toContainEqual(
        expect.objectContaining({
          id: serviceTagId2,
        })
      );
    });

    it('should update the fiches liees relations in the database', async () => {
      const data: UpdateFicheInput = {
        fichesLiees: [{ id: linkedFicheId }],
      };

      const fiche = await updateFiche(data);

      expect(fiche.fichesLiees).toContainEqual(
        expect.objectContaining({
          id: linkedFicheId,
        })
      );
    });

    it('should update the resultats attendus relations in the database', async () => {
      const data: UpdateFicheInput = {
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
      const data: UpdateFicheInput = {
        libreTags: [{ id: libreTagId1 }, { id: libreTagId2 }],
      };
      const fiche = await updateFiche(data);

      expect(fiche.libreTags).toContainEqual(
        expect.objectContaining({
          id: libreTagId1,
        })
      );
      expect(fiche.libreTags).toContainEqual(
        expect.objectContaining({
          id: libreTagId2,
        })
      );
    });

    it('should update notes relations in the database', async () => {
      const data: UpdateFicheInput = {
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
      const emptyData: UpdateFicheInput = {
        notes: [],
      };
      const ficheWithEmptyNotes = await updateFiche(emptyData);
      expect(ficheWithEmptyNotes.notes).toBeNull();

      // Test updating with null
      const nullData: UpdateFicheInput = {
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
      const caller = fichesRouter.createCaller({ user: testUser });

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
      const caller = fichesRouter.createCaller({ user: testUser });

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
      const data: UpdateFicheInput = {
        titre: 'Tentative de mise à jour sans droits',
      };

      const caller = fichesRouter.createCaller({ user: null });

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

    test('should not allow update if fiche action is not in user collectivite', async () => {
      // Créer une fiche sur une autre collectivité où l'utilisateur n'a pas accès
      const { collectivite: otherCollectivite } = await addTestCollectivite(db);
      await db.db.insert(ficheActionTable).values({
        ...ficheActionFixture,
        id: 10000,
        collectiviteId: otherCollectivite.id,
      });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, 10000));
      });

      const data: UpdateFicheInput = {
        titre: 'Construire des pistes cyclables',
      };

      const caller = fichesRouter.createCaller({ user: userWithNoRights });

      await expect(() =>
        caller.update({
          ficheId: 10000,
          ficheFields: data,
        })
      ).rejects.toThrowError(/Droits insuffisants/i);
    });

    test('should allow update if fiche action is in user’s collectivite', async () => {
      await db.db
        .insert(ficheActionTable)
        .values({ ...ficheActionFixture, id: 10000, collectiviteId });

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, 10000));
      });

      const data: UpdateFicheInput = {
        titre: 'Titre mis à jour par une utilisatrice autorisée',
      };

      const caller = fichesRouter.createCaller({ user: testUser });

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
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });

      const adminCaller = fichesRouter.createCaller({ user: testUser });

      onTestFinished(async () => {
        await cleanup();
      });

      const limitedEditionUser = getAuthUserFromUserCredentials(user);
      const limitedEditionCaller = fichesRouter.createCaller({
        user: limitedEditionUser,
      });

      // Attempt to update should fail
      await expect(
        limitedEditionCaller.update({
          ficheId: ficheId,
          ficheFields: { titre: 'Tentative de mise à jour sans droits' },
        })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation plans.fiches.update sur la ressource Collectivité ${collectiviteId}`
      );

      // Udpate to add it as pilote
      await adminCaller.update({
        ficheId: ficheId,
        ficheFields: { pilotes: [{ tagId: personneTagId1, userId: user.id }] },
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

    test('Contributeur pilote of a parent fiche can update its sous-action', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectiviteId,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });

      const adminCaller = fichesRouter.createCaller({ user: testUser });

      // Ajoute le contributeur comme pilote de la fiche parente
      await db.db.insert(ficheActionPiloteTable).values({
        ficheId: ficheId,
        userId: user.id,
      });

      // Crée une sous-action rattachée à la fiche parente
      const sousAction = await adminCaller.create({
        fiche: {
          titre: 'Sous-action à modifier',
          collectiviteId,
          parentId: ficheId,
        },
      });
      const sousActionId = sousAction.id;
      expect(sousActionId).toBeDefined();

      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, sousActionId));
        await db.db
          .delete(ficheActionPiloteTable)
          .where(
            and(
              eq(ficheActionPiloteTable.ficheId, ficheId),
              eq(ficheActionPiloteTable.userId, user.id)
            )
          );
        await cleanup();
      });

      const contributeurUser = getAuthUserFromUserCredentials(user);
      const contributeurCaller = fichesRouter.createCaller({
        user: contributeurUser,
      });

      // Le contributeur n'est pas pilote de la sous-action elle-même,
      // mais doit pouvoir la modifier car il pilote la fiche parente.
      await contributeurCaller.update({
        ficheId: sousActionId,
        ficheFields: { titre: 'Sous-action modifiée par pilote parent' },
      });

      const fiche = await contributeurCaller.get({ id: sousActionId });
      expect(fiche.titre).toBe('Sous-action modifiée par pilote parent');
    });
  });

  async function insertFixtures(
    databaseService: DatabaseService,
    ficheId: number
  ) {
    // Créer les entités collectivité-spécifiques
    const [a1] = await databaseService.db
      .insert(axeTable)
      .values([{ nom: 'Plan test', collectiviteId }])
      .returning();
    axeId1 = a1.id;
    const [a2] = await databaseService.db
      .insert(axeTable)
      .values([{ nom: 'Axe test 2', collectiviteId, plan: axeId1 }])
      .returning();
    axeId2 = a2.id;

    const [pt1, pt2] = await databaseService.db
      .insert(personneTagTable)
      .values([
        { nom: 'Pilote Test 1', collectiviteId },
        { nom: 'Pilote Test 2', collectiviteId },
      ])
      .returning();
    personneTagId1 = pt1.id;
    personneTagId2 = pt2.id;

    const [st1, st2] = await databaseService.db
      .insert(structureTagTable)
      .values([
        { nom: 'Structure Test 1', collectiviteId },
        { nom: 'Structure Test 2', collectiviteId },
      ])
      .returning();
    structureTagId1 = st1.id;
    structureTagId2 = st2.id;

    const [pat1, pat2] = await databaseService.db
      .insert(partenaireTagTable)
      .values([
        { nom: 'Partenaire Test 1', collectiviteId },
        { nom: 'Partenaire Test 2', collectiviteId },
      ])
      .returning();
    partenaireTagId1 = pat1.id;
    partenaireTagId2 = pat2.id;

    const [svc1, svc2] = await databaseService.db
      .insert(serviceTagTable)
      .values([
        { nom: 'Service Test 1', collectiviteId },
        { nom: 'Service Test 2', collectiviteId },
      ])
      .returning();
    serviceTagId1 = svc1.id;
    serviceTagId2 = svc2.id;

    const [ft1, ft2] = await databaseService.db
      .insert(financeurTagTable)
      .values([
        { nom: 'Financeur Test 1', collectiviteId },
        { nom: 'Financeur Test 2', collectiviteId },
      ])
      .returning();
    financeurTagId1 = ft1.id;
    financeurTagId2 = ft2.id;

    const [lt1, lt2] = await databaseService.db
      .insert(libreTagTable)
      .values([
        { nom: 'Libre Tag 1', collectiviteId },
        { nom: 'Libre Tag 2', collectiviteId },
      ])
      .returning();
    libreTagId1 = lt1.id;
    libreTagId2 = lt2.id;

    const [lf] = await databaseService.db
      .insert(ficheActionTable)
      .values({ titre: 'Fiche liée test', collectiviteId, restreint: false })
      .returning();
    linkedFicheId = lf.id;

    // Insérer la fiche de test principale
    await databaseService.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheId));

    await databaseService.db
      .insert(ficheActionTable)
      .values({ ...ficheActionFixture, collectiviteId });

    // Insérer les relations de la fiche
    await databaseService.db.insert(ficheActionAxeTable).values({
      ficheId,
      axeId: axeId1,
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
      partenaireTagId: partenaireTagId1,
    });

    await databaseService.db.insert(ficheActionStructureTagTable).values({
      ficheId,
      structureTagId: structureTagId1,
    });

    await databaseService.db.insert(ficheActionPiloteTable).values({
      ficheId,
      tagId: personneTagId1,
    });

    await databaseService.db.insert(ficheActionReferentTable).values({
      ficheId,
      tagId: personneTagId2,
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
      serviceTagId: serviceTagId1,
    });

    await databaseService.db.insert(ficheActionFinanceurTagTable).values({
      ficheId,
      financeurTagId: financeurTagId1,
      montantTtc: financeursFixture.montantTtc,
    });

    await databaseService.db.insert(ficheActionLienTable).values({
      ficheUne: ficheId,
      ficheDeux: linkedFicheId,
    });

    await databaseService.db.insert(ficheActionEffetAttenduTable).values({
      ficheId,
      effetAttenduId: effetsAttendusFixture.id,
    });

    await databaseService.db.insert(ficheActionLibreTagTable).values({
      ficheId,
      libreTagId: libreTagId1,
    });
  }

  test('should reject linking instance gouvernance from a different collectivite', async () => {
    const { collectivite: otherCollectivite } = await addTestCollectivite(db);
    const otherCollectiviteId = otherCollectivite.id;

    const [tag] = await db.db
      .insert(instanceGouvernanceTagTable)
      .values({
        nom: 'Instance autre collectivité',
        collectiviteId: otherCollectiviteId,
        createdBy: testUser.id,
        createdAt: new Date().toISOString(),
      })
      .returning();

    const caller = fichesRouter.createCaller({ user: testUser });

    await expect(
      caller.update({
        ficheId,
        ficheFields: {
          instanceGouvernance: [{ id: tag.id }],
        },
      })
    ).rejects.toThrow(
      "L'instance de gouvernance n'appartient pas à la même collectivité que la fiche"
    );

    await db.db
      .delete(instanceGouvernanceTagTable)
      .where(eq(instanceGouvernanceTagTable.id, tag.id));
  });

  test('should reject linking non-existent instance gouvernance tag', async () => {
    const nonExistentTagId = 999999;
    const caller = fichesRouter.createCaller({ user: testUser });

    await expect(
      caller.update({
        ficheId,
        ficheFields: {
          instanceGouvernance: [{ id: nonExistentTagId }],
        },
      })
    ).rejects.toThrow(
      "Une ou plusieurs instances de gouvernance n'existent pas"
    );
  });

  test('should rollback all changes when instance gouvernance validation fails', async () => {
    const { collectivite: otherCollectivite } = await addTestCollectivite(db);
    const otherCollectiviteId = otherCollectivite.id;
    const originalTitre = 'Titre avant rollback';

    const caller = fichesRouter.createCaller({ user: testUser });

    await caller.update({
      ficheId,
      ficheFields: { titre: originalTitre },
    });

    const [tag] = await db.db
      .insert(instanceGouvernanceTagTable)
      .values({
        nom: 'Instance rollback test',
        collectiviteId: otherCollectiviteId,
        createdBy: testUser.id,
        createdAt: new Date().toISOString(),
      })
      .returning();

    await expect(
      caller.update({
        ficheId,
        ficheFields: {
          titre: 'Titre qui ne devrait pas être sauvegardé',
          instanceGouvernance: [{ id: tag.id }],
        },
      })
    ).rejects.toThrow(
      "L'instance de gouvernance n'appartient pas à la même collectivité que la fiche"
    );

    const fiche = await caller.get({ id: ficheId });
    expect(fiche.titre).toBe(originalTitre);

    await db.db
      .delete(instanceGouvernanceTagTable)
      .where(eq(instanceGouvernanceTagTable.id, tag.id));
  });

  async function updateFiche(data: UpdateFicheInput) {
    const caller = fichesRouter.createCaller({ user: testUser });

    await caller.update({
      ficheId,
      ficheFields: data,
    });

    const fiche = await caller.get({
      id: ficheId,
    });

    return fiche;
  }

  const _cleanupLibreTags = async () => {
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
