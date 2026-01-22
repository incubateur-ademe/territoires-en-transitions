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
import { SousActionCellActionParente } from './sous-action.cell-action-parente';
import { SousActionCellActions } from './sous-action.cell-actions';
import { SousActionCellDate } from './sous-action.cell-date';
import { SousActionCellDescription } from './sous-action.cell-description';
import { SousActionCellPilotes } from './sous-action.cell-pilotes';
import { SousActionCellStatut } from './sous-action.cell-statut';
import { SousActionCellTitle } from './sous-action.cell-title';

const columnHelper = createColumnHelper<FicheWithRelations>();

const columns = [
  columnHelper.accessor('titre', {
    header: () => <TableHeaderCell title="Titre" className="w-80" />,
    cell: (info) => <SousActionCellTitle sousAction={info.row.original} />,
  }),
  columnHelper.accessor('description', {
    header: () => (
      <TableHeaderCell title="Description" className="max-2xl:w-[32rem]" />
    ),
    cell: (info) => (
      <SousActionCellDescription sousAction={info.row.original} />
    ),
  }),
  columnHelper.accessor('parentId', {
    header: () => <TableHeaderCell title="Action parente" className="w-64" />,
    cell: (info) => (
      <SousActionCellActionParente parentId={info.row.original.parentId} />
    ),
  }),
  columnHelper.accessor('statut', {
    header: () => <TableHeaderCell title="Statut" className="w-32" />,
    cell: (info) => <SousActionCellStatut sousAction={info.row.original} />,
  }),
  columnHelper.accessor('pilotes', {
    header: () => <TableHeaderCell title="Pilotes" className="w-40" />,
    cell: (info) => <SousActionCellPilotes sousAction={info.row.original} />,
  }),
  columnHelper.accessor('dateFin', {
    header: () => <TableHeaderCell title="Date de fin" className="w-32" />,
    cell: (info) => <SousActionCellDate sousAction={info.row.original} />,
  }),
  columnHelper.display({
    id: 'actions',
    header: () => <TableHeaderCell className="w-16" icon="more-2-line" />,
    cell: (info) => <SousActionCellActions sousAction={info.row.original} />,
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
  );
};
