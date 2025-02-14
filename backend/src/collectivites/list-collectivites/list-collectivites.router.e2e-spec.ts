import { inferProcedureInput } from '@trpc/server';
import { getTestRouter } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';

type Input = inferProcedureInput<
  AppRouter['collectivites']['collectivites']['list']
>;

describe('Route de recherche des collectivités', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
  });

  test(`Requête sans filtre et sans authentification`, async () => {
    const caller = router.createCaller({ user: null });

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
    const caller = router.createCaller({ user: null });

    const input: Input = {
      text: 'Angers',
    };

    const result = await caller.collectivites.collectivites.list(input);
    expect(result.length).toBeGreaterThan(0);
  });

  test(`Requête avec filtre avancé`, async () => {
    const caller = router.createCaller({ user: null });

    const input: Input = {
      text: 'lion angers',
    };

    const result = await caller.collectivites.collectivites.list(input);
    expect(result.length).toBeGreaterThan(0);

    // Vérifie que le résultat contient bien "Lion d'Angers"
    const lionAngers = result.find((c) => c.nom.includes("Le Lion-d'Angers"));
    expect(lionAngers).toBeDefined();

    const resultWithNonExistentText =
      await caller.collectivites.collectivites.list({
        text: 'NonExistentText',
      });
    expect(resultWithNonExistentText.length).toBe(0);
  });
});
