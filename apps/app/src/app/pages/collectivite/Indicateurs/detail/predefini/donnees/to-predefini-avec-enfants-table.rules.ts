import type { SousIndicateurTableRow } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import type {
  PeriodeTableCell,
  PeriodeTableRow,
} from '@/app/indicateurs/valeurs/periodes-table/periodes-table.types';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';

type TableParts = Readonly<{
  periodes: readonly IndicateurPeriode[];
  rows: readonly PeriodeTableRow[];
}>;

export const toPredefiniAvecEnfantsTable = ({
  valeursPropres,
  enfants,
}: {
  valeursPropres: TableParts;
  enfants: TableParts;
}): { periodes: IndicateurPeriode[]; rows: PeriodeTableRow[] } => ({
  periodes: IndicateurPeriodes.merge(valeursPropres.periodes, enfants.periodes),
  rows: [...valeursPropres.rows, ...enfants.rows],
});

const BLANK_CELL: PeriodeTableCell = {
  kind: 'contenu',
  content: null,
  isBold: false,
};

export const listGroupingRowKeys = (
  rows: readonly SousIndicateurTableRow[]
): ReadonlySet<string> =>
  new Set(
    rows
      .filter(
        ({ isExpandable, acceptsOwnValeurs }) =>
          isExpandable && acceptsOwnValeurs === false
      )
      .map(({ rowKey }) => rowKey)
  );

export const toBlankedGroupingRows = ({
  rows,
  groupingRowKeys,
}: {
  rows: readonly PeriodeTableRow[];
  groupingRowKeys: ReadonlySet<string>;
}): PeriodeTableRow[] =>
  rows.map((row) =>
    groupingRowKeys.has(row.key) ? { ...row, cellOf: () => BLANK_CELL } : row
  );
