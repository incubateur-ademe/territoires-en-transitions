import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSelectFiches } from './use-select-fiches';

describe('useFicheActionSelection', () => {
  describe('Grouped actions mode', () => {
    it('should reset selection when disabling grouped actions mode', () => {
      const { result } = renderHook(() =>
        useSelectFiches({
          view: 'grid',
          currentPage: 1,
          isReadOnly: false,
          permissions: [],
        })
      );

      // Select some fiches and enable grouped mode
      act(() => {
        result.current.handleSelectFiche(1);
        result.current.toggleGroupedActionsMode(true);
      });
      expect(result.current.selectedFicheIds).toEqual([1]);

      // Disable grouped mode should reset selection
      act(() => {
        result.current.toggleGroupedActionsMode(false);
      });
      expect(result.current.selectedFicheIds).toEqual([]);
    });
  });

  describe('Selection handling', () => {
    it('should select and deselect individual fiches', () => {
      const { result } = renderHook(() =>
        useSelectFiches({
          view: 'grid',
          currentPage: 1,
          isReadOnly: false,
          permissions: [],
        })
      );

      act(() => {
        result.current.handleSelectFiche(1);
      });
      expect(result.current.selectedFicheIds).toEqual([1]);

      act(() => {
        result.current.handleSelectFiche(1);
      });
      expect(result.current.selectedFicheIds).toEqual([]);
    });

    it('should select multiple fiches', () => {
      const { result } = renderHook(() =>
        useSelectFiches({
          view: 'grid',
          currentPage: 1,
          isReadOnly: false,
          permissions: [],
        })
      );

      act(() => {
        result.current.handleSelectFiche(1);
      });
      act(() => {
        result.current.handleSelectFiche(2);
      });
      act(() => {
        result.current.handleSelectFiche(3);
      });

      expect(result.current.selectedFicheIds).toEqual([1, 2, 3]);
    });

    it('should handle select all mode', () => {
      const { result } = renderHook(() =>
        useSelectFiches({
          view: 'grid',
          currentPage: 1,
          isReadOnly: false,
          permissions: [],
        })
      );

      act(() => {
        result.current.toggleGroupedActionsMode(true);
        result.current.handleSelectAll(true);
      });

      expect(result.current.selectedFicheIds).toBe('all');
      expect(result.current.isSelectAllMode).toBe(true);
    });

    it('should deselect all when handleSelectAll is called with false', () => {
      const { result } = renderHook(() =>
        useSelectFiches({
          view: 'grid',
          currentPage: 1,
          isReadOnly: false,
          permissions: [],
        })
      );

      // First select some fiches
      act(() => {
        result.current.handleSelectFiche(1);
      });
      act(() => {
        result.current.handleSelectFiche(2);
      });
      expect(result.current.selectedFicheIds).toEqual([1, 2]);

      // Then deselect all
      act(() => {
        result.current.handleSelectAll(false);
      });
      expect(result.current.selectedFicheIds).toEqual([]);
    });

    it('should convert from "all" to specific selections when selecting individual fiche', () => {
      const { result } = renderHook(() =>
        useSelectFiches({
          view: 'grid',
          currentPage: 1,
          isReadOnly: false,
          permissions: [],
        })
      );

      // First select all
      act(() => {
        result.current.toggleGroupedActionsMode(true);
        result.current.handleSelectAll(true);
      });
      expect(result.current.selectedFicheIds).toBe('all');

      // Then select individual fiche (should convert to array and add the fiche)
      act(() => {
        result.current.handleSelectFiche(1);
      });
      expect(result.current.selectedFicheIds).toEqual([1]);
    });
  });

  describe('Page change behavior', () => {
    it('should preserve selection on page change when in select all mode', () => {
      const { result, rerender } = renderHook(
        (currentPage) =>
          useSelectFiches({
            view: 'grid',
            currentPage,
            isReadOnly: false,
            permissions: [],
          }),
        { initialProps: 1 }
      );

      act(() => {
        result.current.toggleGroupedActionsMode(true);
        result.current.handleSelectAll(true);
      });
      expect(result.current.selectedFicheIds).toBe('all');
      expect(result.current.isSelectAllMode).toBe(true);

      rerender(2);
      expect(result.current.selectedFicheIds).toBe('all');
      expect(result.current.isSelectAllMode).toBe(true);
    });

    it('should keep selection between page change when not in select all mode', () => {
      const { result, rerender } = renderHook(
        (currentPage) =>
          useSelectFiches({
            view: 'grid',
            currentPage,
            isReadOnly: false,
            permissions: [],
          }),
        { initialProps: 1 }
      );

      // Select some fiches
      act(() => {
        result.current.handleSelectFiche(1);
      });
      expect(result.current.selectedFicheIds).toEqual([1]);

      // Change page - should reset
      rerender(2);
      expect(result.current.selectedFicheIds).toEqual([1]);

      // Select on new page
      act(() => {
        result.current.handleSelectFiche(4);
      });
      expect(result.current.selectedFicheIds).toEqual([1, 4]);

      // Change page again - should reset again
      rerender(3);
      expect(result.current.selectedFicheIds).toEqual([1, 4]);
    });
  });

  describe('Reset functionality', () => {
    it('should reset selection to empty array', () => {
      const { result } = renderHook(() =>
        useSelectFiches({
          view: 'grid',
          currentPage: 1,
          isReadOnly: false,
          permissions: [],
        })
      );

      act(() => {
        result.current.handleSelectFiche(1);
      });
      act(() => {
        result.current.handleSelectFiche(2);
      });
      expect(result.current.selectedFicheIds).toEqual([1, 2]);

      // Reset is called internally by toggleGroupedActionsMode(false)
      act(() => {
        result.current.toggleGroupedActionsMode(false);
      });
      expect(result.current.selectedFicheIds).toEqual([]);
    });

    it('should reset from select all mode', () => {
      const { result } = renderHook(() =>
        useSelectFiches({
          view: 'grid',
          currentPage: 1,
          isReadOnly: false,
          permissions: [],
        })
      );

      act(() => {
        result.current.toggleGroupedActionsMode(true);
        result.current.handleSelectAll(true);
      });
      expect(result.current.selectedFicheIds).toBe('all');

      act(() => {
        result.current.handleSelectAll(false);
      });
      expect(result.current.selectedFicheIds).toEqual([]);
    });
  });

  describe('Complex scenarios', () => {
    it('should maintain state consistency across multiple operations', () => {
      const { result, rerender } = renderHook(
        (currentPage) =>
          useSelectFiches({
            view: 'grid',
            currentPage,
            isReadOnly: false,
            permissions: [],
          }),
        { initialProps: 1 }
      );

      // 1. Select individual items
      act(() => {
        result.current.handleSelectFiche(1);
      });
      act(() => {
        result.current.handleSelectFiche(3);
      });
      expect(result.current.selectedFicheIds).toEqual([1, 3]);
      expect(result.current.isSelectAllMode).toBe(false);

      // 2. Enable grouped mode and select all
      act(() => {
        result.current.toggleGroupedActionsMode(true);
        result.current.handleSelectAll(true);
      });
      expect(result.current.selectedFicheIds).toBe('all');
      expect(result.current.isSelectAllMode).toBe(true);

      // 3. Change page - should preserve selection in select all mode
      rerender(2);
      expect(result.current.selectedFicheIds).toBe('all');
      expect(result.current.isSelectAllMode).toBe(true);

      // 4. Deselect all
      act(() => {
        result.current.handleSelectAll(false);
      });
      expect(result.current.selectedFicheIds).toEqual([]);
      expect(result.current.isSelectAllMode).toBe(false);

      // 5. Disable grouped mode
      act(() => {
        result.current.toggleGroupedActionsMode(false);
      });
      expect(result.current.isGroupedActionsModeActive).toBe(false);
      expect(result.current.selectedFicheIds).toEqual([]);
    });
  });
});
