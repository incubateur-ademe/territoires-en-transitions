import { DatabaseService } from '@/backend/utils';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

describe('AssignServicesRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    yoloDodoUser = await getAuthUser();
  });

  test('List services throws error when not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input = {
      collectiviteId: 1,
      actionId: 'eci_2.2.2.2',
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.referentiels.actions.listServices(input)
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('Upsert services throws error when not authorized', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 3,
      actionId: 'eci_2.2.2.2',
      services: [{ serviceTagId: 1 }, { serviceTagId: 2 }],
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.referentiels.actions.upsertServices(input)
    ).rejects.toThrowError(/Droits insuffisants/i);
  });

  test('Insert, update and delete services', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const actionId = 'eci_2.2.2.2';
    const collectiviteId = 1;

    // Create action (mesure) - services link
    const servicesInput = {
      collectiviteId,
      actionId,
      services: [{ serviceTagId: 1 }, { serviceTagId: 2 }],
    };

    const createdServices = await caller.referentiels.actions.upsertServices(
      servicesInput
    );
    expect(createdServices).toHaveLength(2);
    expect(createdServices[0]).toHaveProperty('serviceTagId', 1);
    expect(createdServices[1]).toHaveProperty('serviceTagId', 2);

    // List services
    const listedServices = await caller.referentiels.actions.listServices({
      collectiviteId,
      actionId,
    });
    expect(listedServices).toHaveLength(2);
    expect(listedServices).toEqual(expect.arrayContaining(createdServices));

    // Update services
    const updatedServicesInput = {
      collectiviteId,
      actionId,
      services: [{ serviceTagId: 3 }],
    };

    const updatedServices = await caller.referentiels.actions.upsertServices(
      updatedServicesInput
    );
    expect(updatedServices).toHaveLength(1);
    expect(updatedServices[0]).toHaveProperty('serviceTagId', 3);

    // Delete services
    await caller.referentiels.actions.deleteServices({
      collectiviteId,
      actionId,
    });

    const emptyServices = await caller.referentiels.actions.listServices({
      collectiviteId,
      actionId,
    });
    expect(emptyServices).toHaveLength(0);
  });

  test('Throw error when upserting services with empty services array', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 1,
      actionId: 'eci_2.2.2.2',
      services: [],
    };

    await expect(() =>
      caller.referentiels.actions.upsertServices(input)
    ).rejects.toThrow();
  });
});
