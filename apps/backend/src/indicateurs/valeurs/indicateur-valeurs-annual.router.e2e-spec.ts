import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getAuthUserFromUserCredentials, getTestApp } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '../shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '../shared/models/indicateur-source.table';
import { indicateurValeurTable } from './indicateur-valeur.table';

describe('Régressions de la saisie annuelle des indicateurs', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let authenticatedUser: AuthenticatedUser;
  let collectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = app.get(DatabaseService);
    const fixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = fixture.collectivite.id;
    authenticatedUser = getAuthUserFromUserCredentials(fixture.user);
  });

  afterAll(async () => {
    await app.close();
  });

  const insertAnnualIndicateur = async ({
    sansValeurUtilisateur = false,
  } = {}) => {
    const [definition] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId,
        titre: 'Indicateur annuel de test',
        unite: 'MWh',
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        sansValeurUtilisateur,
      })
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, definition.id));
    });
    return definition.id;
  };

  test("L'upsert historique applique aussi l'interdiction de saisie utilisateur", async () => {
    const protectedIndicateurId = await insertAnnualIndicateur({
      sansValeurUtilisateur: true,
    });
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.valeurs.upsert({
        collectiviteId,
        indicateurId: protectedIndicateurId,
        dateValeur: '2026-01-01',
        resultat: 1,
      })
    ).rejects.toThrow(/n'accepte.*pas de valeur utilisateur/);
  });

  test("L'upsert historique remplace un calcul automatique par une saisie manuelle", async () => {
    const annualIndicateurId = await insertAnnualIndicateur();
    const [existing] = await databaseService.db
      .insert(indicateurValeurTable)
      .values({
        indicateurId: annualIndicateurId,
        collectiviteId,
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        dateValeur: '2026-01-01',
        resultat: 10,
        objectif: 12,
        calculAuto: true,
        calculAutoIdentifiantsManquants: ['source_manquante'],
      })
      .returning();
    const caller = router.createCaller({ user: authenticatedUser });

    await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId: annualIndicateurId,
      id: existing.id,
      resultat: null,
    });

    const [saved] = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.id, existing.id));
    expect(saved).toMatchObject({
      resultat: null,
      objectif: 12,
      calculAuto: false,
      calculAutoIdentifiantsManquants: null,
    });
  });

  test('La suppression conserve une valeur open-data', async () => {
    const annualIndicateurId = await insertAnnualIndicateur();
    const sourceId = `test-${randomUUID()}`;
    await databaseService.db.insert(indicateurSourceTable).values({
      id: sourceId,
      libelle: 'Source de test',
    });
    const [metadonnee] = await databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values({
        sourceId,
        dateVersion: '2026-01-01T00:00:00.000Z',
      })
      .returning();
    const [openDataValeur] = await databaseService.db
      .insert(indicateurValeurTable)
      .values({
        indicateurId: annualIndicateurId,
        collectiviteId,
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        dateValeur: '2026-01-01',
        resultat: 10,
        metadonneeId: metadonnee.id,
      })
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.id, openDataValeur.id));
      await databaseService.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, metadonnee.id));
      await databaseService.db
        .delete(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, sourceId));
    });
    const caller = router.createCaller({ user: authenticatedUser });

    await caller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId: annualIndicateurId,
      id: openDataValeur.id,
    });

    const [saved] = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.id, openDataValeur.id));
    expect(saved).toMatchObject({ id: openDataValeur.id, resultat: 10 });
  });

  test('La suppression propage la disparition des lignes calculées A → B → C', async () => {
    const suffix = randomUUID().replaceAll('-', '');
    const [sourceA, calculatedB, calculatedC] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values([
        {
          collectiviteId: null,
          identifiantReferentiel: `test_${suffix}_a`,
          titre: 'Source A',
          unite: 'MWh',
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        },
        {
          collectiviteId: null,
          identifiantReferentiel: `test_${suffix}_b`,
          titre: 'Calcul B',
          unite: 'MWh',
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          // Les formules sont insensibles à la casse : la découverte SQL des
          // dépendants doit suivre le même contrat que le parseur/évaluateur.
          valeurCalcule: `val(TEST_${suffix.toUpperCase()}_A)`,
          sansValeurUtilisateur: true,
        },
        {
          collectiviteId: null,
          identifiantReferentiel: `test_${suffix}_c`,
          titre: 'Calcul C',
          unite: 'MWh',
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          valeurCalcule: `val(test_${suffix}_b)`,
          sansValeurUtilisateur: true,
        },
      ])
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(
          inArray(indicateurDefinitionTable.id, [
            sourceA.id,
            calculatedB.id,
            calculatedC.id,
          ])
        );
    });
    const caller = router.createCaller({ user: authenticatedUser });
    const savedA = await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId: sourceA.id,
      dateValeur: '2026-01-01',
      resultat: 1,
    });
    assert.isDefined(savedA);

    const calculatedBeforeDeletion = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          inArray(indicateurValeurTable.indicateurId, [
            calculatedB.id,
            calculatedC.id,
          ]),
          eq(indicateurValeurTable.dateValeur, '2026-01-01')
        )
      );
    expect(calculatedBeforeDeletion).toHaveLength(2);
    expect(calculatedBeforeDeletion).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicateurId: calculatedB.id,
          resultat: 1,
          calculAuto: true,
        }),
        expect.objectContaining({
          indicateurId: calculatedC.id,
          resultat: 1,
          calculAuto: true,
        }),
      ])
    );

    await caller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId: sourceA.id,
      id: savedA.id,
    });

    const persistedValeurs = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          inArray(indicateurValeurTable.indicateurId, [
            sourceA.id,
            calculatedB.id,
            calculatedC.id,
          ]),
          eq(indicateurValeurTable.dateValeur, '2026-01-01')
        )
      );
    expect(persistedValeurs).toEqual([]);
  });
});
