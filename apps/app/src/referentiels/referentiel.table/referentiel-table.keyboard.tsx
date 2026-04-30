import { Table as ReactTable, Row } from '@tanstack/react-table';
import type { FocusEvent, KeyboardEvent } from 'react';
import { useCallback, useLayoutEffect, useRef } from 'react';

import { ActionListItem } from '../actions/use-list-actions';

const CELL_ATTR = 'data-cell-id';
const CELL_SELECTOR = `td[${CELL_ATTR}]`;

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

function findRowByCellId(
  table: ReactTable<ActionListItem>,
  cellId: string
): Row<ActionListItem> | null {
  return (
    table
      .getRowModel()
      .rows.find((row) =>
        row.getVisibleCells().some((cell) => cell.id === cellId)
      ) ?? null
  );
}

export type ReferentielTableKeyboardProps = {
  tableRef: React.RefObject<HTMLTableElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onKeyDownCapture: (event: KeyboardEvent<HTMLTableElement>) => void;
  onFocusCapture: (event: FocusEvent<HTMLTableElement>) => void;
  /**
   * Cible la cellule à focusser lors du prochain rendu déclenché par un
   * changement d'état du tableau (ex: dépliage de ligne). À utiliser avant
   * d'appeler `row.toggleExpanded(...)` pour que `useLayoutEffect` ramène
   * le focus sur la nouvelle cellule sans flash intermédiaire.
   */
  setFocusedCellId: (cellId: string) => void;
};

/**
 * Keyboard navigation for the referentiel table.
 *
 * Uses imperative DOM focus + CSS `:focus` for the focus ring instead of
 * React state/context, so moving focus between cells triggers zero
 * React re-renders.
 */
