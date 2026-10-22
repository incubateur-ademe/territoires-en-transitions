import { QueryClient } from '@tanstack/react-query';
import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { ListActionsDynamicStateResult } from '@tet/domain/referentiels';
import {
  ActionStatesCollection,
  ActionStateRow,
} from './action-states.collection';
import { buildState } from './test-fixtures';
import {
  patchActionExplication,
  updateActionExplicationOptimistically,
} from './update-action-explication.action';

const queryKey = ['listActionsGroupedById'];

/**
 * Collection d'état adossée à une query qui renvoie la réponse brute (avec
 * le même `select` dérivé qu'en production), avec un serveur simulé
 */
const setup = () => {
  let serverResponse: ListActionsDynamicStateResult = {
    referentielVersion: '1.0.0',
    hiddenActionIds: [],
    actionsById: { cae_1: buildState('cae_1'), cae_2: buildState('cae_2') },
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const queryFn = vi.fn(async () => structuredClone(serverResponse));
  const states = createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey,
      queryFn,
      select: (response: ListActionsDynamicStateResult) =>
        Object.values(response.actionsById).map(
          (state, position): ActionStateRow => ({ ...state, position })
        ),
      getKey: (row: ActionStateRow) => row.actionId,
    })
  ) as unknown as ActionStatesCollection;

  const setServerExplication = (actionId: string, explication: string) => {
    serverResponse = patchActionExplication(
      serverResponse,
      actionId,
      explication
    ) as ListActionsDynamicStateResult;
  };

  const patchStateCache = vi.fn((commentaire: string) =>
    queryClient.setQueryData<ListActionsDynamicStateResult>(
      queryKey,
      (response) => patchActionExplication(response, 'cae_1', commentaire)
    )
  );
  const getCachedExplication = (actionId: string) =>
    queryClient.getQueryData<ListActionsDynamicStateResult>(queryKey)
      ?.actionsById[actionId]?.score.explication;

  return {
    queryClient,
    states,
    queryFn,
    setServerExplication,
    patchStateCache,
    getCachedExplication,
  };
};

const input = { actionId: 'cae_1', collectiviteId: 1, commentaire: 'Nouveau' };

