import { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { JSX } from 'react';
import { DragHandle } from './drag-handle';

export type HeaderDragHandle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
};

export const DraggableHeaderLabel = ({
  label,
  dragHandle,
}: {
  label: string;
  dragHandle?: HeaderDragHandle;
}): JSX.Element => (
  <div className="flex items-center gap-1">
    {dragHandle !== undefined && (
      <DragHandle
        attributes={dragHandle.attributes}
        listeners={dragHandle.listeners}
        setActivatorNodeRef={dragHandle.setActivatorNodeRef}
        targetLabel={label}
      />
    )}
    {label}
  </div>
);