export function useTableKeyboard(
  table: ReactTable<ActionListItem>,
  navigationDeps: unknown
): ReferentielTableKeyboardProps {
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const focusedCellIdRef = useRef<string | null>(null);
  const pendingFocusedCellIdRef = useRef<string | null>(null);
  const lastPositionRef = useRef({ row: 0, col: 0 });

  const findCellElement = useCallback(
    (cellId: string): HTMLTableCellElement | null => {
      return (
        (tableRef.current?.querySelector(
          `td[${CELL_ATTR}="${CSS.escape(cellId)}"]`
        ) as HTMLTableCellElement | null) ?? null
      );
    },
    []
  );

  const moveFocusTo = useCallback(
    (cellId: string) => {
      if (focusedCellIdRef.current && focusedCellIdRef.current !== cellId) {
        const prev = findCellElement(focusedCellIdRef.current);
        if (prev) prev.tabIndex = -1;
      }

      focusedCellIdRef.current = cellId;
      const next = findCellElement(cellId);
      if (next) {
        next.tabIndex = 0;
        next.focus({ preventScroll: false });
        next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    },
    [findCellElement]
  );

  useLayoutEffect(() => {
    const matrix = getCellMatrix(table);
    if (matrix.length === 0) return;

    // Si une cellule cible a été demandée explicitement (ex: après dépliage
    // d'une ligne), elle prime sur la cellule courante : on prend ce focus en
    // attente et on force la mise au point sans tester `activeElement`, car
    // l'élément précédemment actif (Select en train de se fermer) peut encore
    // capter le focus pendant la phase de commit.
    const pendingId = pendingFocusedCellIdRef.current;
    if (pendingId) {
      pendingFocusedCellIdRef.current = null;
      const pos = findPosition(matrix, pendingId);
      if (pos) {
        lastPositionRef.current = pos;
        focusedCellIdRef.current = pendingId;
        requestAnimationFrame(() => {
          const el = findCellElement(pendingId);
          if (!el) return;
          el.tabIndex = 0;
          el.focus({ preventScroll: false });
          el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });
        return;
      }
    }

    const currentId = focusedCellIdRef.current;
    let targetId: string;

    if (currentId) {
      const pos = findPosition(matrix, currentId);
      if (pos) {
        lastPositionRef.current = pos;
        targetId = currentId;
      } else {
        const { row, col } = lastPositionRef.current;
        const r = Math.min(row, matrix.length - 1);
        const c = Math.min(col, matrix[r].length - 1);
        targetId = matrix[r][c];
        lastPositionRef.current = { row: r, col: c };
      }
    } else {
      targetId = matrix[0][0];
      lastPositionRef.current = { row: 0, col: 0 };
    }

    focusedCellIdRef.current = targetId;

    requestAnimationFrame(() => {
      const el = findCellElement(targetId);
      if (!el) return;
      el.tabIndex = 0;

      const active = document.activeElement;
      if (active && active.closest('input, textarea, select, [contenteditable]'))
        return;

      el.focus({ preventScroll: false });
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }, [table, navigationDeps, findCellElement]);

  const onFocusCapture = useCallback(
    (event: FocusEvent<HTMLTableElement>) => {
      const target = event.target as HTMLElement;
      const td = target.closest(CELL_SELECTOR) as HTMLTableCellElement | null;
      if (!td) return;

      const tbody = tableRef.current?.querySelector('tbody');
      if (!tbody?.contains(td)) return;

      const cellId = td.getAttribute(CELL_ATTR);
      if (!cellId || cellId === focusedCellIdRef.current) return;

      if (focusedCellIdRef.current) {
        const prev = findCellElement(focusedCellIdRef.current);
        if (prev) prev.tabIndex = -1;
      }

      focusedCellIdRef.current = cellId;
      td.tabIndex = 0;

      const matrix = getCellMatrix(table);
      const pos = findPosition(matrix, cellId);
      if (pos) {
        lastPositionRef.current = pos;
      }
    },
    [table, findCellElement]
  );

  const onKeyDownCapture = useCallback(
    (event: KeyboardEvent<HTMLTableElement>) => {
      const isArrowKey =
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight';
      const isEnterKey = event.key === 'Enter';
      const isSpaceKey =
        event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space';

      if (!isArrowKey && !isEnterKey && !isSpaceKey) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (target.isContentEditable) return;
      if (target.closest('button, a, input, textarea, select')) return;

      const td = target.closest('td') as HTMLTableCellElement | null;
      if (!td || !tableRef.current?.contains(td)) return;

      const tbody = tableRef.current.querySelector('tbody');
      if (!tbody?.contains(td)) return;

      const cellId = td.getAttribute(CELL_ATTR);
      if (!cellId) return;

      if (isSpaceKey) {
        const currentRow = findRowByCellId(table, cellId);
        if (!currentRow) return;

        const isLeafRow = !currentRow.getCanExpand();
        const rowToToggle = isLeafRow ? currentRow.getParentRow() : currentRow;
        if (!rowToToggle?.getCanExpand()) return;

        const matrix = getCellMatrix(table);
        const currentPos = findPosition(matrix, cellId);
        let nextCellId = cellId;

        if (isLeafRow && currentPos) {
          const parentCells = rowToToggle.getVisibleCells();
          const nextCol = Math.min(currentPos.col, parentCells.length - 1);
          const parentCellId = parentCells[nextCol]?.id;
          if (parentCellId) {
            nextCellId = parentCellId;
            const parentPos = findPosition(matrix, parentCellId);
            if (parentPos) {
              lastPositionRef.current = parentPos;
            }
          }
        }

        event.preventDefault();
        event.stopPropagation();
        focusedCellIdRef.current = nextCellId;
        rowToToggle.toggleExpanded();
        return;
      }

      if (isEnterKey) {
        const isInlineEditable = td.getAttribute('data-inline-edit') === 'true';
        if (!isInlineEditable) return;

        event.preventDefault();
        event.stopPropagation();
        td.click();
        return;
      }

      const matrix = getCellMatrix(table);
      const pos = findPosition(matrix, cellId);
      if (!pos) return;

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
      if (nextId === cellId) return;

      event.preventDefault();
      lastPositionRef.current = { row: nextRow, col: nextCol };
      moveFocusTo(nextId);
    },
    [table, moveFocusTo]
  );

  const setFocusedCellId = useCallback((cellId: string) => {
    pendingFocusedCellIdRef.current = cellId;
  }, []);

  return {
    tableRef,
    scrollContainerRef,
    onKeyDownCapture,
    onFocusCapture,
    setFocusedCellId,
  };
}
