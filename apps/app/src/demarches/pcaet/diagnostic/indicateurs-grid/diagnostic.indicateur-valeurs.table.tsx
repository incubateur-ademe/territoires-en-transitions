'use client';

import { JSX } from 'react';
import { IndicateurValeursTable } from '../../../../indicateurs/valeurs/grid';
import type { GridMaxHeight } from '../../../../indicateurs/valeurs/grid/types';
import type { DiagnosticIndicateurTable } from './indicateur-tab.layout';
import { useDiagnosticIndicateurValeursTable } from './use-diagnostic-indicateur-valeurs-table';

type Props = {
  demarcheId: number;
  table: DiagnosticIndicateurTable;
  isReadonly: boolean;
  maxHeight: GridMaxHeight;
};

export const DiagnosticIndicateurValeursTable = ({
  demarcheId,
  table,
  isReadonly,
  maxHeight,
}: Props): JSX.Element => {
  const { rows, years, referenceYear, unit, onReferenceYearChange } =
    useDiagnosticIndicateurValeursTable({
      demarcheId,
      table,
      isReadonly,
    });

  return (
    <IndicateurValeursTable
      demarcheId={demarcheId}
      rows={rows}
      years={years}
      referenceYear={referenceYear}
      onReferenceYearChange={onReferenceYearChange ?? (() => {})}
      title={table.title}
      unit={unit}
      isReadonly={isReadonly}
      isRequired={!table.isOptional}
      maxHeight={maxHeight}
    />
  );
};
