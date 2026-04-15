import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
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

describe('createIndicateurPerso', () => {
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

  test('should create a personal indicator with all fields', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    // Create a fiche in the collectivite for the ficheId field
    const fiche = await caller.plans.fiches.create({
      fiche: { collectiviteId: collectivite.id, titre: 'Fiche test indicateur' },
    });

    const data = {
      collectiviteId: collectivite.id,
      titre: 'Test Personal Indicator',
      unite: 'kg',
      thematiques: [{ id: 1 }, { id: 2 }],
      commentaire: 'Test comment for personal indicator',
      estFavori: true,
      ficheId: fiche.id,
    } satisfies CreateIndicateurDefinitionInput;

    const indicateurId = await caller.indicateurs.indicateurs.create(data);

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
      collectiviteId: collectivite.id,
      titre: 'Minimal Test Indicator',
      unite: '',
      thematiques: [],
      commentaire: undefined,
      estFavori: false,
      ficheId: undefined,
    };

    const caller = router.createCaller({ user: authenticatedUser });
    const indicateurId = await caller.indicateurs.indicateurs.create(data);

    expect(indicateurId).toBeDefined();
    expect(typeof indicateurId).toBe('number');

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
      collectiviteId: collectivite.id,
      titre: 'Test Indicator for modified_by',
      unite: 'kg',
      commentaire: 'Test comment',
      estFavori: true,
    };

    const caller = router.createCaller({ user: authenticatedUser });
    const indicateurId = await caller.indicateurs.indicateurs.create(data);

    expect(indicateurId).toBeDefined();

    // Verify the modified_* fields are set by using the list service
    const {
      data: [indicateur],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateur).toBeDefined();

    if (!indicateur.modifiedBy) {
      expect.fail('modifiedBy is null');
    }

    expect(indicateur.modifiedBy.id).toBe(authenticatedUser.id);
    expect(indicateur.modifiedAt).toBeDefined();
  });

  test('should throw error when user lacks permission', async () => {
    const data: CreateIndicateurDefinitionInput = {
      collectiviteId: 999,
      titre: 'Unauthorized Test Indicator',
      unite: 'kg',
    };

    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.indicateurs.create(data)
    ).rejects.toThrowError(/Droits insuffisants/);
  });
});
