import { Row } from '@tanstack/react-table';
import { JSX } from 'react';
import { GroupBody } from './group-body';
import { GridDisplayRow } from './grid-model';
import { GridRowGroup } from './types';

export const GridBody = ({
  rows,
  groups,
  isGrouped,
  showAddYearColumn = false,
}: {
  rows: Row<GridDisplayRow>[];
  groups: GridRowGroup[];
  isGrouped: boolean;
  showAddYearColumn?: boolean;
}): JSX.Element => (
  <>
    {groups.map((group) => (
      <GroupBody
        key={group.id}
        group={group}
        rows={rows.filter((row) => row.original.groupId === group.id)}
        isGrouped={isGrouped}
        showAddYearColumn={showAddYearColumn}
      />
    ))}
  </>
);
