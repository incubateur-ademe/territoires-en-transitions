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
  writeCell: IndicateurValuesGridActions['writeCell'];
};

export const UserDataCell = memo(
  ({
    cell,
    ariaLabel,
    indicateurId,
    year,
    writeCell,
  }: UserDataCellProps): JSX.Element => {
    const { value, valueId, coveringSources } = cell;
    const onCommit = useCallback(
      (resultat: number | null) =>
        writeCell({ indicateurId, valueId, year, resultat }),
      [writeCell, indicateurId, valueId, year]
    );
    const { text, status, onChange, commit, cancel } = useCellEdit({
      serverValue: value,
      onCommit,
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
          onCommit={commit}
          onCancel={cancel}
        />
        {showCoverageDot && <CoverageDot />}
        {status === 'saved' && <SaveAck />}
      </div>
    );
  }
);

UserDataCell.displayName = 'UserDataCell';
