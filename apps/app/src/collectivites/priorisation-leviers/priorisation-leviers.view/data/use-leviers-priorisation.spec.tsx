import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { JSX, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useLeviersPriorisation } from './use-leviers-priorisation';

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
            queryFn: () => ({ leviers: [] }),
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
              queryFn: () => ({ secteurs: [] }),
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
  it("garde la même liste de leviers d'un rendu à l'autre tant que les données ne changent pas", async () => {
    const { result, rerender } = renderHook(() => useLeviersPriorisation(1), {
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
});
