import {
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  Table as ReactTable,
  RowData,
  useReactTable,
} from '@tanstack/react-table';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  ActionType,
  ActionTypeEnum,
  filterActionsBy,
  ReferentielId,
} from '@tet/domain/referentiels';
import { cn, Table, TableHead, TableLoading, TableRow } from '@tet/ui';
import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import { ActionListItem } from '../actions/use-list-actions';
import { useListActionsGroupedById } from '../actions/use-list-actions-grouped-by-id';
import { useReferentielId } from '../referentiel-context';
import { useReferentielTableColumns } from './use-referentiel-table-columns';
import { rowClassNameByActionTypeToClassName } from './utils';

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

/** Stable defaults for controlled table state (avoid new object refs each render). */
const TABLE_ROW_PINNING = { top: [] as string[] };
const TABLE_COLUMN_PINNING = { left: ['nom'] as string[] };

export const ReferentielTable = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  const [{ data: actions = {}, isPending }] = useListActionsGroupedById({
    referentielIds: [referentielId],
  });

  const recordOfAxesAndSousAxes = filterActionsBy(actions ?? {}, (action) =>
    TYPES_EXPANDED_BY_DEFAULT.has(action.actionType)
  );

  const [expanded, setExpanded] = useState<ExpandedState>(
    Object.fromEntries(
      Object.entries(recordOfAxesAndSousAxes).map(([id]) => [id, true])
    )
  );

  const axes = useMemo(() => {
    const referentiel = actions[referentielId];
    return referentiel?.childrenIds.map((id) => actions[id]);
  }, [actions, referentielId]);

  const getSubRows = useCallback(
    (row: ActionListItem) => row.childrenIds.map((id) => actions[id]),
    [actions]
  );

  const tableState = useMemo(
    () => ({
      expanded,
      rowPinning: TABLE_ROW_PINNING,
      columnPinning: TABLE_COLUMN_PINNING,
    }),
    [expanded]
  );

  const tableMeta = useMemo(
    () => ({ collectiviteId, referentielId }),
    [collectiviteId, referentielId]
  );

  const { columns } = useReferentielTableColumns();

  const table = useReactTable({
    columns,
    data: axes,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows,
    getRowId: (row) => row.actionId,
    state: tableState,
    onExpandedChange: setExpanded,
    meta: tableMeta,
  });

  if (isPending) {
    return <ReferentielTableLoading table={table} />;
  }

  const isEmpty = table.getRowModel().rows.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-96 flex items-center justify-center text-error-1 bg-white rounded-xl border border-grey-3">
        Une erreur est survenue lors de la récupération des données
      </div>
    );
  }

  return (
    <TableWrapper table={table}>
      {table.getRowModel().rows.map((row) => (
        <TableRow
          key={row.id}
          className={cn(
            'text-sm',
            rowClassNameByActionTypeToClassName[row.original.actionType]
          )}
        >
          {row.getVisibleCells().map((cell) => (
            <React.Fragment key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </React.Fragment>
          ))}
        </TableRow>
      ))}
    </TableWrapper>
  );
};

function TableWrapper({
  children,
  table,
}: {
  children: ReactNode;
  table: ReactTable<ActionListItem>;
}) {
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
    <div className="2xl:-ml-[calc((100vw-4rem-1440px+3rem)/2)] 2xl:w-[calc(100vw-4rem)] relative bg-white rounded-xl border border-grey-3 overflow-x-scroll">
      <Table className="border-separate border-spacing-0">
        <TableHead>
          <TableRow>{tableHeaderRow}</TableRow>
        </TableHead>
        <tbody>{children}</tbody>
      </Table>
    </div>
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
