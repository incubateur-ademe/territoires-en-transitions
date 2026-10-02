import {
  columnVisibilityFeature,
  createColumnHelper,
  metaHelper,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';

import { appLabels } from '@/app/labels/catalog';
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
import { FichesListPrioriteCell } from './cells/fiches-list.priorite.cell';
import { FichesListStatutCell } from './cells/fiches-list.statut.cell';

type FichesListTableMeta = {
  selectedFicheIds?: number[] | 'all';
  selectAction?: (ficheId: number) => void;
  onUnlink?: (ficheId: number) => void;
};

const features = tableFeatures({
  columnVisibilityFeature,
  tableMeta: metaHelper<FichesListTableMeta>(),
});

const columnHelper = createColumnHelper<
  typeof features,
  FicheWithRelationsAndCollectivite
>();

const columns = columnHelper.columns([
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
            title={appLabels.dissocierAction}
            size="xs"
            variant="grey"
          />
        )}
      </TableCell>
    ),
  }),

  columnHelper.accessor('titre', {
    header: () => (
      <TableHeaderCell title={appLabels.tableauTitre} className="w-96" />
    ),
    cell: ({ row, table }) => (
      <FichesListCellTitle
        fiche={row.original}
        canOpenAction={!table.getColumn('select')?.getIsVisible()}
      />
    ),
  }),

  columnHelper.accessor('plans', {
    header: () => (
      <TableHeaderCell title={appLabels.tableauPlan} className="w-40 xl:w-60" />
    ),
    cell: (info) => <FichesListCellPlans plans={info.getValue()} />,
  }),

  columnHelper.accessor('statut', {
    header: () => (
      <TableHeaderCell title={appLabels.ficheStatut} className="w-32" />
    ),
    cell: (info) => <FichesListStatutCell action={info.row.original} />,
  }),

  columnHelper.accessor('pilotes', {
    header: () => (
      <TableHeaderCell title={appLabels.personnePilote()} className="w-44" />
    ),
    cell: (info) => <FichesListCellPilotes action={info.row.original} />,
  }),

  columnHelper.accessor('priorite', {
    header: () => (
      <TableHeaderCell title={appLabels.tableauPriorite} className="w-32" />
    ),
    cell: (info) => <FichesListPrioriteCell action={info.row.original} />,
  }),

  columnHelper.accessor('dateFin', {
    header: () => (
      <TableHeaderCell title={appLabels.dateFin} className="w-32" />
    ),
    cell: (info) => <FichesListCellDateFin action={info.row.original} />,
  }),

  columnHelper.display({
    id: 'actions',
    header: () => <TableHeaderCell className="w-16" icon="more-2-line" />,
    cell: (info) => <FichesListCellActions fiche={info.row.original} />,
  }),
]);

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
  collectivite: { hasCollectivitePermission },
  fiches,
  isLoading,
  isGroupedActionsOn,
  onUnlink,
  enableSelection = true,
  ...selectionProps
}: Props) => {
  const showUnlinkColumn = !!onUnlink;

  const table = useTable({
    features,
    columns,
    data: fiches,
    state: {
      columnVisibility: {
        select: enableSelection && isGroupedActionsOn,
        unlink: showUnlinkColumn,
        actions:
          hasCollectivitePermission('plans.fiches.update') &&
          !showUnlinkColumn,
      },
    },
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

  return (
    <div className="max-xl:overflow-x-auto">
      <ReactTable
        table={table}
        isLoading={isLoading}
        isEmpty={fiches.length === 0}
        emptyCard={{
          description: appLabels.aucuneActionRecherche,
          picto: (props) => <PictoExpert {...props} />,
        }}
      />
    </div>
  );
};
