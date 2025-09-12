import ActionsGroupeesMenu from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/ActionsGroupeesMenu';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from '@/app/app/paths';
import { FichesListEmpty } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.empty';
import { FiltersMenuButton } from '@/app/plans/fiches/list-all-fiches/filters/filters-menu.button';
import { CustomFilterBadges } from '@/app/ui/lists/filter-badges/use-filters-to-badges';

import { useCurrentCollectivite } from '@/api/collectivites/collectivite-context';
import { useListFilteredFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ListFichesSortValue } from '@/domain/plans/fiches';
import { PermissionLevelEnum } from '@/domain/users';
import {
  Checkbox,
  EmptyCard,
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
  useFicheActionPagination,
  useFicheActionSearch,
  useFicheActionSelection,
  useFicheActionSorting,
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
  numberOfItemsPerPage = 15,
  enableGroupedActions = false,
  isReadOnly,
  containerClassName,
  displayEditionMenu = false,
  onUnlink,
  filters,
}: Props) => {
  const { sort, sortOptions, handleSortChange } =
    useFicheActionSorting(defaultSort);

  const { search, debouncedSearch, handleSearchChange, handleSearchSubmit } =
    useFicheActionSearch();

  const { currentPage, setCurrentPage, resetPagination } =
    useFicheActionPagination(filters, debouncedSearch);

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
  const { data, isLoading } = useListFilteredFiches(
    collectivite.collectiviteId,
    {
      filters: filtersWithSearch,
      queryOptions: {
        page: currentPage,
        limit: numberOfItemsPerPage,
        sort: [{ field: sort.field, direction: sort.direction }],
      },
    }
  );
  const { fiches, count: countTotal } = data ?? { count: 0, fiches: [] };
  const hasFiches = (data?.fiches?.length ?? 0) > 0;

  const {
    selectedFicheIds,
    handleSelectFiche,
    handleSelectAll,
    isSelectAllMode,
    isFicheSelected,
    toggleGroupedActionsMode,
    isGroupedActionsModeActive,
  } = useFicheActionSelection(currentPage);

  const searchIsActive = isSearchActive(filters, debouncedSearch);

  const searchResultsAreEmpty =
    searchIsActive === true && hasFiches === false && isLoading === false;

  const noFichesAtAll =
    hasFiches === false && isLoading === false && searchIsActive === false;

  const isAdmin = collectivite.niveauAcces === PermissionLevelEnum.ADMIN;

  const { canUserModifyFiche } = useFichesAccessRights(
    collectivite.niveauAcces === PermissionLevelEnum.LECTURE,
    collectivite.niveauAcces === PermissionLevelEnum.EDITION,
    isAdmin
  );

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

            <VisibleWhen condition={enableGroupedActions && !isReadOnly}>
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
              onSearch={handleSearchSubmit}
              value={search}
              containerClassname="w-full xl:w-96"
              placeholder="Rechercher par nom ou description"
              displaySize="sm"
            />
            <FiltersMenuButton />
          </div>
        </div>

        <VisibleWhen condition={isGroupedActionsModeActive && !isReadOnly}>
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
                onChange={(evt) =>
                  handleSelectAll(evt.currentTarget.checked, isAdmin)
                }
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
      <VisibleWhen condition={isLoading}>
        <div className="grow flex items-center justify-center">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      </VisibleWhen>
      <VisibleWhen condition={isLoading === false}>
        <div>
          <VisibleWhen condition={searchResultsAreEmpty}>
            <EmptyCard
              picto={(props) => <PictoExpert {...props} />}
              title="Aucune fiche action ne correspond à votre recherche"
              variant="transparent"
            />
          </VisibleWhen>
          <VisibleWhen condition={searchResultsAreEmpty === false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fiches?.map((fiche) => (
                <FicheActionCard
                  key={fiche.id}
                  ficheAction={fiche}
                  isEditable={displayEditionMenu}
                  onUnlink={onUnlink ? () => onUnlink(fiche.id) : undefined}
                  onSelect={
                    isGroupedActionsModeActive
                      ? () => handleSelectFiche(fiche.id)
                      : undefined
                  }
                  isSelected={isFicheSelected(fiche.id)}
                  editKeysToInvalidate={[
                    [
                      'fiches_resume_collectivite',
                      collectivite.collectiviteId,
                      {
                        filters,
                        queryOptions: {
                          page: currentPage,
                          limit: numberOfItemsPerPage,
                          sort: [
                            { field: sort.field, direction: sort.direction },
                          ],
                        },
                      },
                    ],
                  ]}
                  link={
                    fiche.plans?.[0]?.id
                      ? makeCollectivitePlanActionFicheUrl({
                          collectiviteId: collectivite.collectiviteId,
                          ficheUid: fiche.id.toString(),
                          planActionUid: fiche.plans?.[0]?.id.toString(),
                        })
                      : makeCollectiviteFicheNonClasseeUrl({
                          collectiviteId: collectivite.collectiviteId,
                          ficheUid: fiche.id.toString(),
                        })
                  }
                  currentCollectivite={collectivite}
                />
              ))}
            </div>

            <Pagination
              className="mx-auto mt-16"
              selectedPage={currentPage}
              nbOfElements={countTotal}
              maxElementsPerPage={numberOfItemsPerPage}
              idToScrollTo="app-header"
              onChange={setCurrentPage}
            />
          </VisibleWhen>
        </div>
      </VisibleWhen>
      <ActionsGroupeesMenu
        selectedFicheIds={selectedFicheIds}
        isVisible={isGroupedActionsModeActive}
        filters={filtersWithSearch}
        sort={[{ field: sort.field, direction: sort.direction }]}
      />
    </div>
  );
};
