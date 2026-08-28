'use client';

import { appLabels } from '@/app/labels/catalog';
import { CellContext } from '@tanstack/react-table';
import {
  getYearFromIsoDate,
  IndicateurValeurType,
} from '@tet/domain/indicateurs';
import { Input, TableCell, VisibleWhen } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { memo, ReactNode, useCallback } from 'react';
import { IndicateurValeurRequiseMarker } from './indicateur-valeur-requise.marker';
import { IndicateurValeurTypeBadge } from './indicateur-valeur-type.badge';
import { parseCellNumber } from './parse-cell-number';
import { SaveAck } from './save-ack';
import { IndicateurTableRow, PcaetIndicateurValeurType } from './types';
import { useCellEdit } from './use-cell-edit';
import { getTableMeta } from './utils';

type IndicateurValeurCellProps = {
  cell: CellContext<IndicateurTableRow, unknown>;
  indicateurValeurType: Extract<IndicateurValeurType, 'resultat' | 'objectif'>;
  year: number;
  isReadonly?: boolean;
};

const fieldAriaLabel = (field: PcaetIndicateurValeurType): string =>
  field === 'resultat'
    ? capitalize(appLabels.indicateurResultat())
    : capitalize(appLabels.indicateurObjectif());

export const IndicateurValeurCell = memo(
  ({
    cell,
    indicateurValeurType,
    year,
    isReadonly = false,
  }: IndicateurValeurCellProps): ReactNode => {
    const { indicateurId, indicateurValeurs, optionalYears } =
      cell.row.original;
    const isRequired =
      optionalYears !== 'all' && !optionalYears?.includes(year);

    const indicateurValeur = indicateurValeurs.find(
      (indicateurValeur) =>
        getYearFromIsoDate(indicateurValeur.dateValeur) === year
    );

    const currentValue = indicateurValeur?.[indicateurValeurType] ?? null;
    const updateIndicateurValeurs = getTableMeta(
      cell.table
    ).updateIndicateurValeurs;

    const persist = useCallback(
      (value: number | null) =>
        updateIndicateurValeurs({
          indicateurId,
          year,
          field: indicateurValeurType,
          value,
        }),
      [updateIndicateurValeurs, indicateurId, year, indicateurValeurType]
    );

    const edit = useCellEdit({
      currentValue,
      onSave: persist,
    });

    // Chaque sous-colonne se referme à droite : sans quoi le résultat et
    // l'objectif d'une même année, comme l'année de référence qui n'a qu'un
    // résultat, se touchaient sans séparateur.
    const cellClassName =
      'relative border-b border-r border-grey-3 whitespace-nowrap';
    const displayedValue = parseCellNumber(edit.text);

    return (
      <TableCell
        data-field={indicateurValeurType}
        tabIndex={-1}
        className={cellClassName}
        aria-invalid={edit.status === 'error'}
        canEdit={!isReadonly}
        edit={{
          onClose: () => {
            void edit.save();
          },
          renderOnEdit: ({ openState }) => (
            <Input
              type="number"
              numType="float"
              inputMode="decimal"
              autoFocus
              containerClassname="grow border-none"
              aria-label={fieldAriaLabel(indicateurValeurType)}
              aria-invalid={edit.status === 'error'}
              aria-required={isRequired}
              value={edit.text}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => edit.onChange(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  openState.setIsOpen(false);
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  edit.cancel();
                  openState.setIsOpen(false);
                }
              }}
            />
          ),
        }}
      >
        {edit.status === 'saved' ? <SaveAck /> : null}
        <div className="flex flex-col ">
          <div className="flex items-center gap-2">
            <IndicateurValeurTypeBadge
              indicateurValeurType={indicateurValeurType}
            />
            {edit.text}
            <VisibleWhen condition={isRequired && displayedValue === null}>
              <IndicateurValeurRequiseMarker />
            </VisibleWhen>
          </div>
        </div>
      </TableCell>
    );
  }
);

IndicateurValeurCell.displayName = 'IndicateurValeurCell';
