'use client';

import { JSX, memo, ReactNode, useCallback, useState } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { cn } from '@tet/ui';
import { isObjectifEditable, isResultatEditable } from './cell-editability';
import { GridCellProps } from './cell-props';
import { FieldValue } from './field-value';
import { generateCellKey, GridCell, ValeurField } from './types';
import { variationHintId } from './variation/variation-hint';

type ValuesCellProps = GridCellProps & {
  cell: GridCell;
  currentYear?: number;
};

const FieldSlot = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element => (
  <div
    className={cn(
      'flex min-w-0 flex-1 items-center justify-center px-1.5',
      className
    )}
  >
    {children}
  </div>
);

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

    // Dual fixed slots when résultat can still be entered, or an existing
    // résultat must stay visible beside the objectif (e.g. future year).
    const showDualSlots = resultatEditable || cell.resultat !== null;

    const navigationField: ValeurField =
      editingField ?? (resultatEditable ? 'resultat' : 'objectif');

    const onResultatEditingChange = useCallback((isEditing: boolean) => {
      setEditingField(isEditing ? 'resultat' : null);
    }, []);

    const onObjectifEditingChange = useCallback((isEditing: boolean) => {
      setEditingField(isEditing ? 'objectif' : null);
    }, []);

    const resultatField = (
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
        reserveSpace
      />
    );

    const objectifField = (
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
        reserveSpace={showDualSlots}
      />
    );

    if (showDualSlots) {
      return (
        <div
          className="relative flex h-full w-full py-1.5"
          data-test="indicateurs.grid.values-cell-dual"
        >
          <FieldSlot className="border-r border-grey-3">
            {resultatField}
          </FieldSlot>
          <FieldSlot>{objectifField}</FieldSlot>
        </div>
      );
    }

    return (
      <div className="relative flex h-full w-full items-center justify-center px-1.5">
        {objectifField}
      </div>
    );
  }
);

ValuesCell.displayName = 'ValuesCell';
