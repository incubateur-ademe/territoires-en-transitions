import {
  StatutAvancementEnum,
  type ActionScore,
  type ActionStatutCreate,
} from '@tet/domain/referentiels';
import {
  applyRepairDecisionsToActionStatuts,
  decideRepairStatuts,
} from './repair-switch-to-te-statuts.rules';

const COLLECTIVITE_ID = 1;

const scoreMap = (desactiveByActionId: Record<string, boolean>) =>
  new Map(
    Object.entries(desactiveByActionId).map(([actionId, desactive]) => [
      actionId,
      { actionId, desactive } as ActionScore,
    ])
  );

const statut = (
  actionId: string,
  value: Omit<ActionStatutCreate, 'collectiviteId' | 'actionId'>
): ActionStatutCreate =>
  ({
    collectiviteId: COLLECTIVITE_ID,
    actionId,
    ...value,
  } as ActionStatutCreate);

describe('decideRepairStatuts', () => {
  test('action désactivée à la bascule avec statut projeté → mise à jour', () => {
    const expected = statut('te_1.1.1.2', {
      statut: StatutAvancementEnum.FAIT,
    });

    expect(
      decideRepairStatuts({
        intactNonConcerneActionIds: ['te_1.1.1.2'],
        expectedStatuts: [expected],
        postSwitchScoreMap: scoreMap({ 'te_1.1.1.2': true }),
      })
    ).toEqual({
      decisions: [
        { actionId: 'te_1.1.1.2', decision: 'update', statut: expected },
      ],
      ignoredActionIds: [],
    });
  });

  test('tâche (aucun statut attendu) désactivée à la bascule → suppression', () => {
    expect(
      decideRepairStatuts({
        intactNonConcerneActionIds: ['te_1.1.6.2.a'],
        expectedStatuts: [],
        postSwitchScoreMap: scoreMap({ 'te_1.1.6.2.a': true }),
      }).decisions
    ).toEqual([{ actionId: 'te_1.1.6.2.a', decision: 'delete' }]);
  });

  test('« Non concerné » attendu (origines non concernées) → laissé', () => {
    expect(
      decideRepairStatuts({
        intactNonConcerneActionIds: ['te_1.1.1.3'],
        expectedStatuts: [
          statut('te_1.1.1.3', { statut: StatutAvancementEnum.NON_CONCERNE }),
        ],
        postSwitchScoreMap: scoreMap({ 'te_1.1.1.3': true }),
      }).decisions
    ).toEqual([{ actionId: 'te_1.1.1.3', decision: 'keep' }]);
  });

  test('action active à la bascule, ou absente du snapshot → ignorée', () => {
    expect(
      decideRepairStatuts({
        intactNonConcerneActionIds: ['te_2.2.3.4', 'te_9.9.9.9'],
        expectedStatuts: [],
        postSwitchScoreMap: scoreMap({ 'te_2.2.3.4': false }),
      })
    ).toEqual({
      decisions: [],
      ignoredActionIds: ['te_2.2.3.4', 'te_9.9.9.9'],
    });
  });
});

describe('applyRepairDecisionsToActionStatuts', () => {
  const nonConcerne = {
    avancement: StatutAvancementEnum.NON_RENSEIGNE,
    avancementDetaille: [0, 0, 0] as [number, number, number],
    concerne: false,
  };

  test('applique mises à jour et suppressions sans toucher au reste', () => {
    const actionStatuts = {
      'te_1.1.1.2': nonConcerne,
      'te_1.1.1.5': nonConcerne,
      'te_1.1.1.3': nonConcerne,
      'te_2.1.1.1': { ...nonConcerne, concerne: true },
    };

    const patched = applyRepairDecisionsToActionStatuts(actionStatuts, [
      {
        actionId: 'te_1.1.1.2',
        decision: 'update',
        statut: statut('te_1.1.1.2', { statut: StatutAvancementEnum.FAIT }),
      },
      {
        actionId: 'te_1.1.1.5',
        decision: 'update',
        statut: statut('te_1.1.1.5', {
          statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
          statutDetailleAuPourcentage: [0.45, 0.25, 0.3],
        }),
      },
      { actionId: 'te_1.1.1.3', decision: 'delete' },
    ]);

    expect(patched).toEqual({
      'te_1.1.1.2': {
        avancement: StatutAvancementEnum.FAIT,
        avancementDetaille: [1, 0, 0],
        concerne: true,
      },
      'te_1.1.1.5': {
        avancement: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
        avancementDetaille: [0.45, 0.25, 0.3],
        concerne: true,
      },
      'te_2.1.1.1': { ...nonConcerne, concerne: true },
    });
    // l'objet d'entrée n'est pas modifié
    expect(actionStatuts['te_1.1.1.3']).toBe(nonConcerne);
  });
});
