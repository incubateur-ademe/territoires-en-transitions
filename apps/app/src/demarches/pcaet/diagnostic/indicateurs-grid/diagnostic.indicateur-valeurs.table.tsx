'use client';

import { JSX } from 'react';
import { IndicateurValeursTable } from '../../../../indicateurs/valeurs/grid';
import type { GridMaxHeight } from '../../../../indicateurs/valeurs/grid/types';
import { demarchePcaetAutosaveKeys } from '../../data/autosave-keys';
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
  const autosaveKey = demarchePcaetAutosaveKeys.diagnosticIndicateurTable(
    demarcheId,
    table.id
  );
  const { rows, years, referenceYear, unit, onReferenceYearChange } =
    useDiagnosticIndicateurValeursTable({
      demarcheId,
      table,
      isReadonly,
      autosaveKey,
    });

  return (
    <IndicateurValeursTable
      demarcheId={demarcheId}
      autosaveKey={autosaveKey}
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
