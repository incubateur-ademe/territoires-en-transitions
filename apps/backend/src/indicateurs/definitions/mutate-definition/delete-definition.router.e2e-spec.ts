import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createIndicateurPerso } from '../definitions.test-fixture';
import { indicateurDefinitionTable } from '../indicateur-definition.table';

const collectiviteId = 2;

describe('DeleteIndicateurDefinitionRouter', () => {
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let yoloDodo: AuthenticatedUser;

  beforeAll(async () => {
    const app = await getTestApp();
    router = app.get(TrpcRouter);

    databaseService = await getTestDatabase(app);
    yoloDodo = await getAuthUser(YOLO_DODO);

    return async () => {
      await app.close();
    };
  });

  test('should delete perso indicator successfully', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const indicateurId = await caller.indicateurs.definitions.create({
      collectiviteId,
      titre: 'Test Personal Indicator to Delete',
      unite: 'kg',
    });

    // Verify the indicator exists
    const [createdIndicateur] = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    expect(createdIndicateur).toBeDefined();
    expect(createdIndicateur.collectiviteId).toBe(collectiviteId);

    // Delete the indicator
    await caller.indicateurs.definitions.delete({
      indicateurId,
      collectiviteId,
    });

    // Verify the indicator is deleted
    const deletedIndicateur = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    expect(deletedIndicateur).toHaveLength(0);
  });

  test('should throw error when trying to delete non-existent indicator', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    await expect(
      caller.indicateurs.definitions.delete({
        indicateurId: 99999, // Non-existent ID
        collectiviteId,
      })
    ).rejects.toThrow();
  });

  test('should throw error when user lacks permission', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'Test Personal Indicator for Permission Test',
        unite: 'kg',
      },
    });

    // Try to delete with unauthorized collectivite
    await expect(
      caller.indicateurs.definitions.delete({
        indicateurId,
        collectiviteId: 999, // Non-existent or unauthorized collectivite
      })
    ).rejects.toThrow();
  });

  test('should not delete non-perso indicators', async () => {
    const getIndicateurPredefini = async (identifiantReferentiel: string) => {
      const [indicateurPredefini] = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(
          eq(
            indicateurDefinitionTable.identifiantReferentiel,
            identifiantReferentiel
          )
        )
        .limit(1);

      return indicateurPredefini;
    };

    const indicateurPredefini = await getIndicateurPredefini('cae_2.a');
    expect(indicateurPredefini).toBeDefined();

    const caller = router.createCaller({ user: yoloDodo });

    // Try to delete a non-perso indicator
    await expect(
      caller.indicateurs.definitions.delete({
        indicateurId: indicateurPredefini.id,
        collectiviteId,
      })
    ).rejects.toThrow();

    // Verify the non-perso indicator still exists
    const stillExists = await getIndicateurPredefini('cae_2.a');
    expect(stillExists).toBeDefined();
  });

  test('should not delete indicator from different collectivite', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'Test Personal Indicator for Cross-Collectivite Test',
        unite: 'kg',
      },
    });

    // Try to delete with different collectivite ID
    await expect(
      caller.indicateurs.definitions.delete({
        indicateurId,
        collectiviteId: 999, // Different collectivite
      })
    ).rejects.toThrow();

    // Verify the indicator still exists
    const stillExists = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    expect(stillExists).toHaveLength(1);
  });
});
