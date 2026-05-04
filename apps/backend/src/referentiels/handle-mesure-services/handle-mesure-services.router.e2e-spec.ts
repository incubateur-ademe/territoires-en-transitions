import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase, getTestRouter } from '../../../test/app-utils';
import { getAuthUserFromUserCredentials } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { addTestUser } from '../../users/users/users.test-fixture';
import { TrpcRouter } from '../../utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';

describe('HandleMesureServicesRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let testUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);
    const testUserResult = await addTestUser(db, {
      collectiviteId: 1,
      role: CollectiviteRole.ADMIN,
    });
    testUser = getAuthUserFromUserCredentials(testUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('Upsert services throws error when not authorized', async () => {
    const caller = router.createCaller({ user: testUser });

    const input = {
      collectiviteId: 3,
      mesureId: 'eci_2.2.2.2',
      services: [{ serviceTagId: 1 }, { serviceTagId: 2 }],
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.referentiels.actions.upsertServices(input)
    ).rejects.toThrowError(/Droits insuffisants/i);
  });

  test('Insert, update and delete services', async () => {
    const caller = router.createCaller({ user: testUser });
    const mesureId = 'eci_2.2.2.2';
    const collectiviteId = 1;

    // Create mesure - services link
    const servicesInput = {
      collectiviteId,
      mesureId,
      services: [{ serviceTagId: 1 }, { serviceTagId: 2 }],
    };

    const servicesResponse = await caller.referentiels.actions.upsertServices(
      servicesInput
    );

    const createdServices = servicesResponse[mesureId];
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

    // Update services
    const updatedServicesInput = {
      collectiviteId,
      mesureId,
      services: [{ serviceTagId: 3 }],
    };

    const updatedServicesResponse =
      await caller.referentiels.actions.upsertServices(updatedServicesInput);
    const updatedServices = updatedServicesResponse[mesureId];
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

    const emptyServices = await caller.referentiels.actions.deleteServices({
      collectiviteId,
      mesureId,
    });
    expect(emptyServices).toEqual({});
  });

  test('Throw error when upserting services with empty services array', async () => {
    const caller = router.createCaller({ user: testUser });

    const input = {
      collectiviteId: 1,
      mesureId: 'eci_2.2.2.2',
      services: [],
    };

    await expect(() =>
      caller.referentiels.actions.upsertServices(input)
    ).rejects.toThrow();
  });

});
