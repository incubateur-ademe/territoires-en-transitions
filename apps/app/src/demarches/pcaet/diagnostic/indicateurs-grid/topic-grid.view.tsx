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
    unit,
    cells,
    actions,
    onAddYear,
    onRemoveYear,
    canRemoveYear,
  } = useTopicGrid({ demarcheId, topic, isReadonly });

  return (
    <IndicateurValeursTable
      rows={rows}
      years={years}
      title={topic.label}
      unit={unit}
      cells={cells}
      isReadonly={isReadonly}
      // Plafonner la hauteur donne au tableau sa propre zone de défilement :
      // c'est ce qui garde l'en-tête et la ligne de secteur visibles quand on
      // parcourt un topic à plusieurs dizaines de lignes.
      maxHeight="viewport"
      actions={actions}
      notify={(message, level) => setToast(level, message)}
      onAddYear={onAddYear}
      onRemoveYear={onRemoveYear}
      canRemoveYear={canRemoveYear}
    />
  );
};
