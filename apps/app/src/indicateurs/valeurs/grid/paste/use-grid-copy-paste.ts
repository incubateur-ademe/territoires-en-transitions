import { ClipboardEvent, useCallback } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { pasteValues } from './paste-values';
import {
  CELL_ID_ATTRIBUTE,
  CellKey,
  GridCell,
  GridRowGroup,
  IndicateurValuesGridActions,
  isCellKey,
  parseCellKey,
  Year,
} from '../types';

export const useGridCopyPaste = ({
  groups,
  years,
  cells,
  saveCellValues,
  notify,
}: {
  groups: GridRowGroup[];
  years: Year[];
  cells: Map<CellKey, GridCell>;
  saveCellValues: IndicateurValuesGridActions['saveCellValues'];
  notify?: (message: string) => void;
}): {
  onPaste: (event: ClipboardEvent<HTMLElement>) => void;
} => {
  const onPaste = useCallback(
    (event: ClipboardEvent<HTMLElement>) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const key = target.getAttribute(CELL_ID_ATTRIBUTE);
      if (!isCellKey(key)) {
        return;
      }
      const anchor = parseCellKey(key);
      const { cellsToWrite, skipped } = pasteValues({
        text: event.clipboardData.getData('text/plain'),
        anchorIndicateurId: anchor.indicateurId,
        anchorYear: anchor.year,
        groups,
        years,
        cells,
      });
      const nothingToPaste = cellsToWrite.length === 0 && skipped === 0;
      if (nothingToPaste) {
        return;
      }
      event.preventDefault();
      if (cellsToWrite.length > 0) {
        void saveCellValues(cellsToWrite);
      }
      if (skipped > 0) {
        notify?.(appLabels.indicateurCollageIgnore({ count: skipped }));
      }
    },
    [groups, years, cells, saveCellValues, notify]
  );

  return { onPaste };
};
