import {
  ColumnFiltersState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  Table as ReactTable,
  RowData,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  ActionType,
  ActionTypeEnum,
  filterActionsBy,
  ReferentielId,
} from '@tet/domain/referentiels';
import { divisionOrZero } from '@tet/domain/utils';
import { cn, Table, TableCell, TableHead, TableLoading, TableRow } from '@tet/ui';
import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import { useSidePanel } from '../../ui/layout/side-panel/side-panel.context';
import { ActionListItem } from '../actions/use-list-actions';
import { useListActionsGroupedById } from '../actions/use-list-actions-grouped-by-id';
import { useReferentielId } from '../referentiel-context';
import { ReferentielTableFiltersForm } from './referentiel-table.filters.form';
import { getTextFilterFn } from './referentiel-table.filters.utils';
import {
  ReferentielTableKeyboardProps,
  useTableKeyboard,
} from './referentiel-table.keyboard';
import { ReferentielTablePointsCell } from './referentiel-table.points.cell';
import { useGetReferentielTableFiltersState } from './use-get-referentiel-table-filters-state';
import { useListReferentielTableColumns } from './use-list-referentiel-table-columns';
import { useReferentielTableColumnVisibility } from './use-referentiel-table-column-visibility';
import { rowClassNameByActionType } from './utils';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    referentielId?: ReferentielId;
  }
}

const TYPES_EXPANDED_BY_DEFAULT = new Set<ActionType>([
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
]);

export function ReferentielTableWithData() {
  const referentielId = useReferentielId();
  const filtersState = useGetReferentielTableFiltersState();
  const columnVisibility = useReferentielTableColumnVisibility();

  const [{ data: actions = {}, isPending }] = useListActionsGroupedById({
    referentielIds: [referentielId],
  });

  return (
    <div className="flex flex-col gap-4">
      <ReferentielTableFiltersForm
        filtersState={filtersState}
        columnVisibility={columnVisibility}
      />

      <ReferentielTable
        key={`${actions.length}-${isPending}`}
        actions={actions}
        referentielId={referentielId}
        isPending={isPending}
        filtersState={filtersState}
        columnVisibility={columnVisibility.columnVisibility}
      />
    </div>
  );
}

function ReferentielTable({
  actions,
  referentielId,
  isPending,
  filtersState,
  columnVisibility,
}: {
  actions: Record<string, ActionListItem>;
  referentielId: ReferentielId;
  isPending: boolean;
  filtersState: ReturnType<typeof useGetReferentielTableFiltersState>;
  columnVisibility: VisibilityState;
}) {
  const collectiviteId = useCollectiviteId();

  const { filters, hasActiveFilters } = filtersState;

  const recordOfAxesAndSousAxes = filterActionsBy(actions, (action) =>
    TYPES_EXPANDED_BY_DEFAULT.has(action.actionType)
  );

  const defaultExpanded = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(recordOfAxesAndSousAxes).map(([id]) => [id, true])
      ),
    [recordOfAxesAndSousAxes]
  );

  const [expanded, setExpanded] = useState<ExpandedState>(defaultExpanded);

  const axes = useMemo(() => {
    const referentiel = actions[referentielId];
    return referentiel?.childrenIds.map((id) => actions[id]) ?? [];
  }, [actions, referentielId]);

  const getSubRows = useCallback(
    (row: ActionListItem) => row.childrenIds.map((id) => actions[id]),
    [actions]
  );

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const result: ColumnFiltersState = [];
    if (filters.statuts.length > 0) {
      result.push({ id: 'statut', value: filters.statuts });
    }
    if (filters.pilotes.length > 0) {
      result.push({ id: 'pilotes', value: filters.pilotes });
    }
    if (filters.services.length > 0) {
      result.push({ id: 'services', value: filters.services });
    }
    return result;
  }, [filters.statuts, filters.pilotes, filters.services]);

  const effectiveExpanded = filters.statuts.length > 0 ? true : expanded;

  const tableState = useMemo(
    () => ({
      expanded: effectiveExpanded,
      columnFilters,
      columnVisibility,
      ...(filters.text ? { globalFilter: filters.text } : {}),
    }),
    [effectiveExpanded, columnFilters, columnVisibility, filters.text]
  );

  const tableMeta = useMemo(
    () => ({ collectiviteId, referentielId }),
    [collectiviteId, referentielId]
  );

  const { columns } = useListReferentielTableColumns(actions);

  const table = useReactTable({
    columns,
    data: axes,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows,
    getRowId: (row) => row.actionId,
    state: tableState,
    onExpandedChange: setExpanded,
    filterFromLeafRows: true,
    globalFilterFn: getTextFilterFn,
    meta: tableMeta,
  });

  const keyboard = useTableKeyboard(table, [expanded, axes]);

  if (isPending) {
    return <ReferentielTableLoading table={table} />;
  }

  const isEmpty = table.getRowModel().rows.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-96 flex items-center justify-center text-grey-7 bg-white rounded-xl border border-grey-3">
        {hasActiveFilters
          ? 'Aucun résultat ne correspond aux filtres sélectionnés'
          : 'Une erreur est survenue lors de la récupération des données'}
      </div>
    );
  }

  return <TableContent table={table} keyboard={keyboard} />;
}

