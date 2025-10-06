import ActionsGroupeesMenu from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/ActionsGroupeesMenu';
import { FiltersMenuButton } from '@/app/plans/fiches/list-all-fiches/filters/filters-menu.button';
import { CustomFilterBadges } from '@/app/ui/lists/filter-badges/use-filters-to-badges';

import { useCurrentCollectivite } from '@/api/collectivites/collectivite-context';
import { FichesListEmpty } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.empty';
import { FichesListGrid } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.grid';
import { FicheListScheduler } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.scheduler/fiche-list.scheduler';
import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { ListFichesSortValue } from '@/domain/plans/fiches';
import {
  ButtonGroup,
  Checkbox,
  Input,
  Pagination,
  Select,
  VisibleWhen,
} from '@/ui';
import classNames from 'classnames';
import { isEqual } from 'es-toolkit';
import { useState } from 'react';
import { fromFormFiltersToFilters } from '../filters/filter-converter';
import { FormFilters } from '../filters/types';
import {
  FicheActionViewOptions,
  useSelectFichesView,
} from '../hooks/use-select-fiche-view';

import { useManageFichesPagination } from '../hooks/use-manage-fiches-pagination';
import { useSearchFiches } from '../hooks/use-search-fiches';
import { useSelectFiches } from '../hooks/use-select-fiches';
import { useSortFiches } from '../hooks/use-sort-fiches';
import { FilterBadges } from './filter-badges';

