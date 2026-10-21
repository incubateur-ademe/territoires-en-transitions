import { QueryClient } from '@tanstack/react-query';
import { ListActionsDynamicStateResult } from '@tet/domain/referentiels';
import {
  createActionDefinitionsCollection,
  replaceReferentielDefinitions,
} from './action-definitions.collection';
import {
  getReferentielActionsStore,
  STORE_GC_TIME_MS,
} from './referentiel-actions.store';
import {
  buildDefinition,
  buildState,
  createLocalStatesCollection,
  toStateRows,
} from './test-fixtures';

const stateQueryKey = ['listActionsGroupedById', 'cae'];

const setup = async () => {
  const queryClient = new QueryClient();
  const definitions = createActionDefinitionsCollection(null);
  await replaceReferentielDefinitions(definitions, 'cae', {
    referentielVersion: '1.0.0',
    definitionsById: {
      cae_1: buildDefinition('cae_1'),
      cae_2: buildDefinition('cae_2'),
    },
  });
  const states = [
    buildState('cae_1', { childrenIds: ['cae_2'] }),
    buildState('cae_2', { parentId: 'cae_1' }),
  ];
  const response: ListActionsDynamicStateResult = {
    referentielVersion: '1.1.0',
    actionsById: Object.fromEntries(states.map((s) => [s.actionId, s])),
    hiddenActionIds: [],
  };
  queryClient.setQueryData(stateQueryKey, response);
  const statesCollection = createLocalStatesCollection(toStateRows(states));

  const getStore = () =>
    getReferentielActionsStore(queryClient, {
      definitions,
      definitionsGeneration: 1,
      states: statesCollection,
      stateQueryKey,
      collectiviteId: 1,
      referentielId: 'cae',
    });
  return { queryClient, getStore, response, statesCollection };
};

describe('getReferentielActionsStore', () => {
  test('assemble une seule fois les actions, partagées entre les abonnés', async () => {
    const { getStore } = await setup();
    const store = getStore();
    const unsubscribe = store.subscribe(() => undefined);

    await vi.waitFor(() => expect(store.getSnapshot().data).toBeDefined());
    const snapshot = store.getSnapshot();

    expect(Object.keys(snapshot.data?.actionsById ?? {})).toEqual([
      'cae_1',
      'cae_2',
    ]);
    expect(snapshot).toMatchObject({
      storedVersion: '1.0.0',
      isStoredVersionReady: true,
      publishedVersion: '1.1.0',
      isError: false,
    });

    // une autre instance du hook lit le même store, le même résultat
    const other = getStore();
    const unsubscribeOther = other.subscribe(() => undefined);
    expect(other).toBe(store);
    expect(other.getSnapshot()).toBe(snapshot);

    unsubscribe();
    unsubscribeOther();
  });

  test('change de résultat quand la réponse de l’état change, et seulement alors', async () => {
    const { queryClient, getStore, response } = await setup();
    const store = getStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    await vi.waitFor(() => expect(store.getSnapshot().data).toBeDefined());
    const before = store.getSnapshot();
    listener.mockClear();

    queryClient.setQueryData(stateQueryKey, {
      ...response,
      hiddenActionIds: ['cae_2'],
    });

    await vi.waitFor(() => expect(store.getSnapshot()).not.toBe(before));
    expect(listener).toHaveBeenCalledOnce();
    expect(
      store.getSnapshot().data?.hiddenActions.map((a) => a.actionId)
    ).toEqual(['cae_2']);
    unsubscribe();
  });

  test('garde le même résultat quand le contenu ne change pas', async () => {
    const { getStore, statesCollection } = await setup();
    const store = getStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    await vi.waitFor(() => expect(store.getSnapshot().data).toBeDefined());
    const before = store.getSnapshot();
    listener.mockClear();

    // ligne réémise à l'identique (rechargement, persistance) : le nouvel
    // assemblage ne doit pas faire recalculer toute la table
    const row = structuredClone(statesCollection.get('cae_2'));
    statesCollection.delete('cae_2');
    if (row) statesCollection.insert(row);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store.getSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  test('est libéré après le départ de son dernier abonné', async () => {
    vi.useFakeTimers();
    try {
      const { getStore } = await setup();
      const store = getStore();
      const unsubscribe = store.subscribe(() => undefined);
      unsubscribe();

      vi.advanceTimersByTime(STORE_GC_TIME_MS - 1);
      expect(getStore()).toBe(store);

      vi.advanceTimersByTime(1);
      expect(getStore()).not.toBe(store);
    } finally {
      vi.useRealTimers();
    }
  });
});
