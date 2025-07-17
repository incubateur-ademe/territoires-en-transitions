import { libreTagTable } from '@/backend/collectivites/index-domain';
import { FichesRouter } from '@/backend/plans/fiches/fiches.router';
import {
    getAuthUser,
    getTestApp,
    getTestDatabase,
    YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
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
import {
    ciblesEnumSchema,
    ficheActionTable,
    piliersEciEnumType,
    statutsEnumSchema,
} from '../shared/models/fiche-action.table';
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
          message: expect.stringContaining('Expected boolean, received string'),
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
          message: `Fiche action non trouvée pour l'id 121212`,
        })
      );
    });

    test('should update fiche action fields', async () => {
      const data: UpdateFicheRequest = {
        collectiviteId: 1,
        titre: 'Construire des pistes cyclables',
        description:
          'Un objectif à long terme sera de construire de nombreuses pistes cyclables dans le centre-ville.',
        dateDebut: '2024-11-14 00:00:00+00',
        dateFin: '2025-09-10 00:00:00+00',
        instanceGouvernance: null,
        priorite: 'Bas',
        piliersEci: [
          piliersEciEnumType.APPROVISIONNEMENT_DURABLE,
          piliersEciEnumType.ECOCONCEPTION,
        ],
        objectifs:
          'Diminution de 15% de la consommation de feuilles de papier / Indicateurs : Nombre de papiers',
        cibles: [
          ciblesEnumSchema.enum['Grand public'],
          ciblesEnumSchema.enum['Associations'],
        ],
        ressources: 'Service numérique',
        financements: 'De 40 000€ à 100 000€',
        budgetPrevisionnel: '35000',
        statut: statutsEnumSchema.enum['En pause'],
        ameliorationContinue: false,
        calendrier: 'Calendrier prévisionnel',
        notesComplementaires: 'Vive le vélo !',
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
        notesComplementaires: null,
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

      const ficheFields = {
        partenaires: [{ id: 1 }, { id: 2 }],
      } satisfies UpdateFicheRequest;

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
        ficheFields.partenaires.length
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
