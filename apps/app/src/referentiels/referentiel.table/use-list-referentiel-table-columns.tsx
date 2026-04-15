import { createColumnHelper } from '@tanstack/react-table';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { cn, TableHeaderCell } from '@tet/ui';
import { useMemo } from 'react';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ActionListItem } from '../actions/use-list-actions';
import { useUpsertMesurePilotes } from '../actions/use-mesure-pilotes';
import { useUpsertMesureServicesPilotes } from '../actions/use-mesure-services-pilotes';
import { useUpdateActionExplication } from '../actions/use-update-action-explication';
import { ReferentielTableCommentsCell } from './referentiel-table.comments.cell';
import { ReferentielTableDocumentsCell } from './referentiel-table.documents.cell';
import { ReferentielTableExplicationCell } from './referentiel-table.explication.cell';
import {
  getPilotesFilterFn,
  getServicesFilterFn,
  getStatutFilterFn,
} from './referentiel-table.filters.utils';
import { ReferentielTablePersonnesPilotesCell } from './referentiel-table.personnes-pilotes.cell';
import { ReferentielTableServicesPilotesCell } from './referentiel-table.services-pilotes.cell';
import { ReferentielTableStatutDetailleCell } from './referentiel-table.statut-detaille.cell';
import { ReferentielTableStatutCell } from './referentiel-table.statut.cell';
import { ReferentielTableTitleCell } from './referentiel-table.title.cell';

const columnHelper = createColumnHelper<ActionListItem>();

const getColumns = ({
  canEdit,
  actions,
  updateActionStatut,
  updateActionPilotes,
  updateActionServices,
  updateActionExplication,
}: {
  canEdit: boolean;
  actions: Record<string, ActionListItem>;
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
  updateActionPilotes: ReturnType<typeof useUpsertMesurePilotes>['mutate'];
  updateActionServices: ReturnType<
    typeof useUpsertMesureServicesPilotes
  >['mutate'];
  updateActionExplication: ReturnType<
    typeof useUpdateActionExplication
  >['mutate'];
}) => [
  columnHelper.accessor('nom', {
    size: 512,
    header: () => (
      <TableHeaderCell title="Intitulé" className={cn('w-[32rem] bg-white')} />
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

  // columnHelper.display({
  //   id: 'progression',
  //   header: () => (
  //     <TableHeaderCell title="Progression" className={cn('w-[8rem]')} />
  //   ),
  //   cell: ({ row, cell }) => (
  //     <ReferentielTableProgressionCell row={row.original} cell={cell} />
  //   ),
  // }),

  columnHelper.display({
    id: 'statutDetaille',
    header: () => <TableHeaderCell title="" className={cn('w-[3.25rem]')} />,
    cell: ({ row, cell }) => (
      <ReferentielTableStatutDetailleCell row={row.original} cell={cell} />
    ),
  }),

  columnHelper.accessor('score.statut', {
    id: 'statut',
    header: () => (
      <TableHeaderCell title="Statut" className={cn('w-[11.3rem]')} />
    ),
    cell: (info) => (
      <ReferentielTableStatutCell
        info={info}
        updateActionStatut={updateActionStatut}
      />
    ),
    filterFn: getStatutFilterFn,
  }),

  // columnHelper.display({
  //   id: 'progress',
  //   header: () => (
  //     <TableHeaderCell title="Fait / Potentiel" className={cn('w-[6.5rem]')} />
  //   ),
  //   cell: ({ row, cell }) => (
  //     <ReferentielTableScoreRatioCell row={row.original} cell={cell} />
  //   ),
  // }),

  columnHelper.accessor('score.explication', {
    header: () => (
      <TableHeaderCell title="État d'avancement" className={cn('w-[32rem]')} />
    ),
    cell: (info) => (
      <ReferentielTableExplicationCell
        info={info}
        canEdit={canEdit}
        updateActionExplication={updateActionExplication}
      />
    ),
    filterFn: 'includesString',
  }),

  columnHelper.display({
    id: 'documents',
    header: () => <TableHeaderCell title="Documents" className={cn('w-28')} />,
    cell: (info) => <ReferentielTableDocumentsCell info={info} />,
  }),

  columnHelper.display({
    id: 'comments',
    header: () => (
      <TableHeaderCell title="Commentaires" className={cn('w-32')} />
    ),
    cell: (info) => <ReferentielTableCommentsCell info={info} />,
  }),

  columnHelper.accessor('pilotes', {
    header: () => <TableHeaderCell title="Pilotes" className={cn('w-40')} />,
    cell: (info) => (
      <ReferentielTablePersonnesPilotesCell
        info={info}
        updateActionPilotes={updateActionPilotes}
        canEdit={canEdit}
      />
    ),
    filterFn: getPilotesFilterFn(actions),
  }),

  columnHelper.accessor('services', {
    header: () => (
      <TableHeaderCell
        title="Service ou direction pilote"
        className={cn('w-40')}
      />
    ),
    cell: (info) => (
      <ReferentielTableServicesPilotesCell
        info={info}
        updateActionServices={updateActionServices}
        canEdit={canEdit}
      />
    ),
    filterFn: getServicesFilterFn(actions),
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
];

export function useListReferentielTableColumns(
  actions: Record<string, ActionListItem>
) {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canEdit = hasCollectivitePermission('referentiels.mutate');

  const { mutate: updateActionStatut } = useUpdateActionStatut();
  const { mutate: updateActionPilotes } = useUpsertMesurePilotes();
  const { mutate: updateActionServices } = useUpsertMesureServicesPilotes();
  const { mutate: updateActionExplication } = useUpdateActionExplication();

  const columns = useMemo(
    () =>
      getColumns({
        canEdit,
        actions,
        updateActionStatut,
        updateActionPilotes,
        updateActionServices,
        updateActionExplication,
      }),
    [
      canEdit,
      actions,
      updateActionStatut,
      updateActionPilotes,
      updateActionServices,
      updateActionExplication,
    ]
  );

  return { columns };
}
