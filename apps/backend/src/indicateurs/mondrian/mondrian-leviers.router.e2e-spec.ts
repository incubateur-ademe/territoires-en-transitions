import { getAnonUser, getAuthUser, YOLO_DODO } from '@/backend/test';
import {
  AuthenticatedUser,
  AuthRole,
  AuthUser,
} from '@/backend/users/models/auth.models';
import { getTestRouter } from '../../../test/app-utils';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

describe('Route de récupération des données Mondrian Leviers', () => {
  let router: TrpcRouter;
  let anonUser: AuthUser<AuthRole.ANON>;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    anonUser = getAnonUser();
    yoloDodoUser = await getAuthUser(YOLO_DODO);
  });

  test('Non autorisé si non authentifié ou anonyme', async () => {
    const caller = router.createCaller({ user: null });

    await expect(async () => {
      await caller.indicateurs.mondrian.getData({
        collectiviteId: 1,
      });
    }).rejects.toThrowError(/not authenticated/i);

    const anonymousCaller = router.createCaller({ user: anonUser });

    await expect(async () => {
      await anonymousCaller.indicateurs.mondrian.getData({
        collectiviteId: 1,
      });
    }).rejects.toThrowError(/not authenticated/i);
  });

  test('Commune collectivite not supported', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(async () => {
      await caller.indicateurs.mondrian.getData({
        collectiviteId: 1,
      });
    }).rejects.toThrowError(/ doit être un epci/i);
  });

  test('Visite for collectivite with siren 246700488', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const siren = '246700488';
    // On récupère / recalule la trajectoire car nécessaire
    await caller.indicateurs.trajectoires.snbc.getOrCompute({
      siren: siren,
    });

    const result = await caller.indicateurs.mondrian.getData({
      siren: siren,
    });

    expect(result).toBeDefined();
  }, 30000);
});
