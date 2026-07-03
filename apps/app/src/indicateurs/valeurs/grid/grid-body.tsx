import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Row } from '@tanstack/react-table';
import { JSX } from 'react';
import { SortableGroupBody } from './drag-reorder/sortable-group-body';
import { groupDragId } from './drag-reorder/use-grid-reorder';
import { GridDisplayRow } from './grid-model';
import { GridRowGroup } from './types';

export const GridBody = ({
  rows,
  groups,
  isGrouped,
  isReorderable,
}: {
  rows: Row<GridDisplayRow>[];
  groups: GridRowGroup[];
  isGrouped: boolean;
  isReorderable: boolean;
}): JSX.Element => (
  <SortableContext
    items={groups.map((group) => groupDragId(group.id))}
    strategy={verticalListSortingStrategy}
  >
    {groups.map((group) => (
      <SortableGroupBody
        key={group.id}
        group={group}
        rows={rows.filter((row) => row.original.groupId === group.id)}
        isGrouped={isGrouped}
        isReorderable={isReorderable}
      />
    ))}
  </SortableContext>
);
