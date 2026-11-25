import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import type { RenameSousIndicateur } from '@/app/indicateurs/sous-indicateurs/data/use-rename-sous-indicateur';
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
import type { SaveSousIndicateurValeur } from '@/app/indicateurs/sous-indicateurs/data/use-save-sous-indicateur-valeur';
import type { IndicateurValeurField } from '@/app/indicateurs/valeurs/grid/types';
import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { uniqBy } from 'es-toolkit';
import { SousIndicateurDetachButton } from './sous-indicateur-detach.button';
import { SousIndicateurOpenLink } from './sous-indicateur-open.link';
import { SousIndicateurNameEditor } from './sous-indicateur-name.editor';
import { SousIndicateurExpandToggle } from './sous-indicateur-expand.toggle';
import { SousIndicateurPeriodCell } from './sous-indicateur-period.cell';
import { SousIndicateurRowHeaderCell } from './sous-indicateur-row-header.cell';

export type DetachTarget = Readonly<{ indicateurId: number; label: string }>;

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

const isFilled = (cell: SousIndicateurCell): boolean => cell.status !== 'empty';

const mergeCells = (
  cellsOfPeriode: readonly SousIndicateurRowCell[]
): SousIndicateurPeriodCells => ({
  resultat:
    cellsOfPeriode.map(({ resultat }) => resultat).find(isFilled) ??
    EMPTY_PERIOD_CELLS.resultat,
  objectif:
    cellsOfPeriode.map(({ objectif }) => objectif).find(isFilled) ??
    EMPTY_PERIOD_CELLS.objectif,
});

const toCellsOfPeriode = ({
  cells,
  periode,
  periodicite,
}: {
  cells: readonly SousIndicateurRowCell[];
  periode: IndicateurPeriode;
  periodicite: IndicateurPeriodicite;
}): SousIndicateurPeriodCells =>
  mergeCells(
    cells.filter(
      ({ dateValeur }) =>
        IndicateurPeriodes.key(toPeriode({ periodicite, dateValeur })) ===
        IndicateurPeriodes.key(periode)
    )
  );

const findDateOfFilledValeur = ({
  cells,
  periode,
  periodicite,
  field,
}: {
  cells: readonly SousIndicateurRowCell[];
  periode: IndicateurPeriode;
  periodicite: IndicateurPeriodicite;
  field: IndicateurValeurField;
}): string | undefined =>
  cells.find(
    (cell) =>
      cell[field].status === 'value' &&
      IndicateurPeriodes.key(
        toPeriode({ periodicite, dateValeur: cell.dateValeur })
      ) === IndicateurPeriodes.key(periode)
  )?.dateValeur;

