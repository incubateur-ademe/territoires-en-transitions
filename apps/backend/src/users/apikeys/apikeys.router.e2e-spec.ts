import {
  getAuthUserFromUserCredentials,
  getServiceRoleUser,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { INestApplication } from '@nestjs/common';

describe('Apikeys router test', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let testUser: AuthenticatedUser;
  let testUser2: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    const db = await getTestDatabase(app);

    const testUser1Result = await addTestUser(db);
    testUser = getAuthUserFromUserCredentials(testUser1Result.user);

    const testUser2Result = await addTestUser(db);
    testUser2 = getAuthUserFromUserCredentials(testUser2Result.user);
  });

  test(`Test generate, list & delete apikey by the user himself`, async () => {
    const caller = router.createCaller({ user: testUser });

    const creationResult = await caller.users.apikeys.create({
      userId: testUser.id,
    });

    const listResult = await caller.users.apikeys.list();
    const foundApikey = listResult.find(
      (item) => item.clientId === creationResult.clientId
    );
    expect(foundApikey).toBeDefined();

    await caller.users.apikeys.delete({
      clientId: creationResult.clientId,
    });

    const listResultAfterDelete = await caller.users.apikeys.list();
    const foundApikeyAfterDelete = listResultAfterDelete.find(
      (item) => item.clientId === creationResult.clientId
    );
    expect(foundApikeyAfterDelete).toBeUndefined();
  });

  test(`Can't generate an api key for another user`, async () => {
    const caller = router.createCaller({ user: testUser2 });

    await expect(
      caller.users.apikeys.create({
        userId: testUser.id,
      })
    ).rejects.toThrowError(
      /is not authorized to generate an API key for user/i
    );
  });

  test(`Can't delete an api key for another user`, async () => {
    const testUserCaller = router.createCaller({ user: testUser });
    const youloudoudouCaller = router.createCaller({ user: testUser2 });

    const creationResult = await testUserCaller.users.apikeys.create({
      userId: testUser.id,
    });

    await expect(
      youloudoudouCaller.users.apikeys.delete({
        clientId: creationResult.clientId,
      })
    ).rejects.toThrowError(/is not authorized to delete an API key for user/i);
  });

  test(`Test generate, list & delete apikey by a service role`, async () => {
    const caller = router.createCaller({ user: getServiceRoleUser() });

    const creationResult = await caller.users.apikeys.create({
      userId: testUser.id,
    });

    const listResult = await caller.users.apikeys.list();
    const foundApikey = listResult.find(
      (item) => item.clientId === creationResult.clientId
    );
    expect(foundApikey).toBeDefined();

    await caller.users.apikeys.delete({
      clientId: creationResult.clientId,
    });

    const listResultAfterDelete = await caller.users.apikeys.list();
    const foundApikeyAfterDelete = listResultAfterDelete.find(
      (item) => item.clientId === creationResult.clientId
    );
    expect(foundApikeyAfterDelete).toBeUndefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
