import {
  getAuthUser,
  getServiceRoleUser,
  getTestApp,
  YOULOU_DOUDOU,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { INestApplication } from '@nestjs/common';

describe('Apikeys router test', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let youlouDoudouUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    yoloDodoUser = await getAuthUser();
    youlouDoudouUser = await getAuthUser(YOULOU_DOUDOU);
  });

  test(`Test generate, list & delete apikey by the user himself`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const creationResult = await caller.users.apikeys.create({
      userId: yoloDodoUser.id,
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
    const caller = router.createCaller({ user: youlouDoudouUser });

    await expect(
      caller.users.apikeys.create({
        userId: yoloDodoUser.id,
      })
    ).rejects.toThrowError(
      /is not authorized to generate an API key for user/i
    );
  });

  test(`Can't delete an api key for another user`, async () => {
    const yolododoCaller = router.createCaller({ user: yoloDodoUser });
    const youloudoudouCaller = router.createCaller({ user: youlouDoudouUser });

    const creationResult = await yolododoCaller.users.apikeys.create({
      userId: yoloDodoUser.id,
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
      userId: yoloDodoUser.id,
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
