import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
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
import { describe, expect } from 'vitest';
import z from 'zod';
import { indicateurThematiqueTable } from '../../shared/models/indicateur-thematique.table';
import { indicateurCollectiviteTable } from '../indicateur-collectivite.table';
import { indicateurDefinitionTable } from '../indicateur-definition.table';
import { createIndicateurDefinitionInputSchema } from './mutate-definition.input';

// On prend le typage en entrée, avant parsing zod du router trpc
type CreateIndicateurDefinitionInput = z.input<
  typeof createIndicateurDefinitionInputSchema
>;

const collectiviteId = 2;
const testIndicateurId = 9998;

describe('createIndicateurPerso', () => {
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let yoloDodo: AuthenticatedUser;

  const cleanDatabase = async () => {
    await databaseService.db
      .delete(indicateurCollectiviteTable)
      .where(eq(indicateurCollectiviteTable.indicateurId, testIndicateurId));

    await databaseService.db
      .delete(indicateurThematiqueTable)
      .where(eq(indicateurThematiqueTable.indicateurId, testIndicateurId));

    await databaseService.db
      .delete(ficheActionIndicateurTable)
      .where(eq(ficheActionIndicateurTable.indicateurId, testIndicateurId));

    await databaseService.db
      .delete(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, testIndicateurId));
  };

  beforeAll(async () => {
    const app = await getTestApp();
    router = app.get(TrpcRouter);

    databaseService = await getTestDatabase(app);
    yoloDodo = await getAuthUser(YOLO_DODO);

    // Clean up any existing test data
    await cleanDatabase();

    return async () => {
      await cleanDatabase();
      await app.close();
    };
  });

  test('should create a personal indicator with all fields', async () => {
    const data = {
      collectiviteId,
      titre: 'Test Personal Indicator',
      unite: 'kg',
      thematiques: [{ id: 1 }, { id: 2 }], // Assuming these thematic IDs exist
      commentaire: 'Test comment for personal indicator',
      estFavori: true,
      ficheId: 1, // Assuming this fiche ID exists
    } satisfies CreateIndicateurDefinitionInput;

    const caller = router.createCaller({ user: yoloDodo });
    const indicateurId = await caller.indicateurs.definitions.create(data);

    expect(indicateurId).toBeDefined();
    expect(typeof indicateurId).toBe('number');

    // Verify the indicator was created in the database
    const createdIndicateur = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    expect(createdIndicateur).toHaveLength(1);
    expect(createdIndicateur[0].titre).toBe(data.titre);
    expect(createdIndicateur[0].unite).toBe(data.unite);
    expect(createdIndicateur[0].collectiviteId).toBe(data.collectiviteId);

    // Verify the collectivite-specific data was created
    const collectiviteData = await databaseService.db
      .select()
      .from(indicateurCollectiviteTable)
      .where(eq(indicateurCollectiviteTable.indicateurId, indicateurId))
      .limit(1);

    expect(collectiviteData).toHaveLength(1);
    expect(collectiviteData[0].commentaire).toBe(data.commentaire);
    expect(collectiviteData[0].favoris).toBe(data.estFavori);

    // Verify thematic associations were created
    const thematiqueData = await databaseService.db
      .select()
      .from(indicateurThematiqueTable)
      .where(eq(indicateurThematiqueTable.indicateurId, indicateurId));

    expect(thematiqueData).toHaveLength(data.thematiques.length);
    expect(thematiqueData.map((t) => t.thematiqueId)).toEqual(
      expect.arrayContaining(data.thematiques.map((t) => t.id))
    );

    // Verify fiche association was created
    const ficheData = await databaseService.db
      .select()
      .from(ficheActionIndicateurTable)
      .where(eq(ficheActionIndicateurTable.indicateurId, indicateurId))
      .limit(1);

    expect(ficheData).toHaveLength(1);
    expect(ficheData[0].ficheId).toBe(data.ficheId);
  });

  test('should create a personal indicator with minimal fields', async () => {
    const data: CreateIndicateurDefinitionInput = {
      collectiviteId,
      titre: 'Minimal Test Indicator',
      unite: '',
      thematiques: [],
      commentaire: undefined,
      estFavori: false,
      ficheId: undefined,
    };

    const caller = router.createCaller({ user: yoloDodo });
    const indicateurId = await caller.indicateurs.definitions.create(data);

    expect(indicateurId).toBeDefined();
    expect(typeof indicateurId).toBe('number');

    onTestFinished(async () => {
      await caller.indicateurs.definitions.delete({
        indicateurId,
        collectiviteId: data.collectiviteId,
      });
    });

    // Verify the indicator was created
    const createdIndicateur = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    expect(createdIndicateur).toHaveLength(1);
    expect(createdIndicateur[0].titre).toBe(data.titre);
    expect(createdIndicateur[0].unite).toBe('');
    expect(createdIndicateur[0].collectiviteId).toBe(data.collectiviteId);

    // Verify collectivite data was created with defaults
    const collectiviteData = await databaseService.db
      .select()
      .from(indicateurCollectiviteTable)
      .where(eq(indicateurCollectiviteTable.indicateurId, indicateurId))
      .limit(1);

    expect(collectiviteData).toHaveLength(1);
    expect(collectiviteData[0].commentaire).toBeNull();
    expect(collectiviteData[0].favoris).toBe(false);

    // Verify no thematic associations were created
    const thematiqueData = await databaseService.db
      .select()
      .from(indicateurThematiqueTable)
      .where(eq(indicateurThematiqueTable.indicateurId, indicateurId));

    expect(thematiqueData).toHaveLength(0);

    // Verify no fiche association was created
    const ficheData = await databaseService.db
      .select()
      .from(ficheActionIndicateurTable)
      .where(eq(ficheActionIndicateurTable.indicateurId, indicateurId));

    expect(ficheData).toHaveLength(0);
  });

  test('should set modified_by field when creating an indicator', async () => {
    const data: CreateIndicateurDefinitionInput = {
      collectiviteId,
      titre: 'Test Indicator for modified_by',
      unite: 'kg',
      commentaire: 'Test comment',
      estFavori: true,
    };

    const caller = router.createCaller({ user: yoloDodo });
    const indicateurId = await caller.indicateurs.definitions.create(data);

    expect(indicateurId).toBeDefined();

    onTestFinished(async () => {
      await caller.indicateurs.definitions.delete({
        indicateurId,
        collectiviteId: data.collectiviteId,
      });
    });

    // Verify the modified_* fields are set by using the list service
    const {
      data: [indicateur],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateur).toBeDefined();

    if (!indicateur.modifiedBy) {
      expect.fail('modifiedBy is null');
    }

    expect(indicateur.modifiedBy.id).toBe(yoloDodo.id);
    expect(indicateur.modifiedAt).toBeDefined();
  });

  test('should throw error when user lacks permission', async () => {
    const data: CreateIndicateurDefinitionInput = {
      collectiviteId: 999, // Non-existent or unauthorized collectivite
      titre: 'Unauthorized Test Indicator',
      unite: 'kg',
    };

    const caller = router.createCaller({ user: yoloDodo });

    await expect(
      caller.indicateurs.definitions.create(data)
    ).rejects.toThrowError(/Droits insuffisants/);
  });
});
