import { YOLO_DODO } from '@/backend/test';
import {
  ActionTypeEnum,
  ListActionsRequestOptionsType,
  ReferentielIdEnum,
} from '@/domain/referentiels';
import { inferProcedureInput } from '@trpc/server';
import { getTestRouter } from '../../../test/app-utils';
import { getAnonUser, getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { type AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';

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
      collectiviteId: YOLO_DODO.collectiviteId.id,
    });

    await caller.referentiels.snapshots.computeAndUpsert({
      referentielId: ReferentielIdEnum.ECI,
      collectiviteId: YOLO_DODO.collectiviteId.id,
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

  test('List actions with statuts and scores', async () => {
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

  test('List action summaries, not authenticated', async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    await expect(
      caller.referentiels.actions.listActionSummaries({
        collectiviteId: YOLO_DODO.collectiviteId.id,
        referentielId: 'eci',
        actionTypes: [ActionTypeEnum.AXE],
      })
    ).rejects.toThrow();
  });

  test('List action summaries', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const result = await caller.referentiels.actions.listActionSummaries({
      collectiviteId: YOLO_DODO.collectiviteId.id,
      referentielId: 'eci',
      actionTypes: [
        ActionTypeEnum.AXE,
        ActionTypeEnum.SOUS_AXE, // pas de sous-axe pour eci mais ne gêne pas le fonctionnement
        ActionTypeEnum.ACTION,
        ActionTypeEnum.SOUS_ACTION,
      ],
    });

    expect(result.length).toBe(106);
    expect(result[0]).toMatchObject({
      id: 'eci_1',
      referentiel: 'eci',
      children: ['eci_1.1', 'eci_1.2', 'eci_1.3'],
      depth: 1,
      type: 'axe',
      identifiant: '1',
      nom: "Définition d'une stratégie globale de la politique économie circulaire et inscription dans le territoire",
      description: '',
      haveExemples: false,
      haveQuestions: false,
      phase: null,
    });

    expect(result.find((r) => r.id === 'eci_1.1')).toMatchObject({
      id: 'eci_1.1',
      referentiel: 'eci',
      children: [
        'eci_1.1.1',
        'eci_1.1.2',
        'eci_1.1.3',
        'eci_1.1.4',
        'eci_1.1.5',
      ],
      depth: 2,
      type: 'action',
      identifiant: '1.1',
      nom: 'Définir une stratégie globale de la politique Economie Circulaire et assurer un portage politique fort',
      description: expect.any(String),
      haveExemples: true,
      haveQuestions: false,
      phase: null,
    });

    expect(result.find((r) => r.id === 'eci_1.1.1')).toMatchObject({
      id: 'eci_1.1.1',
      referentiel: 'eci',
      children: [
        'eci_1.1.1.1',
        'eci_1.1.1.2',
        'eci_1.1.1.3',
        'eci_1.1.1.4',
        'eci_1.1.1.5',
      ],
      depth: 3,
      type: 'sous-action',
      identifiant: '1.1.1',
      nom: "S'engager politiquement et mettre en place des moyens",
      description: expect.any(String),
      haveExemples: true,
      haveQuestions: false,
      phase: 'bases',
    });
  });

  test('List action summaries down to tache', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const result = await caller.referentiels.actions.listActionSummaries({
      collectiviteId: YOLO_DODO.collectiviteId.id,
      referentielId: 'cae',
      identifiant: '1.1.1',
      actionTypes: [ActionTypeEnum.SOUS_ACTION, ActionTypeEnum.TACHE],
    });

    expect(result.length).toBe(28);
    expect(result[0]).toMatchObject({
      children: ['cae_1.1.1.1.1', 'cae_1.1.1.1.2'],
      depth: 4,
      description: '',
      haveExemples: false,
      haveQuestions: false,
      id: 'cae_1.1.1.1',
      identifiant: '1.1.1.1',
      nom: 'Formaliser la vision et les engagements',
      phase: 'bases',
      referentiel: 'cae',
      type: 'sous-action',
    });

    expect(result.find((r) => r.id === 'cae_1.1.1.1.1')).toMatchObject({
      children: [],
      depth: 5,
      description: '',
      haveExemples: false,
      haveQuestions: false,
      id: 'cae_1.1.1.1.1',
      identifiant: '1.1.1.1.1',
      nom: 'Formaliser une vision et des engagements dans une décision de politique générale (délibération)',
      phase: null,
      referentiel: 'cae',
      type: 'tache',
    });
  });
});
