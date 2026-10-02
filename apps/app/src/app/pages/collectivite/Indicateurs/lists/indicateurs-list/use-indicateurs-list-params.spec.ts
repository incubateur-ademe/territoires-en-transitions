import { act, renderHook, waitFor } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';
import { useIndicateursListParams } from './use-indicateurs-list-params';

describe('saved indicateur vue URL filters', () => {
  it('uses the latest saved filters when the URL has no override', () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useIndicateursListParams(filters),
      {
        initialProps: { filters: { text: 'Before' } },
        wrapper: withNuqsTestingAdapter(),
      }
    );

    expect(result.current.searchParams.text).toBe('Before');
    rerender({ filters: { text: 'After' } });
    expect(result.current.searchParams.text).toBe('After');
  });

  it('returns to the first page when the shared filters change, preserving presentation', async () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useIndicateursListParams(filters),
      {
        initialProps: { filters: { text: 'Before' } },
        wrapper: withNuqsTestingAdapter({
          searchParams: { $p: '3', $g: 'false', $s: 'titre' },
          hasMemory: true,
        }),
      }
    );

    expect(result.current.searchParams.currentPage).toBe(3);
    rerender({ filters: { text: 'After' } });
    await waitFor(() =>
      expect(result.current.searchParams).toMatchObject({
        text: 'After',
        currentPage: 1,
        displayGraphs: false,
        sortBy: 'titre',
      })
    );
  });

  it('does not reset pagination when refreshed defaults are semantically unchanged', () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useIndicateursListParams(filters),
      {
        initialProps: { filters: { planIds: [1, 2] } },
        wrapper: withNuqsTestingAdapter({ searchParams: { $p: '3' } }),
      }
    );

    rerender({ filters: { planIds: [2, 1, 1] } });
    expect(result.current.searchParams.currentPage).toBe(3);
  });

  it.each([{}, { text: 'Local override' }])(
    'preserves an explicit URL filter %j and its page when saved filters change',
    (filter) => {
      const { result, rerender } = renderHook(
        ({ filters }) => useIndicateursListParams(filters),
        {
          initialProps: { filters: { text: 'Before' } },
          wrapper: withNuqsTestingAdapter({
            searchParams: { filter: JSON.stringify(filter), $p: '3' },
          }),
        }
      );

      rerender({ filters: { text: 'After' } });
      const { currentPage, sortBy, displayGraphs, ...activeFilters } =
        result.current.searchParams;
      expect(activeFilters).toEqual(filter);
      expect(currentPage).toBe(3);
    }
  );

  it.each([{}, { text: 'Modification de consultation' }])(
    'persists the current filters %j in the URL, including an empty reset',
    async (filter) => {
      const onUrlUpdate = vi.fn();
      const { result } = renderHook(
        () => useIndicateursListParams({ text: 'Vue enregistrée' }),
        {
          wrapper: withNuqsTestingAdapter({
            searchParams: { $p: '3', $g: 'false', $s: 'titre' },
            onUrlUpdate,
            hasMemory: true,
          }),
        }
      );

      act(() => {
        result.current.setSearchParams({
          sortBy: result.current.searchParams.sortBy,
          displayGraphs: result.current.searchParams.displayGraphs,
          currentPage: 1,
          ...filter,
        });
      });

      await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
      const searchParams = onUrlUpdate.mock.calls.at(-1)?.[0].searchParams;
      expect(JSON.parse(searchParams.get('filter'))).toEqual(filter);
      expect(result.current.searchParams).toEqual({
        ...filter,
        currentPage: 1,
        displayGraphs: false,
        sortBy: 'titre',
      });
    }
  );

  it('restores saved criteria and the first page without losing presentation options', async () => {
    const { result } = renderHook(
      () => useIndicateursListParams({ text: 'Vue enregistrée' }),
      {
        wrapper: withNuqsTestingAdapter({
          searchParams: { filter: '{}', $p: '3', $g: 'false', $s: 'titre' },
          hasMemory: true,
        }),
      }
    );

    act(() => result.current.restoreDefaultFilters());

    await waitFor(() =>
      expect(result.current.searchParams).toEqual({
        text: 'Vue enregistrée',
        currentPage: 1,
        displayGraphs: false,
        sortBy: 'titre',
      })
    );
  });
});
