'use client';

import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';
import DropdownFloater from '@/app/ui/shared/floating-ui/DropdownFloater';
import { useGridCellServices } from '../grid-context';
import { OpenDataSource, IndicateurId, Year } from '../types';
import { ColumnSelection, OpenDataPicker } from './open-data-picker';

type OpenDataSelectorProps = {
  groupLabel: string;
  rowLabel: string;
  indicateurId: IndicateurId;
  year: Year;
  sources: OpenDataSource[];
  selectedSourceId?: string;
  columnSelection?: ColumnSelection;
  children: JSX.Element;
};

export const OpenDataSelector = ({
  groupLabel,
  rowLabel,
  indicateurId,
  year,
  sources,
  selectedSourceId,
  columnSelection,
  children,
}: OpenDataSelectorProps): JSX.Element => {
  const { selectOpenData, clearCell, unit, notify } = useGridCellServices();
  return (
    <DropdownFloater
      placement="bottom-end"
      offsetValue={2}
      render={({ close }) => (
        <OpenDataPicker
          groupLabel={groupLabel}
          rowLabel={rowLabel}
          year={year}
          unit={unit}
          sources={sources}
          selectedSourceId={selectedSourceId}
          onSelect={async (sourceId) => {
            const selectionResult = await selectOpenData({
              indicateurId,
              year,
              sourceId,
            });
            if (selectionResult.ok) {
              close();
            } else {
              notify?.(appLabels.indicateurSelectionnerValeurEchec);
            }
          }}
          onClose={close}
          onReset={async () => {
            const resetResult = await clearCell({ indicateurId, year });
            if (resetResult.ok) {
              close();
            } else {
              notify?.(appLabels.indicateurRepasserSaisieEchec);
            }
          }}
          columnSelection={
            columnSelection === undefined
              ? undefined
              : {
                  ...columnSelection,
                  onSelect: async () => {
                    const allSelected = await columnSelection.onSelect();
                    if (allSelected) {
                      close();
                    } else {
                      notify?.(appLabels.indicateurSelectionnerValeurEchec);
                    }
                    return allSelected;
                  },
                }
          }
        />
      )}
    >
      {children}
    </DropdownFloater>
  );
};
