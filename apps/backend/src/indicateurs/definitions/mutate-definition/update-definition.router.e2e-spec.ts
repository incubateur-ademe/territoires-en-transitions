import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { IndicateurDefinition } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, isNull } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createIndicateurPerso } from '../definitions.test-fixture';
import { indicateurDefinitionTable } from '../indicateur-definition.table';
import { UpdateIndicateurDefinitionInput } from './mutate-definition.input';

describe('UpdateIndicateurDefinitionRouter', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let collectivite: Collectivite;
  let collectiviteCleanup: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteCleanup = testResult.cleanup;
    collectivite = testResult.collectivite;
    authenticatedUser = getAuthUserFromUserCredentials(testResult.user);
  });

  afterAll(async () => {
    await collectiviteCleanup?.();
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
