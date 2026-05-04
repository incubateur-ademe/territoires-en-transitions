import type { ExpandedState } from '@tanstack/react-table';
import type { RefObject } from 'react';
import { useCallback, useLayoutEffect, useRef } from 'react';

import { ActionListItem } from '../actions/use-list-actions';

/**
 * Enfile une cellule (`data-cell-id`) à focusser après le prochain layout où
 * le nœud existe (ex. ligne enfant rendue après expansion).
 */
export function useReferentielTablePendingCellFocus(
  expanded: ExpandedState,
  axes: ActionListItem[]
): {
  tableRef: RefObject<HTMLTableElement | null>;
  setFocusedCellId: (cellId: string) => void;
} {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const pendingFocusCellIdRef = useRef<string | null>(null);

  const setFocusedCellId = useCallback((cellId: string) => {
    pendingFocusCellIdRef.current = cellId;
  }, []);

  useLayoutEffect(() => {
    const id = pendingFocusCellIdRef.current;
    if (!id) {
      return;
    }

    const td = tableRef.current?.querySelector(
      `td[data-cell-id="${CSS.escape(id)}"]`
    ) as HTMLElement | null;
    if (!td) {
      return;
    }

    pendingFocusCellIdRef.current = null;

    td.focus({ preventScroll: false });
    td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [expanded, axes]);

  return { tableRef, setFocusedCellId };
}
