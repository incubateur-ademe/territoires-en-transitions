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
import { createFiche } from '@tet/backend/plans/fiches/fiches.test-fixture';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, isNull } from 'drizzle-orm';
import { describe, expect, onTestFinished } from 'vitest';
import z from 'zod';
import { indicateurGroupeTable } from '../../shared/models/indicateur-groupe.table';
import { indicateurThematiqueTable } from '../../shared/models/indicateur-thematique.table';
import { indicateurCollectiviteTable } from '../../indicateur/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '../../indicateur/indicateur-definition.table';
import { createIndicateurInputSchema } from './mutate-indicateur.input';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';

// On prend le typage en entrée, avant parsing zod du router trpc
type CreateIndicateurInput = z.input<typeof createIndicateurInputSchema>;

describe('createIndicateurPerso', () => {
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

  test.each([
    undefined,
    IndicateurPeriodiciteEnum.ANNUELLE,
    IndicateurPeriodiciteEnum.SEMESTRIELLE,
    IndicateurPeriodiciteEnum.TRIMESTRIELLE,
    IndicateurPeriodiciteEnum.MENSUELLE,
  ] as const)(
    'creates, writes and reads an indicator with periodicite=%s',
    async (periodicite) => {
      const caller = router.createCaller({ user: authenticatedUser });
      const indicateurId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Périodicité de bout en bout',
        periodicite,
      });
      onTestFinished(async () => {
        await caller.indicateurs.indicateurs.delete({
          collectiviteId: collectivite.id,
          indicateurId,
        });
      });
      const dateValeur =
        periodicite === undefined ? '2024-12-31' : '2024-01-01';

      await caller.indicateurs.valeurs.upsert({
        collectiviteId: collectivite.id,
        indicateurId,
        periodicite,
        dateValeur,
        resultat: 0,
      });

      await caller.indicateurs.indicateurs.update({
        collectiviteId: collectivite.id,
        indicateurId,
        indicateurFields: { titre: 'Titre modifié sans changer la cadence' },
      });

      const { indicateurs } = await caller.indicateurs.valeurs.list({
        collectiviteId: collectivite.id,
        indicateurIds: [indicateurId],
      });
      expect(indicateurs[0].definition).toMatchObject({
        titre: 'Titre modifié sans changer la cadence',
        periodicite: periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE,
      });
      expect(indicateurs[0].sources.collectivite.valeurs).toMatchObject([
        {
          periodicite: periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE,
          dateValeur: '2024-01-01',
          resultat: 0,
        },
      ]);
    }
  );

  test('should create a personal indicator with all fields', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    // Create a fiche in the collectivite for the ficheId field
    const fiche = await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Fiche test indicateur',
      },
    });

    const data = {
      collectiviteId: collectivite.id,
      titre: 'Test Personal Indicator',
      unite: 'kg',
      thematiques: [{ id: 1 }, { id: 2 }],
      commentaire: 'Test comment for personal indicator',
      estFavori: true,
      estConfidentiel: true,
      ficheId: fiche.id,
    } satisfies CreateIndicateurInput;

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
    expect(collectiviteData[0].confidentiel).toBe(data.estConfidentiel);

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
    const data: CreateIndicateurInput = {
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
    expect(collectiviteData[0].confidentiel).toBe(false);

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

  test('crée un indicateur déjà déclaré non applicable', async () => {
    const data: CreateIndicateurInput = {
      collectiviteId: collectivite.id,
      titre: 'Indicateur non applicable dès la création',
      unite: 'kg',
      isApplicable: false,
    };

    const caller = router.createCaller({ user: authenticatedUser });
    const indicateurId = await caller.indicateurs.indicateurs.create(data);

    const [collectiviteData] = await databaseService.db
      .select()
      .from(indicateurCollectiviteTable)
      .where(eq(indicateurCollectiviteTable.indicateurId, indicateurId))
      .limit(1);

    expect(collectiviteData.isApplicable).toBe(false);
  });

  test('should set modified_by field when creating an indicator', async () => {
    const data: CreateIndicateurInput = {
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
    const data: CreateIndicateurInput = {
      collectiviteId: 999,
      titre: 'Unauthorized Test Indicator',
      unite: 'kg',
    };

    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.indicateurs.create(data)
    ).rejects.toThrowError(/permissions nécessaires/);
  });

  test('should reject a fiche owned by another collectivite and roll back creation', async () => {
    const other = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    onTestFinished(other.cleanup);
    const otherCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(other.user),
    });
    const foreignFicheId = await createFiche({
      caller: otherCaller,
      ficheInput: {
        collectiviteId: other.collectivite.id,
        titre: 'Foreign fiche for indicator creation',
      },
    });
    const titre = `Indicator rejected with foreign fiche ${crypto.randomUUID()}`;

    const caller = router.createCaller({ user: authenticatedUser });
    await expect(
      caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre,
        ficheId: foreignFicheId,
      })
    ).rejects.toThrow(/fiches doivent appartenir/i);

    const indicateurs = await databaseService.db
      .select({ id: indicateurDefinitionTable.id })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.titre, titre));
    expect(indicateurs).toHaveLength(0);
  });

  describe('sous-indicateur', () => {
    const createParentMensuel = async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      return caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Déchets ménagers',
        unite: 't',
        periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
      });
    };

    test('rattache le nouvel indicateur à son parent en reprenant unité et périodicité', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const parentId = await createParentMensuel();

      const childId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Ordures ménagères',
        parentId,
      });

      const [child] = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, childId));
      expect(child).toMatchObject({
        titre: 'Ordures ménagères',
        unite: 't',
        periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
        collectiviteId: collectivite.id,
      });

      const links = await databaseService.db
        .select()
        .from(indicateurGroupeTable)
        .where(eq(indicateurGroupeTable.enfant, childId));
      expect(links).toEqual([{ parent: parentId, enfant: childId }]);
    });

    test('refuse un sous-indicateur sous un indicateur prédéfini', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const [predefini] = await databaseService.db
        .select({ id: indicateurDefinitionTable.id })
        .from(indicateurDefinitionTable)
        .where(isNull(indicateurDefinitionTable.collectiviteId))
        .limit(1);
      const titre = `Sous-indicateur refusé ${crypto.randomUUID()}`;

      await expect(
        caller.indicateurs.indicateurs.create({
          collectiviteId: collectivite.id,
          titre,
          parentId: predefini.id,
        })
      ).rejects.toThrow(/indicateur personnalisé/);

      const created = await databaseService.db
        .select({ id: indicateurDefinitionTable.id })
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.titre, titre));
      expect(created).toHaveLength(0);
    });

    test('refuse un troisième niveau', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const parentId = await createParentMensuel();
      const childId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Tri sélectif',
        parentId,
      });

      await expect(
        caller.indicateurs.indicateurs.create({
          collectiviteId: collectivite.id,
          titre: 'Verre',
          parentId: childId,
        })
      ).rejects.toThrow(/deux niveaux maximum/);
    });

    test('ne révèle pas un indicateur d’une autre collectivité', async () => {
      const other = await addTestCollectiviteAndUser(databaseService, {
        user: { role: CollectiviteRole.ADMIN },
      });
      onTestFinished(other.cleanup);
      const otherCaller = router.createCaller({
        user: getAuthUserFromUserCredentials(other.user),
      });
      const foreignParentId = await otherCaller.indicateurs.indicateurs.create({
        collectiviteId: other.collectivite.id,
        titre: 'Indicateur d’une autre collectivité',
      });
      const caller = router.createCaller({ user: authenticatedUser });

      await expect(
        caller.indicateurs.indicateurs.create({
          collectiviteId: collectivite.id,
          titre: 'Enfant sans parent accessible',
          parentId: foreignParentId,
        })
      ).rejects.toThrow(/parent n'a pas été trouvé/);
    });
  });
});
