import { inferProcedureInput } from '@trpc/server';
import { YOLO_DODO } from 'backend/test/test-users.samples';
import { getTestRouter } from '../../../test/app-utils';
import { getAnonUser, getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { type AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { ActionTypeEnum, ReferentielIdEnum } from '../index-domain';
import {
  ListActionsRequestOptionsType,
  listActionsRequestSchema,
} from './list-actions.request';

type ListActionsInput = inferProcedureInput<
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

    const input: ListActionsInput = {
      collectiviteId: 1,
      filters: {
        actionIds: ['cae_1.1.1'],
      },
    };

    await expect(
      caller.referentiels.actions.listActions(input)
    ).rejects.toThrow();
  });

  test('List a single action', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 1,
      filters: {
        actionIds: ['cae_1.1.1'],
      },
    } satisfies ListActionsInput;

    const result = await caller.referentiels.actions.listActions(input);
    expect(result.length).toEqual(input.filters.actionIds.length);

    for (const action of result) {
      expect(input.filters.actionIds).toContain(action.actionId);

      expect(action.referentiel).toBeDefined();
      expect(action.nom).toBeDefined();
      expect(action.identifiant).toBeDefined();
      expect(action.depth).toBeDefined();
      expect(action.actionType).toBeDefined();

      expect(action.statut).toBeDefined();
      expect(action.desactive).toBeDefined();
      expect(action.concerne).toBeDefined();

      expect(Array.isArray(action.pilotes)).toBe(true);
      expect(Array.isArray(action.services)).toBe(true);
    }
  });

  test('List actions from CAE & ECI at the same time', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 1,
      filters: {
        actionIds: ['cae_1.1.1', 'eci_1.3.2'],
      },
    } satisfies ListActionsInput;

    const result = await caller.referentiels.actions.listActions(input);
    expect(result.length).toEqual(input.filters.actionIds.length);

    for (const action of result) {
      expect(input.filters.actionIds).toContain(action.actionId);
    }
  });

  test('List actions with statuts', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 1,
      filters: {
        actionIds: ['cae_1.1.1', 'eci_1.3.2'],
      },
    } satisfies ListActionsInput;

    const result = await caller.referentiels.actions.listActions(input);

    expect(result.length).toEqual(input.filters.actionIds.length);

    for (const action of result) {
      expect(input.filters.actionIds).toContain(action.actionId);

      expect(action.depth).toBeDefined();
      expect(action.actionType).toBeDefined();

      expect(action.statut).toBeDefined();
      expect(action.desactive).toBeDefined();
      expect(action.concerne).toBeDefined();
    }
  });

  test('List actions with scores', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input = {
      collectiviteId: 1,
      filters: {
        actionIds: ['cae_1.1.1'],
      },
    } satisfies ListActionsInput;

    const result = await caller.referentiels.actions.listActionsWithScores(
      input
    );

    expect(result.length).toEqual(input.filters.actionIds.length);

    for (const action of result) {
      expect(input.filters.actionIds).toContain(action.actionId);

      expect(action.score).toBeDefined();
    }
  });

  test(`Request executes without filters`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: ListActionsInput = {
      collectiviteId: 1,
    };
    const result = await caller.referentiels.actions.listActions(input);
    expect(result.length).not.toBe(0);
    const toCheck = listActionsRequestSchema.safeParse(result);
    expect(toCheck.success).toBeTruthy;
  });

  test(`Request executes with filters`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const filters: ListActionsRequestOptionsType = {
      actionIds: ['cae_1.1.1', 'eci_1.3.2'],
      actionTypes: [ActionTypeEnum.ACTION, ActionTypeEnum.SOUS_ACTION],
      utilisateurPiloteIds: [yoloDodoUser.id],
      personnePiloteIds: [1],
      servicePiloteIds: [1],
      referentielIds: [ReferentielIdEnum.CAE, ReferentielIdEnum.ECI],
    };

    const input: ListActionsInput = {
      collectiviteId: 1,
      filters: filters,
    };

    const result = await caller.referentiels.actions.listActions(input);
    expect(result.length).toBe(0);
  });
});
