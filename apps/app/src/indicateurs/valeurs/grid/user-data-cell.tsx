import { JSX, memo, useCallback } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { CellInput } from './cell-input';
import { GridCellProps } from './cell-props';
import { useGridCellServices } from './grid-context';
import {
  ValueWithVariation,
  variationHintId,
} from './variation/variation-hint';
import { CoverageDot } from './open-data-picker/coverage-dot';
import { SaveAck } from './save-ack';
import { useCellEdit } from './use-cell-edit';
import { generateCellKey, GridCell } from './types';

type UserDataCellProps = GridCellProps & {
  cell: Extract<GridCell, { kind: 'user-data' }>;
};

export const UserDataCell = memo(
  ({
    cell,
    secteur,
    polluant,
    indicateurId,
    year,
    columnSelection,
    variationToReferenceYear,
  }: UserDataCellProps): JSX.Element => {
    const { saveCellValue } = useGridCellServices();
    const { value, valueId, coveringSources } = cell;
    const cellId = generateCellKey(indicateurId, year);
    const impactId = variationHintId(cellId, variationToReferenceYear);
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
        <label className="flex h-full cursor-text items-center justify-end pr-3">
          <ValueWithVariation
            variationToReferenceYear={variationToReferenceYear}
            hintId={impactId}
          >
            <CellInput
              cellId={cellId}
              value={text}
              ariaLabel={appLabels.indicateurCellule(polluant, year)}
              describedById={impactId}
              hasError={status === 'error'}
              onChange={onChange}
              onSave={save}
              onCancel={cancel}
            />
          </ValueWithVariation>
        </label>
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
