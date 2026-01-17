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
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { Button, ReactTable, TableCell, TableHeaderCell } from '@tet/ui';
import { FichesListCellActions } from './cells/fiches-list.cell-actions';
import { FichesListCellCheckbox } from './cells/fiches-list.cell-checkbox';
import { FichesListCellDateFin } from './cells/fiches-list.cell-date-fin';
import { FichesListCellPilotes } from './cells/fiches-list.cell-pilotes';
import { FichesListCellPlans } from './cells/fiches-list.cell-plans';
import { FichesListCellTitle } from './cells/fiches-list.cell-title';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    selectedFicheIds?: number[] | 'all';
    selectAction?: (ficheId: number) => void;
    onUnlink?: (ficheId: number) => void;
  }
}

const columnHelper = createColumnHelper<FicheWithRelationsAndCollectivite>();

const columns = [
  columnHelper.display({
    id: 'select',
    header: () => <TableHeaderCell className="w-12" />,
    cell: ({ row, table }) => (
      <TableCell>
        <FichesListCellCheckbox
          ficheId={row.original.id}
          selectAction={() =>
            table.options.meta?.selectAction?.(row.original.id)
          }
          selectedFicheIds={table.options.meta?.selectedFicheIds}
        />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'unlink',
    header: () => <TableHeaderCell className="w-12" />,
    cell: ({ row, table }) => (
      <TableCell>
        {table.options.meta?.onUnlink && (
          <Button
            onClick={() => table.options.meta?.onUnlink?.(row.original.id)}
            icon="link-unlink"
            title="Dissocier l'action"
            size="xs"
            variant="grey"
          />
        )}
      </TableCell>
    ),
  }),

  columnHelper.accessor('titre', {
    header: () => <TableHeaderCell title="Titre" />,
    cell: (info) => (
      <TableCell>
        <FichesListCellTitle
          title={info.getValue()}
          fiche={info.row.original}
        />
      </TableCell>
    ),
  }),

  columnHelper.accessor('plans', {
    header: () => <TableHeaderCell title="Plan" className="w-40 xl:w-60" />,
    cell: (info) => (
      <TableCell>
        <FichesListCellPlans plans={info.getValue()} />
      </TableCell>
    ),
  }),

  columnHelper.accessor('statut', {
    header: () => <TableHeaderCell title="Statut" className="w-32" />,
    cell: (info) => {
      const statut = info.getValue();
      return (
        <TableCell>
          {statut && <BadgeStatut statut={statut} size="sm" />}
        </TableCell>
      );
    },
  }),

  columnHelper.accessor('pilotes', {
    header: () => <TableHeaderCell title="Pilote" className="w-44" />,
    cell: (info) => (
      <TableCell>
        <FichesListCellPilotes pilotes={info.getValue()} />
      </TableCell>
    ),
  }),

  columnHelper.accessor('priorite', {
    header: () => <TableHeaderCell title="Priorité" className="w-24" />,
    cell: (info) => {
      const priorite = info.getValue();
      return (
        <TableCell>
          {priorite && <BadgePriorite priorite={priorite} size="sm" />}
        </TableCell>
      );
    },
  }),

  columnHelper.accessor('dateFin', {
    header: () => <TableHeaderCell title="Date de fin" className="w-32" />,
    cell: (info) => (
      <TableCell>
        <FichesListCellDateFin
          dateFin={info.getValue()}
          statut={info.row.original.statut}
        />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'actions',
    header: () => <TableHeaderCell className="w-16" icon="more-2-line" />,
    cell: ({ row }) => (
      <TableCell>
        <FichesListCellActions fiche={row.original} />
      </TableCell>
    ),
  }),
];

type Props = {
  collectivite: CollectiviteCurrent;
  fiches: FicheWithRelationsAndCollectivite[];
  isLoading: boolean;
  isGroupedActionsOn: boolean;
  onUnlink?: (ficheId: number) => void;
} & (
  | {
      enableSelection?: true;
      selectedFicheIds: number[] | 'all';
      handleSelectFiche: (ficheId: number) => void;
    }
  | {
      enableSelection: false;
      selectedFicheIds?: never;
      handleSelectFiche?: never;
    }
);

export const FichesListTable = ({
  collectivite,
  fiches,
  isLoading,
  isGroupedActionsOn,
  onUnlink,
  enableSelection = true,
  ...selectionProps
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
      selectedFicheIds:
        enableSelection && 'selectedFicheIds' in selectionProps
          ? selectionProps.selectedFicheIds
          : undefined,
      selectAction:
        enableSelection && 'handleSelectFiche' in selectionProps
          ? (ficheId: number) => selectionProps.handleSelectFiche?.(ficheId)
          : undefined,
      onUnlink,
    },
  });

  useEffect(() => {
    const showUnlinkColumn = !!onUnlink;
    const showActionsColumn = !collectivite.isReadOnly && !showUnlinkColumn;
    table
      .getColumn('select')
      ?.toggleVisibility(enableSelection && isGroupedActionsOn);
    table.getColumn('unlink')?.toggleVisibility(showUnlinkColumn);
    table.getColumn('actions')?.toggleVisibility(showActionsColumn);
  }, [
    collectivite.isReadOnly,
    enableSelection,
    isGroupedActionsOn,
    onUnlink,
    table,
  ]);

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
