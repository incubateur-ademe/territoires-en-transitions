import { type ReferentielResponse } from '@tet/backend/referentiels/get-referentiel/get-referentiel.service';
import {
  ActionTypeEnum,
  ReferentielIdEnum,
  type ActionScore,
  type ActionTreeNode,
  type ActionType,
  type ReferentielId,
} from '@tet/domain/referentiels';
import {
  isCibleConcernee,
  listMesuresCibles,
  listSousActionsEtTachesCibles,
} from './action-cible';

type TestTreeNode = ActionTreeNode<{
  actionId: string;
  actionType: ActionType;
  actionsOrigine?: {
    referentielId: string;
    actionId: string;
    ponderation: number;
    nom: string | null;
  }[];
}>;

const createActionScore = (overrides: Partial<ActionScore> = {}): ActionScore =>
  ({
    concerne: true,
    pointReferentiel: 1,
    ...overrides,
  } as ActionScore);

const createReferentielTe = (itemsTree: TestTreeNode): ReferentielResponse => ({
  version: 'test',
  orderedItemTypes: [
    ActionTypeEnum.REFERENTIEL,
    ActionTypeEnum.AXE,
    ActionTypeEnum.SOUS_AXE,
    ActionTypeEnum.ACTION,
    ActionTypeEnum.SOUS_ACTION,
    ActionTypeEnum.TACHE,
  ],
  itemsTree: itemsTree as ReferentielResponse['itemsTree'],
});

const caeOrigine = (actionId: string) => ({
  referentielId: ReferentielIdEnum.CAE,
  actionId,
  ponderation: 1,
  nom: null,
});

const eciOrigine = (actionId: string) => ({
  referentielId: ReferentielIdEnum.ECI,
  actionId,
  ponderation: 1,
  nom: null,
});