describe('updateActionExplicationOptimistically', () => {
  test('affiche le commentaire tout de suite, puis la valeur enregistrée, sans recharger l’état', async () => {
    const { states, queryFn, patchStateCache, getCachedExplication } = setup();
    await states.preload();
    queryFn.mockClear();

    let releaseSave: () => void = () => undefined;
    const save = vi.fn(
      () =>
        new Promise<{ commentaire: string }>((resolve) => {
          releaseSave = () => resolve({ commentaire: 'Nouveau (enregistré)' });
        })
    );
    const explications: Array<string | undefined> = [];
    const subscription = states.subscribeChanges(() =>
      explications.push(states.get('cae_1')?.score.explication)
    );

    const done = updateActionExplicationOptimistically(states, input, {
      save,
      patchStateCache,
    });

    // optimiste, avant la réponse du serveur
    expect(states.get('cae_1')?.score.explication).toBe('Nouveau');

    releaseSave();
    await done;
    subscription.unsubscribe();

    expect(save).toHaveBeenCalledWith(input);
    expect(patchStateCache).toHaveBeenCalledWith('Nouveau (enregistré)');
    expect(states.get('cae_1')?.score.explication).toBe('Nouveau (enregistré)');
    // le cache brut porte aussi la valeur enregistrée
    expect(getCachedExplication('cae_1')).toBe('Nouveau (enregistré)');
    // pas de retour à l'ancienne valeur entre l'optimiste et l'enregistré
    expect(explications).not.toContain('Explication cae_1');
    // le reste du score est conservé
    expect(states.get('cae_1')?.score).toMatchObject({ actionId: 'cae_1' });
    expect(queryFn).not.toHaveBeenCalled();
  });

  test('les autres écritures du cache brut atteignent encore la collection', async () => {
    const { queryClient, states, patchStateCache } = setup();
    await states.preload();

    await updateActionExplicationOptimistically(states, input, {
      save: async () => ({ commentaire: 'Nouveau' }),
      patchStateCache,
    });
    // ex. renommage d'un service (`patchServiceTagInDenormalizedCaches`)
    queryClient.setQueryData<ListActionsDynamicStateResult>(
      queryKey,
      (response) =>
        response && {
          ...response,
          actionsById: {
            ...response.actionsById,
            cae_2: { ...response.actionsById.cae_2, services: [] },
          },
        }
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(states.get('cae_2')?.services).toEqual([]);
    expect(states.get('cae_1')?.score.explication).toBe('Nouveau');
  });

  test('annule la mise à jour optimiste si l’enregistrement échoue, puis recharge l’état', async () => {
    const { states, queryFn, patchStateCache, getCachedExplication } = setup();
    await states.preload();
    queryFn.mockClear();

    const save = vi.fn(async () => {
      throw new Error('refus du serveur');
    });

    const done = updateActionExplicationOptimistically(states, input, {
      save,
      patchStateCache,
    });
    expect(states.get('cae_1')?.score.explication).toBe('Nouveau');

    await expect(done).rejects.toThrow('refus du serveur');
    expect(states.get('cae_1')?.score.explication).toBe('Explication cae_1');
    expect(getCachedExplication('cae_1')).toBe('Explication cae_1');
    expect(patchStateCache).not.toHaveBeenCalled();
    expect(queryFn).toHaveBeenCalledOnce();
  });

  test('affiche le commentaire enregistré malgré l’erreur (échec du recalcul du snapshot)', async () => {
    const { states, setServerExplication, patchStateCache } = setup();
    await states.preload();

    const save = vi.fn(async () => {
      setServerExplication('cae_1', 'Nouveau');
      throw new Error('SNAPSHOT_UPDATE_FAILED');
    });

    await expect(
      updateActionExplicationOptimistically(states, input, {
        save,
        patchStateCache,
      })
    ).rejects.toThrow('SNAPSHOT_UPDATE_FAILED');
    expect(states.get('cae_1')?.score.explication).toBe('Nouveau');
    expect(patchStateCache).not.toHaveBeenCalled();
  });

  test('enregistre sans mise à jour optimiste si l’action n’est pas chargée', async () => {
    const { states, queryFn, patchStateCache } = setup();
    await states.preload();
    queryFn.mockClear();
    const save = vi.fn(async () => ({ commentaire: 'Nouveau' }));

    await updateActionExplicationOptimistically(
      states,
      { ...input, actionId: 'cae_9' },
      { save, patchStateCache }
    );

    expect(save).toHaveBeenCalledOnce();
    expect(patchStateCache).toHaveBeenCalledWith('Nouveau');
    expect(queryFn).not.toHaveBeenCalled();
  });
});

describe('patchActionExplication', () => {
  test('ne remplace que l’explication de l’action, sans muter la réponse', () => {
    const response: ListActionsDynamicStateResult = {
      referentielVersion: '1.0.0',
      hiddenActionIds: [],
      actionsById: { cae_1: buildState('cae_1'), cae_2: buildState('cae_2') },
    };

    const patched = patchActionExplication(response, 'cae_1', 'Nouveau');

    expect(patched?.actionsById.cae_1.score.explication).toBe('Nouveau');
    expect(patched?.actionsById.cae_2).toBe(response.actionsById.cae_2);
    expect(response.actionsById.cae_1.score.explication).toBe(
      'Explication cae_1'
    );
  });

  test('renvoie la réponse inchangée si l’action est absente', () => {
    const response: ListActionsDynamicStateResult = {
      referentielVersion: '1.0.0',
      hiddenActionIds: [],
      actionsById: {},
    };

    expect(patchActionExplication(response, 'cae_1', 'Nouveau')).toBe(response);
    expect(patchActionExplication(undefined, 'cae_1', 'Nouveau')).toBe(
      undefined
    );
  });
});