type Props = {
  filters: FormFilters;
  customFilterBadges?: CustomFilterBadges;
  resetFilters?: () => void;
  defaultSort?: ListFichesSortValue;
  isReadOnly?: boolean;
  containerClassName?: string;
  displayEditionMenu?: boolean;
  onUnlink?: (ficheId: number) => void;
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

const NUMBER_OF_FICHE_PER_PAGE = 15;

export const FichesList = ({
  defaultSort = 'titre',
  isReadOnly,
  containerClassName,
  displayEditionMenu = false,
  onUnlink,
  filters,
}: Props) => {
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

  const [previousFilters, setPreviousFilters] = useState(filters);

  if (!isEqual(previousFilters, filters)) {
    setPreviousFilters(filters);
    resetPagination();
  }

  const collectivite = useCurrentCollectivite();
  const filtersWithSearch = {
    ...fromFormFiltersToFilters(filters),
    texteNomOuDescription: debouncedSearch,
  };
  const {
    fiches,
    count: countTotal,
    isLoading,
  } = useListFiches(collectivite.collectiviteId, {
    filters: filtersWithSearch,
    queryOptions: {
      page: currentPage,
      limit: NUMBER_OF_FICHE_PER_PAGE,
      sort: [sort],
    },
  });
  const hasFiches = fiches.length > 0;

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
    isReadOnly: isReadOnly ?? false,
  });

  const searchIsActive = isSearchActive(filters, debouncedSearch);

  const noFichesAtAll =
    hasFiches === false && isLoading === false && searchIsActive === false;

  if (noFichesAtAll) {
    return (
      <FichesListEmpty
        isReadOnly={isReadOnly ?? false}
        collectiviteId={collectivite.collectiviteId}
      />
    );
  }

  return (
    <div
      className={classNames(
        'grow flex flex-col gap-8 bg-grey-2',
        containerClassName
      )}
    >
      <div className="relative bg-inherit">
        <div className="relative z-[1] bg-inherit flex flex-wrap justify-between items-center gap-4 py-6 border-y border-primary-3">
          <div className="flex gap-x-8 gap-y-4 items-center">
            <Select
              options={sortOptions}
              onChange={(selectedOption) =>
                handleSortChange(`${selectedOption}`)
              }
              values={sort.field}
              customItem={(v) => <span className="text-grey-8">{v.label}</span>}
              disabled={sortOptions.length === 1}
              small
            />

            <VisibleWhen condition={isGroupedActionsEnabled}>
              <Checkbox
                label="Actions groupées"
                variant="switch"
                labelClassname="text-sm text-grey-7 font-normal whitespace-nowrap"
                checked={isGroupedActionsModeActive}
                onChange={(evt) => {
                  toggleGroupedActionsMode(evt.currentTarget.checked);
                }}
                disabled={isLoading}
              />
            </VisibleWhen>
          </div>

          <div className="flex gap-x-8 gap-y-4">
            <Input
              type="search"
              className="min-w-96"
              onChange={(e) => handleSearchChange(e.target.value)}
              onSearch={(v) => {
                handleSearchSubmit(v);
                resetPagination();
              }}
              value={search}
              containerClassname="w-full xl:w-96"
              placeholder="Rechercher par nom ou description"
              displaySize="sm"
            />

            {!isReadOnly && (
              <ButtonGroup
                activeButtonId={view}
                size="sm"
                buttons={[
                  {
                    id: 'grid',
                    icon: 'grid-line',
                    children: 'Carte',
                    onClick: () => handleChangeView('grid'),
                  },
                  {
                    id: 'scheduler',
                    icon: 'calendar-line',
                    children: 'Calendrier',
                    onClick: () => handleChangeView('scheduler'),
                  },
                ]}
              />
            )}

            <FiltersMenuButton />
          </div>
        </div>

        <VisibleWhen
          condition={isGroupedActionsModeActive && isGroupedActionsEnabled}
        >
          <div
            className={classNames(
              'relative flex justify-between py-5 border-b border-primary-3 transition-all duration-500',
              {
                '-translate-y-full -mb-16': !isGroupedActionsModeActive,
                'translate-y-0 mb-0': isGroupedActionsModeActive,
              }
            )}
          >
            <div className="flex items-center gap-4">
              <Checkbox
                label="Sélectionner toutes les actions"
                checked={isSelectAllMode}
                onChange={(evt) => handleSelectAll(evt.currentTarget.checked)}
                disabled={isLoading || !fiches?.length}
              />
            </div>
            <div className="text-grey-7 font-medium">
              <span className="text-primary-9">{`${
                isSelectAllMode ? countTotal : selectedFicheIds.length || 0
              } action${
                (isSelectAllMode ? countTotal : selectedFicheIds.length) > 1
                  ? 's'
                  : ''
              } sélectionnée${
                (isSelectAllMode ? countTotal : selectedFicheIds.length) > 1
                  ? 's'
                  : ''
              }`}</span>
              {` / ${countTotal} action${
                countTotal ? (countTotal > 1 ? 's' : '') : ''
              }`}
            </div>
          </div>
        </VisibleWhen>
      </div>

      <FilterBadges />

      {/** Listes des fiches, affichage en fonction de la vue sélectionnée */}

      {view === 'scheduler' && (
        <FicheListScheduler
          fiches={fiches ?? []}
          isLoading={isLoading}
          fichesPerPage={NUMBER_OF_FICHE_PER_PAGE}
        />
      )}
      {view === 'grid' && (
        <FichesListGrid
          collectivite={collectivite}
          fiches={fiches ?? []}
          isLoading={isLoading}
          displayEditionMenu={displayEditionMenu}
          isGroupedActionsOn={isGroupedActionsModeActive}
          selectedFicheIds={selectedFicheIds}
          onUnlink={onUnlink}
          handleSelectFiche={handleSelectFiche}
        />
      )}

      <Pagination
        className="mx-auto mt-6"
        selectedPage={currentPage}
        nbOfElements={countTotal}
        maxElementsPerPage={NUMBER_OF_FICHE_PER_PAGE}
        idToScrollTo={view === 'scheduler' ? 'fa-scheduler' : 'app-header'}
        onChange={setCurrentPage}
      />

      <ActionsGroupeesMenu
        selectedFicheIds={selectedFicheIds}
        isVisible={isGroupedActionsModeActive}
        filters={filtersWithSearch}
        sort={[{ field: sort.field, direction: sort.direction }]}
      />
    </div>
  );
};
