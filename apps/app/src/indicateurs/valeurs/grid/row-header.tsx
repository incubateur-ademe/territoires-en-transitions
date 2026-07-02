import { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { JSX } from 'react';
import { DragHandle } from './drag-handle';

type RowHeaderProps = {
  label: string;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

export const RowHeader = ({
  label,
  attributes,
  listeners,
}: RowHeaderProps): JSX.Element => (
  <th
    scope="row"
    role="rowheader"
    className="border border-grey-3 bg-white p-2 text-left font-medium text-primary-9"
  >
    <div className="flex items-center gap-1">
      <DragHandle attributes={attributes} listeners={listeners} targetLabel={label} />
      {label}
    </div>
  </th>
);
