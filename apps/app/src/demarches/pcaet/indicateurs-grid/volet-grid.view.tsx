'use client';

import { JSX } from 'react';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { IndicateurValuesGrid } from '@/app/indicateurs/valeurs/grid';
import { IndicateurGridShape } from '@/app/indicateurs/valeurs/grid/indicateur-grid-shape';
import type { DemarchePcaetVoletId } from '../demarche-pcaet.types';
import { useVoletGrid } from './use-volet-grid';

type VoletGridViewProps = {
  demarcheId: string;
  voletId: DemarchePcaetVoletId;
  shape: IndicateurGridShape;
};

export const VoletGridView = (props: VoletGridViewProps): JSX.Element => {
  const { setToast } = useToastContext();
  const {
    rows,
    years,
    referenceYear,
    unit,
    cells,
    isLoading,
    actions,
    onReorderRows,
    onReferenceYearChange,
  } = useVoletGrid(props);

  return (
    <IndicateurValuesGrid
      rows={rows}
      years={years}
      referenceYear={referenceYear}
      unit={unit}
      cells={cells}
      isLoading={isLoading}
      actions={actions}
      notify={(message, level) => setToast(level, message)}
      onReorderRows={onReorderRows}
      onReferenceYearChange={onReferenceYearChange}
    />
  );
};
