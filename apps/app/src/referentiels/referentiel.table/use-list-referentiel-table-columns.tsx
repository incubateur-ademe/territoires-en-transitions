import { createColumnHelper } from '@tanstack/react-table';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { divisionOrZero } from '@tet/domain/utils';
import { cn, TableHeaderCell } from '@tet/ui';
import { useMemo } from 'react';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ActionListItem } from '../actions/use-list-actions';
import { useUpsertMesurePilotes } from '../actions/use-mesure-pilotes';
import { useUpsertMesureServicesPilotes } from '../actions/use-mesure-services-pilotes';
import { useUpdateActionExplication } from '../actions/use-update-action-explication';
import { ReferentielTableCategorieCell } from './referentiel-table.categorie.cell';
import { ReferentielTableCommentsCell } from './referentiel-table.comments.cell';
import { ReferentielTableDescriptionCell } from './referentiel-table.description.cell';
import { ReferentielTableDocumentsCell } from './referentiel-table.documents.cell';
import { ReferentielTableExplicationCell } from './referentiel-table.explication.cell';
import { ReferentielTableFichesCell } from './referentiel-table.fiches.cell';
import {
  getCategorieFilterFn,
  getExplicationFilterFn,
  getPilotesFilterFn,
  getScoreRangeFilterFn,
  getServicesFilterFn,
  getStatutFilterFn,
} from './referentiel-table.filters.utils';
import {
  CategorieHeaderFilter,
  ExplicationHeaderFilter,
  IntituleHeaderFilter,
  PilotesHeaderFilter,
  ScoreRangeHeaderFilter,
  ServicesHeaderFilter,
  StatutHeaderFilter,
} from './referentiel-table.header-filters';
import { ReferentielTablePersonnesPilotesCell } from './referentiel-table.personnes-pilotes.cell';
import { ReferentielTablePointsCell } from './referentiel-table.points.cell';
import { ReferentielTableProgressionCell } from './referentiel-table.progression.cell';
import { ReferentielTableServicesPilotesCell } from './referentiel-table.services-pilotes.cell';
import { ReferentielTableStatutDetailleCell } from './referentiel-table.statut-detaille.cell';
import { ReferentielTableStatutCell } from './referentiel-table.statut.cell';
import { ReferentielTableTitleCell } from './referentiel-table.title.cell';
import { useGetReferentielTableFiltersState } from './use-get-referentiel-table-filters-state';

const columnHelper = createColumnHelper<ActionListItem>();

