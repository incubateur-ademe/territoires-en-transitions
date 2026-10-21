import {
  ActionDynamicState,
  ActionStaticDefinition,
  ListActionDefinitionsOutput,
  ListActionsDynamicStateResult,
  ListActionTextOverridesOutput,
} from '@tet/domain/referentiels';
import { describe, expect, it, vi } from 'vitest';
import {
  ActionsQueryError,
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

const DOM_KEY = 'r1;localisation=dom';

const buildState = (
  referentielVersion = '1.0.0',
  textVariantKey: string | null = null
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
  textVariantKey,
});

const buildTextOverrides = (
  referentielVersion = '1.0.0'
): ListActionTextOverridesOutput => ({
  referentielVersion,
  textVariantKey: DOM_KEY,
  overridesById: { cae_1: { nom: 'Nom DOM cae_1' } },
});

const buildPart = <TData>(
  data: TData | undefined,
  overrides: Partial<ActionsQueryPart<TData>> = {}
): ActionsQueryPart<TData> => ({
  data,
  error: null,
  isFetching: false,
  isPending: data === undefined,
  isError: false,
  refetch: vi.fn(),
  ...overrides,
});

const networkError = {
  message: 'NetworkError when attempting to fetch resource.',
} as ActionsQueryError;

const buildFailedPart = <TData>(
  data: TData | undefined
): ActionsQueryPart<TData> =>
  buildPart(data, { isPending: false, isError: true, error: networkError });

const buildPair = ({
  definitions = buildPart(buildDefinitions()),
  state = buildPart(buildState()),
  textOverrides,
}: Partial<
  Omit<ActionsQueryResultsPair, 'referentielId'>
> = {}): ActionsQueryResultsPair => ({
  referentielId: 'cae',
  definitions,
  state,
  textOverrides,
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
    expect(result.failure).toBeUndefined();
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

  it('sans clé de variante, ignore la query des surcharges (désactivée)', () => {
    const result = mergeActionsQueryResults([
      buildPair({
        textOverrides: buildPart<ListActionTextOverridesOutput>(undefined),
      }),
    ]);

    expect(result.isPending).toBe(false);
    expect(result.data.get('cae')?.actionsById['cae_1'].nom).toBe('Nom cae_1');
  });

  it('avec une clé de variante, attend les surcharges puis les applique', () => {
    const state = buildPart(buildState('1.0.0', DOM_KEY));

    const pending = mergeActionsQueryResults([
      buildPair({
        state,
        textOverrides: buildPart<ListActionTextOverridesOutput>(undefined),
      }),
    ]);
    expect(pending.isPending).toBe(true);
    expect(pending.data.has('cae')).toBe(false);

    const loaded = mergeActionsQueryResults([
      buildPair({ state, textOverrides: buildPart(buildTextOverrides()) }),
    ]);
    expect(loaded.isPending).toBe(false);
    expect(loaded.data.get('cae')?.actionsById['cae_1'].nom).toBe(
      'Nom DOM cae_1'
    );
  });

  it('une erreur sur les surcharges met le résultat en erreur', () => {
    const result = mergeActionsQueryResults([
      buildPair({
        state: buildPart(buildState('1.0.0', DOM_KEY)),
        textOverrides: buildPart<ListActionTextOverridesOutput>(undefined, {
          isPending: false,
          isError: true,
        }),
      }),
    ]);

    expect(result.isError).toBe(true);
    expect(result.data.has('cae')).toBe(false);
  });

  it('signale un écart de version entre les définitions et les surcharges', () => {
    const result = mergeActionsQueryResults([
      buildPair({
        state: buildPart(buildState('1.0.0', DOM_KEY)),
        textOverrides: buildPart(buildTextOverrides('2.0.0')),
      }),
    ]);

    expect(result.versionMismatches.map(getVersionMismatchKey)).toEqual([
      'cae:1.0.0:2.0.0',
    ]);
    // surcharges d'une autre version : ignorées
    expect(result.data.get('cae')?.actionsById['cae_1'].nom).toBe('Nom cae_1');
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
        state: buildFailedPart<ListActionsDynamicStateResult>(undefined),
      }),
      referentielId: 'te' as const,
    };

    expect(mergeActionsQueryResults([loaded, pending])).toMatchObject({
      isPending: true,
      failure: undefined,
    });
    expect(mergeActionsQueryResults([loaded, inError])).toMatchObject({
      isPending: false,
      failure: { error: networkError },
    });
    expect([
      ...mergeActionsQueryResults([loaded, pending, inError]).data.keys(),
    ]).toEqual(['cae']);
  });

  it("ne signale pas d'erreur quand un rechargement échoue alors que les données sont en cache", () => {
    const result = mergeActionsQueryResults([
      buildPair({
        state: buildFailedPart(buildState()),
      }),
    ]);

    expect(result).toMatchObject({ isPending: false, failure: undefined });
    expect(result.data.get('cae')?.actionsById['cae_1']).toMatchObject({
      actionId: 'cae_1',
    });
  });

  it('la relance ne recharge que les queries en échec sans données', () => {
    const failedDefinitions =
      buildFailedPart<ListActionDefinitionsOutput>(undefined);
    const failedRefetchWithCache = buildFailedPart(buildState());
    const loadedDefinitions = buildPart(buildDefinitions());

    const { failure } = mergeActionsQueryResults([
      buildPair({ definitions: failedDefinitions }),
      {
        ...buildPair({
          definitions: loadedDefinitions,
          state: failedRefetchWithCache,
        }),
        referentielId: 'eci',
      },
    ]);
    failure?.retry();

    expect({
      failedDefinitions: vi.mocked(failedDefinitions.refetch).mock.calls.length,
      failedRefetchWithCache: vi.mocked(failedRefetchWithCache.refetch).mock
        .calls.length,
      loadedDefinitions: vi.mocked(loadedDefinitions.refetch).mock.calls.length,
    }).toEqual({
      failedDefinitions: 1,
      failedRefetchWithCache: 0,
      loadedDefinitions: 0,
    });
  });
});
