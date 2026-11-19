import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { inArray } from 'drizzle-orm';
import request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { GetStatsOutput } from './get-stats.output';
import { getPeriodStart, STATS_CACHE_MAX_AGE_SECONDS } from './get-stats.rules';

// Année fictive, antérieure à toutes les fiches de la base de test : sa valeur
// ne dépend que des fiches créées par cette spec.
const ANNEE_TEST = 1990;
const anneeTestTimestamp = Date.UTC(ANNEE_TEST, 0, 1);

describe('GET /api/stats', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let testAgent: TestAgent;

  beforeAll(async () => {
    // Avec le préfixe global : on vérifie le vrai chemin, hors `api/v1`.
    app = await getTestApp({ withGlobalPrefix: true });
    db = await getTestDatabase(app);
    testAgent = request(app.getHttpServer());

    const { collectivite, cleanup: cleanupCollectivite } =
      await addTestCollectivite(db);
    const {
      collectivite: collectiviteDeTest,
      cleanup: cleanupCollectiviteDeTest,
    } = await addTestCollectivite(db, { type: collectiviteTypeEnum.TEST });

    const createdAt = (monthDay: string) =>
      `${ANNEE_TEST}-${monthDay}T12:00:00.000Z`;

    const [ficheComptee1, ficheComptee2, ...autresFiches] = await db.db
      .insert(ficheActionTable)
      .values([
        { collectiviteId: collectivite.id, createdAt: createdAt('03-01') },
        { collectiviteId: collectivite.id, createdAt: createdAt('11-30') },
        // Non comptées : supprimée, et fiche d'une collectivité de test
        {
          collectiviteId: collectivite.id,
          createdAt: createdAt('05-01'),
          deleted: true,
        },
        {
          collectiviteId: collectiviteDeTest.id,
          createdAt: createdAt('05-01'),
        },
      ])
      .returning({ id: ficheActionTable.id });

    // Non comptée : sous-action
    const [sousAction] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: collectivite.id,
        createdAt: createdAt('06-01'),
        parentId: ficheComptee1.id,
      })
      .returning({ id: ficheActionTable.id });

    const ficheIds = [
      ficheComptee1,
      ficheComptee2,
      ...autresFiches,
      sousAction,
    ].map(({ id }) => id);

    return async () => {
      await db.db
        .delete(ficheActionTable)
        .where(inArray(ficheActionTable.id, ficheIds));
      await cleanupCollectivite();
      await cleanupCollectiviteDeTest();
      await app.close();
    };
  });

  test('est publique et compte les fiches créées par an, hors sous-actions, supprimées et collectivités de test', async () => {
    const response = await testAgent
      .get('/api/stats')
      .query({ periodicity: 'year' })
      .expect(200);

    const body: GetStatsOutput = response.body;
    expect(body.description).toBe('Nombre de fiches action créées par an');

    const anneeTest = body.stats.find(
      ({ date }) => date === anneeTestTimestamp
    );
    expect(anneeTest).toEqual({ value: 2, date: anneeTestTimestamp });

    // Série continue jusqu'à l'année en cours, années vides à 0
    const anneeSuivante = body.stats.find(
      ({ date }) => date === Date.UTC(ANNEE_TEST + 1, 0, 1)
    );
    expect(anneeSuivante?.value).toBeGreaterThanOrEqual(0);
    expect(body.stats.at(-1)?.date).toBe(
      getPeriodStart(new Date(), 'year').getTime()
    );
  });

  test('`since` limite la série au nombre de périodes demandé (mois par défaut)', async () => {
    const response = await testAgent
      .get('/api/stats')
      .query({ since: 12 })
      .expect(200);

    const body: GetStatsOutput = response.body;
    expect(body.description).toBe('Nombre de fiches action créées par mois');
    expect(body.stats).toHaveLength(12);
    expect(body.stats.at(-1)?.date).toBe(
      getPeriodStart(new Date(), 'month').getTime()
    );
    for (const stat of body.stats) {
      expect(Number.isInteger(stat.value)).toBe(true);
      expect(stat.value).toBeGreaterThanOrEqual(0);
    }

    const cacheControl = response.headers['cache-control'];
    const maxAge = Number(/max-age=(\d+)/.exec(cacheControl)?.[1]);
    expect(maxAge).toBeLessThanOrEqual(STATS_CACHE_MAX_AGE_SECONDS);
  });

  test.each([
    { periodicity: 'hour' },
    { since: 0 },
    { since: -3 },
    { since: 'abc' },
    { since: 2.5 },
  ])('rejette les paramètres invalides : %o', async (query) => {
    await testAgent.get('/api/stats').query(query).expect(400);
  });

  test('refuse les autres méthodes que GET (405)', async () => {
    const response = await testAgent.post('/api/stats').expect(405);
    expect(response.headers['allow']).toBe('GET, OPTIONS');
  });
});
