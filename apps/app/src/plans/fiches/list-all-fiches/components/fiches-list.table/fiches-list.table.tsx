import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  RowData,
  useReactTable,
} from '@tanstack/react-table';
import { Fragment, useEffect, useState } from 'react';

import BadgePriorite from '@/app/app/pages/collectivite/PlansActions/components/BadgePriorite';
import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { FicheWithRelationsAndCollectivite } from '@/domain/plans';
import { CollectiviteAccess } from '@/domain/users';
import { FichesListCellActions } from './cells/fiches-list.cell-actions';
import { FichesListCellCheckbox } from './cells/fiches-list.cell-checkbox';
import { FichesListCellDateFin } from './cells/fiches-list.cell-date-fin';
import { FichesListCellPilotes } from './cells/fiches-list.cell-pilotes';
import { FichesListCellPlans } from './cells/fiches-list.cell-plans';
import { FichesListCellTitle } from './cells/fiches-list.cell-title';
import { HeaderCell, Row, TableLoading, TRowEmpty } from './components';

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
    header: () => <HeaderCell className="w-12" />,
    cell: ({ row, table }) => (
      <FichesListCellCheckbox
        ficheId={row.original.id}
        selectAction={() => table.options.meta?.selectAction(row.original.id)}
        selectedFicheIds={table.options.meta?.selectedFicheIds}
      />
    ),
  }),

  columnHelper.accessor('titre', {
    header: () => <HeaderCell title="Titre" />,
    cell: (info) => (
      <FichesListCellTitle title={info.getValue()} fiche={info.row.original} />
    ),
  }),

  columnHelper.accessor('plans', {
    header: () => <HeaderCell title="Plan" className="w-40 xl:w-60" />,
    cell: (info) => <FichesListCellPlans plans={info.getValue()} />,
  }),

  columnHelper.accessor('statut', {
    header: () => <HeaderCell title="Statut" className="w-32" />,
    cell: (info) => {
      const statut = info.getValue();
      return statut && <BadgeStatut statut={statut} size="sm" />;
    },
  }),

  columnHelper.accessor('pilotes', {
    header: () => <HeaderCell title="Pilote" className="w-44" />,
    cell: (info) => <FichesListCellPilotes pilotes={info.getValue()} />,
  }),

  columnHelper.accessor('priorite', {
    header: () => <HeaderCell title="Priorité" className="w-24" />,
    cell: (info) => {
      const priorite = info.getValue();
      return priorite && <BadgePriorite priorite={priorite} size="sm" />;
    },
  }),

  columnHelper.accessor('dateFin', {
    header: () => <HeaderCell title="Date de fin" className="w-32" />,
    cell: (info) => <FichesListCellDateFin date={info.getValue()} />,
  }),

  columnHelper.display({
    id: 'actions',
    header: () => <HeaderCell className="w-16" icon="more-2-line" />,
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
    <div className="p-4 lg:p-8 bg-white rounded-xl border border-grey-3">
      <table className="table-fixed w-full">
        <thead className="sticky top-0 shadow-[0_1px_0px_0px] shadow-grey-3 z-[1]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-white">
              {headerGroup.headers.map((header) => (
                <Fragment key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </Fragment>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <TableLoading
              columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
            />
          ) : fiches.length === 0 ? (
            <TRowEmpty
              columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
              title="Aucune action ne correspond à votre recherche"
            />
          ) : (
            table.getRowModel().rows.map((row) => (
              <Row key={row.id} className="text-sm">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </Row>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
