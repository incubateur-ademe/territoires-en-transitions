import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteRelationsTable } from '@tet/backend/collectivites/shared/models/collectivite-relations.table';
import { IndicateurChartService } from '@tet/backend/indicateurs/charts/indicateur-chart.service';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import {
  getAuthUserFromUserCredentials,
  getIndicateurIdByIdentifiant,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import {
  IndicateurSourceEnum,
  IndicateurValeurTypeEnum,
  StatutTrajectoireSnbc3,
} from '@tet/domain/indicateurs';
import { eq } from 'drizzle-orm';
import {
  addTestTrajectoireSnbc3Valeurs,
  mockTrajectoireSnbc3Flag,
} from './trajectoire-snbc3.test-fixture';

describe('Lecture de la trajectoire SNBC 3 (indicateurs.trajectoires.snbc3)', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let database: DatabaseService;
  let user: AuthenticatedUser;
  /** Utilisateur non vérifié : pas de droit de lecture des valeurs. */
  let userNonVerifie: AuthenticatedUser;
  const cleanups: (() => Promise<unknown>)[] = [];
  let restoreFlag: (() => void) | undefined;

  let epci: Collectivite;
  let epciAbsent: Collectivite;
  let epciParent: Collectivite;
  let commune: Collectivite;
  let region: Collectivite;
  let syndicat: Collectivite;
  let collectiviteTest: Collectivite;

  const addCollectivite = async (
    args: Parameters<typeof addTestCollectivite>[1]
  ) => {
    const fixture = await addTestCollectivite(database, args);
    cleanups.push(fixture.cleanup);
    return fixture.collectivite;
  };

  const caller = () => router.createCaller({ user });

  /** Active ou coupe le flag le temps d'un test. */
  const withFlag = (enabled: boolean) => {
    restoreFlag?.();
    restoreFlag = mockTrajectoireSnbc3Flag(app, enabled);
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    database = await getTestDatabase(app);

    const testUser = await addTestUser(database);
    cleanups.push(testUser.cleanup);
    user = getAuthUserFromUserCredentials(testUser.user);
    const testUserNonVerifie = await addTestUser(database, { verified: false });
    cleanups.push(testUserNonVerifie.cleanup);
    userNonVerifie = getAuthUserFromUserCredentials(testUserNonVerifie.user);

    epci = await addCollectivite({ type: 'epci', natureInsee: 'CA' });
    epciAbsent = await addCollectivite({ type: 'epci', natureInsee: 'CC' });
    epciParent = await addCollectivite({ type: 'epci', natureInsee: 'CA' });
    commune = await addCollectivite({ type: 'commune' });
    region = await addCollectivite({ type: 'region' });
    syndicat = await addCollectivite({ type: 'epci', natureInsee: 'PETR' });
    collectiviteTest = await addCollectivite({ type: 'test' });

    await database.db.insert(collectiviteRelationsTable).values([
      // Un PETR n'est jamais proposé comme EPCI parent.
      { id: commune.id, parentId: syndicat.id },
      { id: commune.id, parentId: epciParent.id },
    ]);

    const valeurs = await addTestTrajectoireSnbc3Valeurs(database, epci.id, [
      { identifiant: 'cae_1.ca', annee: 2021, objectif: 50 },
      { identifiant: 'cae_1.ca', annee: 2050, objectif: 5 },
      { identifiant: 'cae_63.b', annee: 2021, objectif: 12 },
      { identifiant: 'cae_2.ea', annee: 2021, objectif: 300 },
    ]);
    cleanups.unshift(valeurs.cleanup);

    // Une valeur SNBC 2 de la même collectivité, ignorée par la lecture SNBC 3.
    await database.db
      .insert(indicateurSourceTable)
      .values({ id: 'snbc', libelle: 'SNBC' })
      .onConflictDoNothing();
    const [snbcMetadonnee] = await database.db
      .insert(indicateurSourceMetadonneeTable)
      .values({ sourceId: 'snbc', dateVersion: '2024-07-11T00:00:00' })
      .returning();
    await database.db.insert(indicateurValeurTable).values({
      collectiviteId: epci.id,
      indicateurId: await getIndicateurIdByIdentifiant(database, 'cae_1.ca'),
      periodicite: 'annuelle',
      dateValeur: '2015-01-01',
      metadonneeId: snbcMetadonnee.id,
      objectif: 999,
    });
    cleanups.unshift(async () => {
      await database.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.metadonneeId, snbcMetadonnee.id));
      await database.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, snbcMetadonnee.id));
    });
  });

  afterAll(async () => {
    restoreFlag?.();
    for (const cleanup of cleanups) {
      await cleanup();
    }
    await app.close();
  });

  describe('sans le flag', () => {
    beforeEach(() => withFlag(false));

    test('checkStatus et get renvoient TRAJECTOIRE_SNBC3_NON_OUVERTE', async () => {
      const expected = {
        code: 'FORBIDDEN',
        message:
          "La trajectoire SNBC 3 n'est pas encore ouverte pour cet utilisateur ou cette collectivité",
      };
      await expect(
        caller().indicateurs.trajectoires.snbc3.checkStatus({
          collectiviteId: epci.id,
        })
      ).rejects.toMatchObject(expected);
      await expect(
        caller().indicateurs.trajectoires.snbc3.get({ collectiviteId: epci.id })
      ).rejects.toMatchObject(expected);
    });
  });

  describe('avec le flag', () => {
    beforeEach(() => withFlag(true));

    test('disponible pour une collectivité présente dans le millésime', async () => {
      const result = await caller().indicateurs.trajectoires.snbc3.checkStatus({
        collectiviteId: epci.id,
      });
      expect(result).toEqual({
        status: StatutTrajectoireSnbc3.DISPONIBLE,
        millesime: { dateVersion: expect.any(String) },
      });
    });

    test.each([
      [
        'un EPCI absent',
        () => epciAbsent,
        StatutTrajectoireSnbc3.ABSENT_DU_MILLESIME,
      ],
      [
        'une collectivité de test',
        () => collectiviteTest,
        StatutTrajectoireSnbc3.ABSENT_DU_MILLESIME,
      ],
      ['une région', () => region, StatutTrajectoireSnbc3.SUPRA_NON_SUPPORTE],
      ['un PETR', () => syndicat, StatutTrajectoireSnbc3.SUPRA_NON_SUPPORTE],
    ])('%s : %s', async (_, getCollectivite, status) => {
      const result = await caller().indicateurs.trajectoires.snbc3.checkStatus({
        collectiviteId: getCollectivite().id,
      });
      expect(result.status).toBe(status);
      expect(result.collectiviteRattachement).toBeUndefined();
    });

    test('une commune absente renvoie son EPCI à fiscalité propre', async () => {
      const result = await caller().indicateurs.trajectoires.snbc3.checkStatus({
        collectiviteId: commune.id,
      });
      expect(result).toMatchObject({
        status: StatutTrajectoireSnbc3.COMMUNE_NON_SUPPORTEE,
        collectiviteRattachement: { id: epciParent.id, nom: epciParent.nom },
      });
    });

    test('droits insuffisants sans droit de lecture des valeurs', async () => {
      const callerNonVerifie = router.createCaller({ user: userNonVerifie });
      const result =
        await callerNonVerifie.indicateurs.trajectoires.snbc3.checkStatus({
          collectiviteId: epci.id,
        });
      expect(result.status).toBe(StatutTrajectoireSnbc3.DROITS_INSUFFISANTS);

      await expect(
        callerNonVerifie.indicateurs.trajectoires.snbc3.get({
          collectiviteId: epci.id,
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    test('get regroupe les valeurs snbc3 par secteur, sans la SNBC 2', async () => {
      const { millesime, trajectoire } =
        await caller().indicateurs.trajectoires.snbc3.get({
          collectiviteId: epci.id,
        });
      expect(millesime).toEqual({ dateVersion: expect.any(String) });

      const objectifs = (
        indicateurs: typeof trajectoire.emissionsGes,
        identifiant: string
      ) =>
        indicateurs
          .find((i) => i.definition.identifiantReferentiel === identifiant)
          ?.valeurs.map(({ dateValeur, objectif }) => ({
            dateValeur,
            objectif,
          }));

      // La valeur SNBC 2 de 2015 n'apparaît pas.
      expect(objectifs(trajectoire.emissionsGes, 'cae_1.ca')).toEqual([
        { dateValeur: '2021-01-01', objectif: 50 },
        { dateValeur: '2050-01-01', objectif: 5 },
      ]);
      // Séquestration stockée en positif, renvoyée en négatif.
      expect(objectifs(trajectoire.sequestrations, 'cae_63.b')).toEqual([
        { dateValeur: '2021-01-01', objectif: -12 },
      ]);
      expect(objectifs(trajectoire.consommationsFinales, 'cae_2.ea')).toEqual([
        { dateValeur: '2021-01-01', objectif: 300 },
      ]);
    });

    test('checkStatus renvoie COLLECTIVITE_NOT_FOUND pour un id inconnu', async () => {
      await expect(
        caller().indicateurs.trajectoires.snbc3.checkStatus({
          collectiviteId: 999_999_999,
        })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    test("une commune absente sans EPCI parent n'a pas de clé collectiviteRattachement", async () => {
      const communeIsolee = await addCollectivite({ type: 'commune' });
      const result = await caller().indicateurs.trajectoires.snbc3.checkStatus({
        collectiviteId: communeIsolee.id,
      });
      expect(result.status).toBe(StatutTrajectoireSnbc3.COMMUNE_NON_SUPPORTEE);
      expect(result).not.toHaveProperty('collectiviteRattachement');
    });

    test('get renvoie une trajectoire vide hors du millésime', async () => {
      const { trajectoire } = await caller().indicateurs.trajectoires.snbc3.get(
        {
          collectiviteId: epciAbsent.id,
        }
      );
      expect(trajectoire).toEqual({
        emissionsGes: [],
        consommationsFinales: [],
        sequestrations: [],
      });
    });
  });

  describe('lecture sans utilisateur (rapport PPT)', () => {
    // Pas de mock : sans utilisateur, le vrai TrackingService renvoie `false`.
    beforeEach(() => {
      restoreFlag?.();
      restoreFlag = undefined;
    });

    /** Graphe des trajectoires SNBC 2 et SNBC 3 de cae_1.ca, comme le PPT. */
    const getGraphe = (trajectoireSnbc3Enabled?: boolean) =>
      app.get(IndicateurChartService).getIndicateurValeursAndChartData({
        collectiviteId: epci.id,
        identifiantReferentiel: 'cae_1.ca',
        sources: [IndicateurSourceEnum.SNBC, IndicateurSourceEnum.SNBC3].map(
          (sourceId) => ({
            sourceId,
            valeurTypes: [IndicateurValeurTypeEnum.OBJECTIF],
          })
        ),
        trajectoireSnbc3Enabled,
      });

    const sourcesDuGraphe = async (trajectoireSnbc3Enabled?: boolean) => {
      const { indicateurValeurs } = await getGraphe(trajectoireSnbc3Enabled);
      return Object.keys(indicateurValeurs?.sources ?? {});
    };

    test("garde les valeurs snbc3 quand l'appelant a évalué le flag à vrai", async () => {
      expect(await sourcesDuGraphe(true)).toEqual(
        expect.arrayContaining([
          IndicateurSourceEnum.SNBC,
          IndicateurSourceEnum.SNBC3,
        ])
      );
    });

    test('nomme SNBC 2 et SNBC 3 quand les deux trajectoires sont sur le graphe', async () => {
      const nomsDesSeries = (
        { chartData }: Awaited<ReturnType<typeof getGraphe>>
      ) =>
        [chartData.series ?? []]
          .flat()
          .map((serie) => serie.name)
          .join(' | ');

      const avecSnbc3 = nomsDesSeries(await getGraphe(true));
      expect(avecSnbc3).toContain('SNBC 2 territorialisée');
      expect(avecSnbc3).toContain('SNBC 3 territorialisée');

      // Sans la SNBC 3, la SNBC 2 garde son libellé actuel.
      const sansSnbc3 = nomsDesSeries(await getGraphe());
      expect(sansSnbc3).toContain('SNBC territorialisée');
      expect(sansSnbc3).not.toContain('SNBC 2');
    });

    test('retire les valeurs snbc3 sans décision du flag', async () => {
      expect(await sourcesDuGraphe()).not.toContain(IndicateurSourceEnum.SNBC3);
      expect(await sourcesDuGraphe(false)).not.toContain(
        IndicateurSourceEnum.SNBC3
      );
    });
  });
});
