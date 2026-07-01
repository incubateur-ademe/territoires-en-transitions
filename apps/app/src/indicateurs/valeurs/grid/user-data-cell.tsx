import { JSX, memo, useCallback } from 'react';
import { CellInput } from './cell-input';
import { CoverageDot } from './coverage-dot';
import { SaveAck } from './save-ack';
import { useCellEdit } from './use-cell-edit';
import {
  GridCell,
  IndicateurId,
  IndicateurValuesGridActions,
  Year,
} from './types';

type UserDataCellProps = {
  cell: Extract<GridCell, { kind: 'user-data' }>;
  ariaLabel: string;
  indicateurId: IndicateurId;
  year: Year;
  saveCellValue: IndicateurValuesGridActions['saveCellValue'];
};

export const UserDataCell = memo(
  ({
    cell,
    ariaLabel,
    indicateurId,
    year,
    saveCellValue,
  }: UserDataCellProps): JSX.Element => {
    const { value, valueId, coveringSources } = cell;
    const onSave = useCallback(
      (resultat: number | null) =>
        saveCellValue({ indicateurId, valueId, year, resultat }),
      [saveCellValue, indicateurId, valueId, year]
    );
    const { text, status, onChange, save, cancel } = useCellEdit({
      currentValue: value,
      onSave,
    });
    const isEmpty = text === '';
    const showCoverageDot =
      isEmpty && status === 'idle' && coveringSources.length > 0;
    return (
      <div className="relative h-full">
        <CellInput
          value={text}
          ariaLabel={ariaLabel}
          hasError={status === 'error'}
          onChange={onChange}
          onSave={save}
          onCancel={cancel}
        />
        {showCoverageDot && <CoverageDot />}
        {status === 'saved' && <SaveAck />}
      </div>
    );
  }
);

UserDataCell.displayName = 'UserDataCell';
