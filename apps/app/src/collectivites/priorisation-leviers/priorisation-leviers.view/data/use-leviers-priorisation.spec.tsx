import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { JSX, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLeviersPriorisation } from './use-leviers-priorisation';

const fakeApi = vi.hoisted(() => ({
  isCommune: false,
  getTrajectoire: vi.fn(() => ({ secteurs: [] })),
}));

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: () => ({
    collectiviteId: 1,
    collectiviteType: fakeApi.isCommune ? 'commune' : 'epci',
  }),
}));

vi.mock('@tet/api', () => ({
  useTRPC: () => ({
    collectivites: {
      pertinenceLeviers: {
        list: {
          queryOptions: () => ({
            queryKey: ['pertinences'],
            queryFn: () => ({ pertinences: [] }),
          }),
        },
      },
      analysis: {
        getMobilisation: {
          queryOptions: () => ({
            queryKey: ['mobilisation'],
            queryFn: () => ({ analyzedFicheCount: 0, leviers: [] }),
          }),
        },
      },
    },
    indicateurs: {
      trajectoires: {
        leviers: {
          getData: {
            queryOptions: (_input: unknown, options: object) => ({
              ...options,
              queryKey: ['trajectoire'],
              queryFn: fakeApi.getTrajectoire,
            }),
          },
        },
      },
    },
  }),
}));

const toQueryClientWrapper = (
  queryClient: QueryClient
): (({ children }: { children: ReactNode }) => JSX.Element) => {
  const QueryClientWrapper = ({
    children,
  }: {
    children: ReactNode;
  }): JSX.Element => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return QueryClientWrapper;
};

describe('useLeviersPriorisation', () => {
  afterEach(() => {
    fakeApi.isCommune = false;
    fakeApi.getTrajectoire.mockClear();
  });

  it("garde la même liste de leviers d'un rendu à l'autre tant que les données ne changent pas", async () => {
    const { result, rerender } = renderHook(() => useLeviersPriorisation(), {
      wrapper: toQueryClientWrapper(new QueryClient()),
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    const leviersBeforeRerender =
      result.current.status === 'ready' ? result.current.leviers : undefined;

    rerender();

    const leviersAfterRerender =
      result.current.status === 'ready' ? result.current.leviers : undefined;
    expect(leviersBeforeRerender).toBeDefined();
    expect(leviersAfterRerender).toBe(leviersBeforeRerender);
  });

  it('hors EPCI, signale la vue réservée aux EPCI sans demander la trajectoire', async () => {
    fakeApi.isCommune = true;
    const { result } = renderHook(() => useLeviersPriorisation(), {
      wrapper: toQueryClientWrapper(
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      ),
    });

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'ready',
        leviers: [],
        analyzedFicheCount: 0,
        access: 'reservedToEpci',
      })
    );
    expect(fakeApi.getTrajectoire).not.toHaveBeenCalled();
  });
});
