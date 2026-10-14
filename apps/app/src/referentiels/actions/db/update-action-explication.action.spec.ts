import { QueryClient } from '@tanstack/react-query';
import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
  ActionStatesCollection,
  ActionStateRow,
} from './action-states.collection';
import { buildState, toStateRows } from './test-fixtures';
import { updateActionExplicationOptimistically } from './update-action-explication.action';

/** Collection d'état adossée à une query, avec un serveur simulé */
const setup = () => {
  let serverRows = toStateRows([buildState('cae_1'), buildState('cae_2')]);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const queryFn = vi.fn(async () => structuredClone(serverRows));
  const states = createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: ['states'],
      queryFn,
      getKey: (row: ActionStateRow) => row.actionId,
    })
  ) as unknown as ActionStatesCollection;

  const setServerExplication = (actionId: string, explication: string) => {
    serverRows = serverRows.map((row) =>
      row.actionId === actionId
        ? { ...row, score: { ...row.score, explication } }
        : row
    );
  };

  return { states, queryFn, setServerExplication };
};

const input = { actionId: 'cae_1', collectiviteId: 1, commentaire: 'Nouveau' };

describe('updateActionExplicationOptimistically', () => {
  test('affiche le commentaire tout de suite, puis la valeur enregistrée, sans recharger l’état', async () => {
    const { states, queryFn } = setup();
    await states.preload();
    queryFn.mockClear();

    let releaseSave: () => void = () => undefined;
    const save = vi.fn(
      () =>
        new Promise<{ commentaire: string }>((resolve) => {
          releaseSave = () => resolve({ commentaire: 'Nouveau (enregistré)' });
        })
    );

    const done = updateActionExplicationOptimistically(states, input, save);

    // optimiste, avant la réponse du serveur
    expect(states.get('cae_1')?.score.explication).toBe('Nouveau');

    releaseSave();
    await done;

    expect(save).toHaveBeenCalledWith(input);
    expect(states.get('cae_1')?.score.explication).toBe('Nouveau (enregistré)');
    // le reste du score est conservé
    expect(states.get('cae_1')?.score).toMatchObject({ actionId: 'cae_1' });
    expect(queryFn).not.toHaveBeenCalled();
  });

  test('annule la mise à jour optimiste si l’enregistrement échoue, puis recharge l’état', async () => {
    const { states, queryFn } = setup();
    await states.preload();
    queryFn.mockClear();

    const save = vi.fn(async () => {
      throw new Error('refus du serveur');
    });

    const done = updateActionExplicationOptimistically(states, input, save);
    expect(states.get('cae_1')?.score.explication).toBe('Nouveau');

    await expect(done).rejects.toThrow('refus du serveur');
    expect(states.get('cae_1')?.score.explication).toBe('Explication cae_1');
    expect(queryFn).toHaveBeenCalledOnce();
  });

  test('affiche le commentaire enregistré malgré l’erreur (échec du recalcul du snapshot)', async () => {
    const { states, setServerExplication } = setup();
    await states.preload();

    const save = vi.fn(async () => {
      setServerExplication('cae_1', 'Nouveau');
      throw new Error('SNAPSHOT_UPDATE_FAILED');
    });

    await expect(
      updateActionExplicationOptimistically(states, input, save)
    ).rejects.toThrow('SNAPSHOT_UPDATE_FAILED');
    expect(states.get('cae_1')?.score.explication).toBe('Nouveau');
  });

  test('enregistre sans mise à jour optimiste si l’action n’est pas chargée', async () => {
    const { states, queryFn } = setup();
    await states.preload();
    queryFn.mockClear();
    const save = vi.fn(async () => ({ commentaire: 'Nouveau' }));

    await updateActionExplicationOptimistically(
      states,
      { ...input, actionId: 'cae_9' },
      save
    );

    expect(save).toHaveBeenCalledOnce();
    expect(queryFn).not.toHaveBeenCalled();
  });
});
