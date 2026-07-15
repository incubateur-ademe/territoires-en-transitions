import { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { cn, Icon } from '@tet/ui';
import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { RiDraggable } from '@remixicon/react';

type DragHandleProps = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  targetLabel: string;
  className?: string;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
};

export const DragHandle = ({
  attributes,
  listeners,
  targetLabel,
  className,
  setActivatorNodeRef,
}: DragHandleProps): JSX.Element => (
  <button
    ref={setActivatorNodeRef}
    type="button"
    aria-label={appLabels.indicateurReordonnerCible(targetLabel)}
    className={cn('cursor-grab touch-none text-grey-7', className)}
    {...attributes}
    {...listeners}
  >
    <Icon icon={<RiDraggable />} size="xs" />
  </button>
);
