import { createLiveQueryCollection } from '@tanstack/react-db';
import {
  ActionDynamicState,
  ActionStaticDefinition,
  mergeActionDefinitionsAndState,
} from '@tet/domain/referentiels';
import {
  createActionDefinitionsCollection,
  replaceReferentielDefinitions,
} from './action-definitions.collection';
import { queryJoinedActions } from './action-live-queries';
import {
  assembleActionsGroupedById,
  JoinedActionRow,
} from './assemble-actions-grouped-by-id';
import {
  buildDefinition,
  buildState,
  createLocalStatesCollection,
  toStateRows,
} from './test-fixtures';

/** Lignes de la live query de jointure (propriétés virtuelles comprises) */
const join = async (
  definitions: ActionStaticDefinition[],
  states: ActionDynamicState[]
): Promise<JoinedActionRow[]> => {
  const definitionsCollection = createActionDefinitionsCollection(null);
  await replaceReferentielDefinitions(
    definitionsCollection,
    definitions[0].referentielId,
    {
      referentielVersion: '1.0.0',
      definitionsById: Object.fromEntries(
        definitions.map((d) => [d.actionId, d])
      ),
    }
  );
  const live = createLiveQueryCollection((q) =>
    queryJoinedActions(
      q,
      definitionsCollection,
      createLocalStatesCollection(toStateRows(states))
    )
  );
  await live.preload();
  return live.toArray;
};

/** Résultat de référence : la fusion utilisée avant TanStack DB */
const merge = (
  definitions: ActionStaticDefinition[],
  states: ActionDynamicState[],
  hiddenActionIds: string[] = []
) =>
  mergeActionDefinitionsAndState(
    {
      referentielVersion: '1.0.0',
      definitionsById: Object.fromEntries(
        definitions.map((d) => [d.actionId, d])
      ),
    },
    {
      referentielVersion: '1.0.0',
      actionsById: Object.fromEntries(states.map((s) => [s.actionId, s])),
      hiddenActionIds,
    }
  );

describe('assembleActionsGroupedById', () => {
  test('donne le même résultat que mergeActionDefinitionsAndState, ordre compris', async () => {
    const definitions = [
      buildDefinition('cae_1'),
      buildDefinition('cae_1.1', { exprScore: 'si identite(EP_1) alors 0' }),
      buildDefinition('cae_1.2', { exprScore: '  ' }),
      buildDefinition('cae_1.10'),
    ];
    const states = [
      buildState('cae_1', {
        childrenIds: ['cae_1.1', 'cae_1.2', 'cae_1.10', 'cae_1.3'],
      }),
      buildState('cae_1.1', { parentId: 'cae_1' }),
      buildState('cae_1.2', { parentId: 'cae_1' }),
      // absente des définitions : ignorée et retirée des enfants
      buildState('cae_1.3', { parentId: 'cae_1' }),
      buildState('cae_1.10', { parentId: 'cae_1' }),
    ];

    const result = assembleActionsGroupedById(
      await join(definitions, states),
      [],
      () => undefined
    );

    expect(result).toEqual(merge(definitions, states));
    expect(Object.keys(result.actionsById)).toEqual(
      Object.keys(merge(definitions, states).actionsById)
    );
    expect(result.actionsById['cae_1']).not.toHaveProperty('position');
  });

  test('résout les actions masquées dans l’ordre de hiddenActionIds', async () => {
    const definitions = [
      buildDefinition('te_1'),
      buildDefinition('te_1.1'),
      buildDefinition('te_1.2'),
    ];
    const states = [buildState('te_1')];
    const hiddenActionIds = ['te_1.2', 'te_9', 'te_1.1'];

    const result = assembleActionsGroupedById(
      await join(definitions, states),
      hiddenActionIds,
      (actionId) => definitions.find((d) => d.actionId === actionId)
    );

    expect(result).toEqual(merge(definitions, states, hiddenActionIds));
    expect(result.hiddenActions.map((a) => a.actionId)).toEqual([
      'te_1.2',
      'te_1.1',
    ]);
  });

  test('ignore les champs de compatibilité temporaire renvoyés pour l’ancien bundle front', async () => {
    const definitions = [
      buildDefinition('te_1'),
      buildDefinition('te_1.1', { exprScore: 'si identite(EP_1) alors 0' }),
    ];
    // `childrenIdsWithExprScore: []` ajouté par `withLegacyCompatFields`
    const states = [
      buildState('te_1', { childrenIds: ['te_1.1'] }),
      buildState('te_1.1', { parentId: 'te_1' }),
    ].map((state) => ({ ...state, childrenIdsWithExprScore: [] }));

    const result = assembleActionsGroupedById(
      await join(definitions, states),
      [],
      () => undefined
    );

    expect(result.actionsById['te_1'].childrenIdsWithExprScore).toEqual([
      'te_1.1',
    ]);
  });
});
