import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useMemo, useState } from 'react';
import {
  GridRowGroup,
  IndicateurId,
  Year,
  toIndicateurId,
} from '../types';

export type RowDragId = `row-${number}`;
export type GroupDragId = `group-${string}`;

export const rowDragId = (indicateurId: IndicateurId): RowDragId =>
  `row-${indicateurId}`;
export const groupDragId = (groupId: string): GroupDragId => `group-${groupId}`;

export type ParsedDragId =
  | { type: 'group'; groupId: string }
  | { type: 'row'; indicateurId: IndicateurId };

export const parseDragId = (dragId: string): ParsedDragId | null => {
  if (dragId.startsWith('group-')) {
    return { type: 'group', groupId: dragId.slice('group-'.length) };
  }
  if (dragId.startsWith('row-')) {
    return {
      type: 'row',
      indicateurId: toIndicateurId(Number(dragId.slice('row-'.length))),
    };
  }
  return null;
};

const orderBy = <T>(
  items: T[],
  order: string[] | null,
  dragIdOf: (item: T) => string
): T[] => {
  if (order === null) {
    return items;
  }
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...items].sort(
    (a, b) =>
      (rank.get(dragIdOf(a)) ?? order.length) -
      (rank.get(dragIdOf(b)) ?? order.length)
  );
};

export type GridReorder = {
  orderedYears: Year[];
  orderedGroups: GridRowGroup[];
  isReordered: boolean;
  reorderGroups: (activeId: string, overId: string) => void;
  reorderRows: (groupId: string, activeId: string, overId: string) => void;
  reset: () => void;
};

export const useGridReorder = ({
  years,
  groups,
  onReorderRows,
}: {
  years: Year[];
  groups: GridRowGroup[];
  onReorderRows?: (params: {
    groupId: string;
    activeId: string;
    overId: string;
  }) => void;
}): GridReorder => {
  const [groupOrder, setGroupOrder] = useState<string[] | null>(null);
  const [rowOrderByGroup, setRowOrderByGroup] = useState<
    Record<string, string[]>
  >({});

  const orderedYears = years;

  const orderedGroups = useMemo(
    () =>
      orderBy(groups, groupOrder, (group) => groupDragId(group.id)).map(
        (group) => ({
          ...group,
          rows: onReorderRows
            ? group.rows
            : orderBy(group.rows, rowOrderByGroup[group.id] ?? null, (row) =>
                rowDragId(row.indicateurId)
              ),
        })
      ),
    [groups, groupOrder, rowOrderByGroup, onReorderRows]
  );

  const isReordered =
    groupOrder !== null || Object.keys(rowOrderByGroup).length > 0;

  const reorderGroups = useCallback(
    (activeId: string, overId: string) => {
      const current = orderedGroups.map((group) => groupDragId(group.id));
      const from = current.findIndex((id) => id === activeId);
      const to = current.findIndex((id) => id === overId);
      if (from === -1 || to === -1) {
        return;
      }
      setGroupOrder(arrayMove(current, from, to));
    },
    [orderedGroups]
  );

  const reorderRows = useCallback(
    (groupId: string, activeId: string, overId: string) => {
      if (onReorderRows !== undefined) {
        onReorderRows({ groupId, activeId, overId });
        return;
      }
      const group = orderedGroups.find((candidate) => candidate.id === groupId);
      if (group === undefined) {
        return;
      }
      const current = group.rows.map((row) => rowDragId(row.indicateurId));
      const from = current.findIndex((id) => id === activeId);
      const to = current.findIndex((id) => id === overId);
      if (from === -1 || to === -1) {
        return;
      }
      setRowOrderByGroup((previous) => ({
        ...previous,
        [groupId]: arrayMove(current, from, to),
      }));
    },
    [orderedGroups, onReorderRows]
  );

  const reset = useCallback(() => {
    setGroupOrder(null);
    setRowOrderByGroup({});
  }, []);

  return {
    orderedYears,
    orderedGroups,
    isReordered,
    reorderGroups,
    reorderRows,
    reset,
  };
};
