import { Row } from '@tanstack/react-table';
import { JSX, useState } from 'react';
import { useGridContext } from './grid-context';
import { GridDisplayRow } from './grid-model';
import { IndicateurValeursRow } from './grid-row';
import { IndicateurParentGroupRow } from './group-parent-row';
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
  const { years, referenceYear } = useGridContext();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <tbody>
      {isGrouped && (
        <IndicateurParentGroupRow
          label={group.label}
          rowCount={group.rows.length}
          years={years}
          referenceYear={referenceYear}
          showAddYearColumn={showAddYearColumn}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded((current) => !current)}
        />
      )}
      {isExpanded &&
        rows.map((row) => <IndicateurValeursRow key={row.id} row={row} />)}
    </tbody>
  );
};
