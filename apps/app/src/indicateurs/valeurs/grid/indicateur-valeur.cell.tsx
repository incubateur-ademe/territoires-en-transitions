'use client';

import { appLabels } from '@/app/labels/catalog';
import { CellContext } from '@tanstack/react-table';
import {
  IndicateurPeriod,
  IndicateurPeriods,
  IndicateurValeurType,
} from '@tet/domain/indicateurs';
import { cn, Input, TableCell, VisibleWhen } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { memo, ReactNode, useCallback } from 'react';
import { IndicateurValeurRequiseMarker } from './indicateur-valeur-requise.marker';
import { IndicateurValeurTypeBadge } from './indicateur-valeur-type.badge';
import { parseCellNumber } from './parse-cell-number';
import { SaveAck } from './save-ack';
import { IndicateurTableRow, PcaetIndicateurValeurType } from './types';
import { useCellEdit } from './use-cell-edit';
import { getTableMeta, IndicateurValeursTableFeatures } from './utils';

type IndicateurValeurCellProps = {
  cell: CellContext<
    IndicateurValeursTableFeatures,
    IndicateurTableRow,
    unknown
  >;
  indicateurValeurType: Extract<IndicateurValeurType, 'resultat' | 'objectif'>;
  period: IndicateurPeriod | null;
  isReadonly?: boolean;
  isRequired: boolean;
};

const fieldAriaLabel = (field: PcaetIndicateurValeurType): string =>
  field === 'resultat'
    ? capitalize(appLabels.indicateurResultat())
    : capitalize(appLabels.indicateurObjectif());

export const IndicateurValeurCell = memo(
  ({
    cell,
    indicateurValeurType,
    period,
    isReadonly = false,
    isRequired,
  }: IndicateurValeurCellProps): ReactNode => {
    const { indicateurId, indicateurValeurs, isApplicable } = cell.row.original;

    const periodKey = period === null ? null : IndicateurPeriods.key(period);
    const indicateurValeur =
      period === null
        ? undefined
        : indicateurValeurs.find(
            (valeur) =>
              valeur.periodicite === period.periodicite &&
              // Les dates historiques ne sont pas toutes au premier jour de la période.
              IndicateurPeriods.key(
                IndicateurPeriods.containing(
                  valeur.periodicite,
                  valeur.dateValeur
                )
              ) === periodKey
          );

    const currentValue = indicateurValeur?.[indicateurValeurType] ?? null;
    const updateIndicateurValeurs = getTableMeta(
      cell.table
    ).updateIndicateurValeurs;

    const persist = useCallback(
      (value: number | null) => {
        if (isReadonly || period === null) return Promise.resolve(false);
        return updateIndicateurValeurs({
          indicateurId,
          period,
          field: indicateurValeurType,
          value,
        });
      },
      [
        updateIndicateurValeurs,
        indicateurId,
        period,
        indicateurValeurType,
        isReadonly,
      ]
    );

    const edit = useCellEdit({
      currentValue,
      onSave: persist,
    });

    // Chaque sous-colonne se referme à droite : sans quoi le résultat et
    // l'objectif d'une même période, comme la référence qui n'a qu'un
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
          <div className="flex items-center gap-2 text-sm">
            <IndicateurValeurTypeBadge
              indicateurValeurType={indicateurValeurType}
            />
            {appLabels.pcaetDiagnosticValeurNonApplicable}
          </div>
        </TableCell>
      );
    }

    return (
      <TableCell
        data-field={indicateurValeurType}
        tabIndex={-1}
        className={cellClassName}
        aria-invalid={edit.status === 'error'}
        canEdit={!isReadonly && period !== null}
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
