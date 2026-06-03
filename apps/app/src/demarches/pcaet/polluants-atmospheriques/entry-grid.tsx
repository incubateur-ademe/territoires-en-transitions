'use client';

import { appLabels } from '@/app/labels/catalog';
import { cn } from '@tet/ui';
import { ClipboardEvent, JSX, ReactNode, useState } from 'react';
import { DraggableRowHeader } from './draggable-row-header';
import { GridRow } from './grid-model';
import { useReorder } from './use-reorder';
import { ValueCell } from './value-cell';

type Move = { from: number; to: number };

type EntryGridProps = {
  rows: GridRow[];
  years: number[];
  referenceYear: number;
  showSector: boolean;
  showOpenData: boolean;
  onCellChange: (args: {
    indicateurId: number;
    year: number;
    value: number | null;
  }) => void;
  onPaste: (args: {
    paste: string;
    anchor: { row: number; column: number };
  }) => void;
  onMoveSector: (move: Move) => void;
  onMovePollutant: (move: Move) => void;
};

const HeaderCell = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}): JSX.Element => (
  <th
    scope="col"
    className={cn(
      'sticky top-0 z-10 border border-grey-3 bg-grey-1 p-2 font-bold text-primary-9',
      className
    )}
  >
    {children}
  </th>
);

export const EntryGrid = ({
  rows,
  years,
  referenceYear,
  showSector,
  showOpenData,
  onCellChange,
  onPaste,
  onMoveSector,
  onMovePollutant,
}: EntryGridProps): JSX.Element => {
  const [anchor, setAnchor] = useState({ row: 0, column: 0 });
  const sectorReorder = useReorder(onMoveSector);
  const pollutantReorder = useReorder(onMovePollutant);

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>): void => {
    const paste = event.clipboardData.getData('text');
    if (paste === '') {
      return;
    }
    event.preventDefault();
    onPaste({ paste, anchor });
  };

  return (
    <div onPasteCapture={handlePaste} className="max-h-[70vh] overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {showSector && (
              <HeaderCell className="text-left uppercase">
                {appLabels.demarchePcaetPolluantsColonneSecteur}
              </HeaderCell>
            )}
            <HeaderCell className="text-left uppercase">
              {appLabels.demarchePcaetPolluantsColonnePolluant}
            </HeaderCell>
            {years.map((year) => (
              <HeaderCell key={year} className="text-right">
                {year === referenceYear ? (
                  <div className="flex flex-col items-end">
                    <span>{appLabels.demarchePcaetPolluantsAnneeReference}</span>
                    <span className="text-xs font-normal text-grey-6">
                      {year}
                    </span>
                  </div>
                ) : (
                  year
                )}
              </HeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.identifier}>
              {showSector && row.isGroupStart && (
                <DraggableRowHeader
                  label={row.sectorLabel}
                  rowSpan={row.groupSize}
                  className="bg-grey-1 align-top font-bold"
                  handlers={sectorReorder(row.sectorIndex)}
                />
              )}
              <DraggableRowHeader
                label={row.pollutantLabel}
                className="font-medium"
                handlers={pollutantReorder(row.pollutantIndex)}
              />
              {row.cells.map((cell, columnIndex) => (
                <ValueCell
                  key={cell.year}
                  cell={cell}
                  indicateurId={row.indicateurId}
                  pollutantLabel={row.pollutantLabel}
                  sectorLabel={row.sectorLabel}
                  showOpenData={showOpenData}
                  onFocus={() => setAnchor({ row: rowIndex, column: columnIndex })}
                  onCommit={(value) => {
                    if (row.indicateurId !== null) {
                      onCellChange({
                        indicateurId: row.indicateurId,
                        year: cell.year,
                        value,
                      });
                    }
                  }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
