'use client';

import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { useGridContext } from './grid-context';
import { useGetTable } from './use-get-table';
import { useGridKeyboardNav } from './keyboard-navigation/use-grid-keyboard-nav';
import { useGridCopyPaste } from './paste/use-grid-copy-paste';
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
    actions,
    notify,
    onReferenceYearChange,
    onAddYear,
    onRemoveYear,
    canRemoveYear,
  } = useGridContext();

  const { table, tableRef } = useGetTable({
    groups,
    years,
  });

  const { onKeyDown, onFocus } = useGridKeyboardNav({
    containerRef: tableRef,
    groups,
    years,
  });
  const { onPaste } = useGridCopyPaste({
    groups,
    years,
    cells,
    saveCellValues: actions.saveCellValues,
    notify,
  });

  return (
    <div className="flex flex-col gap-2">
      <GridLegend />
      <div className="max-h-[70vh] overflow-auto">
        <table
          ref={tableRef}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onPasteCapture={onPaste}
          aria-label={appLabels.indicateurValeursGrille}
          className="w-full border-collapse text-sm [&_td]:border [&_td]:border-grey-3 [&_td[data-field=objectif]]:!border-l-0 [&_td[data-field=resultat]]:!border-r-0 [&_th]:border [&_th]:border-grey-3"
          role="grid"
        >
          <GridHead
            years={years}
            title={title}
            unit={unit}
            referenceYear={referenceYear}
            cells={cells}
            groups={groups}
            onReferenceYearChange={onReferenceYearChange}
            onAddYear={onAddYear}
            onRemoveYear={onRemoveYear}
            canRemoveYear={canRemoveYear}
          />
          <GridBody
            rows={table.getRowModel().rows}
            groups={groups}
            isGrouped={isGrouped}
            showAddYearColumn={onAddYear !== undefined}
          />
        </table>
      </div>
    </div>
  );
};
