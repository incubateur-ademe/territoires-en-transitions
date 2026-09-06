import type { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { invalidateIndicateurValeursQueries } from './invalidate-indicateur-valeurs-queries';

describe('invalidateIndicateurValeursQueries', () => {
  it('attend le rafraichissement de toutes les projections', async () => {
    let resolveValues: () => void = () => undefined;
    const invalidateQueries = vi
      .fn()
      .mockResolvedValue(undefined)
      .mockImplementationOnce(() => Promise.resolve())
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveValues = resolve;
          })
      );
    const queryKey = (name: string) => (input: unknown) => [name, input];
    const pathKey = (name: string) => () => [name];
    const trpc = {
      indicateurs: {
        indicateurs: { list: { queryKey: queryKey('indicateurs') } },
        valeurs: {
          list: { queryKey: queryKey('valeurs') },
          average: { queryKey: queryKey('average') },
        },
      },
      referentiels: {
        actions: {
          getValeursUtilisables: { queryKey: queryKey('referentiels') },
          getScoreIndicatif: { pathKey: pathKey('score-indicatif') },
        },
      },
      demarches: {
        pcaet: {
          get: { pathKey: pathKey('demarche-pcaet') },
          diagnostic: {
            get: { pathKey: pathKey('diagnostic-pcaet') },
          },
        },
      },
    };

    let settled = false;
    const invalidation = invalidateIndicateurValeursQueries({
      queryClient: { invalidateQueries } as unknown as QueryClient,
      trpc: trpc as never,
      collectiviteId: 12,
    }).then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(invalidateQueries).toHaveBeenCalledTimes(7);
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ['indicateurs', { collectiviteId: 12 }] }],
      [{ queryKey: ['valeurs', { collectiviteId: 12 }] }],
      [{ queryKey: ['average', { collectiviteId: 12 }] }],
      [{ queryKey: ['referentiels', { collectiviteId: 12 }] }],
      [{ queryKey: ['score-indicatif'] }],
      [{ queryKey: ['diagnostic-pcaet'] }],
      [{ queryKey: ['demarche-pcaet'] }],
    ]);
    expect(settled).toBe(false);

    resolveValues();
    await invalidation;
    expect(settled).toBe(true);
  });
});
