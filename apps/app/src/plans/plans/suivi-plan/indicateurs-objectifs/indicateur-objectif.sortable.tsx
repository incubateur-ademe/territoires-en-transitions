'use client';

import { appLabels } from '@/app/labels/catalog';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ReactNode } from 'react';

/**
 * Une carte d'indicateur réordonnable. Seule la poignée lance le glisser-déposer,
 * pour qu'un clic sur la carte ou sur le texte ne déplace rien.
 */
export const IndicateurObjectifSortable = ({
  id,
  isEnabled,
  renderCard,
}: {
  id: number;
  isEnabled: boolean;
  renderCard: (poignee: ReactNode) => ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEnabled });

  const poignee = isEnabled ? (
    <button
      ref={setActivatorNodeRef}
      type="button"
      aria-label={appLabels.indicateursObjectifsDeplacer}
      className={cn(
        'mt-0.5 shrink-0 cursor-grab touch-none text-grey-7 transition-opacity hover:text-primary-9 active:cursor-grabbing',
        // visible au survol de la carte, au focus clavier, et pendant le glissement
        isDragging
          ? 'opacity-100'
          : 'opacity-0 focus-visible:opacity-100 group-hover:opacity-100'
      )}
      data-test="plans.suivi.indicateurs-objectifs.deplacer"
      data-html2canvas-ignore
      {...attributes}
      {...listeners}
    >
      <Icon icon="draggable" size="sm" />
    </button>
  ) : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && 'relative z-10 opacity-75')}
    >
      {renderCard(poignee)}
    </div>
  );
};
