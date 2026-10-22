import { QueryClient } from '@tanstack/react-query';
import type { ReferentielId } from '@tet/domain/referentiels';
import { createActionDefinitionsCollection } from './action-definitions.collection';
import {
  getDefinitionsSyncKey,
  syncReferentielDefinitions,
} from './sync-referentiel-definitions';
import { buildDefinition } from './test-fixtures';

describe('getDefinitionsSyncKey', () => {
  test('charge les définitions absentes sans attendre la version publiée', () => {
    expect(
      getDefinitionsSyncKey({
        referentielId: 'te',
        storedVersion: undefined,
        publishedVersion: undefined,
      })
    ).toBe('te:vide');
  });

  test('ne recharge pas des définitions à jour, ni tant que la version publiée est inconnue', () => {
    expect(
      getDefinitionsSyncKey({
        referentielId: 'te',
        storedVersion: '1.0.0',
        publishedVersion: '1.0.0',
      })
    ).toBeNull();
    expect(
      getDefinitionsSyncKey({
        referentielId: 'te',
        storedVersion: '1.0.0',
        publishedVersion: undefined,
      })
    ).toBeNull();
  });

  test('recharge quand une nouvelle version a été publiée, une clé par écart', () => {
    expect(
      getDefinitionsSyncKey({
        referentielId: 'te',
        storedVersion: '1.0.0',
        publishedVersion: '1.1.0',
      })
    ).toBe('te:1.0.0:1.1.0');
  });
});

describe('syncReferentielDefinitions', () => {
  const referentielId: ReferentielId = 'te';
  const fetchedVersion = '1.1.0';

  const setup = () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined);
    const trpc = {
      referentiels: {
        actions: {
          listActionDefinitions: {
            queryOptions: (input: unknown) => ({
              queryKey: ['listActionDefinitions', input],
              queryFn: async () => ({
                referentielVersion: fetchedVersion,
                definitionsById: {
                  te_1: buildDefinition('te_1', {
                    referentielVersion: fetchedVersion,
                  }),
                },
              }),
            }),
          },
          listActionsGroupedById: {
            queryFilter: (input: unknown) => ({
              queryKey: ['listActionsGroupedById', input],
            }),
          },
        },
      },
    };
    const collection = createActionDefinitionsCollection(null);
    const onWriteError = vi.fn();
    const sync = (publishedVersion: string | undefined) =>
      syncReferentielDefinitions({
        referentielId,
        publishedVersion,
        collection,
        queryClient,
        trpc: trpc as never,
        onWriteError,
      });
    return { collection, invalidateQueries, onWriteError, sync };
  };

  test('écrit les définitions dans la collection et renvoie la version', async () => {
    const { collection, sync } = setup();

    await expect(sync(undefined)).resolves.toBe(fetchedVersion);

    expect(collection.get('te_1')?.nom).toBe('Nom te_1');
  });

  test("recharge l'état quand la version chargée diffère de la version publiée", async () => {
    const { invalidateQueries, sync } = setup();

    await sync('1.2.0');

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
  });

  test("ne recharge pas l'état si les versions sont égales ou la version publiée inconnue", async () => {
    const { invalidateQueries, sync } = setup();

    await sync(fetchedVersion);
    await sync(undefined);

    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  test("signale l'échec de l'écriture dans la collection (persistance locale)", async () => {
    const { collection, onWriteError, sync } = setup();
    const writeError = new Error('quota dépassé');
    vi.spyOn(collection.utils, 'acceptMutations').mockRejectedValue(writeError);

    await expect(sync(undefined)).rejects.toThrow('quota dépassé');

    expect(onWriteError).toHaveBeenCalledWith(writeError);
  });

  test("ne signale pas d'échec d'écriture quand l'écriture réussit", async () => {
    const { onWriteError, sync } = setup();

    await sync(undefined);

    expect(onWriteError).not.toHaveBeenCalled();
  });
});
