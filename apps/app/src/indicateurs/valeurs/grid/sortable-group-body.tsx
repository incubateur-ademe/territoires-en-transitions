import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Row } from '@tanstack/react-table';
import { cn } from '@tet/ui';
import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { SortableGridRow } from './sortable-grid-row';
import { groupDragId, rowDragId } from './use-grid-reorder';
import { GridDisplayRow } from './grid-model';
import { GridRowGroup } from './types';

export const SortableGroupBody = ({
  group,
  rows,
}: {
  group: GridRowGroup;
  rows: Row<GridDisplayRow>[];
}): JSX.Element => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: groupDragId(group.id),
    attributes: { roleDescription: appLabels.indicateurGroupe },
  });
  return (
    <tbody
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-50')}
    >
      <SortableContext
        items={rows.map((row) => rowDragId(row.original.indicateurId))}
        strategy={verticalListSortingStrategy}
      >
        {rows.map((row) => (
          <SortableGridRow
            key={row.id}
            row={row}
            groupHandle={
              row.original.isGroupStart
                ? { attributes, listeners, setActivatorNodeRef }
                : undefined
            }
          />
        ))}
      </SortableContext>
    </tbody>
  );
};
