'use client';

import { DndContext } from '@dnd-kit/core';
import { Button } from '@tet/ui';
import { JSX, useState } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { useGridContext } from './grid-context';
import { useGetTable } from './use-get-table';
import { useGridKeyboardNav } from './keyboard-navigation/use-grid-keyboard-nav';
import { useGridCopyPaste } from './paste/use-grid-copy-paste';
import { useGridReorder } from './drag-reorder/use-grid-reorder';
import { useGridDragHandlers } from './drag-reorder/use-grid-drag-handlers';
import { GridHead } from './grid-head';
import { GridBody } from './grid-body';

export const GridFrame = (): JSX.Element => {
  const {
    groups,
    isGrouped,
    years,
    referenceYear,
    unit,
    cells,
    isReorderable,
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

  const { sensors, collisionDetection, onDragEnd, announcements } =
    useGridDragHandlers({
      orderedGroups,
      table,
      reorderYears,
      reorderGroups,
      reorderRows,
    });

  const handleReset = (): void => {
    reset();
    setResetMessage(appLabels.indicateurOrdreReinitialise);
    notify(appLabels.indicateurOrdreReinitialise);
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
              isGrouped={isGrouped}
              isReorderable={isReorderable}
              onReferenceYearChange={onReferenceYearChange}
            />
            <GridBody
              rows={table.getRowModel().rows}
              groups={orderedGroups}
              isGrouped={isGrouped}
              isReorderable={isReorderable}
            />
          </table>
        </div>
      </div>
    </DndContext>
  );
};
