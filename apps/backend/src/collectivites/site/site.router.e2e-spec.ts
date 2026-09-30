import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { labellisationTable } from '@tet/backend/referentiels/labellisations/labellisation.table';
import { getTestApp, getTestDatabase, getTestRouter } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { eq, sql } from 'drizzle-orm';
import { CARTE_RATE_LIMIT } from './site.router';

describe('collectivites.site', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectiviteId: number;

  const siren = `9${Math.random().toString().substring(2, 10)}`;
  const nom = `Sitevitrine${siren}`;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const { collectivite, cleanup } = await addTestCollectivite(
      databaseService,
      { nom, siren, isCOT: true }
    );
    collectiviteId = collectivite.id;
    await databaseService.db.insert(labellisationTable).values({
      collectiviteId: collectivite.id,
      referentiel: 'cae',
      obtenueLe: '2024-06-01T00:00:00Z',
      etoiles: 2,
      scoreRealise: 42.5,
    });

    // Le site lit des vues matérialisées rafraîchies chaque nuit par pg_cron.
    await databaseService.db.execute(
      sql`refresh materialized view stats.collectivite`
    );
    await databaseService.db.execute(
      sql`refresh materialized view site_labellisation`
    );

    return async () => {
      await databaseService.db
        .delete(labellisationTable)
        .where(eq(labellisationTable.collectiviteId, collectivite.id));
      await cleanup();
      await app.close();
    };
  });

  /**
   * `listCarte` est limité par IP : chaque test appelle avec sa propre IP pour
   * que le test de limite ne consomme pas le quota des autres.
   */
  const anonymousCaller = (clientIp = '198.51.100.10') =>
    router.createCaller({ user: null, clientIp }).collectivites.site;

  test('recherche une collectivité par préfixe de nom, sans session', async () => {
    const results = await anonymousCaller().searchCollectivites({
      search: nom.substring(0, nom.length - 2),
    });

    expect(results).toEqual([{ codeSirenInsee: siren, nom }]);
  });

  test('propose quelques collectivités quand rien n’est saisi', async () => {
    const results = await anonymousCaller().searchCollectivites({
      search: '  ',
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(10);
  });

  test('renvoie la fiche d’une collectivité avec son historique de labellisation', async () => {
    const collectivite = await anonymousCaller().getCollectivite({
      codeSirenInsee: siren,
    });

    expect(collectivite).toMatchObject({
      nom,
      codeSirenInsee: siren,
      labellisee: true,
      caeEtoiles: 2,
      eciEtoiles: null,
      labellisations: [
        {
          referentiel: 'cae',
          annee: 2024,
          etoiles: 2,
          scoreRealise: 42.5,
        },
      ],
      indicateursGazEffetSerre: null,
      indicateurArtificialisation: null,
    });
  });

  test('la publication GES ne mélange pas les observations annuelles et mensuelles', async () => {
    const metadonnees = await databaseService.db.execute<{ id: number }>(sql`
      insert into indicateur_source_metadonnee (source_id, date_version)
      values ('citepa', '2026-01-01') returning id
    `);
    const metadonneeId = metadonnees.rows[0].id;
    try {
      await databaseService.db.execute(sql`
        insert into indicateur_valeur
          (collectivite_id, indicateur_id, metadonnee_id, periodicite, date_valeur, resultat)
        select ${collectiviteId}, definition.id, ${metadonneeId},
               valeur.periodicite, valeur.date_valeur, valeur.resultat
        from indicateur_definition definition
        cross join (values
          ('annuelle', date '2025-01-01', 100),
          ('mensuelle', date '2025-02-01', 999)
        ) valeur(periodicite, date_valeur, resultat)
        where definition.identifiant_referentiel = 'cae_1.a'
      `);
      const collectivite = await anonymousCaller().getCollectivite({
        codeSirenInsee: siren,
      });
      expect(collectivite?.indicateursGazEffetSerre).toEqual([
        expect.objectContaining({
          dateValeur: '2025-01-01',
          resultat: 100,
          identifiant: 'cae_1.a',
        }),
      ]);
    } finally {
      await databaseService.db.execute(
        sql`delete from indicateur_valeur where metadonnee_id = ${metadonneeId}`
      );
      await databaseService.db.execute(
        sql`delete from indicateur_source_metadonnee where id = ${metadonneeId}`
      );
    }
  });

  test('renvoie null pour un code inconnu', async () => {
    const collectivite = await anonymousCaller().getCollectivite({
      codeSirenInsee: '000000000',
    });

    expect(collectivite).toBeNull();
  });

  test('place la collectivité engagée sur la carte', async () => {
    const { collectivites, regions } = await anonymousCaller(
      '198.51.100.11'
    ).listCarte();

    expect(collectivites).toContainEqual(
      expect.objectContaining({
        codeSirenInsee: siren,
        engagee: true,
        cot: true,
        labellisee: true,
      })
    );
    // Les contours de régions viennent du seed `stats.region_geojson`.
    expect(Array.isArray(regions)).toBe(true);
  });

  test('limite le nombre d’appels à la carte par IP', async () => {
    const ip = '198.51.100.12';

    for (let i = 0; i < CARTE_RATE_LIMIT.limit; i++) {
      await anonymousCaller(ip).listCarte();
    }

    await expect(anonymousCaller(ip).listCarte()).rejects.toThrow(
      /Trop de requêtes/
    );

    // Une autre IP n'est pas affectée.
    await expect(
      anonymousCaller('198.51.100.13').listCarte()
    ).resolves.toBeDefined();
  });
});
