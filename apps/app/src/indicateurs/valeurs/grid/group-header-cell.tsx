import { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { JSX } from 'react';
import { DragHandle } from './drag-reorder/drag-handle';

type GroupDragHandle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
};

type GroupHeaderCellProps = {
  label: string;
  rowSpan: number;
  dragHandle?: GroupDragHandle;
};

export const GroupHeaderCell = ({
  label,
  rowSpan,
  dragHandle,
}: GroupHeaderCellProps): JSX.Element => (
  <th
    scope="rowgroup"
    rowSpan={rowSpan}
    className="sticky left-0 z-10 border border-grey-3 bg-grey-1 p-2 align-top text-left font-bold text-primary-9"
  >
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
  </th>
);
