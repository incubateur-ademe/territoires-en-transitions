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
import { GridLegend } from './grid-legend';

export const GridFrame = (): JSX.Element => {
  const {
    groups,
    isGrouped,
    years,
    referenceYear,
    title,
    unit,
    cells,
    isReorderable,
    actions,
    notify,
    onReorderRows,
    onReferenceYearChange,
    onAddYear,
    onRemoveYear,
    canRemoveYear,
  } = useGridContext();

  const {
    orderedYears,
    orderedGroups,
    isReordered,
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
      reorderGroups,
      reorderRows,
    });

  const handleReset = (): void => {
    reset();
    setResetMessage(appLabels.indicateurOrdreReinitialise);
    notify(appLabels.indicateurOrdreReinitialise, 'success');
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
        <GridLegend />
        <div className="max-h-[70vh] overflow-auto">
          <table
            ref={tableRef}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onPasteCapture={onPaste}
            aria-label={appLabels.indicateurValeursGrille}
            className="w-full border-collapse text-sm [&_td]:border [&_td]:border-grey-3 [&_th]:border [&_th]:border-grey-3"
            role="grid"
          >
            <GridHead
              years={orderedYears}
              title={title}
              unit={unit}
              referenceYear={referenceYear}
              isReorderable={isReorderable}
              cells={cells}
              groups={orderedGroups}
              onReferenceYearChange={onReferenceYearChange}
              onAddYear={onAddYear}
              onRemoveYear={onRemoveYear}
              canRemoveYear={canRemoveYear}
            />
            <GridBody
              rows={table.getRowModel().rows}
              groups={orderedGroups}
              isGrouped={isGrouped}
              isReorderable={isReorderable}
              showAddYearColumn={onAddYear !== undefined}
            />
          </table>
        </div>
      </div>
    </DndContext>
  );
};
