import { getAuthUser, getTestRouter } from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { AppRouter, TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { inferProcedureInput } from '@trpc/server';

type inputType = inferProcedureInput<
  AppRouter['collectivites']['recherches']['collectivites']
>;

const input: inputType = {
  typesPlan: [],
  regions: [],
  departments: [],
  typesCollectivite: [],
  population: [],
  referentiel: [],
  niveauDeLabellisation: [],
  realiseCourant: [],
  tauxDeRemplissage: [],
  nbCards: 2,
};

const inputWithCondition: inputType = {
  typesPlan: [1, 2],
  nom: 'test avec condition',
  regions: ['27'],
  departments: ['51', '31'],
  typesCollectivite: ['syndicat'],
  population: ['<20000'],
  referentiel: ['eci'],
  niveauDeLabellisation: ['1', '2'],
  realiseCourant: ['50-64', '35-49'],
  tauxDeRemplissage: ['80-99'],
  trierPar: ['score'],
  page: 2,
  nbCards: 2,
};

/**
 * Test que les requêtes s'executent correctement càd sans erreurs de syntaxe
 */
describe('Test recherches collectivite', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
  });

  test('Test tab "Collectivités"', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.collectivites.recherches.collectivites(input);
    expect(result.items.length).toEqual(2);
  });

  test('Test tab "Collectivités" avec conditions', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.collectivites.recherches.collectivites(
      inputWithCondition
    );
    expect(result.items.length).toEqual(0);
  });

  test('Test tab "Référentiels"', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.collectivites.recherches.referentiels(input);
    expect(result.items.length).toEqual(2);
  });

  test('Test tab "Référentiels" avec conditions', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.collectivites.recherches.referentiels(
      inputWithCondition
    );
    expect(result.items.length).toEqual(0);
  });

  test('Test tab "Plans d action"', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.collectivites.recherches.plans(input);
    expect(result.items.length).toEqual(2);
  });

  test('Test tab "Plans d action" avec conditions', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.collectivites.recherches.plans(
      inputWithCondition
    );
    expect(result.items.length).toEqual(0);
  });
});
