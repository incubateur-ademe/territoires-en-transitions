'use client';

import { appLabels } from '@/app/labels/catalog';
import { cn } from '@tet/ui';
import { JSX, memo } from 'react';
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
  }: ValueFieldCellProps): JSX.Element => {
    const cellId = generateNavCellKey(indicateurId, year, field);
    const hintId = variationHintId(cellId, variationToReferenceYear);
    const resultatEditable = isResultatEditable(year, currentYear);
    const objectifEditable = isObjectifEditable(year, currentYear);

    if (field === 'resultat' && !resultatEditable && cell.resultat === null) {
      return null;
    }

    const editable = field === 'resultat' ? resultatEditable : objectifEditable;
    const withNavigationId =
      field === 'resultat' ? resultatEditable : objectifEditable;

    return (
      <div
        className={cn('flex h-full items-center justify-center', {
          'border-r border-grey-3 p-1': field === 'resultat',
          'p-1': field === 'objectif',
        })}
        data-test={
          field === 'resultat'
            ? 'indicateurs.grid.value-field-cell-resultat'
            : 'indicateurs.grid.value-field-cell-objectif'
        }
      >
        <FieldValue
          field={field}
          value={field === 'resultat' ? cell.resultat : cell.objectif}
          editable={editable}
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
          dotClassName={
            field === 'resultat'
              ? 'bg-grey-9'
              : 'bg-primary-7 ring-2 ring-primary-2'
          }
          withNavigationId={withNavigationId}
          variationToReferenceYear={
            field === 'objectif' ? variationToReferenceYear : null
          }
          hintId={field === 'objectif' ? hintId : undefined}
        />
      </div>
    );
  }
);

ValueFieldCell.displayName = 'ValueFieldCell';
