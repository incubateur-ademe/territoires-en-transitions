import { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { JSX } from 'react';
import { DragHandle } from './drag-reorder/drag-handle';

type RowDragHandle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

type RowHeaderProps = {
  label: string;
  dragHandle?: RowDragHandle;
};

export const RowHeader = ({
  label,
  dragHandle,
}: RowHeaderProps): JSX.Element => (
  <th
    scope="row"
    role="rowheader"
    className="border border-grey-3 bg-white p-2 text-left font-medium text-primary-9"
  >
    <div className="flex items-center gap-1">
      {dragHandle !== undefined && (
        <DragHandle
          attributes={dragHandle.attributes}
          listeners={dragHandle.listeners}
          targetLabel={label}
        />
      )}
      {label}
    </div>
  </th>
);
