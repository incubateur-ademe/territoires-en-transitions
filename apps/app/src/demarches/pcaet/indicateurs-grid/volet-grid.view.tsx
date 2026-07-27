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
  title: string;
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
    onReferenceYearChange,
    onAddYear,
    onRemoveYear,
    canRemoveYear,
  } = useVoletGrid(props);

  return (
    <IndicateurValuesGrid
      rows={rows}
      years={years}
      referenceYear={referenceYear}
      title={props.title}
      unit={unit}
      cells={cells}
      isLoading={isLoading}
      actions={actions}
      notify={(message, level) => setToast(level, message)}
      onReferenceYearChange={onReferenceYearChange}
      onAddYear={onAddYear}
      onRemoveYear={onRemoveYear}
      canRemoveYear={canRemoveYear}
    />
  );
};
