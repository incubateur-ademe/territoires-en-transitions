import { getAnonUser, getServiceRoleUser } from '@/backend/test';
import { AuthRole, AuthUser } from '@/backend/users/models/auth.models';
import { getTestRouter } from '../../../test/app-utils';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

describe("Route d'import des relations entre collectivités", () => {
  let router: TrpcRouter;
  let anonUser: AuthUser<AuthRole.ANON>;
  let serviceRoleUser: AuthUser<AuthRole.SERVICE_ROLE>;

  beforeAll(async () => {
    router = await getTestRouter();
    anonUser = getAnonUser();
    serviceRoleUser = getServiceRoleUser();
  });

  test('Non autorisé si pas service role', async () => {
    const noUserCaller = router.createCaller({ user: null });

    await expect(async () => {
      await noUserCaller.collectivites.relations.importEpciCommunesRelations();
    }).rejects.toThrowError(/not service role/i);
    await expect(async () => {
      await noUserCaller.collectivites.relations.importSyndicatEpciRelations();
    }).rejects.toThrowError(/not service role/i);

    const anonCaller = router.createCaller({ user: anonUser });
    await expect(async () => {
      await anonCaller.collectivites.relations.importEpciCommunesRelations();
    }).rejects.toThrowError(/not service role/i);
    await expect(async () => {
      await anonCaller.collectivites.relations.importSyndicatEpciRelations();
    }).rejects.toThrowError(/not service role/i);
  });

  test('Relations correctement créées', async () => {
    const serviceRoleCaller = router.createCaller({ user: serviceRoleUser });
    const importEpciCommunesRelationsResult =
      await serviceRoleCaller.collectivites.relations.importEpciCommunesRelations();
    expect(importEpciCommunesRelationsResult.processed).toBeGreaterThan(0);
    expect(importEpciCommunesRelationsResult.created).toBeGreaterThan(0);

    const importSyndicatEpciRelationsResult =
      await serviceRoleCaller.collectivites.relations.importSyndicatEpciRelations();
    expect(importSyndicatEpciRelationsResult.processed).toBeGreaterThan(0);
    expect(importSyndicatEpciRelationsResult.created).toBeGreaterThan(0);
  });
});
