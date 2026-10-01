import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getServiceRoleUser } from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ActionTypeEnum, ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
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
import { TrpcRouter } from '../../utils/trpc/trpc.router';

describe('ActionStatutListRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let testUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  async function resetDisplayPreferences(collectiviteId: number) {
    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });
    await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
      {
        collectiviteId,
      }
    );
  }

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    const testUserResult = await addTestUser(databaseService, {
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

  test('List actions : ne renvoie que la partie dynamique', async () => {
    const caller = router.createCaller({ user: testUser });

    const input = {
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
    };

    const [result, definitions] = await Promise.all([
      caller.referentiels.actions.listActionsGroupedById(input),
      caller.referentiels.actions.listActionDefinitions({
        referentielId: input.referentielId,
      }),
    ]);

    expect(result.referentielVersion).toBe(definitions.referentielVersion);

    const entries = Object.entries(result.actionsById);

    expect(entries.length).toBeGreaterThan(0);

    for (const [actionId, action] of entries) {
      expect(actionId).toContain(input.referentielId);

      // seuls les champs dynamiques sont renvoyés : les définitions viennent
      // de `listActionDefinitions`
      expect(Object.keys(action)).toEqual(
        expect.arrayContaining([
          'actionId',
          'childrenIds',
          'nextId',
          'parentId',
          'pilotes',
          'previousId',
          'score',
          'scoresTag',
          'services',
        ])
      );
      for (const definitionField of [
        'nom',
        'identifiant',
        'description',
        'categorie',
        'points',
        'exprScore',
        'actionType',
        'tags',
        'level',
        'preuves',
      ]) {
        expect(action).not.toHaveProperty(definitionField);
      }

      expect(action).not.toHaveProperty('childrenIdsWithExprScore');

      const { actionType } = definitions.definitionsById[actionId];
      const statutApplicableSurScore =
        actionType === ActionTypeEnum.SOUS_ACTION ||
        actionType === ActionTypeEnum.TACHE;
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

  test('List actions : généalogie ECI', async () => {
    const caller = router.createCaller({ user: testUser });

    const result = await caller.referentiels.actions.listActionsGroupedById({
      collectiviteId: 1,
      referentielId: 'eci' as const,
    };

    const result = await caller.referentiels.actions.listActionsGroupedById(
      input
    );
    const actionsGroupedById = result.actionsById;

    const actionTypes: ActionType[] = [
      ActionTypeEnum.AXE,
      ActionTypeEnum.SOUS_AXE, // pas de sous-axe pour eci mais ne gêne pas le fonctionnement
      ActionTypeEnum.ACTION,
      ActionTypeEnum.SOUS_ACTION,
    ];

    const countByActionTypes = (actions: typeof actionsGroupedById) =>
      Object.values(actions).filter((action) =>
        actionTypes.includes(action.actionType)
      );

    const filteredActions = countByActionTypes(actionsGroupedById);

    expect(filteredActions.length).toBe(106);

    expect(filteredActions[0]).toMatchObject({
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
      filteredActions.find((action) => action.actionId === 'eci_1.1')
    ).toMatchObject({
      actionId: 'eci_1.1',
      referentielId: ReferentielIdEnum.ECI,
    });

    expect(result.actionsById['eci_1']).toMatchObject({
      actionId: 'eci_1',
      parentId: 'eci',
      childrenIds: ['eci_1.1', 'eci_1.2', 'eci_1.3'],
    });
    expect(result.actionsById['eci_1.1.1']).toMatchObject({
      actionId: 'eci_1.1.1',
      parentId: 'eci_1.1',
      childrenIds: [
        'eci_1.1.1.1',
        'eci_1.1.1.2',
        'eci_1.1.1.3',
        'eci_1.1.1.4',
        'eci_1.1.1.5',
      ],
      previousId: null,
      nextId: 'eci_1.1.2',
    });
  });

  test('La mesure te_1.1.1 est désactivée quand PCAET_1 est NON, et remonte dans `hiddenActionIds`', async () => {
    const { collectivite, cleanup, user } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          role: CollectiviteRole.EDITION,
        },
      }
    );
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    const referentielId = ReferentielIdEnum.TE;
    const collectiviteId = collectivite.id;
    const input = { collectiviteId, referentielId };

    onTestFinished(async () => {
      await cleanup();
    });

    await caller.collectivites.personnalisations.setReponse({
      collectiviteId,
      questionId: 'PCAET_1',
      reponse: false,
    });

    await resetDisplayPreferences(collectiviteId);

    await caller.referentiels.snapshots.computeAndUpsert(input);

    const result = await caller.referentiels.actions.listActionsGroupedById(
      input
    );
    expect(result.actionsById['te_1.1.1']).toBeUndefined();
    expect(result.hiddenActionIds).toContain('te_1.1.1');
  });

  test('Les liens précédents/suivants sautent les mesures désactivées pour le référentiel TE', async () => {
    const { collectivite, cleanup, user } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          role: CollectiviteRole.EDITION,
        },
      }
    );
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    const referentielId = ReferentielIdEnum.TE;
    const collectiviteId = collectivite.id;
    const input = { collectiviteId, referentielId };

    onTestFinished(async () => {
      await cleanup();
    });

    await caller.collectivites.personnalisations.setReponse({
      collectiviteId,
      questionId: 'Bat_1',
      reponse: false,
    });

    await resetDisplayPreferences(collectiviteId);

    await caller.referentiels.snapshots.computeAndUpsert(input);

    const result = await caller.referentiels.actions.listActionsGroupedById(
      input
    );
    const actions = result.actionsById;

    expect(actions['te_2.2.3']).toBeUndefined();
    expect(actions['te_2.2.4']).toBeUndefined();
    expect(actions['te_2.2.5']).toBeUndefined();
    expect(actions['te_2.2.2']).toMatchObject({
      nextId: 'te_2.2.5alter',
    });
    expect(actions['te_2.2.5alter']).toMatchObject({
      previousId: 'te_2.2.2',
    });
  });

  test('Les liens précédents/suivants ne sautent pas les mesures désactivées pour les anciens référentiels', async () => {
    const { collectivite, cleanup, user } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          role: CollectiviteRole.EDITION,
        },
      }
    );
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    const referentielId = ReferentielIdEnum.CAE;
    const collectiviteId = collectivite.id;
    const input = { collectiviteId, referentielId };

    onTestFinished(async () => {
      await cleanup();
    });

    for (const questionId of ['urba_1', 'urba_2', 'urba_3'] as const) {
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId,
        questionId,
        reponse: false,
      });
    }

    await caller.referentiels.snapshots.computeAndUpsert(input);

    const result = await caller.referentiels.actions.listActionsGroupedById(
      input
    );
    const actions = result.actionsById;

    expect(actions['cae_1.3.3']?.score.desactive).toBe(true);
    expect(actions['cae_1.3.2']).toMatchObject({
      nextId: 'cae_1.3.3',
    });
    expect(actions['cae_2.1.1']).toMatchObject({
      previousId: 'cae_1.3.3',
    });
  });

  test('Retourne les labels, le tag coremeasure et les thématiques des mesures du référentiel TE', async () => {
    const { collectivite, cleanup, user } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          role: CollectiviteRole.EDITION,
        },
      }
    );
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    const input = {
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.TE,
    };

    onTestFinished(async () => {
      await cleanup();
    });

    await resetDisplayPreferences(collectivite.id);

    await caller.referentiels.snapshots.computeAndUpsert(input);

    const { actionsById } =
      await caller.referentiels.actions.listActionsGroupedById(input);

    const mesure = actionsById['te_1.1.1'];
    expect(mesure.labels).toEqual(['te_cae']);
    expect(mesure.isCoremeasure).toBe(true);
    expect(mesure.thematiques).toHaveLength(3);
    expect(mesure.thematiques).toEqual(
      expect.arrayContaining([
        { ref: 'biodiversite', nom: 'Biodiversité' },
        { ref: 'dechets', nom: 'Déchets' },
        { ref: 'qualite_air', nom: "Qualité de l'air" },
      ])
    );

    // les tags sont portés par la mesure, pas par l'axe
    const axe = actionsById['te_1'];
    expect(axe.labels).toEqual([]);
    expect(axe.isCoremeasure).toBe(false);
    expect(axe.thematiques).toEqual([]);
  });

  test('ECI ne retourne pas de hiddenActionIds', async () => {
    const caller = router.createCaller({ user: testUser });

    const input = {
      collectiviteId: 1,
      referentielId: 'eci' as const,
    };

    const result = await caller.referentiels.actions.listActionsGroupedById(
      input
    );
    expect(result.hiddenActions).toEqual([]);
    expect(Object.keys(result.actionsById).length).toBeGreaterThan(0);
  });

  test('List CAE action summaries down to tache', async () => {
    const caller = router.createCaller({ user: testUser });

    const result = await caller.referentiels.actions.listActionsGroupedById({
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
    });
    const actionsGroupedById = result.actionsById;

    const entries = Object.entries(actionsGroupedById);
    expect(entries.length).toBeGreaterThan(0);

    const actionTypes: ActionType[] = [
      ActionTypeEnum.SOUS_ACTION,
      ActionTypeEnum.TACHE,
    ];

    const filteredActions = entries
      .filter(
        ([_, action]) =>
          actionTypes.includes(action.actionType) &&
          action.actionId.startsWith('cae_1.1.1')
      )
      .map(([_, action]) => action);

    expect(filteredActions.length).toBe(28);
    expect(filteredActions[0]).toMatchObject({
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
      filteredActions.find((action) => action.actionId === 'cae_1.1.1.1.1')
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
