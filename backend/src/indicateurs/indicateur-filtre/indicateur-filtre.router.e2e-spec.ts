import {
  GetFilteredIndicateurRequestQueryOptionType,
  GetFilteredIndicateursRequestOptionType
} from './get-filtered-indicateurs.request';
import { getTestRouter } from '../../../test/common/app-utils';
import { AuthenticatedUser } from './../../auth/models/auth.models';
import { getYoloDodoUser } from '../../../test/auth/auth-utils';
import { inferProcedureInput } from '@trpc/server';
import { AppRouter, TrpcRouter } from '../../trpc/trpc.router';
import {
  getFilteredIndicateurResponseSchema
} from './get-filtered-indicateurs.response';

type Input = inferProcedureInput<AppRouter['indicateurs']['filtre']>;

describe('Route de lecture des indicateurs filtrés', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  const queryOptions: GetFilteredIndicateurRequestQueryOptionType = {
    page: 1,
    limit: 10,
    sort: [
      {
        field: 'estComplet',
        direction: 'asc'
      }
    ]
  };

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getYoloDodoUser();
  });

  it(`Test que la requête s'exécute sans filtres`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const filtre: GetFilteredIndicateursRequestOptionType = {};

    const input: Input = {
      collectiviteId: 1,
      filtre: filtre,
      queryOptions: queryOptions
    };
    const result = await caller.indicateurs.filtre.getFilteredIndicateur(input);
    console.log(JSON.stringify(result, null, 4));
    const toCheck = getFilteredIndicateurResponseSchema.safeParse(result.body);
    expect(toCheck.success).toBeTruthy;
  });

  it(`Test que la requête s'exécute avec tous les filtres`, async () => {
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
      withChildren: false
    };

    const input: Input = {
      collectiviteId: 1,
      filtre: filtre,
      queryOptions: queryOptions
    };

    const result = await caller.indicateurs.filtre.getFilteredIndicateur(input);
  });
});
