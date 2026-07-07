'use client';

import { JSX, useCallback, useState } from 'react';
import { useToastContext } from '@/app/utils/toast/toast-context';
import {
  CellKey,
  generateCellKey,
  GridCell,
  IndicateurValuesGrid,
  parseCellKey,
  Year,
} from '@/app/indicateurs/valeurs/grid';
import {
  buildDemarcheGridMock,
  DemarcheGridMock,
  VoletGridStructure,
} from './build-grid-mock';
import { useMockGridActions } from './use-mock-grid-actions';

const moveReferenceColumn = (
  cells: Map<CellKey, GridCell>,
  fromYear: Year,
  toYear: Year
): Map<CellKey, GridCell> =>
  new Map(
    Array.from(cells, ([key, cell]) => {
      const { indicateurId, year } = parseCellKey(key);
      if (year !== fromYear) {
        return [key, cell] as const;
      }
      return [generateCellKey(indicateurId, toYear), cell] as const;
    })
  );

export const DemarcheIndicateursGridView = ({
  structure,
}: {
  structure: VoletGridStructure;
}): JSX.Element => {
  const { setToast } = useToastContext();
  const [mock, setMock] = useState<DemarcheGridMock>(() =>
    buildDemarcheGridMock(structure, new Date().getFullYear())
  );

  const updateCells = useCallback(
    (updater: (previous: Map<CellKey, GridCell>) => Map<CellKey, GridCell>) =>
      setMock((previous) => ({ ...previous, cells: updater(previous.cells) })),
    []
  );
  const actions = useMockGridActions(updateCells);

  const onReferenceYearChange = useCallback((nextYear: Year) => {
    setMock((previous) => {
      const isNoOp =
        nextYear === previous.referenceYear ||
        previous.years.includes(nextYear);
      if (isNoOp) {
        return previous;
      }
      return {
        ...previous,
        years: previous.years.map((year) =>
          year === previous.referenceYear ? nextYear : year
        ),
        referenceYear: nextYear,
        cells: moveReferenceColumn(
          previous.cells,
          previous.referenceYear,
          nextYear
        ),
      };
    });
  }, []);

  return (
    <IndicateurValuesGrid
      rows={mock.groups}
      years={mock.years}
      referenceYear={mock.referenceYear}
      unit={mock.unit}
      cells={mock.cells}
      actions={actions}
      notify={(message) => setToast('success', message)}
      onReferenceYearChange={onReferenceYearChange}
    />
  );
};
