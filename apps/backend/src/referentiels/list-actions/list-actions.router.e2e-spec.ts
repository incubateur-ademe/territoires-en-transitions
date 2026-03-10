import { INestApplication } from '@nestjs/common';
import {
  ActionCategorieEnum,
  ActionType,
  ActionTypeEnum,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';
import {
  getAnonUser,
  getAuthUserFromUserCredentials,
} from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { addTestUser } from '../../users/users/users.test-fixture';
import { type AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';

import { getTestRouter } from '../../../test/app-utils';
import { getAnonUser, getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

type ListActionsInput = inferProcedureInput<
  AppRouter['referentiels']['actions']['listActions']
>;

describe('ActionStatutListRouter', () => {
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

    const caller = router.createCaller({ user: testUser });

    await caller.referentiels.snapshots.computeAndUpsert({
      referentielId: ReferentielIdEnum.CAE,
      collectiviteId: 1,
    });

    await caller.referentiels.snapshots.computeAndUpsert({
      referentielId: ReferentielIdEnum.ECI,
      collectiviteId: 1,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('not authenticated = no access', async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    await expect(
      caller.referentiels.actions.listActionsGroupedById({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
      })
    ).rejects.toThrow();
  });

  test('List a single action', async () => {
    const caller = router.createCaller({ user: testUser });

    const input = {
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
    };

    const result = await caller.referentiels.actions.listActionsGroupedById(
      input
    );

    const entries = Object.entries(result);

    expect(entries.length).toBeGreaterThan(0);

    for (const [actionId, action] of entries) {
      expect(actionId).toContain(input.referentielId);

      expect(action.referentielId).toBeDefined();
      expect(action.nom).toBeDefined();
      expect(action.identifiant).toBeDefined();
      expect(action.depth).toBeDefined();
      expect(action.actionType).toBeDefined();

      const statutApplicableSurScore =
        action.actionType === ActionTypeEnum.SOUS_ACTION ||
        action.actionType === ActionTypeEnum.TACHE;
      if (statutApplicableSurScore) {
        expect(action.score.statut).toBeDefined();
      } else {
        expect(action.score.statut).toBeUndefined();
      }
      expect(action.score.desactive).toBeDefined();
      expect(action.score.concerne).toBeDefined();

      expect(Array.isArray(action.pilotes)).toBe(true);
      expect(Array.isArray(action.services)).toBe(true);
    }
  });

  test('List actions from CAE & ECI at the same time', async () => {
    const caller = router.createCaller({ user: testUser });

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
    const caller = router.createCaller({ user: testUser });

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
    const caller = router.createCaller({ user: testUser });

    const input: ListActionsInput = {
      collectiviteId: 1,
    };
    const result = await caller.referentiels.actions.listActions(input);
    expect(result.length).not.toBe(0);
  });

  test(`Request executes with filters`, async () => {
    const caller = router.createCaller({ user: testUser });

    const filters: ListActionsInput = {
      actionIds: ['cae_1.1.1', 'eci_1.3.2'],
      actionTypes: [ActionTypeEnum.ACTION, ActionTypeEnum.SOUS_ACTION],
      utilisateurPiloteIds: [testUser.id],
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
        collectiviteId: 1,
        referentielId: 'eci',
        actionTypes: [ActionTypeEnum.AXE],
      })
    ).rejects.toThrow();
  });

  test('List action summaries', async () => {
    const caller = router.createCaller({ user: testUser });

    const actionsGroupedById =
      await caller.referentiels.actions.listActionsGroupedById({
        collectiviteId: 1,
        referentielId: 'eci',
      });

    const entries = Object.entries(actionsGroupedById);
    expect(entries.length).toBeGreaterThan(0);

    const actionTypes: ActionType[] = [
      ActionTypeEnum.AXE,
      ActionTypeEnum.SOUS_AXE, // pas de sous-axe pour eci mais ne gêne pas le fonctionnement
      ActionTypeEnum.ACTION,
      ActionTypeEnum.SOUS_ACTION,
    ];

    const result = entries
      .filter(([_, action]) => actionTypes.includes(action.actionType))
      .map(([_, action]) => action);

    expect(result.length).toBe(106);

    expect(result[0]).toMatchObject({
      actionId: 'eci_1',
      referentiel: 'eci',
      childrenIds: ['eci_1.1', 'eci_1.2', 'eci_1.3'],
      depth: 1,
      actionType: ActionTypeEnum.AXE,
      identifiant: '1',
      nom: "Définition d'une stratégie globale de la politique économie circulaire et inscription dans le territoire",
      description: '',
      exemples: '',
      questionIds: [],
      categorie: null,
    });

    expect(
      result.find((action) => action.actionId === 'eci_1.1')
    ).toMatchObject({
      actionId: 'eci_1.1',
      referentielId: ReferentielIdEnum.ECI,
      referentiel: ReferentielIdEnum.ECI,
      childrenIds: [
        'eci_1.1.1',
        'eci_1.1.2',
        'eci_1.1.3',
        'eci_1.1.4',
        'eci_1.1.5',
      ],
      depth: 2,
      actionType: ActionTypeEnum.ACTION,
      identifiant: '1.1',
      nom: 'Définir une stratégie globale de la politique Economie Circulaire et assurer un portage politique fort',
      description: expect.any(String),
      exemples: expect.any(String),
      questionIds: [],
      categorie: null,
    });

    expect(
      result.find((action) => action.actionId === 'eci_1.1.1')
    ).toMatchObject({
      actionId: 'eci_1.1.1',
      referentiel: 'eci',
      childrenIds: [
        'eci_1.1.1.1',
        'eci_1.1.1.2',
        'eci_1.1.1.3',
        'eci_1.1.1.4',
        'eci_1.1.1.5',
      ],
      depth: 3,
      actionType: ActionTypeEnum.SOUS_ACTION,
      identifiant: '1.1.1',
      nom: "S'engager politiquement et mettre en place des moyens",
      description: expect.any(String),
      exemples: expect.any(String),
      questionIds: [],
      categorie: ActionCategorieEnum.BASES,
    });
  });

  test('List CAE action summaries down to tache', async () => {
    const caller = router.createCaller({ user: testUser });

    const actionsGroupedById =
      await caller.referentiels.actions.listActionsGroupedById({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
      });

    const entries = Object.entries(actionsGroupedById);
    expect(entries.length).toBeGreaterThan(0);

    const actionTypes: ActionType[] = [
      ActionTypeEnum.SOUS_ACTION,
      ActionTypeEnum.TACHE,
    ];

    const result = entries
      .filter(
        ([_, action]) =>
          actionTypes.includes(action.actionType) &&
          action.actionId.startsWith('cae_1.1.1')
      )
      .map(([_, action]) => action);

    expect(result.length).toBe(28);
    expect(result[0]).toMatchObject({
      childrenIds: ['cae_1.1.1.1.1', 'cae_1.1.1.1.2'],
      depth: 4,
      description: '',
      exemples: '',
      questionIds: [],
      actionId: 'cae_1.1.1.1',
      identifiant: '1.1.1.1',
      nom: 'Formaliser la vision et les engagements',
      categorie: ActionCategorieEnum.BASES,
      referentielId: ReferentielIdEnum.CAE,
      referentiel: ReferentielIdEnum.CAE,
      actionType: ActionTypeEnum.SOUS_ACTION,
    });

    expect(
      result.find((action) => action.actionId === 'cae_1.1.1.1.1')
    ).toMatchObject({
      childrenIds: [],
      depth: 5,
      description: '',
      exemples: '',
      questionIds: [],
      actionId: 'cae_1.1.1.1.1',
      identifiant: '1.1.1.1.1',
      nom: 'Formaliser une vision et des engagements dans une décision de politique générale (délibération)',
      categorie: null,
      referentielId: ReferentielIdEnum.CAE,
      referentiel: ReferentielIdEnum.CAE,
      actionType: ActionTypeEnum.TACHE,
    });
  });
});
