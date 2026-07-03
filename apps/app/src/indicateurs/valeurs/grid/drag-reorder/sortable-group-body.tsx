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
import { GridDisplayRow } from '../grid-model';
import { GridRowGroup } from '../types';
import { SortableGridRow } from './sortable-grid-row';
import { groupDragId, rowDragId } from './use-grid-reorder';

export const SortableGroupBody = ({
  group,
  rows,
  isGrouped,
  isReorderable,
}: {
  group: GridRowGroup;
  rows: Row<GridDisplayRow>[];
  isGrouped: boolean;
  isReorderable: boolean;
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
    disabled: !isReorderable,
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
        {rows.map((row) => {
          const showGroupHeader = isGrouped && row.original.isGroupStart;
          return (
            <SortableGridRow
              key={row.id}
              row={row}
              isReorderable={isReorderable}
              showGroupHeader={showGroupHeader}
              groupDragHandle={
                isReorderable && showGroupHeader
                  ? { attributes, listeners, setActivatorNodeRef }
                  : undefined
              }
            />
          );
        })}
      </SortableContext>
    </tbody>
  );
};
