'use client';

import { JSX } from 'react';
import DropdownFloater from '@/app/ui/shared/floating-ui/DropdownFloater';
import { useGridCellServices } from '../grid-context';
import { OpenDataSource, IndicateurId, Year } from '../types';
import { ColumnSelection, OpenDataPicker } from './open-data-picker';
import { buildOpenDataHandlers } from './build-open-data-handlers';

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
      render={({ close }) => {
        const {
          onSelect,
          onReset,
          columnSelection: wrappedColumnSelection,
        } = buildOpenDataHandlers({
          indicateurId,
          year,
          selectOpenData,
          clearCell,
          notify,
          columnSelection,
          close,
        });
        return (
          <OpenDataPicker
            groupLabel={groupLabel}
            rowLabel={rowLabel}
            year={year}
            unit={unit}
            sources={sources}
            selectedSourceId={selectedSourceId}
            onSelect={onSelect}
            onClose={close}
            onReset={onReset}
            columnSelection={wrappedColumnSelection}
          />
        );
      }}
    >
      {children}
    </DropdownFloater>
  );
};
