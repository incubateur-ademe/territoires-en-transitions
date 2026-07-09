import { ClipboardEvent, useCallback } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { pasteValues } from './paste-values';
import {
  CELL_ID_ATTRIBUTE,
  CellKey,
  CellValueInput,
  GridCell,
  GridRowGroup,
  IndicateurValuesGridActions,
  isCellKey,
  NotifyGridEvent,
  parseCellKey,
  Year,
} from '../types';

const writeAndReportFailures = async ({
  cellsToWrite,
  saveCellValues,
  notify,
}: {
  cellsToWrite: CellValueInput[];
  saveCellValues: IndicateurValuesGridActions['saveCellValues'];
  notify: NotifyGridEvent;
}): Promise<void> => {
  try {
    const result = await saveCellValues(cellsToWrite);
    const failedCount = result.ok
      ? result.value.failed.length
      : cellsToWrite.length;
    if (failedCount > 0) {
      notify(appLabels.indicateurCollageEchec({ count: failedCount }), 'error');
    }
  } catch {
    notify(
      appLabels.indicateurCollageEchec({ count: cellsToWrite.length }),
      'error'
    );
  }
};

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
  notify: NotifyGridEvent;
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
      if (skipped > 0) {
        notify(appLabels.indicateurCollageIgnore({ count: skipped }), 'info');
      }
      if (cellsToWrite.length === 0) {
        return;
      }
      void writeAndReportFailures({ cellsToWrite, saveCellValues, notify });
    },
    [groups, years, cells, saveCellValues, notify]
  );

  return { onPaste };
};
