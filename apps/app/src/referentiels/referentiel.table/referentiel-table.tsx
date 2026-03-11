import { makeReferentielActionUrl } from '@/app/app/paths';
import {
  createColumnHelper,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  cn,
  Table,
  TableHead,
  TableHeaderCell,
  TableLoading,
  TableRow,
} from '@tet/ui';
import React, { useMemo, useState } from 'react';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ReferentielTableCommentairesCell } from './referentiel-table.commentaires.cell';
import { ReferentielTableExplicationCell } from './referentiel-table.explication.cell';
import { ReferentielTableNotificationCell } from './referentiel-table.notification.cell';
import { ReferentielTablePersonnesPilotesCell } from './referentiel-table.personnes-pilotes.cell';
import { ReferentielTableScoreRatioCell } from './referentiel-table.score-ratio.cell';
import { ReferentielTableServicesPilotesCell } from './referentiel-table.services-pilotes.cell';
import { ReferentielTableStatutOrProgressionCell } from './referentiel-table.statut-or-progression.cell';
import { ReferentielTableTitleCell } from './referentiel-table.title.cell';
import { ReferentielTableProps, ReferentielTableRow } from './types';
import { buildInitialExpanded, getCommonPinningStyles } from './utils';

const HEADER_CELL_SMALL_CENTER_CLASSNAME = 'text-xs m-auto normal-case';
const HEADER_CELL_BORDER_RIGHT_CLASSNAME =
  'border-r border-primary-10 last:border-r-0';

const columnHelper = createColumnHelper<ReferentielTableRow>();

