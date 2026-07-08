import { CellKey, GridCell, SourceId } from './types';

export const applyOpenDataSelections = (
  cells: Map<CellKey, GridCell>,
  selections: Record<CellKey, SourceId>
): Map<CellKey, GridCell> =>
  new Map(
    [...cells].map(([key, cell]): [CellKey, GridCell] => {
      const selectedSourceId = selections[key];
      const isSelectableEmptyCell =
        selectedSourceId !== undefined &&
        cell.kind === 'user-data' &&
        cell.value === null;
      if (!isSelectableEmptyCell) {
        return [key, cell];
      }
      const source = cell.coveringSources.find(
        (covering) => covering.sourceId === selectedSourceId
      );
      if (source === undefined) {
        return [key, cell];
      }
      return [
        key,
        {
          kind: 'open-data',
          value: source.value,
          selectedSourceId: source.sourceId,
          source: {
            sourceId: source.sourceId,
            libelle: source.libelle,
            methodologie: source.methodologie,
            dateVersion: source.dateVersion,
          },
          coveringSources: cell.coveringSources,
        },
      ];
    })
  );
