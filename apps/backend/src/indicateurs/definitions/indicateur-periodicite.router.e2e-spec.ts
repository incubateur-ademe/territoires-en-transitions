import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { onTestFinished } from 'vitest';
import { TrpcRouter } from '../../utils/trpc/trpc.router';
import { indicateurDefinitionTable } from './indicateur-definition.table';

describe('Périodicité des indicateurs avec le stockage annuel', () => {
  let app: INestApplication;
  let caller: ReturnType<TrpcRouter['createCaller']>;
  let collectiviteId: number;
  let authToken: string;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    const database = await getTestDatabase(app);
    const router = await getTestRouter(app);
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      database,
      { user: { role: CollectiviteRole.ADMIN } }
    );
    onTestFinished(async () => {
      // Les indicateurs référencent leur auteur : les supprimer avant l'utilisateur.
      await database.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.collectiviteId, collectivite.id));
      await cleanup();
    });
    collectiviteId = collectivite.id;
    caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });
    authToken = await getAuthToken(user);
  });

  afterAll(async () => {
    await app.close();
  });

  test.each([undefined, 'annuelle'] as const)(
    'expose les métadonnées annuelles après création avec periodicite=%s',
    async (periodicite) => {
      const indicateurId = await caller.indicateurs.indicateurs.create({
        collectiviteId,
        titre: 'Indicateur annuel',
        periodicite,
      });

      const { data } = await caller.indicateurs.indicateurs.list({
        collectiviteId,
        filters: { indicateurIds: [indicateurId] },
      });
      expect(data).toMatchObject([
        {
          id: indicateurId,
          periodicite: 'annuelle',
          periodiciteMode: 'imposee',
          periodiciteParDefaut: 'annuelle',
          periodicitePersonnalisee: null,
        },
      ]);
    }
  );

  test('refuse une création mensuelle', async () => {
    await expect(
      caller.indicateurs.indicateurs.create({
        collectiviteId,
        titre: 'Indicateur mensuel refusé',
        // @ts-expect-error Vérifie la validation des entrées externes.
        periodicite: 'mensuelle',
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test.each(['annuelle', 'mensuelle', null])(
    'refuse la personnalisation %s sans modifier les autres champs',
    async (periodicite) => {
      const indicateurId = await caller.indicateurs.indicateurs.create({
        collectiviteId,
        titre: 'Titre conservé',
      });

      await expect(
        caller.indicateurs.indicateurs.update({
          collectiviteId,
          indicateurId,
          indicateurFields: {
            titre: 'Titre refusé',
            // @ts-expect-error Vérifie la validation des entrées externes.
            periodicite,
          },
        })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

      const { data } = await caller.indicateurs.indicateurs.list({
        collectiviteId,
        filters: { indicateurIds: [indicateurId] },
      });
      expect(data[0].titre).toBe('Titre conservé');
    }
  );

  test('conserve les dates historiques distinctes et les valeurs nulles ou zéro', async () => {
    const indicateurId = await caller.indicateurs.indicateurs.create({
      collectiviteId,
      titre: 'Dates historiques',
    });
    const valeurs = [
      { dateValeur: '2024-06-30', resultat: 0, objectif: null },
      { dateValeur: '2024-12-31', resultat: null, objectif: 42 },
    ];

    for (const valeur of valeurs) {
      await caller.indicateurs.valeurs.upsert({
        collectiviteId,
        indicateurId,
        ...valeur,
      });
    }

    const input = { collectiviteId, indicateurIds: [indicateurId] };
    const result = await caller.indicateurs.valeurs.list(input);
    expect(result.indicateurs).toHaveLength(1);
    expect(result.indicateurs[0].definition).toMatchObject({
      id: indicateurId,
      periodicite: 'annuelle',
      periodiciteMode: 'imposee',
    });
    expect(result.indicateurs[0].sources.collectivite.valeurs).toMatchObject([
      { dateValeur: '2024-06-30', periodicite: 'annuelle', resultat: 0 },
      { dateValeur: '2024-12-31', periodicite: 'annuelle', objectif: 42 },
    ]);
    expect(
      result.indicateurs[0].sources.collectivite.valeurs[0]
    ).not.toHaveProperty('objectif');
    expect(
      result.indicateurs[0].sources.collectivite.valeurs[1]
    ).not.toHaveProperty('resultat');
    expect(
      await caller.indicateurs.valeurs.list({
        ...input,
        periodicite: 'annuelle',
      })
    ).toEqual(result);

    await expect(
      caller.indicateurs.valeurs.list({
        ...input,
        // @ts-expect-error Vérifie la validation des entrées externes.
        periodicite: 'mensuelle',
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('refuse tout le lot HTTP contenant une valeur mensuelle', async () => {
    const indicateurId = await caller.indicateurs.indicateurs.create({
      collectiviteId,
      titre: 'Lot refusé',
    });

    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        valeurs: [
          {
            collectiviteId,
            indicateurId,
            dateValeur: '2024-12-31',
            resultat: 1,
          },
          {
            collectiviteId,
            indicateurId,
            dateValeur: '2025-01-01',
            periodicite: 'mensuelle',
            resultat: 2,
          },
        ],
      })
      .expect(400);

    const result = await caller.indicateurs.valeurs.list({
      collectiviteId,
      indicateurIds: [indicateurId],
    });
    expect(result.indicateurs[0].sources).toEqual({});
  });
});
