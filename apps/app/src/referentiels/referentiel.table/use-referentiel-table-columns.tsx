import { createColumnHelper } from '@tanstack/react-table';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { cn, TableHeaderCell } from '@tet/ui';
import { useMemo } from 'react';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ActionListItem } from '../actions/use-list-actions';
import { useUpsertMesurePilotes } from '../actions/use-mesure-pilotes';
import { useUpsertMesureServicesPilotes } from '../actions/use-mesure-services-pilotes';
import { ReferentielTableExplicationCell } from './referentiel-table.explication.cell';
import { ReferentielTablePersonnesPilotesCell } from './referentiel-table.personnes-pilotes.cell';
import { ReferentielTableScoreRatioCell } from './referentiel-table.score-ratio.cell';
import { ReferentielTableServicesPilotesCell } from './referentiel-table.services-pilotes.cell';
import { ReferentielTableStatutOrProgressionCell } from './referentiel-table.statut-or-progression.cell';
import { ReferentielTableTitleCell } from './referentiel-table.title.cell';
import { getColumnPinningStyles } from './utils';

// const HEADER_CELL_SMALL_CENTER_CLASSNAME = 'text-xs m-auto normal-case';
const HEADER_CELL_BORDER_RIGHT_CLASSNAME =
  'border-r border-primary-10 last:border-r-0';

const columnHelper = createColumnHelper<ActionListItem>();

const getColumns = ({
  canEdit,
  updateActionStatut,
  updateActionPilotes,
  updateActionServices,
}: {
  canEdit: boolean;
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
  updateActionPilotes: ReturnType<typeof useUpsertMesurePilotes>['mutate'];
  updateActionServices: ReturnType<
    typeof useUpsertMesureServicesPilotes
  >['mutate'];
}) => [
  columnHelper.accessor('nom', {
    size: 512,
    header: (info) => {
      const pinning = getColumnPinningStyles(info.column, undefined, {
        variant: 'header',
      });
      return (
        <TableHeaderCell
          title="Intitulé"
          className={cn(
            'bg-white',
            HEADER_CELL_BORDER_RIGHT_CLASSNAME,
            pinning.className
          )}
          style={pinning.style}
        />
      );
    },
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
  columnHelper.accessor('score.statut', {
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

  columnHelper.display({
    id: 'explication',
    header: () => (
      <TableHeaderCell
        title="État d'avancement"
        className={cn('w-[32rem]', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
      />
    ),
    cell: ({ row }) => (
      <ReferentielTableExplicationCell row={row.original} canEdit={canEdit} />
    ),
  }),

  columnHelper.display({
    id: 'pilotes',
    header: () => (
      <TableHeaderCell
        title="Pilotes"
        className={cn('w-40', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
      />
    ),
    cell: (info) => (
      <ReferentielTablePersonnesPilotesCell
        info={info}
        updateActionPilotes={updateActionPilotes}
        canEdit={canEdit}
      />
    ),
  }),

  columnHelper.display({
    id: 'servicesPilotes',
    header: () => (
      <TableHeaderCell
        title="Service ou direction pilote"
        className={cn('w-40', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
      />
    ),
    cell: (info) => (
      <ReferentielTableServicesPilotesCell
        info={info}
        updateActionServices={updateActionServices}
        canEdit={canEdit}
      />
    ),
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

  // columnHelper.display({
  //   id: 'countDocuments',
  //   header: () => (
  //     <TableHeaderCell
  //       title="Documents liés"
  //       titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
  //       className={cn('w-32', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //     />
  //   ),
  //   cell: (info) => (
  //     <ReferentielTableNotificationCell
  //       link={makeReferentielActionUrl({
  //         ...getTableMeta(info.table),
  //         actionId: info.row.original.actionId,
  //         actionVue: 'documents',
  //       })}
  //       count={info.getValue()}
  //       actionType={info.row.original.actionType}
  //     />
  //   ),
  // }),
  // columnHelper.accessor('countActions', {
  //   header: () => (
  //     <TableHeaderCell
  //       title="Actions liées"
  //       titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
  //       className={cn('w-32', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //     />
  //   ),
  //   cell: (info) => (
  //     <ReferentielTableNotificationCell
  //       link={makeReferentielActionUrl({
  //         ...getTableMeta(info.table),
  //         actionId: info.row.original.actionId,
  //         actionVue: 'fiches',
  //       })}
  //       count={info.getValue()}
  //       actionType={info.row.original.actionType}
  //     />
  //   ),
  // }),
  // columnHelper.accessor('countComments', {
  //   header: () => (
  //     <TableHeaderCell
  //       title="Commentaires"
  //       titleClassName={HEADER_CELL_SMALL_CENTER_CLASSNAME}
  //       className={cn('w-32', HEADER_CELL_BORDER_RIGHT_CLASSNAME)}
  //     />
  //   ),
  //   cell: (info) => <ReferentielTableCommentairesCell info={info} />,
  // }),
];

export function useReferentielTableColumns() {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canEdit = hasCollectivitePermission('referentiels.mutate');

  const { mutate: updateActionStatut } = useUpdateActionStatut();
  const { mutate: updateActionPilotes } = useUpsertMesurePilotes();
  const { mutate: updateActionServices } = useUpsertMesureServicesPilotes();

  const columns = useMemo(
    () =>
      getColumns({
        canEdit,
        updateActionStatut,
        updateActionPilotes,
        updateActionServices,
      }),
    [canEdit, updateActionStatut, updateActionPilotes, updateActionServices]
  );

  return { columns };
}
