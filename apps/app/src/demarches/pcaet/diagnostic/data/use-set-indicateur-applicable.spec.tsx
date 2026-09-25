import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { JSX, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSetIndicateurApplicable } from './use-set-indicateur-applicable';

const COLLECTIVITE_ID = 7;
const DEMARCHE_ID = 3;

/**
 * Seul `useTRPC` est simulé : le `QueryClient` est réel, car c'est justement sa
 * mécanique — écriture optimiste, rollback ciblé, comptage des mutations en vol
 * — que ces tests fixent. Les clés reproduisent la forme de celles de tRPC
 * (préfixe + input), qu'React Query hache structurellement.
 */
const DIAGNOSTIC_KEY = [
  'diagnostic',
  { collectiviteId: COLLECTIVITE_ID, demarcheId: DEMARCHE_ID },
];
const PCAET_KEY = [
  'pcaet',
  { collectiviteId: COLLECTIVITE_ID, demarcheId: DEMARCHE_ID },
];
const UPDATE_MUTATION_KEY = ['indicateurs', 'update'];

const { mutationFn } = vi.hoisted(() => ({ mutationFn: vi.fn() }));

vi.mock('@tet/api', () => ({
  useTRPC: () => ({
    demarches: {
      pcaet: {
        get: { queryKey: () => PCAET_KEY },
        diagnostic: { get: { queryKey: () => DIAGNOSTIC_KEY } },
      },
    },
    indicateurs: {
      indicateurs: {
        update: {
          mutationKey: () => UPDATE_MUTATION_KEY,
          // `mutationOptions` de tRPC rend les options du consommateur
          // augmentées de sa clé et de sa fonction de mutation.
          mutationOptions: (options: Record<string, unknown>) => ({
            ...options,
            mutationKey: UPDATE_MUTATION_KEY,
            mutationFn,
          }),
        },
      },
    },
  }),
}));

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: () => COLLECTIVITE_ID,
}));

type Diagnostic = {
  indicateurDefinitions: { id: number; isApplicable: boolean }[];
  indicateurValeurs: string[];
};

const seed: Diagnostic = {
  indicateurDefinitions: [
    { id: 1, isApplicable: true },
    { id: 2, isApplicable: true },
  ],
  indicateurValeurs: ['intactes'],
};

type Deferred = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
};

/** Laisse chaque requête en vol aussi longtemps que le test en a besoin. */
const enVol: Deferred[] = [];

const newDeferred = (): Deferred => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = () => res();
    reject = rej;
  });
  return { promise, resolve, reject };
};

const renderSetIndicateurApplicable = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(DIAGNOSTIC_KEY, structuredClone(seed));
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useSetIndicateurApplicable(DEMARCHE_ID), {
    wrapper,
  });

  /**
   * Part la bascule sans attendre sa réponse. `mutateAsync` rejette quand la
   * requête échoue : on absorbe le rejet ici, les tests lisent le cache.
   */
  const toggle = async (indicateurId: number, isApplicable: boolean) => {
    await act(async () => {
      void result.current
        .setIndicateurApplicable({ indicateurId, isApplicable })
        .catch(() => undefined);
    });
  };

  const isApplicableInCache = (indicateurId: number) =>
    queryClient
      .getQueryData<Diagnostic>(DIAGNOSTIC_KEY)
      ?.indicateurDefinitions.find(({ id }) => id === indicateurId)
      ?.isApplicable;

  const wasInvalidated = (queryKey: unknown[]) =>
    invalidateQueries.mock.calls.some(
      ([filters]) =>
        JSON.stringify(filters?.queryKey) === JSON.stringify(queryKey)
    );

  return {
    queryClient,
    toggle,
    isApplicableInCache,
    wasInvalidated,
    invalidateQueries,
  };
};

const settle = async (deferred: Deferred, outcome: 'ok' | 'ko') => {
  await act(async () => {
    if (outcome === 'ok') {
      deferred.resolve();
    } else {
      deferred.reject(new Error('échec réseau'));
    }
    await deferred.promise.catch(() => undefined);
  });
};

describe('useSetIndicateurApplicable', () => {
  beforeEach(() => {
    enVol.length = 0;
    mutationFn.mockReset();
    mutationFn.mockImplementation(() => {
      const deferred = newDeferred();
      enVol.push(deferred);
      return deferred.promise;
    });
  });

  it('bascule le flag dans le cache sans attendre la réponse', async () => {
    const { toggle, isApplicableInCache } = renderSetIndicateurApplicable();

    await toggle(1, false);

    expect(isApplicableInCache(1)).toBe(false);
    expect(enVol).toHaveLength(1);
  });

  it('ne touche que le flag visé : le reste du diagnostic est laissé en place', async () => {
    const { toggle, queryClient } = renderSetIndicateurApplicable();

    await toggle(1, false);

    const diagnostic = queryClient.getQueryData<Diagnostic>(DIAGNOSTIC_KEY);
    expect(diagnostic?.indicateurValeurs).toEqual(['intactes']);
    expect(diagnostic?.indicateurDefinitions).toHaveLength(2);
  });

  it("garde la bascule d'une autre ligne quand celle-ci échoue", async () => {
    const { toggle, isApplicableInCache } = renderSetIndicateurApplicable();

    await toggle(1, false);
    await toggle(2, false);

    await settle(enVol[0], 'ko');

    // Le rollback ne restaure que la ligne 1 : la 2 est encore en vol, son
    // optimiste doit survivre.
    expect(isApplicableInCache(1)).toBe(true);
    expect(isApplicableInCache(2)).toBe(false);
  });

  it('ne resynchronise le diagnostic que quand plus aucune mise à jour ne vole', async () => {
    const { toggle, wasInvalidated, invalidateQueries } =
      renderSetIndicateurApplicable();

    await toggle(1, false);
    await toggle(2, false);

    await settle(enVol[0], 'ok');
    expect(wasInvalidated(DIAGNOSTIC_KEY)).toBe(false);

    invalidateQueries.mockClear();
    await settle(enVol[1], 'ok');
    expect(wasInvalidated(DIAGNOSTIC_KEY)).toBe(true);
  });

  it('invalide le parcours même en laissant le diagnostic de côté', async () => {
    const { toggle, wasInvalidated } = renderSetIndicateurApplicable();

    await toggle(1, false);
    await toggle(2, false);

    await settle(enVol[0], 'ok');

    // Le badge de complétion dépend de l'applicabilité : il ne peut pas rester
    // sur son compte d'avant la bascule en attendant la fin des autres.
    expect(wasInvalidated(PCAET_KEY)).toBe(true);
    expect(wasInvalidated(DIAGNOSTIC_KEY)).toBe(false);
  });

  it('ignore un second clic sur une ligne déjà en vol, pas sur les autres', async () => {
    const { toggle } = renderSetIndicateurApplicable();

    await toggle(1, false);
    await toggle(1, true);

    expect(mutationFn).toHaveBeenCalledTimes(1);

    await toggle(2, false);
    expect(mutationFn).toHaveBeenCalledTimes(2);

    // La ligne se rouvre dès que sa bascule est retombée.
    await settle(enVol[0], 'ok');
    await toggle(1, true);
    expect(mutationFn).toHaveBeenCalledTimes(3);
  });
});