const getColumns = ({
  canEdit,
  actions,
  filtersState,
  updateActionStatut,
  updateActionPilotes,
  updateActionServices,
  updateActionExplication,
}: {
  canEdit: boolean;
  actions: Record<string, ActionListItem>;
  filtersState: ReturnType<typeof useGetReferentielTableFiltersState>;
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
      <TableHeaderCell
        title="Intitulé"
        className={cn('w-[32rem] bg-white')}
        filter={
          <IntituleHeaderFilter
            filters={filtersState.filters}
            setFilters={filtersState.setFilters}
          />
        }
      />
    ),
    cell: (info) => <ReferentielTableTitleCell info={info} />,
  }),

  columnHelper.accessor('description', {
    id: 'description',
    header: () => (
      <TableHeaderCell title="Description" className={cn('w-[24rem]')} />
    ),
    cell: (info) => <ReferentielTableDescriptionCell info={info} />,
  }),

  columnHelper.accessor('categorie', {
    id: 'categorie',
    header: () => (
      <TableHeaderCell
        title="Phase"
        className={cn('w-32')}
        titleClassName="m-auto"
        filter={
          <CategorieHeaderFilter
            filters={filtersState.filters}
            setFilters={filtersState.setFilters}
          />
        }
      />
    ),
    cell: (info) => <ReferentielTableCategorieCell info={info} />,
    filterFn: getCategorieFilterFn(actions),
  }),

  columnHelper.accessor((row) => row.score.pointPotentiel, {
    id: 'pointPotentiel',
    header: () => (
      <TableHeaderCell
        title="Potentiel personnalisé"
        className={cn('w-32')}
        titleClassName="m-auto text-center"
      />
    ),
    cell: (info) => (
      <ReferentielTablePointsCell
        value={info.getValue()}
        statut={info.row.original.score.statut}
        cellId={info.cell.id}
      />
    ),
  }),

  columnHelper.accessor((row) => row.score.pointReferentiel, {
    id: 'pointReferentiel',
    header: () => (
      <TableHeaderCell
        title="Potentiel max"
        className={cn('w-32')}
        titleClassName="m-auto text-center"
      />
    ),
    cell: (info) => (
      <ReferentielTablePointsCell
        value={info.getValue()}
        statut={info.row.original.score.statut}
        cellId={info.cell.id}
      />
    ),
  }),

  columnHelper.display({
    id: 'progression',
    header: () => (
      <TableHeaderCell title="Progression" className={cn('w-48')} />
    ),
    cell: ({ row, cell }) => (
      <ReferentielTableProgressionCell row={row.original} cell={cell} />
    ),
  }),

  columnHelper.accessor((row) => row.score.pointNonRenseigne, {
    id: 'pointNonRenseigne',
    header: () => (
      <TableHeaderCell
        title="Points restants"
        className={cn('w-28')}
        titleClassName="m-auto text-center"
      />
    ),
    cell: (info) => (
      <ReferentielTablePointsCell
        value={info.getValue()}
        statut={info.row.original.score.statut}
        cellId={info.cell.id}
      />
    ),
  }),

  columnHelper.accessor((row) => row.score.pointFait, {
    id: 'pointFait',
    header: () => (
      <TableHeaderCell
        title="Points faits"
        className={cn('w-28')}
        titleClassName="m-auto text-center"
      />
    ),
    cell: (info) => (
      <ReferentielTablePointsCell
        value={info.getValue()}
        statut={info.row.original.score.statut}
        cellId={info.cell.id}
      />
    ),
  }),

  columnHelper.accessor(
    (row) => divisionOrZero(row.score.pointFait, row.score.pointPotentiel),
    {
      id: 'scoreRealise',
      header: () => (
        <TableHeaderCell
          title="% fait"
          className={cn('w-24')}
          titleClassName="m-auto text-center"
          filter={
            <ScoreRangeHeaderFilter
              filters={filtersState.filters}
              setFilters={filtersState.setFilters}
              filterKey="scoreRealise"
            />
          }
        />
      ),
      cell: (info) => (
        <ReferentielTablePointsCell
          value={info.getValue()}
          statut={info.row.original.score.statut}
          percentage
          cellId={info.cell.id}
        />
      ),
      filterFn: getScoreRangeFilterFn,
    }
  ),

  columnHelper.accessor((row) => row.score.pointProgramme, {
    id: 'pointProgramme',
    header: () => (
      <TableHeaderCell
        title="Points programmés"
        className={cn('w-28')}
        titleClassName="m-auto text-center"
      />
    ),
    cell: (info) => (
      <ReferentielTablePointsCell
        value={info.getValue()}
        statut={info.row.original.score.statut}
        cellId={info.cell.id}
      />
    ),
  }),

  columnHelper.accessor(
    (row) => divisionOrZero(row.score.pointProgramme, row.score.pointPotentiel),
    {
      id: 'scoreProgramme',
      header: () => (
        <TableHeaderCell
          title="% prog."
          className={cn('w-24')}
          titleClassName="m-auto text-center"
          filter={
            <ScoreRangeHeaderFilter
              filters={filtersState.filters}
              setFilters={filtersState.setFilters}
              filterKey="scoreProgramme"
            />
          }
        />
      ),
      cell: (info) => (
        <ReferentielTablePointsCell
          value={info.getValue()}
          statut={info.row.original.score.statut}
          percentage
          cellId={info.cell.id}
        />
      ),
      filterFn: getScoreRangeFilterFn,
    }
  ),

  columnHelper.accessor((row) => row.score.pointPasFait, {
    id: 'pointPasFait',
    header: () => (
      <TableHeaderCell
        title="Points pas faits"
        className={cn('w-28')}
        titleClassName="m-auto text-center"
      />
    ),
    cell: (info) => (
      <ReferentielTablePointsCell
        value={info.getValue()}
        statut={info.row.original.score.statut}
        cellId={info.cell.id}
      />
    ),
  }),

  columnHelper.accessor(
    (row) => divisionOrZero(row.score.pointPasFait, row.score.pointPotentiel),
    {
      id: 'scorePasFait',
      header: () => (
        <TableHeaderCell
          title="% pas fait"
          className={cn('w-28')}
          titleClassName="m-auto text-center"
          filter={
            <ScoreRangeHeaderFilter
              filters={filtersState.filters}
              setFilters={filtersState.setFilters}
              filterKey="scorePasFait"
            />
          }
        />
      ),
      cell: (info) => (
        <ReferentielTablePointsCell
          percentage
          value={info.getValue()}
          statut={info.row.original.score.statut}
          cellId={info.cell.id}
        />
      ),
      filterFn: getScoreRangeFilterFn,
    }
  ),

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
      <TableHeaderCell
        title="Statut"
        className={cn('w-56')}
        filter={
          <StatutHeaderFilter
            filters={filtersState.filters}
            setFilters={filtersState.setFilters}
          />
        }
      />
    ),
    cell: (info) => (
      <ReferentielTableStatutCell
        info={info}
        updateActionStatut={updateActionStatut}
      />
    ),
    filterFn: getStatutFilterFn,
  }),

  columnHelper.accessor('score.explication', {
    id: 'explication',
    header: () => (
      <TableHeaderCell
        title="État d'avancement"
        className={cn('w-[32rem]')}
        filter={
          <ExplicationHeaderFilter
            filters={filtersState.filters}
            setFilters={filtersState.setFilters}
          />
        }
      />
    ),
    cell: (info) => (
      <ReferentielTableExplicationCell
        info={info}
        canEdit={canEdit}
        updateActionExplication={updateActionExplication}
      />
    ),
    filterFn: getExplicationFilterFn,
  }),

  columnHelper.accessor('pilotes', {
    header: () => (
      <TableHeaderCell
        title="Pilotes"
        className={cn('w-52')}
        filter={
          <PilotesHeaderFilter
            filters={filtersState.filters}
            setFilters={filtersState.setFilters}
          />
        }
      />
    ),
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
        title="Service ou direction"
        className={cn('w-52')}
        filter={
          <ServicesHeaderFilter
            filters={filtersState.filters}
            setFilters={filtersState.setFilters}
          />
        }
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

  columnHelper.display({
    id: 'fiches',
    header: () => (
      <TableHeaderCell title="Actions liées" className={cn('w-32')} />
    ),
    cell: (info) => <ReferentielTableFichesCell info={info} />,
  }),
];

export function useListReferentielTableColumns(
  actions: Record<string, ActionListItem>,
  filtersState: ReturnType<typeof useGetReferentielTableFiltersState>
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
        filtersState,
        updateActionStatut,
        updateActionPilotes,
        updateActionServices,
        updateActionExplication,
      }),
    [
      canEdit,
      actions,
      filtersState,
      updateActionStatut,
      updateActionPilotes,
      updateActionServices,
      updateActionExplication,
    ]
  );

  return { columns };
}
