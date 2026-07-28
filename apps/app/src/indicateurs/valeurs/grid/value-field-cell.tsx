'use client';

import { appLabels } from '@/app/labels/catalog';
import { cn, TableCell } from '@tet/ui';
import { memo, ReactNode } from 'react';
import { isObjectifEditable, isResultatEditable } from './cell-editability';
import { GridCellProps } from './cell-props';
import { FieldValue } from './field-value';
import { generateNavCellKey, GridCell, ValeurField } from './types';
import { variationHintId } from './variation/variation-hint';

type ValueFieldCellProps = GridCellProps & {
  cell: GridCell;
  field: ValeurField;
  currentYear?: number;
};

export const ValueFieldCell = memo(
  ({
    cell,
    field,
    rowLabel,
    indicateurId,
    year,
    currentYear = new Date().getFullYear(),
    variationToReferenceYear,
  }: ValueFieldCellProps): ReactNode => {
    const cellId = generateNavCellKey(indicateurId, year, field);
    const hintId = variationHintId(cellId, variationToReferenceYear);
    const resultatEditable = isResultatEditable(year, currentYear);
    const objectifEditable = isObjectifEditable(year, currentYear);

    if (field === 'resultat' && !resultatEditable && cell.resultat === null) {
      return null;
    }

    const withNavigationId =
      field === 'resultat' ? resultatEditable : objectifEditable;

    return (
      <TableCell
        data-field={field}
        className={cn(
          'whitespace-nowrap p-0',
          field === 'resultat' && '!border-r-0',
          field === 'objectif' && '!border-l-0'
        )}
      >
        <div
          className={cn(
            'relative flex h-full items-center justify-center p-1',
            {
              'after:absolute after:right-0 after:top-1/2 after:h-4 after:w-px after:-translate-y-1/2 after:bg-grey-3':
                field === 'resultat',
            }
          )}
          data-test={
            field === 'resultat'
              ? 'indicateurs.grid.value-field-cell-resultat'
              : 'indicateurs.grid.value-field-cell-objectif'
          }
        >
          <FieldValue
            field={field}
            value={field === 'resultat' ? cell.resultat : cell.objectif}
            rowLabel={rowLabel}
            year={year}
            indicateurId={indicateurId}
            cellId={cellId}
            fieldLabel={
              field === 'resultat'
                ? appLabels.indicateurLegendeResultat
                : appLabels.indicateurLegendeObjectif
            }
            addLabel={
              field === 'resultat'
                ? appLabels.indicateurAjouterResultat
                : appLabels.indicateurAjouterObjectif
            }
            withNavigationId={withNavigationId}
            variationToReferenceYear={
              field === 'objectif' ? variationToReferenceYear : null
            }
            hintId={field === 'objectif' ? hintId : undefined}
          />
        </div>
      </TableCell>
    );
  }
);

ValueFieldCell.displayName = 'ValueFieldCell';
