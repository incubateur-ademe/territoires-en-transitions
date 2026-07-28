import { Row } from '@tanstack/react-table';
import { JSX, useState } from 'react';
import { useGridContext } from './grid-context';
import { GridDisplayRow } from './grid-model';
import { GridRow } from './grid-row';
import { GroupParentRow } from './group-parent-row';
import { GridRowGroup } from './types';

export const GroupBody = ({
  group,
  rows,
  isGrouped,
  showAddYearColumn = false,
}: {
  group: GridRowGroup;
  rows: Row<GridDisplayRow>[];
  isGrouped: boolean;
  showAddYearColumn?: boolean;
}): JSX.Element => {
  const { years } = useGridContext();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <tbody>
      {isGrouped && (
        <GroupParentRow
          label={group.label}
          rowCount={group.rows.length}
          valueColumnCount={years.length * 2}
          showAddYearColumn={showAddYearColumn}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded((current) => !current)}
        />
      )}
      {isExpanded &&
        rows.map((row) => (
          <GridRow
            key={row.id}
            row={row}
            showAddYearColumn={showAddYearColumn}
          />
        ))}
    </tbody>
  );
};