function TableContent({
  table,
  keyboard,
}: {
  table: ReactTable<ActionListItem>;
  keyboard: ReferentielTableKeyboardProps;
}) {
  const rows = table.getRowModel().rows;

  return (
    <TableWrapper table={table} keyboard={keyboard}>
      {rows.map((row) => (
        <TableRow
          key={row.id}
          data-action-type={row.original.actionType}
          className={cn(
            'text-sm',
            rowClassNameByActionType[row.original.actionType]
          )}
        >
          {row.getVisibleCells().map((cell) => (
            <React.Fragment key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </React.Fragment>
          ))}
        </TableRow>
      ))}
      <TableTotalRow table={table} />
    </TableWrapper>
  );
}

// Identifiants des colonnes à sommer (les pourcentages sont recalculés
// à partir des totaux car sommer des pourcentages n'a pas de sens).
const SUMMABLE_COLUMN_IDS = [
  'pointPotentiel',
  'pointReferentiel',
  'pointNonRenseigne',
  'pointFait',
  'pointProgramme',
  'pointPasFait',
] as const;

type SummableColumnId = (typeof SUMMABLE_COLUMN_IDS)[number];

function TableTotalRow({ table }: { table: ReactTable<ActionListItem> }) {
  // On somme uniquement les lignes de premier niveau (axes) du modèle filtré :
  // leurs scores sont déjà agrégés sur toute la descendance, ce qui évite
  // tout double comptage via les sous-lignes dépliées.
  const topLevelRows = table.getFilteredRowModel().rows;

  const totals = useMemo(() => {
    const initial = Object.fromEntries(
      SUMMABLE_COLUMN_IDS.map((id) => [id, 0])
    ) as Record<SummableColumnId, number>;

    return topLevelRows.reduce((acc, row) => {
      const score = row.original.score;
      for (const id of SUMMABLE_COLUMN_IDS) {
        acc[id] += score[id] ?? 0;
      }
      return acc;
    }, initial);
  }, [topLevelRows]);

  const valuesById: Record<string, { value: number; percentage?: boolean }> = {
    pointPotentiel: { value: totals.pointPotentiel },
    pointReferentiel: { value: totals.pointReferentiel },
    pointNonRenseigne: { value: totals.pointNonRenseigne },
    pointFait: { value: totals.pointFait },
    pointProgramme: { value: totals.pointProgramme },
    pointPasFait: { value: totals.pointPasFait },
    scoreRealise: {
      value: divisionOrZero(totals.pointFait, totals.pointPotentiel),
      percentage: true,
    },
    scoreProgramme: {
      value: divisionOrZero(totals.pointProgramme, totals.pointPotentiel),
      percentage: true,
    },
    scorePasFait: {
      value: divisionOrZero(totals.pointPasFait, totals.pointPotentiel),
      percentage: true,
    },
  };

  const visibleColumns = table.getVisibleLeafColumns();

  return (
    <TableRow className="text-sm !bg-white font-medium text-primary-9 [&_td]:border-t [&_td]:border-grey-3">
      {visibleColumns.map((column, index) => {
        const total = valuesById[column.id];
        if (total) {
          return (
            <ReferentielTablePointsCell
              key={column.id}
              value={total.value}
              percentage={total.percentage}
            />
          );
        }
        if (index === 0) {
          return (
            <TableCell key={column.id} tabIndex={-1} className="font-bold">
              TOTAL
            </TableCell>
          );
        }
        return <TableCell key={column.id} tabIndex={-1} />;
      })}
    </TableRow>
  );
}

function TableWrapper({
  children,
  table,
  keyboard,
}: {
  children: ReactNode;
  table: ReactTable<ActionListItem>;
  keyboard?: ReferentielTableKeyboardProps;
}) {
  const { panel } = useSidePanel();

  const tableHeaderRow = table
    .getHeaderGroups()
    .map((headerGroup) =>
      headerGroup.headers.map((header) => (
        <React.Fragment key={header.id}>
          {flexRender(header.column.columnDef.header, header.getContext())}
        </React.Fragment>
      ))
    );

  return (
    <>
      <div
        ref={keyboard?.scrollContainerRef}
        className={cn(
          'bg-white rounded-xl border border-grey-3 overflow-x-scroll',
          !panel.isOpen &&
            '2xl:-ml-[calc((100vw-4rem-1440px+3rem)/2)] 2xl:w-[calc(100vw-4rem)]'
        )}
      >
        <div className="sticky left-0 top-0 bg-white px-4 py-2 border-b border-grey-3 text-xs text-grey-7">
          Raccourcis clavier :{' '}
          <span className="font-bold font-mono">Flèches ↑ ↓ ← →</span> pour
          naviguer entre cellules,{' '}
          <span className="font-bold font-mono">Entrée</span> pour éditer,{' '}
          <span className="font-bold font-mono">Espace</span> pour
          développer/réduire.
        </div>
        <Table
          ref={keyboard?.tableRef}
          className="ref-table border-separate border-spacing-0"
          onKeyDownCapture={keyboard?.onKeyDownCapture}
          onFocusCapture={keyboard?.onFocusCapture}
        >
          <TableHead className="z-40">
            <TableRow>{tableHeaderRow}</TableRow>
          </TableHead>
          <tbody>{children}</tbody>
        </Table>
      </div>
    </>
  );
}

function ReferentielTableLoading({
  table,
}: {
  table: ReactTable<ActionListItem>;
}) {
  return (
    <TableWrapper table={table}>
      <TableLoading columnIds={table.getAllColumns().map((col) => col.id)} />
    </TableWrapper>
  );
}
