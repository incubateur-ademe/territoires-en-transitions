import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Row } from '@tanstack/react-table';
import { cn } from '@tet/ui';
import { JSX, useState } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { useGridContext } from '../grid-context';
import { GroupParentRow } from '../group-parent-row';
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
  const { years } = useGridContext();
  const [isExpanded, setIsExpanded] = useState(true);
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
    disabled: !isReorderable || !isGrouped,
  });

  return (
    <tbody
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-50')}
    >
      {isGrouped && (
        <GroupParentRow
          label={group.label}
          rowCount={group.rows.length}
          yearCount={years.length}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded((current) => !current)}
          dragHandle={
            isReorderable
              ? { attributes, listeners, setActivatorNodeRef }
              : undefined
          }
        />
      )}
      {isExpanded && (
        <SortableContext
          items={rows.map((row) => rowDragId(row.original.indicateurId))}
          strategy={verticalListSortingStrategy}
        >
          {rows.map((row) => (
            <SortableGridRow
              key={row.id}
              row={row}
              isReorderable={isReorderable}
            />
          ))}
        </SortableContext>
      )}
    </tbody>
  );
};
