import { act, renderHook, waitFor } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, test, vi } from 'vitest';
import { FiltersPatch } from './filters';
import { useHistoriqueFilters } from './use-historique-filters';

const monterAvecUrl = (searchParams: string) => {
  const onUrlUpdate = vi.fn();
  const { result } = renderHook(() => useHistoriqueFilters(), {
    wrapper: withNuqsTestingAdapter({ searchParams, onUrlUpdate }),
  });

  // Le hook ne renvoie pas la promesse de nuqs : on attend que la file de
  // mise à jour de l'URL se vide plutôt que de l'attendre directement.
  const setFilters = async (patch: FiltersPatch | null) => {
    act(() => {
      result.current[1](patch);
    });
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
  };

  const derniereUrl = () => onUrlUpdate.mock.calls.at(-1)?.[0].searchParams;

  return { setFilters, derniereUrl };
};

describe('useHistoriqueFilters', () => {
  test("retire la page de l'URL quand un filtre change", async () => {
    const { setFilters, derniereUrl } = monterAvecUrl('?p=3');

    await setFilters({ types: ['reponse'] });

    expect(derniereUrl()?.get('t')).toBe('reponse');
    expect(derniereUrl()?.get('p')).toBeNull();
  });

  test('conserve la page quand seule la page change', async () => {
    const { setFilters, derniereUrl } = monterAvecUrl('?t=reponse');

    await setFilters({ page: 2 });

    expect(derniereUrl()?.get('p')).toBe('2');
  });

  test('efface tous les paramètres sur un patch null', async () => {
    const { setFilters, derniereUrl } = monterAvecUrl(
      '?p=3&t=reponse&m=membre'
    );

    await setFilters(null);

    expect(derniereUrl()?.get('p')).toBeNull();
    expect(derniereUrl()?.get('t')).toBeNull();
    expect(derniereUrl()?.get('m')).toBeNull();
  });
});
