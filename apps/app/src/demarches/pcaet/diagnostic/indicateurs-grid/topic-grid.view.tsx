'use client';

import { IndicateurValeursTable } from '../../../../indicateurs/valeurs/grid';
import { IndicateurGridShape } from '../../../../indicateurs/valeurs/grid/indicateur-grid-shape';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { JSX } from 'react';
import type { DemarchePcaetTopicId } from '@/app/demarches/types';
import { useTopicGrid } from './use-topic-grid';

type TopicGridViewProps = {
  demarcheId: number;
  topicId: DemarchePcaetTopicId;
  shape: IndicateurGridShape;
  title: string;
};

export const TopicGridView = (props: TopicGridViewProps): JSX.Element => {
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
  } = useTopicGrid(props);

  return (
    <IndicateurValeursTable
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
