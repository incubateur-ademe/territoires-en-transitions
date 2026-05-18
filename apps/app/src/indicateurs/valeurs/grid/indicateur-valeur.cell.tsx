'use client';

import { appLabels } from '@/app/labels/catalog';
import { cn, Input, TableCell } from '@tet/ui';
import { memo, ReactNode, useState } from 'react';
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
};

export const IndicateurValeurCell = memo(
  ({
    cell,
    field,
    indicateurId,
    year,
  }: IndicateurValeurCellProps): ReactNode => {
    const [value, setValue] = useState(
      field === 'resultat' ? cell.resultat : cell.objectif
    );
    const cellId = generateNavCellKey(indicateurId, year, field);

    return (
      <TableCell
        {...{ [CELL_ID_ATTRIBUTE]: cellId }}
        data-field={field}
        tabIndex={-1}
        className={cn(
          'border-b border-grey-3',
          field === 'objectif'
            ? 'whitespace-nowrap border-r border-grey-3'
            : 'whitespace-nowrap'
        )}
        canEdit
        edit={{
          renderOnEdit: ({ openState }) => (
            <Input
              type="number"
              inputMode="decimal"
              containerClassname="grow border-none"
              autoFocus
              value={value?.toString() ?? ''}
              aria-label={
                field === 'resultat'
                  ? appLabels.indicateurLegendeResultat
                  : appLabels.indicateurLegendeObjectif
              }
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
        <div className="flex items-center gap-2">
          <IndicateurValueTypeBadge field={field} />
          {value?.toString()}
        </div>
      </TableCell>
    );
  }
);

IndicateurValeurCell.displayName = 'IndicateurValeurCell';
