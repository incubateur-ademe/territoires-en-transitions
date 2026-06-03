import { useState } from 'react';
import { cellKey, DraftCell } from './grid-model';

export type GridDraft = {
  byKey: Map<string, DraftCell>;
  cells: DraftCell[];
  pendingCount: number;
  setCell: (cell: DraftCell) => void;
  applyCells: (cells: DraftCell[]) => void;
  reset: () => void;
};

export const useGridDraft = (): GridDraft => {
  const [byKey, setByKey] = useState<Map<string, DraftCell>>(new Map());

  const setCell = (cell: DraftCell): void => {
    setByKey((current) =>
      new Map(current).set(cellKey(cell.indicateurId, cell.year), cell)
    );
  };

  const applyCells = (cells: DraftCell[]): void => {
    setByKey((current) => {
      const next = new Map(current);
      cells.forEach((cell) => {
        next.set(cellKey(cell.indicateurId, cell.year), cell);
      });
      return next;
    });
  };

  const reset = (): void => setByKey(new Map());

  return {
    byKey,
    cells: Array.from(byKey.values()),
    pendingCount: byKey.size,
    setCell,
    applyCells,
    reset,
  };
};