const toLeafCell = ({
  cells,
  indicateurId,
  isReadonly,
}: {
  cells: SousIndicateurPeriodCells;
  indicateurId: number;
  isReadonly: boolean;
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
    isReadonly,
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
  isHighlighted: true,
  title: (
    <SousIndicateurRowHeaderCell color={SOUS_INDICATEURS_TOTAL_COLOR} isBold>
      <span className="text-primary-9">
        {appLabels.indicateurSousIndicateursTotalSomme}
      </span>
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
  isReadonly,
  saveValeur,
  onRequestDetach,
  renameSousIndicateur,
  isNameFocused,
  onNameEditingEnd,
  isExpanded,
  onToggle,
  hasExtraRows,
  parentValeursAreComputed,
}: {
  row: SousIndicateurTableRow;
  periodicite: IndicateurPeriodicite;
  collectiviteId: number;
  isReadonly: boolean;
  saveValeur: SaveSousIndicateurValeur;
  onRequestDetach: ((target: DetachTarget) => void) | undefined;
  renameSousIndicateur: RenameSousIndicateur | undefined;
  isNameFocused: boolean;
  onNameEditingEnd: () => void;
  isExpanded: boolean;
  onToggle: () => void;
  hasExtraRows: boolean;
  parentValeursAreComputed: boolean;
}): PeriodeTableRow => {
  const hasReadonlyValeurs =
    row.isExpandable &&
    (parentValeursAreComputed || row.acceptsOwnValeurs === false);
  return {
    key: row.rowKey,
    title: (
      <SousIndicateurRowHeaderCell
        color={row.color}
        indentationRem={row.depth * INDENTATION_REM_PER_DEPTH}
        toggle={
          row.isExpandable || hasExtraRows ? (
            <SousIndicateurExpandToggle
              label={row.label}
              isExpanded={isExpanded}
              onToggle={onToggle}
            />
          ) : (
            <span aria-hidden />
          )
        }
        actions={
          <>
            {onRequestDetach && (
              <SousIndicateurDetachButton
                label={row.label}
                onDetach={() =>
                  onRequestDetach({
                    indicateurId: row.indicateurId,
                    label: row.label,
                  })
                }
              />
            )}
            <SousIndicateurOpenLink
              label={row.label}
              href={makeCollectiviteIndicateursUrl({
                collectiviteId,
                indicateurView: 'perso',
                indicateurId: row.indicateurId,
              })}
            />
          </>
        }
      >
        <SousIndicateurNameEditor
          label={row.label}
          shouldEdit={isNameFocused}
          onRename={
            renameSousIndicateur
              ? (titre) =>
                  renameSousIndicateur({
                    indicateurId: row.indicateurId,
                    titre,
                  })
              : undefined
          }
          onEditingEnd={onNameEditingEnd}
        />{' '}
        <span className="sr-only">
          {appLabels.indicateurSousIndicateurNiveau({ niveau: row.depth + 1 })}
        </span>
      </SousIndicateurRowHeaderCell>
    ),
    cellOf: (periode) => {
      const cells = toCellsOfPeriode({
        cells: row.cells,
        periode,
        periodicite,
      });
      const leafCell = hasReadonlyValeurs
        ? null
        : toLeafCell({
            cells,
            indicateurId: row.indicateurId,
            isReadonly,
          });
      return leafCell ?? toContentCell({ cells, isBold: false });
    },
    onSave: hasReadonlyValeurs
      ? SAVE_UNAVAILABLE
      : (periode, field, value) =>
          saveValeur({
            indicateurId: row.indicateurId,
            periode,
            dateValeur: findDateOfFilledValeur({
              cells: row.cells,
              periode,
              periodicite,
              field,
            }),
            field,
            value,
          }),
  };
};

export const toSousIndicateurTable = ({
  data,
  hasTotalRow,
  visibleRows,
  periodicite,
  collectiviteId,
  isReadonly,
  saveValeur,
  requestDetachSousIndicateur,
  renameSousIndicateur,
  focusedNameIndicateurId,
  onNameEditingEnd,
  isExpanded,
  onToggle,
  extraRows,
  parentValeursAreComputed = true,
}: {
  data: SousIndicateursTableData;
  hasTotalRow: boolean;
  visibleRows: readonly SousIndicateurTableRow[];
  periodicite: IndicateurPeriodicite;
  collectiviteId: number;
  isReadonly: boolean;
  saveValeur: SaveSousIndicateurValeur;
  requestDetachSousIndicateur: ((target: DetachTarget) => void) | undefined;
  renameSousIndicateur: RenameSousIndicateur | undefined;
  focusedNameIndicateurId: number | null;
  onNameEditingEnd: () => void;
  isExpanded: (rowKey: string) => boolean;
  onToggle: (rowKey: string) => void;
  extraRows?: (row: SousIndicateurTableRow) => readonly PeriodeTableRow[];
  parentValeursAreComputed?: boolean;
}): { periodes: IndicateurPeriode[]; rows: PeriodeTableRow[] } => ({
  periodes: uniqBy(
    data.columns.map(({ dateValeur }) =>
      toPeriode({ periodicite, dateValeur })
    ),
    (periode) => IndicateurPeriodes.key(periode)
  ),
  rows: [
    ...(hasTotalRow ? [toTotalRow({ data, periodicite })] : []),
    ...visibleRows.flatMap((row) => {
      const rowExtraRows = extraRows?.(row) ?? [];
      const isRowExpanded = isExpanded(row.rowKey);
      return [
        toSousIndicateurRow({
          row,
          periodicite,
          collectiviteId,
          isReadonly,
          saveValeur,
          onRequestDetach: requestDetachSousIndicateur,
          renameSousIndicateur,
          isNameFocused: row.indicateurId === focusedNameIndicateurId,
          onNameEditingEnd,
          isExpanded: isRowExpanded,
          onToggle: () => onToggle(row.rowKey),
          hasExtraRows: rowExtraRows.length > 0,
          parentValeursAreComputed,
        }),
        ...(isRowExpanded ? rowExtraRows : []),
      ];
    }),
  ],
});

export const hasValeursOnPeriode = ({
  data,
  periode,
  periodicite,
  withOwnValeursOnParentRows = false,
}: {
  data: SousIndicateursTableData;
  periode: IndicateurPeriode;
  periodicite: IndicateurPeriodicite;
  withOwnValeursOnParentRows?: boolean;
}): boolean =>
  data.rows
    .filter((row) => withOwnValeursOnParentRows || !row.isExpandable)
    .some((row) => {
      const { resultat, objectif } = toCellsOfPeriode({
        cells: row.cells,
        periode,
        periodicite,
      });
      return resultat.status === 'value' || objectif.status === 'value';
    });
