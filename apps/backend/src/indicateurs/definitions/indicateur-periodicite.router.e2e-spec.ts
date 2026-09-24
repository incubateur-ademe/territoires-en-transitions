import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  signTestAuthToken,
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
import { indicateurSourceMetadonneeTable } from '../shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '../shared/models/indicateur-source.table';
import CrudValeursService from '../valeurs/crud-valeurs.service';

describe('Périodicité de déclaration des indicateurs', () => {
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
    const authUser = getAuthUserFromUserCredentials(user);
    authToken = signTestAuthToken({ ...authUser.jwtPayload, sub: authUser.id });
  });

  afterAll(async () => {
    await app.close();
  });

  test.each([
    undefined,
    'annuelle',
    'semestrielle',
    'trimestrielle',
    'mensuelle',
  ] as const)(
    'expose la périodicité après création avec periodicite=%s',
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
          periodicite: periodicite ?? 'annuelle',
        },
      ]);
      await caller.indicateurs.valeurs.upsert({
        collectiviteId,
        indicateurId,
        periodicite,
        dateValeur: '2026-01-01',
        resultat: 42,
      });
      const values = await caller.indicateurs.valeurs.list({
        collectiviteId,
        indicateurIds: [indicateurId],
      });
      expect(values.indicateurs[0].sources.collectivite.valeurs).toMatchObject([
        {
          periodicite: periodicite ?? 'annuelle',
          dateValeur: '2026-01-01',
          resultat: 42,
        },
      ]);
    }
  );

  test.each(['annuelle', 'semestrielle', 'trimestrielle', 'mensuelle', null])(
    'refuse une modification de périodicité (%s) dès la création, sans valeur enregistrée',
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

  test('conserve les années distinctes et les valeurs nulles ou zéro', async () => {
    const indicateurId = await caller.indicateurs.indicateurs.create({
      collectiviteId,
      titre: 'Dates historiques',
    });
    const valeurs = [
      { dateValeur: '2024-01-01', resultat: 0, objectif: null },
      { dateValeur: '2025-01-01', resultat: null, objectif: 42 },
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
    });
    expect(result.indicateurs[0].sources.collectivite.valeurs).toMatchObject([
      { dateValeur: '2024-01-01', periodicite: 'annuelle', resultat: 0 },
      { dateValeur: '2025-01-01', periodicite: 'annuelle', objectif: 42 },
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
  });

  test.each(['mensuelle', 'trimestrielle', 'semestrielle'] as const)(
    'refuse une déclaration locale %s pour un indicateur annuel',
    async (periodicite) => {
      const indicateurId = await caller.indicateurs.indicateurs.create({
        collectiviteId,
        titre: 'Déclaration refusée',
      });

      await expect(
        caller.indicateurs.valeurs.upsert({
          collectiviteId,
          indicateurId,
          dateValeur: '2026-01-01',
          resultat: 42,
          periodicite,
        })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

      const result = await caller.indicateurs.valeurs.list({
        collectiviteId,
        indicateurIds: [indicateurId],
      });
      expect(result.indicateurs[0].sources).toEqual({});
    }
  );

  test.each(['mensuelle', 'trimestrielle', 'semestrielle'] as const)(
    'refuse tout le lot HTTP contenant une valeur %s',
    async (periodicite) => {
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
              dateValeur: '2025-01-01',
              resultat: 1,
            },
            {
              collectiviteId,
              indicateurId,
              dateValeur: '2025-01-01',
              periodicite,
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
    }
  );

  test('preserves annual external observations beside monthly local declarations', async () => {
    const indicateurId = await caller.indicateurs.indicateurs.create({
      collectiviteId,
      titre: 'Monthly local declaration',
      periodicite: 'mensuelle',
    });
    const database = await getTestDatabase(app);
    const sourceId = `test-periodicite-${indicateurId}`;
    await database.db
      .insert(indicateurSourceTable)
      .values({ id: sourceId, libelle: 'External annual observations' });
    const [metadata] = await database.db
      .insert(indicateurSourceMetadonneeTable)
      .values({
        sourceId,
        dateVersion: '2026-01-01',
      })
      .returning();
    onTestFinished(async () => {
      await database.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));
      await database.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, metadata.id));
      await database.db
        .delete(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, sourceId));
    });
    await app.get(CrudValeursService).upsertIndicateurValeurs(
      [
        {
          collectiviteId,
          indicateurId,
          periodicite: 'annuelle',
          dateValeur: '2026-01-01',
          metadonneeId: metadata.id,
          resultat: 120,
        },
      ],
      { isUserTrusted: true }
    );
    await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId,
      periodicite: 'mensuelle',
      dateValeur: '2026-01-01',
      resultat: 10,
    });
    const result = await caller.indicateurs.valeurs.list({
      collectiviteId,
      indicateurIds: [indicateurId],
    });
    expect(result.indicateurs[0].definition.periodicite).toBe('mensuelle');
    expect(result.indicateurs[0].sources[sourceId].valeurs).toMatchObject([
      { periodicite: 'annuelle', resultat: 120 },
    ]);
    expect(result.indicateurs[0].sources.collectivite.valeurs).toMatchObject([
      { periodicite: 'mensuelle', resultat: 10 },
    ]);
  });

  test.each([
    'annuelle',
    'semestrielle',
    'trimestrielle',
    'mensuelle',
  ] as const)(
    'rejects a noncanonical date for an explicit %s observation',
    async (periodicite) => {
      const indicateurId = await caller.indicateurs.indicateurs.create({
        collectiviteId,
        titre: 'Canonical dates',
        periodicite,
      });
      await expect(
        caller.indicateurs.valeurs.upsert({
          collectiviteId,
          indicateurId,
          periodicite,
          dateValeur: '2026-01-02',
          resultat: 1,
        })
      ).rejects.toThrow(/non canonique/);
    }
  );
});
