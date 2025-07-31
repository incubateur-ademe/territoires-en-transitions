import { getTestApp, getTestRouter } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

describe('HandleMesurePilotesRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    yoloDodoUser = await getAuthUser();
  });

  test('List pilotes throws error when not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input = {
      collectiviteId: 1,
      mesureIds: ['eci_2.2.2.2'],
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
      mesureId: 'eci_2.2.2.2',
      pilotes: [{ userId: '298235a0-60e7-4ceb-9172-0a991cce0386' }],
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.referentiels.actions.upsertPilotes(input)
    ).rejects.toThrowError(/Droits insuffisants/i);
  });

  test('Insert, update and delete pilotes', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const mesureId = 'eci_2.2.2.2';
    const collectiviteId = 1;

    // Create mesure - pilotes link
    const pilotesInput = {
      collectiviteId,
      mesureId,
      pilotes: [
        { userId: '298235a0-60e7-4ceb-9172-0a991cce0386' },
        { tagId: 1 },
      ],
    };

    const pilotesResponse = await caller.referentiels.actions.upsertPilotes(
      pilotesInput
    );

    const createdPilotes = pilotesResponse[mesureId];
    expect(createdPilotes).toHaveLength(2);
    expect(createdPilotes).toEqual(
      expect.arrayContaining([
        {
          nom: expect.any(String),
          userId: '298235a0-60e7-4ceb-9172-0a991cce0386',
          tagId: null,
        },
        {
          nom: expect.any(String),
          userId: null,
          tagId: 1,
        },
      ])
    );

    // List pilotes
    const listedPilotes = await caller.referentiels.actions.listPilotes({
      collectiviteId,
      mesureIds: [mesureId],
    });
    expect(listedPilotes[mesureId]).toHaveLength(2);
    expect(listedPilotes[mesureId]).toEqual(
      expect.arrayContaining(createdPilotes)
    );

    // Update pilotes
    const updatedPilotesInput = {
      collectiviteId,
      mesureId,
      pilotes: [{ userId: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561' }],
    };

    const updatedPilotesResponse =
      await caller.referentiels.actions.upsertPilotes(updatedPilotesInput);
    const updatedPilotes = updatedPilotesResponse[mesureId];
    expect(updatedPilotes).toHaveLength(1);
    expect(updatedPilotes).toEqual([
      {
        nom: expect.any(String),
        userId: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
        tagId: null,
      },
    ]);

    // Delete pilotes
    await caller.referentiels.actions.deletePilotes({
      collectiviteId,
      mesureId,
    });

    const emptyPilotes = await caller.referentiels.actions.listPilotes({
      collectiviteId,
      mesureIds: [mesureId],
    });
    expect(emptyPilotes).toEqual({});
  });

  test('Throw error when upserting pilotes with empty pilotes array', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 1,
      mesureId: 'eci_2.2.2.2',
      pilotes: [],
    };

    await expect(() =>
      caller.referentiels.actions.upsertPilotes(input)
    ).rejects.toThrow();
  });
});
