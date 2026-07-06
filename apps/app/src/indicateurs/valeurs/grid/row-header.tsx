import { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { JSX } from 'react';
import { DraggableHeaderLabel } from './drag-reorder/draggable-header-label';

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
    className="bg-white p-2 text-left font-medium text-primary-9"
  >
    <DraggableHeaderLabel label={label} dragHandle={dragHandle} />
  </th>
);
