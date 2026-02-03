import {
  createColumnHelper,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { FicheWithRelations } from '@tet/domain/plans';
import { ReactTable, ReactTableProps, TableHeaderCell } from '@tet/ui';
import { SousActionActionParenteCell } from './sous-action.action-parente.cell';
import { SousActionActionsCell } from './sous-action.actions.cell';
import { SousActionDateCell } from './sous-action.date.cell';
import { SousActionDescriptionCell } from './sous-action.description.cell';
import { SousActionPilotesCell } from './sous-action.pilotes.cell';
import { SousActionStatutCell } from './sous-action.statut.cell';
import { SousActionTitleCell } from './sous-action.title.cell';

const columnHelper = createColumnHelper<FicheWithRelations>();

const columns = [
  columnHelper.accessor('titre', {
    header: () => <TableHeaderCell title="Titre" className="w-80" />,
    cell: (info) => <SousActionTitleCell sousAction={info.row.original} />,
  }),
  columnHelper.accessor('description', {
    header: () => (
      <TableHeaderCell title="Description" className="max-2xl:w-[32rem]" />
    ),
    cell: (info) => (
      <SousActionDescriptionCell sousAction={info.row.original} />
    ),
  }),
  columnHelper.accessor('parentId', {
    header: () => <TableHeaderCell title="Action parente" className="w-64" />,
    cell: (info) => (
      <SousActionActionParenteCell parentId={info.row.original.parentId} />
    ),
  }),
  columnHelper.accessor('statut', {
    header: () => <TableHeaderCell title="Statut" className="w-32" />,
    cell: (info) => <SousActionStatutCell sousAction={info.row.original} />,
  }),
  columnHelper.accessor('pilotes', {
    header: () => <TableHeaderCell title="Pilotes" className="w-40" />,
    cell: (info) => <SousActionPilotesCell sousAction={info.row.original} />,
  }),
  columnHelper.accessor('dateFin', {
    header: () => <TableHeaderCell title="Date de fin" className="w-32" />,
    cell: (info) => <SousActionDateCell sousAction={info.row.original} />,
  }),
  columnHelper.display({
    id: 'actions',
    header: () => <TableHeaderCell className="w-16" icon="more-2-line" />,
    cell: (info) => <SousActionActionsCell sousAction={info.row.original} />,
  }),
];

type Props = Omit<ReactTableProps, 'table'> & {
  sousActions: FicheWithRelations[];
  createSousAction?: () => void;
  hiddenColumns?: (keyof FicheWithRelations | 'actions')[];
  isReadOnly?: boolean;
};

export const SousActionTable = ({
  sousActions,
  isLoading,
  isEmpty,
  createSousAction,
  hiddenColumns,
  nbLoadingRows = 3,
  isLoadingNewRow,
  isReadOnly,
  emptyCard,
}: Props) => {
  const [columnVisibility, setColumnVisibility] = useState({});

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    columns,
    data: sousActions,
    manualSorting: true,
    getRowId: (row) => row.id.toString(),
    state: {
      columnVisibility,
      sorting,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    table.getColumn('actions')?.toggleVisibility(!isReadOnly);
    hiddenColumns?.forEach((column) => {
      table.getColumn(column)?.toggleVisibility(false);
    });
  }, [isReadOnly, table, hiddenColumns]);

  return (
    <div className="max-2xl:overflow-x-auto">
      <ReactTable
        table={table}
        isLoading={isLoading}
        nbLoadingRows={nbLoadingRows}
        isLoadingNewRow={isLoadingNewRow}
        isEmpty={isEmpty}
        emptyCard={{
          picto: (props) => <PictoAction {...props} />,
          title: 'Aucune sous-action pour le moment',
          description:
            'Décomposez votre action en tâches concrètes pour faciliter son suivi et son pilotage.',
          actions: isReadOnly
            ? undefined
            : [
                {
                  onClick: () => createSousAction?.(),
                  children: 'Ajouter une sous-action',
                  icon: 'add-line',
                },
              ],
          ...emptyCard,
        }}
      />
    </div>
  );
};