describe('listMesuresCibles', () => {
  const scoreMapsByReferentiel = new Map<
    ReferentielId,
    Map<string, ActionScore>
  >([
    [
      ReferentielIdEnum.CAE,
      new Map([
        ['cae_direct', createActionScore()],
        ['cae_child', createActionScore()],
        ['cae_non_concerne', createActionScore({ concerne: false })],
      ]),
    ],
    [ReferentielIdEnum.ECI, new Map([['eci_child', createActionScore()]])],
  ]);

  const minimalTree: TestTreeNode = {
    actionId: 'te',
    actionType: ActionTypeEnum.REFERENTIEL,
    actionsEnfant: [
      {
        actionId: 'te_1',
        actionType: ActionTypeEnum.AXE,
        actionsEnfant: [
          {
            actionId: 'te_1.1',
            actionType: ActionTypeEnum.SOUS_AXE,
            actionsEnfant: [
              {
                actionId: 'te_mesure_directe',
                actionType: ActionTypeEnum.ACTION,
                actionsOrigine: [caeOrigine('cae_direct')],
                actionsEnfant: [],
              },
              {
                actionId: 'te_mesure_agregee',
                actionType: ActionTypeEnum.ACTION,
                actionsEnfant: [
                  {
                    actionId: 'te_mesure_agregee.1',
                    actionType: ActionTypeEnum.SOUS_ACTION,
                    actionsOrigine: [caeOrigine('cae_child')],
                    actionsEnfant: [],
                  },
                ],
              },
              {
                actionId: 'te_mesure_sans_origine',
                actionType: ActionTypeEnum.ACTION,
                actionsEnfant: [],
              },
              {
                actionId: 'te_mesure_non_concernee',
                actionType: ActionTypeEnum.ACTION,
                actionsOrigine: [caeOrigine('cae_non_concerne')],
                actionsEnfant: [],
              },
              {
                actionId: 'te_mesure_dedup',
                actionType: ActionTypeEnum.ACTION,
                actionsEnfant: [
                  {
                    actionId: 'te_mesure_dedup.1',
                    actionType: ActionTypeEnum.SOUS_ACTION,
                    actionsOrigine: [caeOrigine('cae_dup')],
                    actionsEnfant: [],
                  },
                  {
                    actionId: 'te_mesure_dedup.2',
                    actionType: ActionTypeEnum.TACHE,
                    actionsOrigine: [caeOrigine('cae_dup')],
                    actionsEnfant: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const listCibles = (teScoreMap: Map<string, ActionScore>) =>
    listMesuresCibles({
      referentielTe: createReferentielTe(minimalTree),
      scoreMapsByReferentiel,
      teScoreMap,
    });

  it('inclut une mesure TE avec origine directe', () => {
    const cibles = listCibles(new Map());
    const cible = cibles.find((c) => c.actionId === 'te_mesure_directe');

    expect(cible?.actionsOrigine).toEqual([caeOrigine('cae_direct')]);
    expect(cible?.originesConcernees).toHaveLength(1);
  });

  it('agrège les origines des descendants', () => {
    const cible = listCibles(new Map()).find(
      (c) => c.actionId === 'te_mesure_agregee'
    );

    expect(cible?.actionsOrigine).toEqual([caeOrigine('cae_child')]);
  });

  it('exclut une mesure sans aucune correspondance', () => {
    const cibles = listCibles(new Map()).map((c) => c.actionId);

    expect(cibles).not.toContain('te_mesure_sans_origine');
  });

  it('conserve une mesure dont toutes les sources sont non_concerne', () => {
    const cible = listCibles(new Map()).find(
      (c) => c.actionId === 'te_mesure_non_concernee'
    );

    expect(cible?.actionsOrigine).toHaveLength(1);
    expect(cible?.originesConcernees).toHaveLength(0);
  });

  it('marque concernee false si la mesure TE est personnalisée non concernée', () => {
    const teScoreMap = new Map<string, ActionScore>([
      [
        'te_mesure_directe',
        createActionScore({ concerne: false, pointPotentiel: 0 }),
      ],
    ]);

    const cible = listCibles(teScoreMap).find(
      (c) => c.actionId === 'te_mesure_directe'
    );

    expect(cible?.concernee).toBe(false);
  });

  it('déduplique les origines identiques sur plusieurs descendants', () => {
    scoreMapsByReferentiel
      .get(ReferentielIdEnum.CAE)
      ?.set('cae_dup', createActionScore());

    const cible = listCibles(new Map()).find(
      (c) => c.actionId === 'te_mesure_dedup'
    );

    expect(cible?.actionsOrigine).toEqual([caeOrigine('cae_dup')]);
  });
});

describe('listSousActionsEtTachesCibles', () => {
  const tree: TestTreeNode = {
    actionId: 'te',
    actionType: ActionTypeEnum.REFERENTIEL,
    actionsEnfant: [
      {
        actionId: 'te_1',
        actionType: ActionTypeEnum.AXE,
        actionsEnfant: [
          {
            actionId: 'te_1.1',
            actionType: ActionTypeEnum.SOUS_AXE,
            actionsEnfant: [
              {
                actionId: 'te_1.1.1',
                actionType: ActionTypeEnum.ACTION,
                actionsEnfant: [
                  {
                    actionId: 'te_sous_action',
                    actionType: ActionTypeEnum.SOUS_ACTION,
                    actionsOrigine: [caeOrigine('cae_sous_action')],
                    actionsEnfant: [],
                  },
                  {
                    actionId: 'te_tache',
                    actionType: ActionTypeEnum.TACHE,
                    actionsOrigine: [eciOrigine('eci_tache')],
                    actionsEnfant: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const scoreMapsByReferentiel = new Map<
    ReferentielId,
    Map<string, ActionScore>
  >([
    [
      ReferentielIdEnum.CAE,
      new Map([['cae_sous_action', createActionScore()]]),
    ],
    [ReferentielIdEnum.ECI, new Map([['eci_tache', createActionScore()]])],
  ]);

  it('retourne les sous-actions et tâches avec origines directes', () => {
    const cibles = listSousActionsEtTachesCibles({
      referentielTe: createReferentielTe(tree),
      scoreMapsByReferentiel,
      teScoreMap: new Map(),
    });

    expect(cibles.map((c) => c.actionId).sort()).toEqual([
      'te_sous_action',
      'te_tache',
    ]);
  });
});

describe('isCibleConcernee', () => {
  const createActionScore = (overrides: Partial<ActionScore> = {}): ActionScore =>
    ({
      concerne: true,
      pointReferentiel: 1,
      ...overrides,
    } as ActionScore);

  it('retourne true si le score est absent', () => {
    expect(isCibleConcernee(new Map(), 'te_1')).toBe(true);
  });

  it('retourne true si concerne est true', () => {
    const scoreMap = new Map<string, ActionScore>([
      ['te_1', createActionScore({ concerne: true })],
    ]);

    expect(isCibleConcernee(scoreMap, 'te_1')).toBe(true);
  });

  it('retourne false si concerne est false (personnalisation / désactivation)', () => {
    const scoreMap = new Map<string, ActionScore>([
      ['te_1', createActionScore({ concerne: false, pointPotentiel: 0 })],
    ]);

    expect(isCibleConcernee(scoreMap, 'te_1')).toBe(false);
  });
});