const getColumns = ({
  updateActionStatut,
}: {
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
}) => [
  columnHelper.accessor('nom', {
    size: 512,
    header: (info) => (
      <TableHeaderCell
        title="Intitulé"
        className={cn('bg-white', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
        style={{ ...getCommonPinningStyles(info.column) }}
      />
    ),
    cell: (info) => <ReferentielTableTitleCell info={info} />,
  }),
  // columnHelper.accessor('description', {
  //   header: () => <TableHeaderCell title="Description" className={cn('w-[32rem]',HEADER_CELL_BORDER_RIGHT_CLASSNAME)} />,
  //   cell: (info) => (
  //     <TableCell>
  //       <Tooltip label={info.getValue()}>
  //         <span className="line-clamp-1">{info.getValue()}</span>
  //       </Tooltip>
  //     </TableCell>
  //   ),
  // }),
  // columnHelper.accessor('phase', {
  //   header: () => (
  //     <TableHeaderCell
  //       title="Phase"
  //       className={cn('w-36', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //       titleClassName="m-auto"
  //     />
  //   ),
  //   cell: (info) => (
  //     <TableCell
  //       className={cn(
  //         'text-center',
  //         actionTypeToClassName[info.row.original.type]
  //       )}
  //     >
  //       {info.getValue()}
  //     </TableCell>
  //   ),
  // }),
  columnHelper.accessor('statut', {
    header: () => (
      <TableHeaderCell
        title="Statut"
        className={cn('w-40', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
      />
    ),
    cell: (info) => (
      <ReferentielTableStatutOrProgressionCell
        info={info}
        updateActionStatut={updateActionStatut}
      />
    ),
  }),

  columnHelper.display({
    id: 'progress',
    header: () => (
      <TableHeaderCell
        title="Progression"
        className={cn('w-60', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
      />
    ),
    cell: ({ row }) => <ReferentielTableScoreRatioCell row={row.original} />,
  }),

  columnHelper.accessor('explication', {
    header: () => (
      <TableHeaderCell
        title="État d'avancement"
        className={cn('w-[32rem]', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
      />
    ),
    cell: (info) => <ReferentielTableExplicationCell info={info} />,
  }),

  // columnHelper.accessor('pointPotentiel', {
  //   header: () => (
  //     <TableHeaderCell
  //       title="Potentiel"
  //       className={cn('w-28', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //       titleClassName={cn(HEADER_CELL_SMALL_CENTER_CLASSNAME)}
  //     />
  //   ),
  //   cell: (info) => (
  //     <ReferentielTablePointsCell
  //       value={info.getValue()}
  //       actionType={info.row.original.type}
  //     />
  //   ),
  // }),
  // columnHelper.display({
  //   id: 'progress',
  //   header: () => (
  //     <TableHeaderCell
  //       title="Progression"
  //       className={cn('w-60', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //       titleClassName="m-auto normal-case"
  //     />
  //   ),
  //   cell: ({ row }) => <ReferentielTableProgressionCell row={row.original} />,
  // }),

  // columnHelper.accessor('pointRestant', {
  //   header: () => (
  //     <TableHeaderCell
  //       title="Point restant"
  //       className={cn('w-24', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //       titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
  //     />
  //   ),
  //   cell: (info) => (
  //     <ReferentielTablePointsCell
  //       value={info.getValue()}
  //       actionType={info.row.original.type}
  //     />
  //   ),
  // }),
  // columnHelper.accessor('pointFait', {
  //   header: () => (
  //     <TableHeaderCell
  //       title="Point fait"
  //       className={cn('w-24', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //       titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
  //     />
  //   ),
  //   cell: (info) => (
  //     <ReferentielTablePointsCell
  //       value={info.getValue()}
  //       actionType={info.row.original.type}
  //     />
  //   ),
  // }),
  // columnHelper.accessor('scoreRealise', {
  //   header: () => (
  //     <TableHeaderCell
  //       title="% Fait"
  //       className={cn('w-24', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //       titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
  //     />
  //   ),
  //   cell: (info) => (
  //     <ReferentielTablePointsCell
  //       value={info.getValue()}
  //       percentage
  //       actionType={info.row.original.type}
  //     />
  //   ),
  // }),
  // columnHelper.accessor('pointProgramme', {
  //   header: () => (
  //     <TableHeaderCell
  //       title="Point programmé"
  //       className={cn('w-24', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //       titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
  //     />
  //   ),
  //   cell: (info) => (
  //     <ReferentielTablePointsCell
  //       value={info.getValue()}
  //       actionType={info.row.original.type}
  //     />
  //   ),
  // }),
  // columnHelper.accessor('scoreProgramme', {
  //   header: () => (
  //     <TableHeaderCell
  //       title="% Programmé"
  //       className={cn('w-24', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //       titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
  //     />
  //   ),
  //   cell: (info) => (
  //     <ReferentielTablePointsCell
  //       value={info.getValue()}
  //       percentage
  //       actionType={info.row.original.type}
  //     />
  //   ),
  // }),
  // columnHelper.accessor('pointsPasFait', {
  //   header: () => (
  //     <TableHeaderCell
  //       title="Point pas fait"
  //       className={cn('w-24', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //       titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
  //     />
  //   ),
  //   cell: (info) => (
  //     <ReferentielTablePointsCell
  //       value={info.getValue()}
  //       actionType={info.row.original.type}
  //     />
  //   ),
  // }),
  // columnHelper.accessor('scorePasFait', {
  //   header: () => (
  //     <TableHeaderCell
  //       title="% Pas fait"
  //       className={cn('w-24', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //       titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
  //     />
  //   ),
  //   cell: (info) => (
  //     <ReferentielTablePointsCell
  //       value={info.getValue()}
  //       percentage
  //       actionType={info.row.original.type}
  //     />
  //   ),
  // }),

  columnHelper.accessor('personnesPilotes', {
    header: () => (
      <TableHeaderCell
        title="Personnes pilotes"
        className={cn('w-56', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
      />
    ),
    cell: (info) => <ReferentielTablePersonnesPilotesCell info={info} />,
  }),
  columnHelper.accessor('servicesPilotes', {
    header: () => (
      <TableHeaderCell
        title="Service ou direction pilote"
        className={cn('w-56', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
      />
    ),
    cell: (info) => <ReferentielTableServicesPilotesCell info={info} />,
  }),
  columnHelper.accessor('countDocuments', {
    header: () => (
      <TableHeaderCell
        title="Documents liés"
        titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
        className={cn('w-32', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
      />
    ),
    cell: (info) => (
      <ReferentielTableNotificationCell
        link={makeReferentielActionUrl({
          collectiviteId: info.row.original.collectiviteId,
          referentielId: info.row.original.referentielId,
          actionId: info.row.original.id,
          actionVue: 'documents',
        })}
        count={info.getValue()}
        actionType={info.row.original.type}
      />
    ),
  }),
  columnHelper.accessor('countActions', {
    header: () => (
      <TableHeaderCell
        title="Actions liées"
        titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
        className={cn('w-32', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
      />
    ),
    cell: (info) => (
      <ReferentielTableNotificationCell
        link={makeReferentielActionUrl({
          collectiviteId: info.row.original.collectiviteId,
          referentielId: info.row.original.referentielId,
          actionId: info.row.original.id,
          actionVue: 'fiches',
        })}
        count={info.getValue()}
        actionType={info.row.original.type}
      />
    ),
  }),
  columnHelper.accessor('countComments', {
    header: () => (
      <TableHeaderCell
        title="Commentaires"
        titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
        className={cn('w-32', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
      />
    ),
    cell: (info) => <ReferentielTableCommentairesCell info={info} />,
  }),
];

export const ReferentielTable = ({
  data,
  isLoading = false,
}: ReferentielTableProps) => {
  const collectiviteId = useCollectiviteId();
  const { mutate: updateActionStatut } = useUpdateActionStatut();

  const [expanded, setExpanded] = useState<ExpandedState>(
    buildInitialExpanded(data)
  );

  // useEffect(() => {
  //   if (data.length > 0) {
  //     setExpanded(buildInitialExpanded(data));
  //   }
  // }, [data]);

  const columns = useMemo(
    () => getColumns({ updateActionStatut }),
    [updateActionStatut]
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.children,
    getRowId: (row) => row.id,
    state: {
      expanded,
      rowPinning: {
        top: [],
      },
      columnPinning: {
        left: ['nom'],
      },
    },
    onExpandedChange: setExpanded,
    meta: {
      collectiviteId,
    },
  });

  const columnIds = columns.map((col) => col.id || '');

  const isEmpty = table.getRowModel().rows.length === 0;

  if (isEmpty && !isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center text-error-1 bg-white rounded-xl border border-grey-3">
        Une erreur est survenue lors de la récupération des données
      </div>
    );
  }

  return (
    <div className="2xl:-ml-[calc((100vw-4rem-1440px+3rem)/2)] 2xl:w-[calc(100vw-4rem)] relative bg-white rounded-xl border border-grey-3 overflow-x-scroll">
      <Table className="border-separate border-spacing-0">
        <TableHead>
          <TableRow>
            {table
              .getHeaderGroups()
              .map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <React.Fragment key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </React.Fragment>
                ))
              )}
          </TableRow>
        </TableHead>
        <tbody>
          {isLoading ? (
            <TableLoading columnIds={columnIds} />
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="text-sm">
                {row.getVisibleCells().map((cell) => (
                  <React.Fragment key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </React.Fragment>
                ))}
              </TableRow>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
};
