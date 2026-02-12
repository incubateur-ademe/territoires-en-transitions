import ActionsGroupeesMenu from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/ActionsGroupeesMenu';
import { CustomFilterBadges } from '@/app/ui/lists/DEPRECATED_filter-badges/use-filters-to-badges';

import { FichesListEmpty } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.empty';
import { FichesListGrid } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.grid';
import { FicheListScheduler } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.scheduler/fiche-list.scheduler';
import {
  SortValue,
  useListFiches,
} from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Pagination, useEventTracker } from '@tet/ui';
import classNames from 'classnames';
import { isEqual } from 'es-toolkit';
import { useState } from 'react';
import { fromFormFiltersToFilters } from '../filters/filter-converter';
import { FormFilters } from '../filters/types';
import {
  FicheActionViewOptions,
  useSelectFichesView,
} from '../hooks/use-select-fiche-view';

import { useUser } from '@tet/api/users';
import { useCountFiches } from '../hooks/use-count-fiches';
import { useManageFichesPagination } from '../hooks/use-manage-fiches-pagination';
import { useSearchFiches } from '../hooks/use-search-fiches';
import { useSelectFiches } from '../hooks/use-select-fiches';
import { useSortFiches } from '../hooks/use-sort-fiches';
import { FichesListTable } from './fiches-list.table/fiches-list.table';
import { HeaderFicheList } from './header-fiche-list';

const fichesPerPageByView: Record<FicheActionViewOptions, number> = {
  grid: 15,
  scheduler: 15,
  table: 50,
};

type Props = {
  filters: FormFilters;
  customFilterBadges?: CustomFilterBadges;
  resetFilters?: () => void;
  defaultSort?: SortValue;
  containerClassName?: string;
  displayEditionMenu?: boolean;
  onUnlink?: (ficheId: number) => void;
  displayHeader?: boolean;
};

const isSearchActive = (
  filters: FormFilters,
  debouncedSearch: string | undefined
) => {
  const { noPlan, sort, ...rest } = filters;
  const atLeastOneFilterIsSet = Object.values(rest).find(
    (value) => value !== undefined
  );
  return atLeastOneFilterIsSet !== undefined || !!debouncedSearch;
};

export const FichesList = ({
  defaultSort = 'titre',
  containerClassName,
  displayEditionMenu = false,
  displayHeader = true,
  onUnlink,
  filters,
}: Props) => {
  const trackEvent = useEventTracker();

  const collectivite = useCurrentCollectivite();
  const { hasCollectivitePermission } = collectivite;

  const { view, setView } = useSelectFichesView('grid');

  const handleChangeView = (view: FicheActionViewOptions) => {
    setView(view);
    resetPagination();
  };

  const { sort, sortOptions, handleSortChange } = useSortFiches(defaultSort);

  const { search, debouncedSearch, handleSearchChange, handleSearchSubmit } =
    useSearchFiches();

  const { currentPage, setCurrentPage, resetPagination } =
    useManageFichesPagination(filters);

  const fichesPerPage = fichesPerPageByView[view];

  const [previousFilters, setPreviousFilters] = useState(filters);

  if (!isEqual(previousFilters, filters)) {
    setPreviousFilters(filters);
    resetPagination();
  }

  const user = useUser();

  const filtersWithSearch = {
    ...fromFormFiltersToFilters(filters),
    texteNomOuDescription: debouncedSearch,
    hasAtLeastBeginningOrEndDate: view === 'scheduler',
  };
  const {
    fiches,
    count: countTotal,
    isLoading,
  } = useListFiches(collectivite.collectiviteId, {
    filters: filtersWithSearch,
    queryOptions: {
      page: currentPage,
      limit: fichesPerPage,
      sort: [sort],
    },
  });

  const {
    selectedFicheIds,
    handleSelectFiche,
    handleSelectAll,
    isSelectAllMode,
    toggleGroupedActionsMode,
    isGroupedActionsModeActive,
    isGroupedActionsEnabled,
  } = useSelectFiches({
    view,
    currentPage,
    collectivite,
  });

  const searchIsActive = isSearchActive(filters, debouncedSearch);

  /** Doit être récupéré indépendamment de fiches car pour la vue calendaire,
   *  les fiches sans date sont filtrées, on se retrouve donc avec <FichesListEmpty />
   *  qui fait disparaitre le bouton de changement de vue, même si la collectivité a des fiches
   *  visibles dans les vues Carte et Tableau. */
  const { countTotalFiches: countTotalCollectiviteFiches } = useCountFiches();

  const noFichesAtAll =
    countTotalCollectiviteFiches === 0 && !isLoading && !searchIsActive;

  if (noFichesAtAll) {
    return (
      <FichesListEmpty hasCollectivitePermission={hasCollectivitePermission} />
    );
  }

  return (
    <div
      className={classNames(
        'grow flex flex-col gap-8 bg-grey-2',
        containerClassName
      )}
    >
      {displayHeader ? (
        <HeaderFicheList
          sort={sort}
          sortOptions={sortOptions}
          handleSortChange={handleSortChange}
          isGroupedActionsEnabled={isGroupedActionsEnabled}
          isGroupedActionsModeActive={isGroupedActionsModeActive}
          toggleGroupedActionsMode={toggleGroupedActionsMode}
          isLoading={isLoading}
          search={search}
          handleSearchChange={handleSearchChange}
          handleSearchSubmit={handleSearchSubmit}
          resetPagination={resetPagination}
          view={view}
          handleChangeView={handleChangeView}
          trackEvent={trackEvent}
          isReadOnly={!hasCollectivitePermission('plans.fiches.update')}
          isSelectAllMode={isSelectAllMode}
          handleSelectAll={handleSelectAll}
          selectedFicheIds={selectedFicheIds}
          countTotal={countTotal}
          fiches={fiches}
        />
      ) : null}

      {/** Listes des fiches, affichage en fonction de la vue sélectionnée */}

      {view === 'scheduler' && (
        <FicheListScheduler
          fiches={fiches ?? []}
          isLoading={isLoading}
          fichesPerPage={fichesPerPage}
        />
      )}

      {view === 'grid' && (
        <FichesListGrid
          collectivite={collectivite}
          currentUserId={user.id}
          fiches={fiches ?? []}
          isLoading={isLoading}
          displayEditionMenu={displayEditionMenu}
          isGroupedActionsOn={isGroupedActionsModeActive}
          selectedFicheIds={selectedFicheIds}
          handleSelectFiche={handleSelectFiche}
          onUnlink={onUnlink}
        />
      )}

      {view === 'table' && (
        <FichesListTable
          collectivite={collectivite}
          fiches={fiches ?? []}
          isLoading={isLoading}
          isGroupedActionsOn={isGroupedActionsModeActive}
          selectedFicheIds={selectedFicheIds}
          handleSelectFiche={handleSelectFiche}
        />
      )}

      <Pagination
        className="mx-auto mt-6"
        selectedPage={currentPage}
        nbOfElements={countTotal}
        maxElementsPerPage={fichesPerPage}
        idToScrollTo={view === 'scheduler' ? 'fa-scheduler' : 'app-header'}
        onChange={setCurrentPage}
      />

      <ActionsGroupeesMenu
        selectedFicheIds={selectedFicheIds}
        isVisible={isGroupedActionsModeActive && selectedFicheIds.length > 0}
        filters={filtersWithSearch}
        sort={[{ field: sort.field, direction: sort.direction }]}
        fichesCountExportedToPDF={
          selectedFicheIds === 'all' ? countTotal : selectedFicheIds.length
        }
      />
    </div>
  );
};
