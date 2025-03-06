import { DatabaseService } from '@/backend/utils';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

describe('AssignPilotesRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    yoloDodoUser = await getAuthUser();
  });

  test('List pilotes throws error when not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input = {
      collectiviteId: 1,
      actionId: 'eci_2.2.2.2',
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.referentiels.actions.listPilotes(input)
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('Upsert pilotes throws error when not authorized', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 3,
      actionId: 'eci_2.2.2.2',
      pilotes: [{ userId: '298235a0-60e7-4ceb-9172-0a991cce0386', tagId: 1 }],
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.referentiels.actions.upsertPilotes(input)
    ).rejects.toThrowError(/Droits insuffisants/i);
  });

  test('Insert, update and delete pilotes', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const actionId = 'eci_2.2.2.2';
    const collectiviteId = 1;

    // Create action (mesure) - pilotes link
    const pilotesInput = {
      collectiviteId,
      actionId,
      pilotes: [
        { userId: '298235a0-60e7-4ceb-9172-0a991cce0386', tagId: undefined },
        { userId: undefined, tagId: 1 },
      ],
    };

    const createdPilotes = await caller.referentiels.actions.upsertPilotes(
      pilotesInput
    );

    console.log('Created pilotes:', JSON.stringify(createdPilotes, null, 2));

    expect(createdPilotes).toHaveLength(2);
    expect(createdPilotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: '298235a0-60e7-4ceb-9172-0a991cce0386',
          tagId: null,
        }),
        expect.objectContaining({
          userId: null,
          tagId: 1,
        }),
      ])
    );

    // List pilotes
    const listedPilotes = await caller.referentiels.actions.listPilotes({
      collectiviteId,
      actionId,
    });
    expect(listedPilotes).toHaveLength(2);
    expect(listedPilotes).toEqual(expect.arrayContaining(createdPilotes));

    // Update pilotes
    const updatedPilotesInput = {
      collectiviteId,
      actionId,
      pilotes: [
        { userId: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561', tagId: undefined },
      ],
    };

    const updatedPilotes = await caller.referentiels.actions.upsertPilotes(
      updatedPilotesInput
    );
    expect(updatedPilotes).toHaveLength(1);
    expect(updatedPilotes[0]).toHaveProperty(
      'userId',
      '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'
    );
    expect(updatedPilotes[0]).toHaveProperty('tagId', null);

    // Delete pilotes
    await caller.referentiels.actions.deletePilotes({
      collectiviteId,
      actionId,
    });

    const emptyPilotes = await caller.referentiels.actions.listPilotes({
      collectiviteId,
      actionId,
    });
    expect(emptyPilotes).toHaveLength(0);
  });

  test('Throw error when upserting pilotes with empty pilotes array', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 1,
      actionId: 'eci_2.2.2.2',
      pilotes: [],
    };

    await expect(() =>
      caller.referentiels.actions.upsertPilotes(input)
    ).rejects.toThrow();
  });
});
