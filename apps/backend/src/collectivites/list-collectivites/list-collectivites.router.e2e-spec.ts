import { INestApplication } from '@nestjs/common';
import {
  ensureCollectiviteRelationsImported,
  getAnonUser,
  getServiceRoleUser,
} from '@tet/backend/test';
import { AuthRole, AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { inferProcedureInput } from '@trpc/server';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';

type Input = inferProcedureInput<
  AppRouter['collectivites']['collectivites']['list']
>;

describe('Route de recherche des collectivités', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let database: DatabaseService;
  let anonUser: AuthUser<AuthRole.ANON>;
  let serviceRoleUser: AuthUser<AuthRole.SERVICE_ROLE>;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    database = await getTestDatabase(app);
    anonUser = getAnonUser();
    serviceRoleUser = getServiceRoleUser();
  });

  test('Non autorisé si pas minimum en role anonymous', async () => {
    const caller = router.createCaller({ user: null });

    await expect(async () => {
      await caller.collectivites.collectivites.list();
    }).rejects.toThrowError(/not anonymous/i);
  });

  test(`Requête sans filtre`, async () => {
    const caller = router.createCaller({ user: anonUser });

    // Par défaut retourne les 20 premiers résultats
    const result = await caller.collectivites.collectivites.list();
    expect(result.length).toBe(20);

    for (const collectivite of result) {
      expect(collectivite.nom).toBeDefined();
      expect(collectivite.id).toBeDefined();
    }

    // Les collectivités de test (#…) sont triées après les autres
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.nom?.startsWith('#') ?? false).toBe(false);

    let seenTestCollectivite = false;
    for (const collectivite of result) {
      const isTestCollectivite = collectivite.nom?.startsWith('#') ?? false;
      if (isTestCollectivite) {
        seenTestCollectivite = true;
      } else {
        expect(seenTestCollectivite).toBe(false);
      }
    }

    // Retourne le nombre demandé
    const resultWithLimit = await caller.collectivites.collectivites.list({
      limit: 30,
    });
    expect(resultWithLimit.length).toBe(30);
  });

  test(`Requête avec filtre simple`, async () => {
    const caller = router.createCaller({ user: anonUser });

    const input: Input = {
      text: 'Angers',
    };

    const result = await caller.collectivites.collectivites.list(input);
    expect(result.length).toBeGreaterThan(0);
  });

  test(`Requête avec filtre avancé`, async () => {
    const caller = router.createCaller({ user: anonUser });

    const input: Input = {
      text: 'angers',
    };

    const result = await caller.collectivites.collectivites.list(input);
    expect(result.length).toBeGreaterThan(0);

    // Vérifie que le résultat contient bien "Lion d'Angers"
    const lionAngers = result.find((c) => c.nom?.includes("Le Lion-d'Angers"));
    expect(lionAngers).toBeDefined();
  });

  test(`Requête avec filtre insensible aux accents`, async () => {
    const caller = router.createCaller({ user: anonUser });

    const input: Input = {
      text: 'bage',
    };

    const result = await caller.collectivites.collectivites.list(input);
    expect(result.length).toBeGreaterThan(0);

    const collectivite = result.find((c) => c.nom?.includes('Bâgé-Dommartin'));
    expect(collectivite).toBeDefined();
  });

  test(`Requête avec zéro collectivi†és en retour`, async () => {
    const caller = router.createCaller({ user: anonUser });

    const resultWithNonExistentText =
      await caller.collectivites.collectivites.list({
        text: 'NonExistentText',
      });
    expect(resultWithNonExistentText.length).toBe(0);
  });

  describe('avec relations importées', () => {
    beforeAll(async () => {
      const serviceRoleCaller = router.createCaller({ user: serviceRoleUser });
      await ensureCollectiviteRelationsImported(
        database,
        serviceRoleCaller.collectivites.relations
      );
    });

    test(`Requête avec siren et relations`, async () => {
      const caller = router.createCaller({ user: anonUser });

      const resultWithRelations = await caller.collectivites.collectivites.list(
        {
          siren: '200073344',
          fieldsMode: 'resume',
          withRelations: true,
        }
      );
      expect(resultWithRelations.length).toBe(1);
      expect(resultWithRelations[0]).toEqual({
        id: 5178,
        nom: 'CA Rambouillet Territoires',
        siren: '200073344',
        communeCode: null,
        natureInsee: 'CA',
        type: 'epci',
        activeCOT: false,
        parents: [
          {
            id: 5186,
            nom: "SI d'évacuation et d'élimination des déchets de l'Ouest Yvelines (SIEED)",
            siren: '257800300',
            natureInsee: 'SMF',
            type: 'epci',
          },
          {
            id: 5189,
            nom: 'SI de collecte et de traitement des ordures ménagères de la région de Rambouillet (SICTOM)',
            siren: '257801290',
            natureInsee: 'SMF',
            type: 'epci',
          },
        ],
        enfants: [
          {
            id: 3016,
            nom: 'Ablis',
            siren: null,
            communeCode: '78003',
            natureInsee: null,
            type: 'commune',
          },
          {
            id: 3080,
            nom: 'Le Perray-en-Yvelines',
            siren: null,
            communeCode: '78486',
            natureInsee: null,
            type: 'commune',
          },
          {
            id: 3042,
            nom: 'Les Essarts-le-Roi',
            siren: null,
            communeCode: '78220',
            natureInsee: null,
            type: 'commune',
          },
          {
            id: 3085,
            nom: 'Rambouillet',
            siren: null,
            communeCode: '78517',
            natureInsee: null,
            type: 'commune',
          },
          {
            id: 3087,
            nom: 'Saint-Arnoult-en-Yvelines',
            siren: null,
            communeCode: '78537',
            natureInsee: null,
            type: 'commune',
          },
        ],
      });
    });
  });
});
