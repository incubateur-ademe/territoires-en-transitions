import { YOLO_DODO } from '@tet/backend/test';
import {
  ActionCategorieEnum,
  ActionType,
  ActionTypeEnum,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import { getTestRouter } from '../../../test/app-utils';
import { getAnonUser, getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

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

    await expect(
      caller.referentiels.actions.listActionsGroupedById({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
      })
    ).rejects.toThrow();
  });

  test('List actions', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

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

  test('List action summaries', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const actionsGroupedById =
      await caller.referentiels.actions.listActionsGroupedById({
        collectiviteId: YOLO_DODO.collectiviteId.id,
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
    const caller = router.createCaller({ user: yoloDodoUser });

    const actionsGroupedById =
      await caller.referentiels.actions.listActionsGroupedById({
        collectiviteId: YOLO_DODO.collectiviteId.id,
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
