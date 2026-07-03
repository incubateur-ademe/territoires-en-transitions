import { findCell } from '../grid-model';
import {
  CellKey,
  GridCell,
  GridRowGroup,
  IndicateurValuesGridActions,
  OpenDataSource,
  Year,
} from '../types';
import { ColumnSelection } from './open-data-picker';

const sourceToPropagate = (
  cell: GridCell | null
): OpenDataSource | undefined => {
  if (cell === null) {
    return undefined;
  }
  if (cell.kind === 'user-data') {
    return cell.value === null ? cell.coveringSources[0] : undefined;
  }
  return cell.coveringSources.find((s) => s.sourceId === cell.selectedSourceId);
};

export const buildColumnSelection = ({
  cell,
  group,
  year,
  cells,
  selectOpenData,
}: {
  cell: GridCell | null;
  group: GridRowGroup;
  year: Year;
  cells: Map<CellKey, GridCell>;
  selectOpenData: IndicateurValuesGridActions['selectOpenData'];
}): ColumnSelection | undefined => {
  const source = sourceToPropagate(cell);
  if (source === undefined) {
    return undefined;
  }
  const targets = group.rows.filter((row) => {
    const rowCell = findCell({ cells, indicateurId: row.indicateurId, year });
    return (
      rowCell?.kind === 'user-data' &&
      rowCell.value === null &&
      rowCell.coveringSources.some((s) => s.sourceId === source.sourceId)
    );
  });
  if (targets.length <= 1) {
    return undefined;
  }
  return {
    source,
    count: targets.length,
    onSelect: async () => {
      const outcomes = await Promise.all(
        targets.map((row) =>
          selectOpenData({
            indicateurId: row.indicateurId,
            year,
            sourceId: source.sourceId,
          })
        )
      );
      return outcomes.every((outcome) => outcome.ok);
    },
  };
};
