import { inferProcedureInput } from '@trpc/server';
import { YOLO_DODO } from 'backend/test/test-users.samples';
import { getTestRouter } from '../../../test/app-utils';
import { getAnonUser, getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { type AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { ReferentielIdEnum } from '../index-domain';

type Input = inferProcedureInput<
  AppRouter['referentiels']['actions']['listActions']
>;

describe('ActionStatutListRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();

    const caller = router.createCaller({ user: yoloDodoUser });

    await caller.referentiels.snapshots.computeAndUpsert({
      referentielId: ReferentielIdEnum.CAE,
      collectiviteId: YOLO_DODO.collectiviteId.edition,
    });

    await caller.referentiels.snapshots.computeAndUpsert({
      referentielId: ReferentielIdEnum.ECI,
      collectiviteId: YOLO_DODO.collectiviteId.edition,
    });
  });

  test('not authenticated = no access', async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    const input: Input = {
      collectiviteId: 1,
      actionIds: ['cae_1.1.1'],
    };

    await expect(
      caller.referentiels.actions.listActions(input)
    ).rejects.toThrow();
  });

  test('List a single action', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 1,
      actionIds: ['cae_1.1.1'],
    } satisfies Input;

    const result = await caller.referentiels.actions.listActions(input);
    expect(result.length).toEqual(input.actionIds.length);

    for (const action of result) {
      expect(input.actionIds).toContain(action.actionId);

      expect(action.referentiel).toBeDefined();
      expect(action.nom).toBeDefined();
      expect(action.identifiant).toBeDefined();
      expect(action.depth).toBeDefined();
      expect(action.actionType).toBeDefined();

      expect(action).not.toHaveProperty('statut');
    }
  });

  test('List actions from CAE & ECI at the same time', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 1,
      actionIds: ['cae_1.1.1', 'eci_1.3.2'],
    } satisfies Input;

    const result = await caller.referentiels.actions.listActions(input);
    expect(result.length).toEqual(input.actionIds.length);

    for (const action of result) {
      expect(input.actionIds).toContain(action.actionId);
    }
  });

  test('List actions with statuts', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 1,
      actionIds: ['cae_1.1.1', 'eci_1.3.2'],
    } satisfies Input;

    const result = await caller.referentiels.actions.listActionsWithStatuts(
      input
    );
    expect(result.length).toEqual(input.actionIds.length);

    for (const action of result) {
      expect(input.actionIds).toContain(action.actionId);

      expect(action.depth).toBeDefined();
      expect(action.actionType).toBeDefined();

      // Specific fields when `withStatuts` is true
      expect(action.statut).toBeDefined();
      expect(action.desactive).toBeDefined();
      expect(action.concerne).toBeDefined();
    }
  });
});
