import {
  Announcements,
  CollisionDetection,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  SensorDescriptor,
  SensorOptions,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Table } from '@tanstack/react-table';
import { appLabels } from '@/app/labels/catalog';
import { GridDisplayRow } from '../grid-model';
import { GridRowGroup } from '../types';
import { parseDragId } from './use-grid-reorder';

export const useGridDragHandlers = ({
  orderedGroups,
  table,
  reorderYears,
  reorderGroups,
  reorderRows,
}: {
  orderedGroups: GridRowGroup[];
  table: Table<GridDisplayRow>;
  reorderYears: (activeId: string, overId: string) => void;
  reorderGroups: (activeId: string, overId: string) => void;
  reorderRows: (groupId: string, activeId: string, overId: string) => void;
}): {
  sensors: SensorDescriptor<SensorOptions>[];
  collisionDetection: CollisionDetection;
  onDragEnd: (event: DragEndEvent) => void;
  announcements: Announcements;
} => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const groupIdOf = (dragId: string): string | undefined => {
    const parsed = parseDragId(dragId);
    if (parsed?.type !== 'row') {
      return undefined;
    }
    return orderedGroups.find((group) =>
      group.rows.some((row) => row.indicateurId === parsed.indicateurId)
    )?.id;
  };

  const collisionDetection: CollisionDetection = (args) => {
    const activeId = String(args.active.id);
    const activeType = parseDragId(activeId)?.type;
    const activeGroup = activeType === 'row' ? groupIdOf(activeId) : undefined;
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((container) => {
        const containerId = String(container.id);
        if (parseDragId(containerId)?.type !== activeType) {
          return false;
        }
        return activeType !== 'row' || groupIdOf(containerId) === activeGroup;
      }),
    });
  };

  const describeDragId = (dragId: string): string => {
    const parsed = parseDragId(dragId);
    if (parsed === null) {
      return dragId;
    }
    if (parsed.type === 'year') {
      return String(parsed.year);
    }
    if (parsed.type === 'group') {
      return (
        orderedGroups.find((group) => group.id === parsed.groupId)?.label ??
        dragId
      );
    }
    return (
      table
        .getRowModel()
        .rows.find((row) => row.original.indicateurId === parsed.indicateurId)
        ?.original.rowLabel ?? dragId
    );
  };

  const onDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    const isNoOpDrop = over === null || active.id === over.id;
    if (isNoOpDrop) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    const parsed = parseDragId(activeId);
    if (parsed === null) {
      return;
    }
    if (parsed.type === 'year') {
      reorderYears(activeId, overId);
      return;
    }
    if (parsed.type === 'group') {
      reorderGroups(activeId, overId);
      return;
    }
    const group = groupIdOf(activeId);
    const isSameGroup = group !== undefined && group === groupIdOf(overId);
    if (isSameGroup) {
      reorderRows(group, activeId, overId);
    }
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      appLabels.indicateurReordonnerPrise(describeDragId(String(active.id))),
    onDragOver: ({ active, over }) =>
      over === null
        ? undefined
        : appLabels.indicateurReordonnerSurvol(
            describeDragId(String(active.id)),
            describeDragId(String(over.id))
          ),
    onDragEnd: ({ active, over }) => {
      const isCancelledDrop = over === null || active.id === over.id;
      return isCancelledDrop
        ? appLabels.indicateurReordonnerAnnule(describeDragId(String(active.id)))
        : appLabels.indicateurReordonnerDepose(
            describeDragId(String(active.id)),
            describeDragId(String(over.id))
          );
    },
    onDragCancel: ({ active }) =>
      appLabels.indicateurReordonnerAnnule(describeDragId(String(active.id))),
  };

  return { sensors, collisionDetection, onDragEnd, announcements };
};
