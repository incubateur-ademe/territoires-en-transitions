import {
  createColumnHelper,
  getCoreRowModel,
  RowData,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import BadgePriorite from '@/app/app/pages/collectivite/PlansActions/components/BadgePriorite';
import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { ReactTable, TableHeaderCell } from '@tet/ui';
import { FichesListCellActions } from './cells/fiches-list.cell-actions';
import { FichesListCellCheckbox } from './cells/fiches-list.cell-checkbox';
import { FichesListCellDateFin } from './cells/fiches-list.cell-date-fin';
import { FichesListCellPilotes } from './cells/fiches-list.cell-pilotes';
import { FichesListCellPlans } from './cells/fiches-list.cell-plans';
import { FichesListCellTitle } from './cells/fiches-list.cell-title';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    selectedFicheIds: number[] | 'all';
    selectAction: (ficheId: number) => void;
  }
}

const columnHelper = createColumnHelper<FicheWithRelationsAndCollectivite>();

const columns = [
  columnHelper.display({
    id: 'select',
    header: () => <TableHeaderCell className="w-12" />,
    cell: ({ row, table }) => (
      <FichesListCellCheckbox
        ficheId={row.original.id}
        selectAction={() => table.options.meta?.selectAction(row.original.id)}
        selectedFicheIds={table.options.meta?.selectedFicheIds}
      />
    ),
  }),

  columnHelper.accessor('titre', {
    header: () => <TableHeaderCell title="Titre" />,
    cell: (info) => (
      <FichesListCellTitle title={info.getValue()} fiche={info.row.original} />
    ),
  }),

  columnHelper.accessor('plans', {
    header: () => <TableHeaderCell title="Plan" className="w-40 xl:w-60" />,
    cell: (info) => <FichesListCellPlans plans={info.getValue()} />,
  }),

  columnHelper.accessor('statut', {
    header: () => <TableHeaderCell title="Statut" className="w-32" />,
    cell: (info) => {
      const statut = info.getValue();
      return statut && <BadgeStatut statut={statut} size="sm" />;
    },
  }),

  columnHelper.accessor('pilotes', {
    header: () => <TableHeaderCell title="Pilote" className="w-44" />,
    cell: (info) => <FichesListCellPilotes pilotes={info.getValue()} />,
  }),

  columnHelper.accessor('priorite', {
    header: () => <TableHeaderCell title="Priorité" className="w-24" />,
    cell: (info) => {
      const priorite = info.getValue();
      return priorite && <BadgePriorite priorite={priorite} size="sm" />;
    },
  }),

  columnHelper.accessor('dateFin', {
    header: () => <TableHeaderCell title="Date de fin" className="w-32" />,
    cell: (info) => (
      <FichesListCellDateFin
        dateFin={info.getValue()}
        statut={info.row.original.statut}
      />
    ),
  }),

  columnHelper.display({
    id: 'actions',
    header: () => <TableHeaderCell className="w-16" icon="more-2-line" />,
    cell: (info) => <FichesListCellActions fiche={info.row.original} />,
  }),
];

type Props = {
  collectivite: CollectiviteAccess;
  fiches: FicheWithRelationsAndCollectivite[];
  isLoading: boolean;
  isGroupedActionsOn: boolean;
  selectedFicheIds: number[] | 'all';
  handleSelectFiche: (ficheId: number) => void;
};

export const FichesListTable = ({
  collectivite,
  fiches,
  isLoading,
  isGroupedActionsOn,
  handleSelectFiche,
  selectedFicheIds,
}: Props) => {
  const [columnVisibility, setColumnVisibility] = useState({});

  const table = useReactTable({
    columns,
    data: fiches,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      selectedFicheIds,
      selectAction: (ficheId: number) => handleSelectFiche(ficheId),
    },
  });

  useEffect(() => {
    table.getColumn('select')?.toggleVisibility(isGroupedActionsOn);
    table.getColumn('actions')?.toggleVisibility(!collectivite.isReadOnly);
  }, [collectivite.isReadOnly, isGroupedActionsOn, table]);

  return (
    <div className="p-4 pt-2 lg:p-8 lg:pt-4 bg-white rounded-xl border border-grey-3">
      <ReactTable
        table={table}
        isLoading={isLoading}
        isEmpty={fiches.length === 0}
        emptyCard={{
          description: 'Aucune action ne correspond à votre recherche',
          picto: (props) => <PictoExpert {...props} />,
        }}
      />
    </div>
  );
};
