import {
  createColumnHelper,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { Button, ReactTable, TableHeaderCell } from '@tet/ui';
import { useCreateSousAction } from '../../data/use-create-sous-action';
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
  columnHelper.accessor('statut', {
    header: () => <TableHeaderCell title="Statut" className="w-48" />,
    cell: (info) => <SousActionCellStatut sousAction={info.row.original} />,
  }),
  columnHelper.accessor('pilotes', {
    header: () => <TableHeaderCell title="Pilotes" className="w-52" />,
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

export const SousActionTable = () => {
  const collectivite = useCurrentCollectivite();

  const { fiche } = useFicheContext();

  const { mutate: createSousFiche } = useCreateSousAction(fiche.id);

  const { fiches: sousActions, isLoading } = useListFiches(
    collectivite.collectiviteId,
    {
      filters: {
        parentsId: [fiche.id],
      },
      queryOptions: {
        sort: [{ field: 'titre', direction: 'asc' }],
        limit: 'all',
      },
    }
  );

  const [columnVisibility, setColumnVisibility] = useState({});

  const [sorting, setSorting] = useState<SortingState>([]);

  const isEmpty = sousActions.length === 0;

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
    table.getColumn('actions')?.toggleVisibility(!collectivite.isReadOnly);
  }, [collectivite.isReadOnly, table]);

  return (
    <div className="p-2 bg-white rounded-lg border border-grey-3 overflow-x-auto">
      <ReactTable
        table={table}
        isLoading={isLoading}
        nbLoadingRows={3}
        isEmpty={isEmpty}
        emptyCard={{
          picto: (props) => <PictoAction {...props} />,
          title: 'Aucune sous-action pour le moment',
          description:
            'Décomposez votre action en tâches concrètes pour faciliter son suivi et son pilotage.',
          actions: collectivite.isReadOnly
            ? undefined
            : [
                {
                  onClick: () => createSousFiche(),
                  children: 'Ajouter une sous-action',
                  icon: 'add-line',
                },
              ],
        }}
      />
      {!isEmpty && !collectivite.isReadOnly && (
        <Button
          className="m-4"
          icon="add-line"
          size="xs"
          onClick={() => createSousFiche()}
        >
          Ajouter une sous-action
        </Button>
      )}
    </div>
  );
};
