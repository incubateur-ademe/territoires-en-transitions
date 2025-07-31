import { getAnonUser } from '@/backend/test';
import { AuthRole, AuthUser } from '@/backend/users/models/auth.models';
import { inferProcedureInput } from '@trpc/server';
import { getTestRouter } from '../../../test/app-utils';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';

type Input = inferProcedureInput<
  AppRouter['collectivites']['collectivites']['list']
>;

describe('Route de recherche des collectivités', () => {
  let router: TrpcRouter;
  let anonUser: AuthUser<AuthRole.ANON>;

  beforeAll(async () => {
    router = await getTestRouter();
    anonUser = getAnonUser();
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
    const lionAngers = result.find((c) => c.nom.includes("Le Lion-d'Angers"));
    expect(lionAngers).toBeDefined();
  });

  test(`Requête avec filtre insensible aux accents`, async () => {
    const caller = router.createCaller({ user: anonUser });

    const input: Input = {
      text: 'bage',
    };

    const result = await caller.collectivites.collectivites.list(input);
    expect(result.length).toBeGreaterThan(0);

    const collectivite = result.find((c) => c.nom.includes('Bâgé-Dommartin'));
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
});
