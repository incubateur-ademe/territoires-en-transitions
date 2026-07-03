import { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { JSX } from 'react';
import { DragHandle } from './drag-reorder/drag-handle';

type GroupHeaderCellProps = {
  label: string;
  rowSpan: number;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
};

export const GroupHeaderCell = ({
  label,
  rowSpan,
  attributes,
  listeners,
  setActivatorNodeRef,
}: GroupHeaderCellProps): JSX.Element => (
  <th
    scope="rowgroup"
    rowSpan={rowSpan}
    className="sticky left-0 z-10 border border-grey-3 bg-grey-1 p-2 align-top text-left font-bold text-primary-9"
  >
    <div className="flex items-center gap-1">
      <DragHandle
        attributes={attributes}
        listeners={listeners}
        setActivatorNodeRef={setActivatorNodeRef}
        targetLabel={label}
      />
      {label}
    </div>
  </th>
);
