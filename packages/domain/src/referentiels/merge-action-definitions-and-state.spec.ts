import {
  ActionDynamicState,
  ActionStaticDefinition,
  ListActionsDynamicStateResult,
} from './action-with-score.schema';
import { ListActionDefinitionsOutput } from './actions/list-action-definitions.output';
import { mergeActionDefinitionsAndState } from './merge-action-definitions-and-state';

const buildDefinition = (
  actionId: string,
  { exprScore = null }: { exprScore?: string | null } = {}
) =>
  ({
    actionId,
    identifiant: actionId.split('_')[1],
    nom: `Nom ${actionId}`,
    description: `Description ${actionId}`,
    exprScore,
    labels: [],
  } as unknown as ActionStaticDefinition);

const buildState = (
  actionId: string,
  {
    parentId = null,
    childrenIds = [],
  }: { parentId?: string | null; childrenIds?: string[] } = {}
) =>
  ({
    actionId,
    parentId,
    childrenIds,
    nextId: null,
    previousId: null,
    pilotes: [],
    services: [],
    scoresTag: {},
    score: { actionId, explication: `Explication ${actionId}` },
  } as unknown as ActionDynamicState);

const buildDefinitions = (
  definitions: ActionStaticDefinition[]
): ListActionDefinitionsOutput => ({
  referentielVersion: '1.0.0',
  definitionsById: Object.fromEntries(
    definitions.map((definition) => [definition.actionId, definition])
  ),
});

const buildStates = (
  states: ActionDynamicState[],
  hiddenActionIds: string[] = []
): ListActionsDynamicStateResult => ({
  referentielVersion: '1.0.0',
  actionsById: Object.fromEntries(states.map((s) => [s.actionId, s])),
  hiddenActionIds,
});

describe('mergeActionDefinitionsAndState', () => {
  test('fusionne la définition et l’état de chaque action', () => {
    const result = mergeActionDefinitionsAndState(
      buildDefinitions([buildDefinition('cae_1')]),
      buildStates([buildState('cae_1')])
    );

    expect(result.actionsById['cae_1']).toMatchObject({
      actionId: 'cae_1',
      nom: 'Nom cae_1',
      description: 'Description cae_1',
      score: { explication: 'Explication cae_1' },
      pilotes: [],
      services: [],
      childrenIds: [],
      childrenIdsWithExprScore: [],
    });
  });

  test('calcule `childrenIdsWithExprScore` à partir des définitions des enfants', () => {
    const result = mergeActionDefinitionsAndState(
      buildDefinitions([
        buildDefinition('cae_1'),
        buildDefinition('cae_1.1', { exprScore: 'si identite(EP_1) alors 0' }),
        buildDefinition('cae_1.2', { exprScore: '  ' }),
        buildDefinition('cae_1.3'),
      ]),
      buildStates([
        buildState('cae_1', { childrenIds: ['cae_1.1', 'cae_1.2', 'cae_1.3'] }),
        buildState('cae_1.1', { parentId: 'cae_1' }),
        buildState('cae_1.2', { parentId: 'cae_1' }),
        buildState('cae_1.3', { parentId: 'cae_1' }),
      ])
    );

    expect(result.actionsById['cae_1'].childrenIdsWithExprScore).toEqual([
      'cae_1.1',
    ]);
  });

  test('résout les actions masquées avec leur identifiant et leur nom', () => {
    const result = mergeActionDefinitionsAndState(
      buildDefinitions([buildDefinition('te_1'), buildDefinition('te_1.1')]),
      buildStates([buildState('te_1')], ['te_1.1', 'te_9'])
    );

    expect(result.hiddenActions).toEqual([
      { actionId: 'te_1.1', identifiant: '1.1', nom: 'Nom te_1.1' },
    ]);
    expect(result.actionsById['te_1.1']).toBeUndefined();
  });

  test('ignore une action absente des définitions et la retire des enfants de son parent', () => {
    const result = mergeActionDefinitionsAndState(
      buildDefinitions([buildDefinition('cae_1'), buildDefinition('cae_1.1')]),
      buildStates([
        buildState('cae_1', { childrenIds: ['cae_1.1', 'cae_1.2'] }),
        buildState('cae_1.1', { parentId: 'cae_1' }),
        buildState('cae_1.2', { parentId: 'cae_1' }),
      ])
    );

    expect(result.actionsById['cae_1.2']).toBeUndefined();
    expect(result.actionsById['cae_1'].childrenIds).toEqual(['cae_1.1']);
  });

  test('ignore les champs de compatibilité temporaire renvoyés pour l’ancien bundle front', () => {
    const states = buildStates(
      [
        buildState('te_1', { childrenIds: ['te_1.1'] }),
        buildState('te_1.1', { parentId: 'te_1' }),
      ],
      ['te_1.2']
    );
    // champs ajoutés par `withLegacyCompatFields` côté backend
    const statesWithCompatFields = {
      ...states,
      hiddenActions: [],
      actionsById: Object.fromEntries(
        Object.entries(states.actionsById).map(([actionId, state]) => [
          actionId,
          { ...state, childrenIdsWithExprScore: [] },
        ])
      ),
    };

    const result = mergeActionDefinitionsAndState(
      buildDefinitions([
        buildDefinition('te_1'),
        buildDefinition('te_1.1', { exprScore: 'si identite(EP_1) alors 0' }),
        buildDefinition('te_1.2'),
      ]),
      statesWithCompatFields
    );

    expect(result.actionsById['te_1'].childrenIdsWithExprScore).toEqual([
      'te_1.1',
    ]);
    expect(result.hiddenActions).toEqual([
      { actionId: 'te_1.2', identifiant: '1.2', nom: 'Nom te_1.2' },
    ]);
  });

  test('ignore une action absente de l’état', () => {
    const result = mergeActionDefinitionsAndState(
      buildDefinitions([buildDefinition('cae_1'), buildDefinition('cae_2')]),
      buildStates([buildState('cae_1')])
    );

    expect(Object.keys(result.actionsById)).toEqual(['cae_1']);
  });
});
