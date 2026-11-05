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
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import { describe, expect, onTestFinished, test } from 'vitest';
import { createIndicateurPerso } from '../indicateur-perso.test-fixture';
import { indicateurDefinitionTable } from '../../indicateur/indicateur-definition.table';

describe('DeleteIndicateurRouter', () => {
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

  test('should delete perso indicator successfully', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const indicateurId = await caller.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
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
    expect(createdIndicateur.collectiviteId).toBe(collectivite.id);

    // Delete the indicator
    await caller.indicateurs.indicateurs.delete({
      indicateurId,
      collectiviteId: collectivite.id,
    });

    // Verify the indicator is deleted
    const deletedIndicateur = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    expect(deletedIndicateur).toHaveLength(0);
  });

  describe('suppression d’un parent', () => {
    const createParentWithTwoChildren = async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const parentId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Déchets ménagers',
        unite: 't',
      });
      const firstChildId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Ordures ménagères',
        parentId,
      });
      const secondChildId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Tri sélectif',
        parentId,
      });
      return { caller, parentId, firstChildId, secondChildId };
    };

    test('liste les sous-indicateurs qui redeviennent autonomes', async () => {
      const { caller, parentId, firstChildId, secondChildId } =
        await createParentWithTwoChildren();

      const sousIndicateurIds =
        await caller.indicateurs.indicateurs.listSousIndicateursBecomingAutonomous(
          { indicateurId: parentId, collectiviteId: collectivite.id }
        );

      expect([...sousIndicateurIds].sort()).toEqual(
        [firstChildId, secondChildId].sort()
      );
    });

    test('renvoie une liste vide pour un indicateur sans enfant', async () => {
      const { caller, firstChildId } = await createParentWithTwoChildren();

      await expect(
        caller.indicateurs.indicateurs.listSousIndicateursBecomingAutonomous({
          indicateurId: firstChildId,
          collectiviteId: collectivite.id,
        })
      ).resolves.toEqual([]);
    });

    test('conserve les enfants quand le parent est supprimé', async () => {
      const { caller, parentId, firstChildId, secondChildId } =
        await createParentWithTwoChildren();

      await caller.indicateurs.indicateurs.delete({
        indicateurId: parentId,
        collectiviteId: collectivite.id,
      });

      const remaining = await databaseService.db
        .select({ id: indicateurDefinitionTable.id })
        .from(indicateurDefinitionTable)
        .where(
          inArray(indicateurDefinitionTable.id, [
            parentId,
            firstChildId,
            secondChildId,
          ])
        );
      expect(remaining.map(({ id }) => id).sort()).toEqual(
        [firstChildId, secondChildId].sort()
      );
    });

    test('refuse la lecture sans le droit de supprimer', async () => {
      const { parentId } = await createParentWithTwoChildren();
      const other = await addTestCollectiviteAndUser(databaseService, {
        user: { role: CollectiviteRole.ADMIN },
      });
      onTestFinished(other.cleanup);
      const otherCaller = router.createCaller({
        user: getAuthUserFromUserCredentials(other.user),
      });

      await expect(
        otherCaller.indicateurs.indicateurs.listSousIndicateursBecomingAutonomous(
          { indicateurId: parentId, collectiviteId: collectivite.id }
        )
      ).rejects.toThrow(/permissions nécessaires/);
    });
  });

  test('should throw error when trying to delete non-existent indicator', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.indicateurs.delete({
        indicateurId: 99999,
        collectiviteId: collectivite.id,
      })
    ).rejects.toThrow();
  });

  test('should throw error when user lacks permission', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test Personal Indicator for Permission Test',
        unite: 'kg',
      },
    });

    // Try to delete with unauthorized collectivite
    await expect(
      caller.indicateurs.indicateurs.delete({
        indicateurId,
        collectiviteId: 999,
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

    const caller = router.createCaller({ user: authenticatedUser });

    // Try to delete a non-perso indicator
    await expect(
      caller.indicateurs.indicateurs.delete({
        indicateurId: indicateurPredefini.id,
        collectiviteId: collectivite.id,
      })
    ).rejects.toThrow();

    // Verify the non-perso indicator still exists
    const stillExists = await getIndicateurPredefini('cae_2.a');
    expect(stillExists).toBeDefined();
  });

  test('should not delete indicator from different collectivite', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test Personal Indicator for Cross-Collectivite Test',
        unite: 'kg',
      },
    });

    // Try to delete with different collectivite ID
    await expect(
      caller.indicateurs.indicateurs.delete({
        indicateurId,
        collectiviteId: 999,
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
