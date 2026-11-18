'use client';

import type {
  SousIndicateurCell,
  SousIndicateurPeriodCells,
} from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import { IndicateurValeurTypeBadge } from '@/app/indicateurs/valeurs/grid/indicateur-valeur-type.badge';
import type { IndicateurValeurField } from '@/app/indicateurs/valeurs/grid/types';
import { appLabels } from '@/app/labels/catalog';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { Icon, Tooltip } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import type { JSX, PropsWithChildren } from 'react';

type FilledCell = Exclude<SousIndicateurCell, { status: 'empty' }>;

type FilledField = Readonly<{
  field: IndicateurValeurField;
  cell: FilledCell;
}>;

const HIDDEN_VALUE_MARK = '-';

const FIELDS: readonly IndicateurValeurField[] = ['resultat', 'objectif'];

const toFieldLabel = (field: IndicateurValeurField): string =>
  capitalize(
    field === 'resultat'
      ? appLabels.indicateurResultat()
      : appLabels.indicateurObjectif()
  );

const isFilled = (cell: SousIndicateurCell): cell is FilledCell =>
  cell.status !== 'empty';

const listFilledFields = (cells: SousIndicateurPeriodCells): FilledField[] =>
  FIELDS.flatMap((field) => {
    const cell = cells[field];
    return isFilled(cell) ? [{ field, cell }] : [];
  });

const MutedText = ({ children }: PropsWithChildren): JSX.Element => (
  <span className="text-sm text-grey-7">{children}</span>
);

const FilledCellContent = ({ cell }: { cell: FilledCell }): JSX.Element => {
  switch (cell.status) {
    case 'value':
      return <span>{toLocaleFixed(cell.valeur, 2)}</span>;
    case 'incomplete': {
      const label = appLabels.indicateurTotalIncomplet({
        filledCount: cell.filledCount,
        expectedCount: cell.expectedCount,
      });
      return (
        <Tooltip label={label}>
          <span>
            <Icon
              icon="error-warning-fill"
              size="sm"
              className="text-warning-1"
              aria-hidden
            />
            <span className="sr-only">{label}</span>
          </span>
        </Tooltip>
      );
    }
    case 'hidden':
      return (
        <>
          <span aria-hidden>{HIDDEN_VALUE_MARK}</span>
          <span className="sr-only">{appLabels.indicateurValeurMasquee}</span>
        </>
      );
  }
};

const FilledField = ({ field, cell }: FilledField): JSX.Element => (
  <span className="flex items-center gap-1">
    <span aria-hidden>
      <IndicateurValeurTypeBadge indicateurValeurType={field} />
    </span>
    <span className="sr-only">{toFieldLabel(field)}</span>
    <FilledCellContent cell={cell} />
  </span>
);

export const SousIndicateurYearCell = (
  cells: SousIndicateurPeriodCells
): JSX.Element => {
  const filledFields = listFilledFields(cells);
  if (filledFields.length === 0) {
    return <MutedText>{appLabels.indicateurValeurAbsente}</MutedText>;
  }
  return (
    <div className="flex items-center justify-center gap-4">
      {filledFields.map(({ field, cell }) => (
        <FilledField key={field} field={field} cell={cell} />
      ))}
    </div>
  );
};
