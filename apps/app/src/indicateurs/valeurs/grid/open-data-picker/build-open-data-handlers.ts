import { appLabels } from '@/app/labels/catalog';
import { GridCellServices } from '../grid-context';
import { IndicateurId, SourceId, Year } from '../types';
import { ColumnSelection } from './open-data-picker';

export const buildOpenDataHandlers = ({
  indicateurId,
  year,
  selectOpenData,
  clearCell,
  notify,
  columnSelection,
  close,
}: {
  indicateurId: IndicateurId;
  year: Year;
  selectOpenData: GridCellServices['selectOpenData'];
  clearCell: GridCellServices['clearCell'];
  notify: GridCellServices['notify'];
  columnSelection?: ColumnSelection;
  close: () => void;
}): {
  onSelect: (sourceId: SourceId) => Promise<void>;
  onReset: () => Promise<void>;
  columnSelection?: ColumnSelection;
} => {
  const onSelect = async (sourceId: SourceId): Promise<void> => {
    const selectionResult = await selectOpenData({ indicateurId, year, sourceId });
    if (selectionResult.ok) {
      close();
    } else {
      notify(appLabels.indicateurSelectionnerValeurEchec);
    }
  };

  const onReset = async (): Promise<void> => {
    const resetResult = await clearCell({ indicateurId, year });
    if (resetResult.ok) {
      close();
    } else {
      notify(appLabels.indicateurRepasserSaisieEchec);
    }
  };

  if (columnSelection === undefined) {
    return { onSelect, onReset, columnSelection: undefined };
  }

  return {
    onSelect,
    onReset,
    columnSelection: {
      ...columnSelection,
      onSelect: async (): Promise<boolean> => {
        const allSelected = await columnSelection.onSelect();
        if (allSelected) {
          close();
        } else {
          notify(appLabels.indicateurSelectionnerValeurEchec);
        }
        return allSelected;
      },
    },
  };
};
