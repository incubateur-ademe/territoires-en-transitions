import { getTestApp, getTestRouter } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

describe('HandleMesureServicesRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    yoloDodoUser = await getAuthUser();
  });

  test('List services throws error when not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input = {
      collectiviteId: 1,
      actionIds: ['eci_2.2.2.2'],
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

    const servicesResponse = await caller.referentiels.actions.upsertServices(
      servicesInput
    );

    const createdServices = servicesResponse[actionId];
    expect(createdServices).toHaveLength(2);
    expect(createdServices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          collectiviteId: 1,
          id: 1,
          nom: expect.any(String),
        }),
        expect.objectContaining({
          collectiviteId: 1,
          id: 2,
          nom: expect.any(String),
        }),
      ])
    );

    // List services
    const listedServices = await caller.referentiels.actions.listServices({
      collectiviteId,
      actionIds: [actionId],
    });
    expect(listedServices[actionId]).toHaveLength(2);
    expect(listedServices[actionId]).toEqual(
      expect.arrayContaining(createdServices)
    );

    // Update services
    const updatedServicesInput = {
      collectiviteId,
      actionId,
      services: [{ serviceTagId: 3 }],
    };

    const updatedServicesResponse =
      await caller.referentiels.actions.upsertServices(updatedServicesInput);
    const updatedServices = updatedServicesResponse[actionId];
    expect(updatedServices).toHaveLength(1);
    expect(updatedServices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          collectiviteId: 1,
          id: 3,
          nom: expect.any(String),
        }),
      ])
    );

    // Delete services
    await caller.referentiels.actions.deleteServices({
      collectiviteId,
      actionId,
    });

    const emptyServices = await caller.referentiels.actions.listServices({
      collectiviteId,
      actionIds: [actionId],
    });

    expect(emptyServices).toEqual({});
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

  test('List all services for a collectivité', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const collectiviteId = 1;

    const actionId1 = 'eci_2.2.2.1';
    const actionId2 = 'eci_2.2.2.2';

    await caller.referentiels.actions.upsertServices({
      collectiviteId,
      actionId: actionId1,
      services: [{ serviceTagId: 1 }, { serviceTagId: 2 }],
    });

    await caller.referentiels.actions.upsertServices({
      collectiviteId,
      actionId: actionId2,
      services: [{ serviceTagId: 3 }],
    });

    const allServices = await caller.referentiels.actions.listServices({
      collectiviteId,
    });

    expect(allServices).toHaveProperty(actionId1);
    expect(allServices).toHaveProperty(actionId2);
    expect(allServices[actionId1]).toHaveLength(2);
    expect(allServices[actionId2]).toHaveLength(1);

    expect(allServices[actionId1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          collectiviteId: 1,
          id: 1,
          nom: expect.any(String),
        }),
        expect.objectContaining({
          collectiviteId: 1,
          id: 2,
          nom: expect.any(String),
        }),
      ])
    );

    expect(allServices[actionId2]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          collectiviteId: 1,
          id: 3,
          nom: expect.any(String),
        }),
      ])
    );
  });
});
