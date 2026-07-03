'use client';

import {
  Announcements,
  CollisionDetection,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button } from '@tet/ui';
import { JSX, useState } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { useGridContext } from './grid-context';
import { useGetTable } from './use-get-table';
import { useGridKeyboardNav } from './keyboard-navigation/use-grid-keyboard-nav';
import { useGridCopyPaste } from './paste/use-grid-copy-paste';
import { groupDragId, rowDragId, useGridReorder } from './drag-reorder/use-grid-reorder';
import { GridHead } from './grid-head';
import { GridBody } from './grid-body';

const dragType = (dragId: string): string => dragId.split('-')[0];

export const GridFrame = (): JSX.Element => {
  const {
    groups,
    years,
    referenceYear,
    unit,
    cells,
    actions,
    notify,
    onReorderRows,
    onReferenceYearChange,
  } = useGridContext();

  const {
    orderedYears,
    orderedGroups,
    isReordered,
    reorderYears,
    reorderGroups,
    reorderRows,
    reset,
  } = useGridReorder({ years, groups, onReorderRows });

  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const { table, tableRef } = useGetTable({
    groups: orderedGroups,
    years: orderedYears,
  });

  const { onKeyDown, onFocus } = useGridKeyboardNav({
    containerRef: tableRef,
    groups: orderedGroups,
    years: orderedYears,
  });
  const { onPaste } = useGridCopyPaste({
    groups: orderedGroups,
    years: orderedYears,
    cells,
    saveCellValues: actions.saveCellValues,
    notify,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const groupIdOf = (dragId: string): string | undefined =>
    orderedGroups.find((group) =>
      group.rows.some((row) => rowDragId(row.indicateurId) === dragId)
    )?.id;

  const collisionDetection: CollisionDetection = (args) => {
    const activeId = String(args.active.id);
    const activeType = dragType(activeId);
    const activeGroup = activeType === 'row' ? groupIdOf(activeId) : undefined;
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((container) => {
        const containerId = String(container.id);
        if (dragType(containerId) !== activeType) {
          return false;
        }
        return activeType !== 'row' || groupIdOf(containerId) === activeGroup;
      }),
    });
  };

  const describeDragId = (dragId: string): string => {
    if (dragId.startsWith('year-')) {
      return dragId.slice('year-'.length);
    }
    if (dragId.startsWith('group-')) {
      return (
        orderedGroups.find((group) => groupDragId(group.id) === dragId)?.label ??
        dragId
      );
    }
    return (
      table
        .getRowModel()
        .rows.find((row) => rowDragId(row.original.indicateurId) === dragId)
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
    if (activeId.startsWith('year-')) {
      reorderYears(activeId, overId);
      return;
    }
    if (activeId.startsWith('group-')) {
      reorderGroups(activeId, overId);
      return;
    }
    const group = groupIdOf(activeId);
    const isSameGroup = group !== undefined && group === groupIdOf(overId);
    if (isSameGroup) {
      reorderRows(group, activeId, overId);
    }
  };

  const handleReset = (): void => {
    reset();
    setResetMessage(appLabels.indicateurOrdreReinitialise);
    notify?.(appLabels.indicateurOrdreReinitialise);
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: appLabels.indicateurReordonnerInstructions,
        },
      }}
    >
      <div className="flex flex-col gap-2">
        <div role="status" aria-live="polite">
          {resetMessage !== null && (
            <span className="sr-only">{resetMessage}</span>
          )}
        </div>
        {isReordered && (
          <div>
            <Button size="xs" variant="outlined" onClick={handleReset}>
              {appLabels.indicateurReinitialiserOrdre}
            </Button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-auto">
          <table
            ref={tableRef}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onPasteCapture={onPaste}
            aria-label={appLabels.indicateurValeursGrille}
            className="w-full border-collapse text-sm"
            role="grid"
          >
            <GridHead
              years={orderedYears}
              unit={unit}
              referenceYear={referenceYear}
              onReferenceYearChange={onReferenceYearChange}
            />
            <GridBody rows={table.getRowModel().rows} groups={orderedGroups} />
          </table>
        </div>
      </div>
    </DndContext>
  );
};
