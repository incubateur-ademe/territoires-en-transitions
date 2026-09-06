import { INestApplication } from '@nestjs/common';
import {
  createPersonneTag,
  createServiceTag,
} from '@tet/backend/collectivites/collectivites.test-fixture';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createFiche } from '@tet/backend/plans/fiches/fiches.test-fixture';
import { createThematique } from '@tet/backend/shared/shared.test-fixture';
import { Collectivite } from '@tet/domain/collectivites';
import { IndicateurDefinition } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, isNull } from 'drizzle-orm';
import { describe, expect, onTestFinished, test } from 'vitest';
import { createIndicateurPerso } from '../definitions.test-fixture';
import { indicateurDefinitionTable } from '../indicateur-definition.table';
import { UpdateIndicateurDefinitionInput } from './mutate-definition.input';

describe('UpdateIndicateurDefinitionRouter', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    authenticatedUser = getAuthUserFromUserCredentials(testResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('indicateur perso', () => {
    test('should update basic fields for perso indicator', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Personal Indicator',
        },
      });

      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          commentaire: 'Updated commentaire for test indicator',
          estFavori: true,
          estConfidentiel: true,
        },
      };

      await caller.indicateurs.indicateurs.update(updateData);

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.id).toBe(indicateurId);
      expect(updatedIndicateur.commentaire).toBe(
        updateData.indicateurFields.commentaire
      );
      expect(updatedIndicateur.estFavori).toBe(
        updateData.indicateurFields.estFavori
      );
      expect(updatedIndicateur.estConfidentiel).toBe(
        updateData.indicateurFields.estConfidentiel
      );
      expect(updatedIndicateur.modifiedBy).toEqual(
        expect.objectContaining({ id: authenticatedUser.id })
      );
      expect(updatedIndicateur.modifiedAt).toBeDefined();
    });

    test('should update titre and unite for perso indicator', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Personal Indicator',
        },
      });

      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          titre: 'Updated Test Indicateur Title',
          unite: 'kg CO2',
        },
      };

      await caller.indicateurs.indicateurs.update(updateData);

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.id).toBe(indicateurId);
      expect(updatedIndicateur.titre).toBe(updateData.indicateurFields.titre);
      expect(updatedIndicateur.unite).toBe(updateData.indicateurFields.unite);

      // Verify the update in the database
      const dbIndicateur = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId))
        .limit(1);

      expect(dbIndicateur).toHaveLength(1);
      expect(dbIndicateur[0].titre).toBe(updateData.indicateurFields.titre);
      expect(dbIndicateur[0].unite).toBe(updateData.indicateurFields.unite);
    });

    test('should update periodicite before the first value', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Personal Indicator Periodicite',
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { periodicite: 'mensuelle' },
      });

      const [definition] = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));
      expect(definition?.periodicite).toBe('mensuelle');
    });

    test('should atomically update periodicite, fiches and thematiques', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Atomic Personal Indicator Update',
        },
      });
      const ficheId = await createFiche({
        caller,
        ficheInput: {
          collectiviteId: collectivite.id,
          titre: 'Fiche linked in atomic update',
        },
      });
      const thematique = await createThematique({
        database: databaseService,
        thematiqueData: { nom: 'Thématique linked in atomic update' },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          periodicite: 'mensuelle',
          ficheIds: [ficheId],
          thematiques: [{ id: thematique.id }],
        },
      });

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: { indicateurIds: [indicateurId] },
      });
      const linkedFiches = await caller.plans.fiches.listFiches({
        collectiviteId: collectivite.id,
        filters: { indicateurIds: [indicateurId] },
      });

      expect(updatedIndicateur?.periodicite).toBe('mensuelle');
      expect(updatedIndicateur?.thematiques).toContainEqual(
        expect.objectContaining({ id: thematique.id })
      );
      expect(linkedFiches.data).toContainEqual(
        expect.objectContaining({ id: ficheId })
      );
    });

    test('should reject a restricted API key before the pilot fallback while allowing the human pilot', async () => {
      const adminCaller = router.createCaller({ user: authenticatedUser });
      const { user, cleanup } = await addTestUser(databaseService, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });
      onTestFinished(cleanup);
      // Register the indicator cleanup after the user cleanup. Vitest runs
      // onTestFinished callbacks in reverse order, so the foreign keys to the
      // pilot user and modifiedBy are removed before deleting that user.
      const indicateurId = await createIndicateurPerso({
        caller: adminCaller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Restricted API Key Definition Update',
        },
      });

      const pilotUser = getAuthUserFromUserCredentials(user);
      await adminCaller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { pilotes: [{ userId: pilotUser.id }] },
      });

      const restrictedApiKeyCaller = router.createCaller({
        user: {
          ...pilotUser,
          jwtPayload: {
            ...pilotUser.jwtPayload,
            client_id: 'test-read-only-api-key',
            permissions: ['indicateurs.indicateurs.read'],
          },
        },
      });

      await expect(
        restrictedApiKeyCaller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { periodicite: 'mensuelle' },
        })
      ).rejects.toThrow(/clé d'api.*indicateurs\.indicateurs\.update/i);

      const [definitionAfterRejectedUpdate] = await databaseService.db
        .select({ periodicite: indicateurDefinitionTable.periodicite })
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));
      expect(definitionAfterRejectedUpdate?.periodicite).toBe('annuelle');

      const humanPilotCaller = router.createCaller({ user: pilotUser });
      await humanPilotCaller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { periodicite: 'mensuelle' },
      });

      const [definitionAfterHumanUpdate] = await databaseService.db
        .select({ periodicite: indicateurDefinitionTable.periodicite })
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));
      expect(definitionAfterHumanUpdate?.periodicite).toBe('mensuelle');
    });

    test('should reject a periodicite change after the first value', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Immutable Personal Indicator Periodicite',
        },
      });

      await caller.indicateurs.valeurs.upsert({
        collectiviteId: collectivite.id,
        indicateurId,
        dateValeur: '2026-01-01',
        resultat: 1,
      });

      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { periodicite: 'mensuelle' },
        })
      ).rejects.toThrow(/ne peut plus être modifiée après la première saisie/i);
    });

    test('should update multiple fields at once for perso indicator', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'hophophop',
        },
      });

      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          titre: 'Multi-field Updated Title',
          unite: 'tonnes',
          commentaire: 'Updated description with multiple fields',
          estFavori: true,
          estConfidentiel: true,
        },
      };

      await caller.indicateurs.indicateurs.update(updateData);

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.id).toBe(indicateurId);
      expect(updatedIndicateur.titre).toBe(updateData.indicateurFields.titre);
      expect(updatedIndicateur.unite).toBe(updateData.indicateurFields.unite);
      expect(updatedIndicateur.commentaire).toBe(
        updateData.indicateurFields.commentaire
      );
      expect(updatedIndicateur.estFavori).toBe(
        updateData.indicateurFields.estFavori
      );
      expect(updatedIndicateur.estConfidentiel).toBe(
        updateData.indicateurFields.estConfidentiel
      );
    });

    test('should preserve estFavori and estConfidentiel when updating unrelated fields', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Preserve Favori On Partial Update',
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          estFavori: true,
          estConfidentiel: true,
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          pilotes: [{ userId: authenticatedUser.id }],
        },
      });

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.estFavori).toBe(true);
      expect(updatedIndicateur.estConfidentiel).toBe(true);
    });

    test('should reset estFavori and estConfidentiel when explicitly set to false', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Reset Favori On Explicit False',
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          estFavori: true,
          estConfidentiel: true,
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          estFavori: false,
          estConfidentiel: false,
        },
      });

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.estFavori).toBe(false);
      expect(updatedIndicateur.estConfidentiel).toBe(false);
    });

    test('should throw error when updating non-existent indicator', async () => {
      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId: 99999,
        collectiviteId: collectivite.id,
        indicateurFields: {
          titre: 'This should fail',
        },
      };

      const caller = router.createCaller({ user: authenticatedUser });

      await expect(
        caller.indicateurs.indicateurs.update(updateData)
      ).rejects.toThrow();
    });

    test('should throw error when user lacks permission', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'hophophop',
        },
      });

      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId,
        collectiviteId: 999,
        indicateurFields: {
          titre: 'Unauthorized update',
        },
      };

      await expect(
        caller.indicateurs.indicateurs.update(updateData)
      ).rejects.toThrow();
    });

    test('should hide and reject an indicator owned by another collectivite', async () => {
      const other = await addTestCollectiviteAndUser(databaseService, {
        user: { role: CollectiviteRole.ADMIN },
      });
      onTestFinished(other.cleanup);
      const otherCaller = router.createCaller({
        user: getAuthUserFromUserCredentials(other.user),
      });
      const foreignIndicateurId = await createIndicateurPerso({
        caller: otherCaller,
        indicateurData: {
          collectiviteId: other.collectivite.id,
          titre: 'Foreign personal indicator',
        },
      });

      const caller = router.createCaller({ user: authenticatedUser });
      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId: foreignIndicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { commentaire: 'Cross-tenant update' },
        })
      ).rejects.toThrow(/non trouvé pour la collectivité/i);

      const [definition] = await databaseService.db
        .select({ titre: indicateurDefinitionTable.titre })
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, foreignIndicateurId));
      expect(definition?.titre).toBe('Foreign personal indicator');
    });

    test('should reject fiche, service and pilote resources owned by another collectivite', async () => {
      const other = await addTestCollectiviteAndUser(databaseService, {
        user: { role: CollectiviteRole.ADMIN },
      });
      onTestFinished(other.cleanup);
      const otherUser = getAuthUserFromUserCredentials(other.user);
      const otherCaller = router.createCaller({ user: otherUser });
      const foreignFicheId = await createFiche({
        caller: otherCaller,
        ficheInput: {
          collectiviteId: other.collectivite.id,
          titre: 'Foreign fiche for indicator update',
        },
      });
      const foreignService = await createServiceTag({
        database: databaseService,
        tagData: {
          collectiviteId: other.collectivite.id,
          nom: 'Foreign service for indicator update',
        },
      });
      const foreignPersonne = await createPersonneTag({
        database: databaseService,
        tagData: {
          collectiviteId: other.collectivite.id,
          nom: 'Foreign personne for indicator update',
        },
      });
      const caller = router.createCaller({ user: authenticatedUser });
      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Indicator protected from foreign relations',
        },
      });

      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { ficheIds: [foreignFicheId] },
        })
      ).rejects.toThrow(/fiches doivent appartenir/i);
      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { services: [{ id: foreignService.id }] },
        })
      ).rejects.toThrow(/services doivent appartenir/i);
      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { pilotes: [{ tagId: foreignPersonne.id }] },
        })
      ).rejects.toThrow(/pilotes doivent appartenir/i);
      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { pilotes: [{ userId: otherUser.id }] },
        })
      ).rejects.toThrow(/pilotes doivent appartenir/i);
    });
  });

  describe('indicateur prédéfini', () => {
    let indicateurPredefiniCae1a: IndicateurDefinition;

    beforeAll(async () => {
      const [indicateurPredefini] = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(
          and(
            eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.a'),
            isNull(indicateurDefinitionTable.collectiviteId)
          )
        )
        .limit(1);

      expect(indicateurPredefini).toBeDefined();

      indicateurPredefiniCae1a = indicateurPredefini;
    });

    test('should update fields', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = indicateurPredefiniCae1a.id;

      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          commentaire: 'Updated commentaire for test indicator',
          estFavori: true,
          estConfidentiel: true,
        },
      };

      await caller.indicateurs.indicateurs.update(updateData);

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.id).toBe(indicateurId);
      expect(updatedIndicateur.commentaire).toBe(
        updateData.indicateurFields.commentaire
      );
      expect(updatedIndicateur.estFavori).toBe(
        updateData.indicateurFields.estFavori
      );
      expect(updatedIndicateur.estConfidentiel).toBe(
        updateData.indicateurFields.estConfidentiel
      );
      expect(updatedIndicateur.modifiedBy).toEqual(
        expect.objectContaining({ id: authenticatedUser.id })
      );
      expect(updatedIndicateur.modifiedAt).toBeDefined();
    });

    test('should not allow updating titre and unite for non-perso indicators', async () => {
      const [indicateurPredefini] = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(
          and(
            eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.a'),
            isNull(indicateurDefinitionTable.collectiviteId)
          )
        )
        .limit(1);

      expect(indicateurPredefini).toBeDefined();

      // Try to update titre and unite for non-perso indicator
      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId: indicateurPredefini.id,
        collectiviteId: collectivite.id,
        indicateurFields: {
          titre: 'This should fail',
          unite: 'This should fail too',
        },
      };

      const caller = router.createCaller({ user: authenticatedUser });

      await expect(
        caller.indicateurs.indicateurs.update(updateData)
      ).rejects.toThrow();
    });
  });
});
