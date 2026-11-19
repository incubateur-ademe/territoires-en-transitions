import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { SOUS_INDICATEURS_TOTAL_COLOR } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-colors';
import type {
  SousIndicateurCell,
  SousIndicateurPeriodCells,
  SousIndicateurRowCell,
  SousIndicateursTableData,
  SousIndicateurTableRow,
} from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import type {
  PeriodeTableCell,
  PeriodeTableRow,
} from '@/app/indicateurs/valeurs/periodes-table/periodes-table.types';
import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { uniqBy } from 'es-toolkit';
import Link from 'next/link';
import { SousIndicateurExpandToggle } from './sous-indicateur-expand.toggle';
import { SousIndicateurPeriodCell } from './sous-indicateur-period.cell';
import { SousIndicateurRowHeaderCell } from './sous-indicateur-row-header.cell';

const INDENTATION_REM_PER_DEPTH = 1.5;

const EMPTY_PERIOD_CELLS: SousIndicateurPeriodCells = {
  resultat: { status: 'empty' },
  objectif: { status: 'empty' },
};

const TOTAL_ROW_KEY = 'total';

const SAVE_UNAVAILABLE = (): Promise<boolean> => Promise.resolve(false);

const toPeriode = ({
  periodicite,
  dateValeur,
}: {
  periodicite: IndicateurPeriodicite;
  dateValeur: string;
}): IndicateurPeriode => IndicateurPeriodes.containing(periodicite, dateValeur);

const toValeurOrUndefined = (
  cell: SousIndicateurCell
): number | null | undefined => {
  switch (cell.status) {
    case 'value':
      return cell.valeur;
    case 'empty':
      return null;
    case 'incomplete':
    case 'hidden':
      return undefined;
  }
};

const toCellsOfPeriode = ({
  cells,
  periode,
  periodicite,
}: {
  cells: readonly SousIndicateurRowCell[];
  periode: IndicateurPeriode;
  periodicite: IndicateurPeriodicite;
}): SousIndicateurPeriodCells =>
  cells.find(
    ({ dateValeur }) =>
      IndicateurPeriodes.key(toPeriode({ periodicite, dateValeur })) ===
      IndicateurPeriodes.key(periode)
  ) ?? EMPTY_PERIOD_CELLS;

const toLeafCell = ({
  cells,
  indicateurId,
}: {
  cells: SousIndicateurPeriodCells;
  indicateurId: number;
}): PeriodeTableCell | null => {
  const resultat = toValeurOrUndefined(cells.resultat);
  const objectif = toValeurOrUndefined(cells.objectif);
  if (resultat === undefined || objectif === undefined) {
    return null;
  }
  return {
    kind: 'valeurs',
    resultat,
    objectif,
    isReadonly: true,
    emptyLabel: appLabels.indicateurValeurAbsente,
    dataSource: String(indicateurId),
  };
};

const toContentCell = ({
  cells,
  isBold,
}: {
  cells: SousIndicateurPeriodCells;
  isBold: boolean;
}): PeriodeTableCell => ({
  kind: 'contenu',
  content: <SousIndicateurPeriodCell {...cells} />,
  isBold,
});

const toTotalRow = ({
  data,
  periodicite,
}: {
  data: SousIndicateursTableData;
  periodicite: IndicateurPeriodicite;
}): PeriodeTableRow => ({
  key: TOTAL_ROW_KEY,
  title: (
    <SousIndicateurRowHeaderCell color={SOUS_INDICATEURS_TOTAL_COLOR} isBold>
      {appLabels.indicateurSousIndicateursTotalSomme}
    </SousIndicateurRowHeaderCell>
  ),
  cellOf: (periode) =>
    toContentCell({
      cells: toCellsOfPeriode({
        cells: data.totalCells,
        periode,
        periodicite,
      }),
      isBold: true,
    }),
  onSave: SAVE_UNAVAILABLE,
});

const toSousIndicateurRow = ({
  row,
  periodicite,
  collectiviteId,
  isExpanded,
  onToggle,
}: {
  row: SousIndicateurTableRow;
  periodicite: IndicateurPeriodicite;
  collectiviteId: number;
  isExpanded: boolean;
  onToggle: () => void;
}): PeriodeTableRow => ({
  key: row.rowKey,
  title: (
    <SousIndicateurRowHeaderCell
      color={row.color}
      indentationRem={row.depth * INDENTATION_REM_PER_DEPTH}
      toggle={
        row.isExpandable ? (
          <SousIndicateurExpandToggle
            label={row.label}
            isExpanded={isExpanded}
            onToggle={onToggle}
          />
        ) : null
      }
    >
      <Link
        className="text-primary-9 underline"
        href={makeCollectiviteIndicateursUrl({
          collectiviteId,
          indicateurView: 'perso',
          indicateurId: row.indicateurId,
        })}
      >
        {row.label}
      </Link>{' '}
      <span className="sr-only">
        {appLabels.indicateurSousIndicateurNiveau({ niveau: row.depth + 1 })}
      </span>
    </SousIndicateurRowHeaderCell>
  ),
  cellOf: (periode) => {
    const cells = toCellsOfPeriode({ cells: row.cells, periode, periodicite });
    const leafCell = row.isExpandable
      ? null
      : toLeafCell({ cells, indicateurId: row.indicateurId });
    return leafCell ?? toContentCell({ cells, isBold: false });
  },
  onSave: SAVE_UNAVAILABLE,
});

export const toSousIndicateurTable = ({
  data,
  visibleRows,
  periodicite,
  collectiviteId,
  isExpanded,
  onToggle,
}: {
  data: SousIndicateursTableData;
  visibleRows: readonly SousIndicateurTableRow[];
  periodicite: IndicateurPeriodicite;
  collectiviteId: number;
  isExpanded: (rowKey: string) => boolean;
  onToggle: (rowKey: string) => void;
}): { periodes: IndicateurPeriode[]; rows: PeriodeTableRow[] } => ({
  periodes: uniqBy(
    data.columns.map(({ dateValeur }) =>
      toPeriode({ periodicite, dateValeur })
    ),
    (periode) => IndicateurPeriodes.key(periode)
  ),
  rows: [
    ...(data.hasTotalRow ? [toTotalRow({ data, periodicite })] : []),
    ...visibleRows.map((row) =>
      toSousIndicateurRow({
        row,
        periodicite,
        collectiviteId,
        isExpanded: isExpanded(row.rowKey),
        onToggle: () => onToggle(row.rowKey),
      })
    ),
  ],
});
