import ActionsGroupeesMenu from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/ActionsGroupeesMenu';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from '@/app/app/paths';
import { FichesListEmpty } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.empty';
import { FiltersMenuButton } from '@/app/plans/fiches/list-all-fiches/filters/filters-menu.button';
import { CustomFilterBadges } from '@/app/ui/lists/filter-badges/use-filters-to-badges';
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
  useFicheActionGroupedActions,
  useFicheActionPagination,
  useFicheActionSearch,
  useFicheActionSelection,
  useFicheActionSorting,
  useFichesAccessRights,
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

  const isAdmin = collectivite.niveauAcces === PermissionLevelEnum.ADMIN;

  const { canUserModifyFiche } = useFichesAccessRights(
    collectivite.niveauAcces === PermissionLevelEnum.LECTURE,
    collectivite.niveauAcces === PermissionLevelEnum.EDITION,
    isAdmin
  );

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

            <VisibleWhen condition={enableGroupedActions && !isReadOnly}>
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
            <FiltersMenuButton />
          </div>
        </div>

        <VisibleWhen condition={enableGroupedActions && !isReadOnly}>
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
                onChange={(evt) =>
                  handleSelectAll(evt.currentTarget.checked, isAdmin)
                }
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

      {isLoading ? (
        /** État de chargement */
        <div className="grow flex items-center justify-center">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      ficheResumes?.data?.length === 0 ? (
        <EmptyCard
          picto={(props) => <PictoExpert {...props} />}
          title="Aucune fiche action ne correspond à votre recherche"
          variant="transparent"
        />
      ) : (
        /** Liste des fiches actions */
        // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ficheResumes?.data?.map((fiche) => (
              <FicheActionCard
                key={fiche.id}
                ficheAction={fiche}
                isEditable={displayEditionMenu && canUserModifyFiche(fiche)}
                onUnlink={onUnlink ? () => onUnlink(fiche.id) : undefined}
                onSelect={
                  isGroupedActionsOn && canUserModifyFiche(fiche)
                    ? () => handleSelectFiche(fiche.id)
                    : undefined
                }
                isSelected={!!selectedFicheIds?.includes(fiche.id)}
                editKeysToInvalidate={[
                  [
                    'fiches_resume_collectivite',
                    collectivite?.collectiviteId,
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
                  !isGroupedActionsOn
                    ? fiche.plans?.[0]?.id
                      ? makeCollectivitePlanActionFicheUrl({
                          collectiviteId: collectivite?.collectiviteId,
                          ficheUid: fiche.id.toString(),
                          planActionUid: fiche.plans?.[0]?.id.toString(),
                        })
                      : makeCollectiviteFicheNonClasseeUrl({
                          collectiviteId: collectivite?.collectiviteId,
                          ficheUid: fiche.id.toString(),
                        })
                    : undefined
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
        </div>
      )}

      <ActionsGroupeesMenu {...{ isGroupedActionsOn, selectedFicheIds }} />
    </div>
  );
};
