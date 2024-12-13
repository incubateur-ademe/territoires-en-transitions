import { inferProcedureInput } from '@trpc/server';
import { getTestRouter } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AppRouter, TrpcRouter } from '../../trpc/trpc.router';
import { AuthenticatedUser } from './../../auth/models/auth.models';
import {
  GetFilteredIndicateurRequestQueryOptionType,
  GetFilteredIndicateursRequestOptionType,
} from './get-filtered-indicateurs.request';
import { getFilteredIndicateurResponseSchema } from './get-filtered-indicateurs.response';

type Input = inferProcedureInput<AppRouter['indicateurs']['filtre']['list']>;

describe('Route de lecture des indicateurs filtrés', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  const queryOptions: GetFilteredIndicateurRequestQueryOptionType = {
    page: 1,
    limit: 10,
    sort: [
      {
        field: 'estComplet',
        direction: 'asc',
      },
    ],
  };

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
  });

  test(`Test que la requête s'exécute sans filtres`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const filtre: GetFilteredIndicateursRequestOptionType = {};

    const input: Input = {
      collectiviteId: 1,
      filtre: filtre,
      queryOptions: queryOptions,
    };
    const result = await caller.indicateurs.filtre.list(input);
    expect(result.length).not.toBe(0);
    const toCheck = getFilteredIndicateurResponseSchema.safeParse(result);
    expect(toCheck.success).toBeTruthy;
  });

  test(`Test que la requête s'exécute avec tous les filtres`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const filtre: GetFilteredIndicateursRequestOptionType = {
      actionId: 'eci_2',
      participationScore: false,
      estComplet: false,
      estConfidentiel: true,
      estFavorisCollectivite: true,
      fichesNonClassees: true,
      text: 'de',
      estPerso: false,
      categorieNoms: ['cae'],
      hasOpenData: true,
      thematiqueIds: [1],
      planActionIds: [1],
      utilisateurPiloteIds: ['t'],
      personnePiloteIds: [1],
      servicePiloteIds: [1],
      ficheActionIds: [1],
      withChildren: false,
    };

    const input: Input = {
      collectiviteId: 1,
      filtre: filtre,
      queryOptions: queryOptions,
    };

    const result = await caller.indicateurs.filtre.list(input);
    expect(result.length).toBe(0);
  });
});
