import { Cell, Table as ReactTable } from '@tanstack/react-table';
import type { HTMLAttributes, RefAttributes } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ActionListItem } from '../actions/use-list-actions';

const FOCUS_RING_CLASS =
  'ring-2 ring-inset ring-primary-6 z-[1] outline-none relative';
const EDITABLE_FOCUS_RING_CLASS = 'data-[inline-edit=true]:outline-dashed';

function getCellMatrix(table: ReactTable<ActionListItem>): string[][] {
  return table
    .getRowModel()
    .rows.map((row) => row.getVisibleCells().map((cell) => cell.id));
}

function findPosition(
  matrix: string[][],
  cellId: string
): { row: number; col: number } | null {
  for (let row = 0; row < matrix.length; row++) {
    const col = matrix[row].indexOf(cellId);
    if (col !== -1) {
      return { row, col };
    }
  }
  return null;
}

type ReferentielTableKeyboardContextValue = {
  focusedCellId: string | null;
  setFocusedCellId: (id: string | null) => void;
  registerCellRef: (cellId: string, el: HTMLTableCellElement | null) => void;
  tableRef: React.RefObject<HTMLTableElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onKeyDownCapture: (event: React.KeyboardEvent<HTMLTableElement>) => void;
};

const ReferentielTableKeyboardContext =
  createContext<ReferentielTableKeyboardContextValue | null>(null);

type ProviderProps = {
  table: ReactTable<ActionListItem>;
  /** Re-sync focus when expansion or row data changes */
  navigationDeps: unknown;
  children: React.ReactNode;
};

export function ReferentielTableKeyboardProvider({
  table,
  navigationDeps,
  children,
}: ProviderProps) {
  const [focusedCellId, setFocusedCellId] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
  const lastPositionRef = useRef({ row: 0, col: 0 });

  const registerCellRef = useCallback(
    (cellId: string, el: HTMLTableCellElement | null) => {
      if (el) {
        cellRefs.current.set(cellId, el);
      } else {
        cellRefs.current.delete(cellId);
      }
    },
    []
  );

  useLayoutEffect(() => {
    const matrix = getCellMatrix(table);
    if (matrix.length === 0) {
      return;
    }

    setFocusedCellId((prev) => {
      if (prev) {
        const pos = findPosition(matrix, prev);
        if (pos) {
          lastPositionRef.current = pos;
          return prev;
        }
      }
      const { row, col } = lastPositionRef.current;
      const r = Math.min(row, matrix.length - 1);
      const c = Math.min(col, matrix[r].length - 1);
      const id = matrix[r][c];
      lastPositionRef.current = { row: r, col: c };
      return id;
    });
  }, [table, navigationDeps]);

  useLayoutEffect(() => {
    if (!focusedCellId) {
      return;
    }
    const el = cellRefs.current.get(focusedCellId);
    if (!el) {
      return;
    }
    requestAnimationFrame(() => {
      el.focus({ preventScroll: false });
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }, [focusedCellId, navigationDeps]);

  const onKeyDownCapture = useCallback(
    (event: React.KeyboardEvent<HTMLTableElement>) => {
      const isArrowKey =
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight';
      const isEnterKey = event.key === 'Enter';
      const isSpaceKey =
        event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space';

      if (!isArrowKey && !isEnterKey && !isSpaceKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      // Don't override keyboard interactions while typing.
      if (target.isContentEditable) {
        return;
      }
      if (target.closest('button, a, input, textarea, select')) {
        return;
      }

      const td = target.closest('td');
      if (!td || !tableRef.current?.contains(td)) {
        return;
      }

      const tbody = tableRef.current.querySelector('tbody');
      if (!tbody?.contains(td)) {
        return;
      }

      const cellId = td.getAttribute('data-referentiel-cell-id');
      if (!cellId) {
        return;
      }

      if (isSpaceKey) {
        // Only toggle expand/collapse for cells explicitly marked as such.
        const shouldToggleExpand = td.getAttribute(
          'data-referentiel-toggle-expand'
        );
        if (!shouldToggleExpand) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setFocusedCellId(cellId);
        td.click();
        return;
      }

      if (isEnterKey) {
        // Inline-editable cells use this marker (see `TableCell`).
        const isInlineEditable = td.getAttribute('data-inline-edit') === 'true';
        if (!isInlineEditable) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setFocusedCellId(cellId);
        td.click();
        return;
      }

      const matrix = getCellMatrix(table);
      const pos = findPosition(matrix, cellId);
      if (!pos) {
        return;
      }

      let nextRow = pos.row;
      let nextCol = pos.col;

      switch (event.key) {
        case 'ArrowUp':
          nextRow = Math.max(0, pos.row - 1);
          break;
        case 'ArrowDown':
          nextRow = Math.min(matrix.length - 1, pos.row + 1);
          break;
        case 'ArrowLeft':
          nextCol = Math.max(0, pos.col - 1);
          break;
        case 'ArrowRight':
          nextCol = Math.min(matrix[pos.row].length - 1, pos.col + 1);
          break;
        default:
          break;
      }

      const nextId = matrix[nextRow][nextCol];
      if (nextId === cellId) {
        return;
      }

      event.preventDefault();
      lastPositionRef.current = { row: nextRow, col: nextCol };
      setFocusedCellId(nextId);
    },
    [table]
  );

  const value = useMemo(
    () => ({
      focusedCellId,
      setFocusedCellId,
      registerCellRef,
      tableRef,
      scrollContainerRef,
      onKeyDownCapture,
    }),
    [focusedCellId, registerCellRef, onKeyDownCapture]
  );

  return (
    <ReferentielTableKeyboardContext value={value}>
      {children}
    </ReferentielTableKeyboardContext>
  );
}

export function useReferentielTableCellFocus(
  cell: Cell<ActionListItem, unknown>
) {
  const ctx = useContext(ReferentielTableKeyboardContext);

  return useMemo(() => {
    if (!ctx) {
      return {
        referentielCellProps: {} as Record<string, unknown>,
      };
    }

    const isFocused = ctx.focusedCellId === cell.id;

    return {
      referentielCellProps: {
        ref: (el: HTMLTableCellElement | null) =>
          ctx.registerCellRef(cell.id, el),
        tabIndex: isFocused ? 0 : -1,
        className: isFocused
          ? `${FOCUS_RING_CLASS} ${EDITABLE_FOCUS_RING_CLASS}`
          : undefined,
        onFocus: () => {
          ctx.setFocusedCellId(cell.id);
        },
        'data-referentiel-cell-id': cell.id,
      } satisfies HTMLAttributes<HTMLTableCellElement> &
        RefAttributes<HTMLTableCellElement> & {
          'data-referentiel-cell-id': string;
        },
    };
  }, [ctx, cell.id]);
}

export function useReferentielTableKeyboardOptional() {
  return useContext(ReferentielTableKeyboardContext);
}
