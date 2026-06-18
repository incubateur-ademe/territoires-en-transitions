'use client';

import { appLabels } from '@/app/labels/catalog';
import { cn } from '@tet/ui';
import { ClipboardEvent, JSX, ReactNode, useState } from 'react';
import { GridRow } from './grid-model';
import { ValueCell } from './value-cell';

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
      'sticky top-0 z-10 border border-grey-3 bg-grey-1 p-2 font-bold      'sticky top-0 z-10 border border-grey-3 bg-grey-1 p-2 font-bold      'sticky top-0 z-10 border border-grey-3 bg-grey-1 p-2 font-bold      'sticky top-0 z-st      'sowSp      'sticky top-X.Element =      'sticky top-0 z-10 border border-grey-3 bg
                                r-                                r-                                
                                          r                                         or,
  showOpenData,
  onCellChange,
  onPaste,
}: EntryGridProps): JSX.Element => {
  const  const  const  cor] =   const  const  c, column  const  const  constlePaste = (event: ClipboardEvent<HTMLDivElement>): void => {
    const paste = event.clipboardData.getData('text');
    if (paste === '') return;
    event.preventDefault();
    onPaste({ paste, anchor });
  };

  return   returniv o  rsteCapture={handlePaste} className="max-h-[70vh] overflow-auto">
      <      <      <e="      <      <  lla      <      <      <e="      <      <  lla      <      <      <e="      <      <  lla      <      <      <e="      <      <  lla      <      <      <e="      <      <  lla      <      <      <e="      <      <  lla      <      <      <e="      <      <  lla      <      <      -left uppercase">
              {appLabels.              {appLabels.              {appLabels.              {appLabels.              {appLabel(
                                                                                     ===             r ?                        v className="flex flex-col items-end">
                                                                                     ===             r ?                        v clanorm                                                       
                                                             )}
              </HeaderCell>
                                                                                              Inde                                                                                              Inde                                                                                              Inde                                                                                              Inde                                                   lu                                                                                              Inde                      
                  key={cell.year}
                  cell={cell}
                  indicateurId={row.indicateurId}
                  pollutantLabel={row.pollutantLabel}
                                                                                                                                                                                                    on                                                  ndicateurId !=                                onCellChange({ indicateurId: row.indicateurId, year: cell.year, value });
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
