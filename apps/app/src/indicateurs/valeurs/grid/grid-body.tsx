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
}: {
  rows: Row<GridDisplayRow>[];
  groups: GridRowGroup[];
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
      />
    ))}
  </SortableContext>
);
