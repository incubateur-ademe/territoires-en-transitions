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
import { and, eq, isNull } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createIndicateurPerso } from '../definitions.test-fixture';
import { indicateurCollectiviteTable } from '../indicateur-collectivite.table';
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
  });

  describe('applicabilité', () => {
    const listIndicateur = async (
      caller: ReturnType<typeof router.createCaller>,
      indicateurId: number
    ) => {
      const {
        data: [indicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: { indicateurIds: [indicateurId] },
      });
      return indicateur;
    };

    test('un indicateur sans ligne indicateur_collectivite est applicable', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      // Un prédéfini que la collectivité n'a jamais touché : c'est le seul cas
      // où le LEFT JOIN rend `null`, celui que rattrape le `coalesce`.
      // `createIndicateurPerso` poserait une ligne et masquerait ce chemin.
      const [indicateurJamaisTouche] = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(
          and(
            eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.c'),
            isNull(indicateurDefinitionTable.collectiviteId)
          )
        )
        .limit(1);
      expect(indicateurJamaisTouche).toBeDefined();

      const lignes = await databaseService.db
        .select()
        .from(indicateurCollectiviteTable)
        .where(
          and(
            eq(
              indicateurCollectiviteTable.indicateurId,
              indicateurJamaisTouche.id
            ),
            eq(indicateurCollectiviteTable.collectiviteId, collectivite.id)
          )
        );
      expect(lignes).toHaveLength(0);

      expect(
        (await listIndicateur(caller, indicateurJamaisTouche.id)).isApplicable
      ).toBe(true);
    });

    test('se déclare non applicable, puis redevient applicable', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Bascule applicabilité',
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { isApplicable: false },
      });

      expect((await listIndicateur(caller, indicateurId)).isApplicable).toBe(
        false
      );

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { isApplicable: true },
      });

      expect((await listIndicateur(caller, indicateurId)).isApplicable).toBe(
        true
      );
    });

    test('une mise à jour qui ne parle pas d’applicabilité ne la touche pas', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Applicabilité préservée',
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { isApplicable: false },
      });

      // `estFavori` seul : le champ absent du payload ne doit pas être remis à
      // sa valeur par défaut par l'upsert.
      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { estFavori: true },
      });

      const indicateur = await listIndicateur(caller, indicateurId);
      expect(indicateur.isApplicable).toBe(false);
      expect(indicateur.estFavori).toBe(true);
    });

    test('le filtre isApplicable sépare les deux populations', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const nonApplicableId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Filtre — non applicable',
        },
      });
      const applicableId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Filtre — applicable',
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId: nonApplicableId,
        collectiviteId: collectivite.id,
        indicateurFields: { isApplicable: false },
      });

      // La création insère toujours une ligne `indicateur_collectivite` : on la
      // supprime pour retrouver le cas — majoritaire en base — d'un indicateur
      // sans ligne du tout, que le filtre doit compter comme applicable.
      await databaseService.db
        .delete(indicateurCollectiviteTable)
        .where(
          and(
            eq(indicateurCollectiviteTable.indicateurId, applicableId),
            eq(indicateurCollectiviteTable.collectiviteId, collectivite.id)
          )
        );

      // Restreint aux deux indicateurs du test : la liste est paginée, et la
      // collectivité en porte bien plus que ça.
      const indicateurIds = [nonApplicableId, applicableId];

      const { data: nonApplicables } =
        await caller.indicateurs.indicateurs.list({
          collectiviteId: collectivite.id,
          filters: { indicateurIds, isApplicable: false },
        });
      expect(nonApplicables.map(({ id }) => id)).toEqual([nonApplicableId]);

      // `applicableId` n'a plus de ligne `indicateur_collectivite` : `NULL =
      // true` l'exclurait à tort, le filtre doit quand même le remonter.
      const { data: applicables } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: { indicateurIds, isApplicable: true },
      });
      expect(applicables.map(({ id }) => id)).toEqual([applicableId]);
    });
  });

  describe('indicateur prédéfini', () => {
    let indicateurPredefiniCae1a: typeof indicateurDefinitionTable.$inferSelect;

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
