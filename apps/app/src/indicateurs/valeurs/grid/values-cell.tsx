'use client';

import { JSX, memo, useCallback, useState } from 'react';
import { appLabels } from '@/app/labels/catalog';
import {
  isObjectifEditable,
  isResultatEditable,
} from './cell-editability';
import { GridCellProps } from './cell-props';
import { FieldValue } from './field-value';
import { generateCellKey, GridCell, ValeurField } from './types';
import { variationHintId } from './variation/variation-hint';

type ValuesCellProps = GridCellProps & {
  cell: GridCell;
  currentYear?: number;
};

export const ValuesCell = memo(
  ({
    cell,
    rowLabel,
    indicateurId,
    year,
    currentYear = new Date().getFullYear(),
    variationToReferenceYear,
  }: ValuesCellProps): JSX.Element => {
    const cellId = generateCellKey(indicateurId, year);
    const hintId = variationHintId(cellId, variationToReferenceYear);
    const resultatEditable = isResultatEditable(year, currentYear);
    const objectifEditable = isObjectifEditable(year, currentYear);
    const [editingField, setEditingField] = useState<ValeurField | null>(null);

    const navigationField: ValeurField =
      editingField ?? (resultatEditable ? 'resultat' : 'objectif');

    const onResultatEditingChange = useCallback((isEditing: boolean) => {
      setEditingField(isEditing ? 'resultat' : null);
    }, []);

    const onObjectifEditingChange = useCallback((isEditing: boolean) => {
      setEditingField(isEditing ? 'objectif' : null);
    }, []);

    return (
      <div className="relative flex h-full items-center justify-end gap-2 pr-3">
        <FieldValue
          field="resultat"
          value={cell.resultat}
          editable={resultatEditable}
          rowLabel={rowLabel}
          year={year}
          indicateurId={indicateurId}
          cellId={cellId}
          fieldLabel={appLabels.indicateurLegendeResultat}
          addLabel={appLabels.indicateurAjouterResultat}
          dotClassName="bg-grey-9"
          withNavigationId={navigationField === 'resultat'}
          onEditingChange={onResultatEditingChange}
        />
        <FieldValue
          field="objectif"
          value={cell.objectif}
          editable={objectifEditable}
          rowLabel={rowLabel}
          year={year}
          indicateurId={indicateurId}
          cellId={cellId}
          fieldLabel={appLabels.indicateurLegendeObjectif}
          addLabel={appLabels.indicateurAjouterObjectif}
          dotClassName="bg-primary-7 ring-2 ring-primary-2"
          withNavigationId={navigationField === 'objectif'}
          variationToReferenceYear={variationToReferenceYear}
          hintId={hintId}
          onEditingChange={onObjectifEditingChange}
        />
      </div>
    );
  }
);

ValuesCell.displayName = 'ValuesCell';
