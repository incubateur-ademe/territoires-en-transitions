import { JSX, memo, useCallback } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { CellInput } from './cell-input';
import { useGridCellServices } from './grid-context';
import { ColumnSelection } from './open-data-picker/open-data-picker';
import { CoverageDot } from './open-data-picker/coverage-dot';
import { SaveAck } from './save-ack';
import { useCellEdit } from './use-cell-edit';
import { generateCellKey, GridCell, IndicateurId, Year } from './types';

type UserDataCellProps = {
  cell: Extract<GridCell, { kind: 'user-data' }>;
  secteur: string;
  polluant: string;
  indicateurId: IndicateurId;
  year: Year;
  columnSelection?: ColumnSelection;
};

export const UserDataCell = memo(
  ({
    cell,
    secteur,
    polluant,
    indicateurId,
    year,
    columnSelection,
  }: UserDataCellProps): JSX.Element => {
    const { saveCellValue } = useGridCellServices();
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
          cellId={generateCellKey(indicateurId, year)}
          value={text}
          ariaLabel={appLabels.indicateurCellule(polluant, year)}
          hasError={status === 'error'}
          onChange={onChange}
          onSave={save}
          onCancel={cancel}
        />
        {showCoverageDot && (
          <CoverageDot
            coveringSources={coveringSources}
            secteur={secteur}
            polluant={polluant}
            indicateurId={indicateurId}
            year={year}
            columnSelection={columnSelection}
          />
        )}
        {status === 'saved' && <SaveAck />}
      </div>
    );
  }
);

UserDataCell.displayName = 'UserDataCell';
