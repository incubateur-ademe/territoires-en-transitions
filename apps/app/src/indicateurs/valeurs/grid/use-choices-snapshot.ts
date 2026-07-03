import { useEffect, useMemo } from 'react';
import {
  IndicateurChoicesSnapshot,
  toChoicesSnapshot,
} from './choices-snapshot';
import { CellKey, GridCell } from './types';

export const useChoicesSnapshot = (
  cells: Map<CellKey, GridCell>,
  onSnapshotChange?: (snapshot: IndicateurChoicesSnapshot) => void
): void => {
  const snapshot = useMemo(() => toChoicesSnapshot(cells), [cells]);
  useEffect(() => {
    onSnapshotChange?.(snapshot);
  }, [snapshot, onSnapshotChange]);
};
