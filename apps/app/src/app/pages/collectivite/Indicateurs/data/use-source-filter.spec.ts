import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSourceFilter } from './use-source-filter';

const mocks = vi.hoisted(() => ({
  availableSources: vi.fn(),
  moyenne: vi.fn(),
  reference: vi.fn(),
}));

vi.mock('./use-indicateur-sources', () => ({
  useIndicateurAvailableSources: mocks.availableSources,
}));

vi.mock('./use-indicateur-moyenne', () => ({
  useIndicateurMoyenne: mocks.moyenne,
}));

vi.mock('./use-indicateur-reference', () => ({
  useIndicateurReference: mocks.reference,
  hasValeurCible: (reference?: {
    cible: number | null;
    objectifs?: unknown[] | null;
  }) =>
    Boolean(
      reference &&
        (reference.cible !== null || Boolean(reference.objectifs?.length))
    ),
  hasValeurSeuil: (reference?: { seuil: number | null }) =>
    Boolean(reference && reference.seuil !== null),
}));

describe('useSourceFilter', () => {
  beforeEach(() => {
    mocks.availableSources.mockReturnValue({
      data: [{ id: 'snbc' }, { id: 'pcaet' }, { id: 'citepa' }],
      isLoading: false,
    });
    mocks.moyenne.mockReturnValue({
      data: { valeurs: [{ valeur: 12 }] },
      isLoading: false,
    });
    mocks.reference.mockReturnValue({
      data: {
        cible: 20,
        objectifs: null,
        seuil: 10,
        libelle: 'Référence',
        drom: false,
      },
      isLoading: false,
    });
  });

  it('mémorise son résultat tant que les données et les filtres sont stables', () => {
    const input = { collectiviteId: 42, indicateurId: 7 };
    const { result, rerender } = renderHook(() => useSourceFilter(input));
    const initialResult = result.current;

    rerender();

    expect(result.current).toBe(initialResult);
  });

  it('déplie le filtre open data sans perdre les autres filtres', () => {
    const input = { collectiviteId: 42, indicateurId: 7 };
    const { result, rerender } = renderHook(() => useSourceFilter(input));

    act(() => result.current.setFiltresSource(['opendata', 'cible']));

    expect(result.current.sources).toEqual(['citepa', 'cible']);
    expect(result.current.valeursReference).toMatchObject({
      cible: 20,
      seuil: null,
    });

    const filteredResult = result.current;
    rerender();
    expect(result.current).toBe(filteredResult);
  });
});
