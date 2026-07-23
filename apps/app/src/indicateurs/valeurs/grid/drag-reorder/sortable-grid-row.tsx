import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, Row } from '@tanstack/react-table';
import { cn } from '@tet/ui';
import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { RowHeader } from '../row-header';
import { GridDisplayRow } from '../grid-model';
import { rowDragId } from './use-grid-reorder';

export const SortableGridRow = ({
  row,
  isReorderable,
}: {
  row: Row<GridDisplayRow>;
  isReorderable: boolean;
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
    disabled: !isReorderable,
  });
  return (
    <tr
      ref={setNodeRef}
      role="row"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-50')}
    >
      <RowHeader
        label={row.original.rowLabel}
        dragHandle={isReorderable ? { attributes, listeners } : undefined}
      />
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} role="gridcell" className="h-10 p-0">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
};
