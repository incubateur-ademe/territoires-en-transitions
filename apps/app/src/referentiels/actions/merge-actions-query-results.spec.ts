import {
  ActionDynamicState,
  ActionStaticDefinition,
  ListActionDefinitionsOutput,
  ListActionsDynamicStateResult,
} from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import {
  ActionsQueryPart,
  ActionsQueryResultsPair,
  getVersionMismatchKey,
  mergeActionsQueryResults,
} from './merge-actions-query-results';

const buildDefinitions = (
  referentielVersion = '1.0.0'
): ListActionDefinitionsOutput => ({
  referentielVersion,
  definitionsById: {
    cae_1: {
      actionId: 'cae_1',
      identifiant: '1',
      nom: 'Nom cae_1',
      exprScore: null,
      labels: [],
    } as unknown as ActionStaticDefinition,
  },
});

const buildState = (
  referentielVersion = '1.0.0'
): ListActionsDynamicStateResult => ({
  referentielVersion,
  actionsById: {
    cae_1: {
      actionId: 'cae_1',
      parentId: null,
      childrenIds: [],
      nextId: null,
      previousId: null,
      pilotes: [],
      services: [],
      scoresTag: {},
      score: { actionId: 'cae_1' },
    } as unknown as ActionDynamicState,
  },
  hiddenActionIds: [],
});

const buildPart = <TData>(
  data: TData | undefined,
  overrides: Partial<ActionsQueryPart<TData>> = {}
): ActionsQueryPart<TData> => ({
  data,
  isFetching: false,
  isPending: data === undefined,
  isError: false,
  ...overrides,
});

const buildPair = ({
  definitions = buildPart(buildDefinitions()),
  state = buildPart(buildState()),
}: Partial<
  Omit<ActionsQueryResultsPair, 'referentielId'>
> = {}): ActionsQueryResultsPair => ({
  referentielId: 'cae',
  definitions,
  state,
});

describe('mergeActionsQueryResults', () => {
  it('fusionne les deux parties d’un référentiel', () => {
    const result = mergeActionsQueryResults([buildPair()]);

    expect(result.data.get('cae')?.actionsById['cae_1']).toMatchObject({
      actionId: 'cae_1',
      nom: 'Nom cae_1',
      pilotes: [],
    });
    expect(result.isPending).toBe(false);
    expect(result.isError).toBe(false);
  });

  it('ne renvoie rien pour un référentiel dont une partie manque', () => {
    const result = mergeActionsQueryResults([
      buildPair({ state: buildPart<ListActionsDynamicStateResult>(undefined) }),
    ]);

    expect(result.data.has('cae')).toBe(false);
    expect(result.isPending).toBe(true);
    expect(result.versionMismatches).toEqual([]);
  });

  it('ne signale rien quand les versions sont identiques', () => {
    const result = mergeActionsQueryResults([buildPair()]);

    expect(result.versionMismatches).toEqual([]);
  });

  it('signale un écart de version entre les deux parties', () => {
    const result = mergeActionsQueryResults([
      buildPair({ state: buildPart(buildState('2.0.0')) }),
    ]);

    expect(result.versionMismatches).toEqual([
      {
        referentielId: 'cae',
        definitionsVersion: '1.0.0',
        stateVersion: '2.0.0',
      },
    ]);
    expect(result.versionMismatches.map(getVersionMismatchKey)).toEqual([
      'cae:1.0.0:2.0.0',
    ]);
  });

  it('ne signale pas d’écart pendant le rechargement de l’une des parties', () => {
    const definitionsFetching = mergeActionsQueryResults([
      buildPair({
        definitions: buildPart(buildDefinitions(), { isFetching: true }),
        state: buildPart(buildState('2.0.0')),
      }),
    ]);
    const stateFetching = mergeActionsQueryResults([
      buildPair({
        state: buildPart(buildState('2.0.0'), { isFetching: true }),
      }),
    ]);

    expect(definitionsFetching.versionMismatches).toEqual([]);
    expect(stateFetching.versionMismatches).toEqual([]);
  });

  it('renvoie la même fusion tant que les données ne changent pas', () => {
    const pair = buildPair();

    const first = mergeActionsQueryResults([pair]);
    const second = mergeActionsQueryResults([{ ...pair }]);
    const afterStateRefetch = mergeActionsQueryResults([
      { ...pair, state: buildPart(buildState()) },
    ]);

    expect(second.data.get('cae')).toBe(first.data.get('cae'));
    expect(afterStateRefetch.data.get('cae')).not.toBe(first.data.get('cae'));
  });

  it('agrège les états de chargement et d’erreur de toutes les queries', () => {
    const loaded = buildPair();
    const pending = {
      ...buildPair({
        definitions: buildPart<ListActionDefinitionsOutput>(undefined),
      }),
      referentielId: 'eci' as const,
    };
    const inError = {
      ...buildPair({
        state: buildPart<ListActionsDynamicStateResult>(undefined, {
          isPending: false,
          isError: true,
        }),
      }),
      referentielId: 'te' as const,
    };

    expect(mergeActionsQueryResults([loaded, pending])).toMatchObject({
      isPending: true,
      isError: false,
    });
    expect(mergeActionsQueryResults([loaded, inError])).toMatchObject({
      isPending: false,
      isError: true,
    });
    expect([
      ...mergeActionsQueryResults([loaded, pending, inError]).data.keys(),
    ]).toEqual(['cae']);
  });
});
