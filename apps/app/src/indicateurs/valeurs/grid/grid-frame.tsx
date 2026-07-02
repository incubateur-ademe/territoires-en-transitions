'use client';

import { flexRender } from '@tanstack/react-table';
import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { useGridContext } from './grid-context';
import { useGetTable } from './use-get-table';
import { useGridKeyboardNav } from './keyboard-navigation/use-grid-keyboard-nav';
import { useGridCopyPaste } from './paste/use-grid-copy-paste';
import { GroupRowHeader } from './group-row-header';
import { RowHeader } from './row-header';
import { YearColumnHeader } from './year-column-header';

export const GridFrame = (): JSX.Element => {
  const { groups, years, referenceYear, unit, cells, actions, notify } =
    useGridContext();
  const { table, tableRef } = useGetTable({ groups, years });
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
        <thead>
          <tr role="row">
            <th
              scope="col"
              className="sticky left-0 top-0 z-30 border border-grey-3 bg-grey-1 p-2"
            />
            <th scope="col" className="sticky top-0 z-20 border border-grey-3 bg-grey-1 p-2" />
            {years.map((year) => (
              <YearColumnHeader
                key={year}
                year={year}
                unit={unit}
                isReference={year === referenceYear}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} role="row">
              {row.original.isGroupStart && (
                <GroupRowHeader
                  label={row.original.groupLabel}
                  rowSpan={row.original.groupSize}
                />
              )}
              <RowHeader label={row.original.rowLabel} />
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  role="gridcell"
                  className="h-10 border border-grey-3 p-0"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
