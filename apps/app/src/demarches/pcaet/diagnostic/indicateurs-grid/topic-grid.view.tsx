'use client';

import { useToastContext } from '@/app/utils/toast/toast-context';
import type { DemarchePcaetTopic } from '@tet/domain/demarches';
import { JSX } from 'react';
import { IndicateurValeursTable } from '../../../../indicateurs/valeurs/grid';
import { useTopicGrid } from './use-topic-grid';

type TopicGridViewProps = {
  demarcheId: number;
  topic: DemarchePcaetTopic;
  isReadonly: boolean;
};

export const TopicGridView = ({
  demarcheId,
  topic,
  isReadonly,
}: TopicGridViewProps): JSX.Element => {
  const { setToast } = useToastContext();
  const {
    rows,
    years,
    referenceYear,
    unit,
    cells,
    actions,
    onReferenceYearChange,
    onAddYear,
    onRemoveYear,
    canRemoveYear,
  } = useTopicGrid({ demarcheId, topic, isReadonly });

  return (
    <IndicateurValeursTable
      rows={rows}
      years={years}
      referenceYear={referenceYear}
      title={topic.label}
      unit={unit}
      cells={cells}
      isReadonly
      hasMaxHeight={false}
      actions={actions}
      notify={(message, level) => setToast(level, message)}
      onReferenceYearChange={onReferenceYearChange}
      onAddYear={onAddYear}
      onRemoveYear={onRemoveYear}
      canRemoveYear={canRemoveYear}
    />
  );
};
