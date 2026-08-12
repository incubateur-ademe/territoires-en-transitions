'use client';

import { appLabels } from '@/app/labels/catalog';
import { Table } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { JSX } from 'react';
import { GridBody } from './grid-body';
import { useGridContext } from './grid-context';
import { GridHead } from './grid-head';
import { GridLegend } from './grid-legend';
import { useGridCopyPaste } from './paste/use-grid-copy-paste';
import { ReferenceYearField } from './reference-year/reference-year-field';
import { useGetTable } from './use-get-table';

export const GridFrame = (): JSX.Element => {
  const {
    groups,
    isGrouped,
    years,
    referenceYear,
    cells,
    actions,
    notify,
    isReadonly,
    hasMaxHeight,
    onReferenceYearChange,
    onAddYear,
  } = useGridContext();

  const { table, tableRef } = useGetTable({
    groups,
    years,
  });

  const { onPaste } = useGridCopyPaste({
    groups,
    years,
    referenceYear,
    cells,
    saveCellValues: actions.saveCellValues,
    notify,
  });

  return (
    <div className="flex flex-col gap-2">
      {onReferenceYearChange !== undefined && referenceYear !== null ? (
        <ReferenceYearField
          year={referenceYear}
          years={years}
          onReferenceYearChange={onReferenceYearChange}
        />
      ) : null}
      <GridLegend />
      {/* overflow-auto reste nécessaire pour le défilement horizontal
          (cellules sticky left/right) même sans plafond de hauteur. */}
      <div className={cn('overflow-auto', hasMaxHeight && 'max-h-[70vh]')}>
        <Table
          ref={tableRef}
          onPasteCapture={isReadonly ? undefined : onPaste}
          aria-label={appLabels.indicateurValeursGrille}
          role="grid"
          className="border-separate border-spacing-0"
        >
          <GridHead table={table} />
          <GridBody
            rows={table.getRowModel().rows}
            groups={groups}
            isGrouped={isGrouped}
            showAddYearColumn={onAddYear !== undefined}
          />
        </Table>
      </div>
    </div>
  );
};
