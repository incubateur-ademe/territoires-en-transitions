import { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, Row } from '@tanstack/react-table';
import { cn } from '@tet/ui';
import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { GroupHeaderCell } from '../group-header-cell';
import { RowHeader } from '../row-header';
import { GridDisplayRow } from '../grid-model';
import { rowDragId } from './use-grid-reorder';

type GroupHandle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
};

export const SortableGridRow = ({
  row,
  groupHandle,
}: {
  row: Row<GridDisplayRow>;
  groupHandle?: GroupHandle;
}): JSX.Element => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: rowDragId(row.original.indicateurId),
    attributes: { roleDescription: appLabels.indicateurLigne },
  });
  return (
    <tr
      ref={setNodeRef}
      role="row"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-50')}
    >
      {groupHandle !== undefined && (
        <GroupHeaderCell
          label={row.original.groupLabel}
          rowSpan={row.original.groupSize}
          attributes={groupHandle.attributes}
          listeners={groupHandle.listeners}
          setActivatorNodeRef={groupHandle.setActivatorNodeRef}
        />
      )}
      <RowHeader
        label={row.original.rowLabel}
        attributes={attributes}
        listeners={listeners}
      />
      {row.getVisibleCells().map((cell) => (
        <td
          key={cell.id}
          role="gridcell"
          className="h-10 border border-grey-3 p-0"
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
};
