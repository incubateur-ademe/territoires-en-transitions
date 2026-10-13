'use client';

import { JSX, useMemo } from 'react';
import { IndicateurValeursTable } from '../../../../indicateurs/valeurs/grid';
import type { GridMaxHeight } from '../../../../indicateurs/valeurs/grid/types';
import { demarchePcaetAutosaveKeys } from '../../data/autosave-keys';
import type { DiagnosticIndicateurTable } from './indicateur-tab.layout';
import { buildDiagnosticIndicateurPeriodeColumns } from './diagnostic-indicateur-periode.columns';
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
  const {
    rows,
    years,
    referenceYear,
    unit,
    onReferenceYearChange,
    updateIndicateurValeurs,
    setIndicateurApplicable,
  } = useDiagnosticIndicateurValeursTable({
    demarcheId,
    table,
    isReadonly,
    autosaveKey,
  });

  const currentYear = new Date().getFullYear();
  const periodeColumns = useMemo(
    () =>
      buildDiagnosticIndicateurPeriodeColumns({
        years,
        referenceYear,
        currentYear,
        onReferenceYearChange,
        isReadonly,
      }),
    [years, referenceYear, currentYear, onReferenceYearChange, isReadonly]
  );

  return (
    <IndicateurValeursTable
      autosaveKey={autosaveKey}
      rows={rows}
      periodeColumns={periodeColumns}
      updateIndicateurValeurs={updateIndicateurValeurs}
      setIndicateurApplicable={setIndicateurApplicable}
      title={table.title}
      unit={unit}
      isReadonly={isReadonly}
      isRequired={!table.isOptional}
      maxHeight={maxHeight}
    />
  );
};
