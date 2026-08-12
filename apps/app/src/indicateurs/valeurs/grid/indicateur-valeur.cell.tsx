'use client';

import { appLabels } from '@/app/labels/catalog';
import { cn, Input, TableCell } from '@tet/ui';
import { memo, ReactNode, useState } from 'react';
import {
  CellReferenceMarker,
  CellReferences,
  type ReferencesVariant,
} from './cell-references';
import { IndicateurValueTypeBadge } from './indicateur-valeur-type.badge';
import {
  CELL_ID_ATTRIBUTE,
  generateNavCellKey,
  GridCell,
  IndicateurId,
  ValeurField,
  Year,
} from './types';

type IndicateurValeurCellProps = {
  cell: GridCell;
  field: ValeurField;
  indicateurId: IndicateurId;
  year: Year;
  /** Valeur consultable seulement : rendue dans un champ désactivé. */
  isReadonly?: boolean;
  /** Présentation des constats extérieurs : liste sous la valeur, ou coin replié. */
  referencesVariant?: ReferencesVariant;
};

const fieldAriaLabel = (field: ValeurField): string =>
  field === 'resultat'
    ? appLabels.indicateurLegendeResultat
    : appLabels.indicateurLegendeObjectif;

export const IndicateurValeurCell = memo(
  ({
    cell,
    field,
    indicateurId,
    year,
    isReadonly = false,
    referencesVariant = 'compact',
  }: IndicateurValeurCellProps): ReactNode => {
    const [value, setValue] = useState(
      field === 'resultat' ? cell.resultat : cell.objectif
    );
    const cellId = generateNavCellKey(indicateurId, year, field);
    // Les sources extérieures ne publient que des constats : leurs valeurs
    // n'ont leur place qu'en regard du résultat.
    const references =
      field === 'resultat' && cell.references !== undefined
        ? cell.references
        : [];
    const marker =
      referencesVariant === 'compact' ? (
        <CellReferenceMarker references={references} />
      ) : null;
    const list =
      referencesVariant === 'list' ? (
        <CellReferences references={references} />
      ) : null;
    const cellClassName = cn(
      'relative border-b border-grey-3 whitespace-nowrap',
      field === 'objectif' ? 'border-r border-grey-3' : undefined
    );

    // En lecture seule, la valeur reste affichée dans un champ désactivé :
    // l'utilisateur voit que la donnée existe et qu'elle n'est pas modifiable,
    // au lieu d'un texte qui laisse croire qu'un clic ouvrirait la saisie.
    if (isReadonly) {
      return (
        <TableCell
          {...{ [CELL_ID_ATTRIBUTE]: cellId }}
          data-field={field}
          tabIndex={-1}
          className={cellClassName}
        >
          {marker}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <IndicateurValueTypeBadge field={field} />
              <Input
                type="number"
                numType="float"
                inputMode="decimal"
                containerClassname="grow border-none"
                disabled
                value={value?.toString() ?? ''}
                aria-label={fieldAriaLabel(field)}
                onChange={() => undefined}
              />
            </div>
            {list}
          </div>
        </TableCell>
      );
    }

    return (
      <TableCell
        {...{ [CELL_ID_ATTRIBUTE]: cellId }}
        data-field={field}
        tabIndex={-1}
        className={cellClassName}
        canEdit
        edit={{
          renderOnEdit: ({ openState }) => (
            <Input
              type="number"
              numType="float"
              inputMode="decimal"
              containerClassname="grow border-none"
              autoFocus
              value={value?.toString() ?? ''}
              aria-label={fieldAriaLabel(field)}
              onChange={(e) => {
                const raw = e.target.value;
                setValue(raw === '' ? null : parseFloat(raw));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  openState.setIsOpen(false);
                }
              }}
            />
          ),
        }}
      >
        {marker}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <IndicateurValueTypeBadge field={field} />
            {value?.toString()}
          </div>
          {list}
        </div>
      </TableCell>
    );
  }
);

IndicateurValeurCell.displayName = 'IndicateurValeurCell';
