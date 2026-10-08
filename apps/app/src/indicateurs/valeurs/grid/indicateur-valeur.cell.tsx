'use client';

import { appLabels } from '@/app/labels/catalog';
import { CellContext } from '@tanstack/react-table';
import { getYearFromIsoDate } from '@tet/domain/indicateurs';
import { cn, TableCell, VisibleWhen } from '@tet/ui';
import { memo, ReactNode, useCallback } from 'react';
import { IndicateurValeurRequiseMarker } from './indicateur-valeur-requise.marker';
import {
  IndicateurValeurContent,
  IndicateurValeurInput,
} from './indicateur-valeur.field';
import { parseCellNumber } from './parse-cell-number';
import { SaveAck } from './save-ack';
import { IndicateurTableRow, IndicateurValeurField } from './types';
import { useCellEdit } from './use-cell-edit';
import { getTableMeta, IndicateurValeursTableFeatures } from './utils';

type IndicateurValeurCellProps = {
  cell: CellContext<
    IndicateurValeursTableFeatures,
    IndicateurTableRow,
    unknown
  >;
  indicateurValeurType: IndicateurValeurField;
  year: number;
  isReadonly?: boolean;
};

export const IndicateurValeurCell = memo(
  ({
    cell,
    indicateurValeurType,
    year,
    isReadonly = false,
  }: IndicateurValeurCellProps): ReactNode => {
    const { indicateurId, indicateurValeurs, optionalYears, isApplicable } =
      cell.row.original;
    // Un indicateur non applicable ne réclame plus rien : le marqueur de
    // valeur requise disparaît avec la saisie.
    const isRequired =
      isApplicable && optionalYears !== 'all' && !optionalYears?.includes(year);

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

    if (!isApplicable) {
      return (
        <TableCell
          data-field={indicateurValeurType}
          tabIndex={-1}
          className={cn(cellClassName, 'bg-grey-1 text-grey-6')}
          canEdit={false}
        >
          <IndicateurValeurContent
            type={indicateurValeurType}
            className="text-sm"
          >
            {appLabels.pcaetDiagnosticValeurNonApplicable}
          </IndicateurValeurContent>
        </TableCell>
      );
    }

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
            <IndicateurValeurInput
              type={indicateurValeurType}
              edit={edit}
              isRequired={isRequired}
              onCommit={() => openState.setIsOpen(false)}
              onCancel={() => openState.setIsOpen(false)}
            />
          ),
        }}
      >
        {edit.status === 'saved' ? <SaveAck /> : null}
        <div className="flex flex-col ">
          <IndicateurValeurContent type={indicateurValeurType}>
            {edit.text}
            <VisibleWhen condition={isRequired && displayedValue === null}>
              <IndicateurValeurRequiseMarker />
            </VisibleWhen>
          </IndicateurValeurContent>
        </div>
      </TableCell>
    );
  }
);

IndicateurValeurCell.displayName = 'IndicateurValeurCell';
