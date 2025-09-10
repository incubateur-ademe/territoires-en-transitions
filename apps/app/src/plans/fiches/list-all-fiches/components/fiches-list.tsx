import ActionsGroupeesMenu from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/ActionsGroupeesMenu';
import { FiltersMenuButton } from '@/app/plans/fiches/list-all-fiches/filters/filters-menu.button';
import { CustomFilterBadges } from '@/app/ui/lists/filter-badges/use-filters-to-badges';

import { FichesListEmpty } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.empty';
import { FichesListGrid } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.grid';
import { FicheListScheduler } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.scheduler/fiche-list.scheduler';
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
  useFicheActionGroupedActions,
  useFicheActionPagination,
  useFicheActionSearch,
  useFicheActionSelection,
  useFicheActionSorting,
  useGetFiches,
} from '../hooks';
import { FilterBadges } from './filter-badges';

type Props = {
  filters: FormFilters;
  customFilterBadges?: CustomFilterBadges;
  resetFilters?: () => void;
  numberOfItemsPerPage?: number;
  defaultSort?: ListFichesSortValue;
  enableGroupedActions?: boolean;
  isReadOnly?: boolean;
  containerClassName?: string;
  displayEditionMenu?: boolean;
  onUnlink?: (ficheId: number) => void;
};

export const FichesList = ({
  defaultSort = 'titre',
  numberOfItemsPerPage = 15,
  enableGroupedActions = false,
  isReadOnly,
  containerClassName,
  displayEditionMenu = false,
  onUnlink,
  filters,
}: Props) => {
  const [view, setView] = useState<'grid' | 'scheduler'>('grid');

  const isGroupedActionsEnabled =
    enableGroupedActions && !isReadOnly && view !== 'scheduler';

  const { sort, sortOptions, handleSortChange } =
    useFicheActionSorting(defaultSort);

  const { search, debouncedSearch, handleSearchChange, handleSearchSubmit } =
    useFicheActionSearch();

  const { currentPage, setCurrentPage, resetPagination } =
    useFicheActionPagination(filters, debouncedSearch);

  const [lastFilters, setLastFilters] = useState(filters);

  if (!isEqual(lastFilters, filters)) {
    setLastFilters(filters);
    resetPagination();
  }
  const { ficheResumes, isLoading, hasFiches, countTotal, collectivite } =
    useGetFiches(
      fromFormFiltersToFilters(filters),
      currentPage,
      numberOfItemsPerPage,
      sort,
      debouncedSearch
    );

  const { isGroupedActionsOn, handleGroupedActionsToggle } =
    useFicheActionGroupedActions();

  const {
    selectedFicheIds,
    handleSelectFiche,
    handleSelectAll,
    resetSelection,
    selectAll,
  } = useFicheActionSelection(ficheResumes, currentPage);

  if (!hasFiches && !isLoading) {
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
                checked={isGroupedActionsOn}
                onChange={(evt) => {
                  if (isGroupedActionsOn) {
                    resetSelection();
                  }
                  handleGroupedActionsToggle(evt.currentTarget.checked);
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
              onSearch={handleSearchSubmit}
              value={search}
              containerClassname="w-full xl:w-96"
              placeholder="Rechercher par nom ou description"
              displaySize="sm"
            />
            {/** Change view buttons */}
            {!isReadOnly && (
              <ButtonGroup
                activeButtonId={view}
                size="sm"
                buttons={[
                  {
                    id: 'grid',
                    icon: 'grid-line',
                    children: 'Carte',
                    onClick: () => setView('grid'),
                  },
                  {
                    id: 'scheduler',
                    icon: 'calendar-line',
                    children: 'Calendrier',
                    onClick: () => setView('scheduler'),
                  },
                ]}
              />
            )}

            <FiltersMenuButton />
          </div>
        </div>

        <VisibleWhen condition={isGroupedActionsEnabled}>
          <div
            className={classNames(
              'relative flex justify-between py-5 border-b border-primary-3 transition-all duration-500',
              {
                '-translate-y-full -mb-16': !isGroupedActionsOn,
                'translate-y-0 mb-0': isGroupedActionsOn,
              }
            )}
          >
            <div className="flex items-center gap-4">
              <Checkbox
                label="Sélectionner toutes les actions"
                checked={selectAll}
                onChange={(evt) => handleSelectAll(evt.currentTarget.checked)}
                disabled={isLoading || !ficheResumes?.data?.length}
              />
            </div>
            <div className="text-grey-7 font-medium">
              <span className="text-primary-9">{`${
                (selectedFicheIds ?? []).length
              } action${
                (selectedFicheIds ?? []).length > 1 ? 's' : ''
              } sélectionnée${
                (selectedFicheIds ?? []).length > 1 ? 's' : ''
              }`}</span>
              {` / ${countTotal} action${countTotal > 1 ? 's' : ''}`}
            </div>
          </div>
        </VisibleWhen>
      </div>

      <FilterBadges />

      {/** Listes des fiches, affichage en fonction de la vue sélectionnée */}

      {view === 'scheduler' && (
        <FicheListScheduler
          fiches={ficheResumes?.data ?? []}
          isLoading={isLoading}
        />
      )}
      {view === 'grid' && (
        <FichesListGrid
          collectivite={collectivite}
          fiches={ficheResumes?.data ?? []}
          isLoading={isLoading}
          displayEditionMenu={displayEditionMenu}
          isGroupedActionsOn={isGroupedActionsOn}
          selectedFicheIds={selectedFicheIds}
          onUnlink={onUnlink}
          handleSelectFiche={handleSelectFiche}
        />
      )}

      <Pagination
        className="mx-auto mt-6"
        selectedPage={currentPage}
        nbOfElements={countTotal}
        maxElementsPerPage={numberOfItemsPerPage}
        idToScrollTo="app-header"
        onChange={setCurrentPage}
      />

      <ActionsGroupeesMenu {...{ isGroupedActionsOn, selectedFicheIds }} />
    </div>
  );
};
