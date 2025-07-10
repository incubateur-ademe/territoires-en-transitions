import ActionsGroupeesMenu from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/ActionsGroupeesMenu';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import EmptyFichePicto from '@/app/app/pages/collectivite/PlansActions/FicheAction/FichesLiees/EmptyFichePicto';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from '@/app/app/paths';
import { FiltersMenuButton } from '@/app/plans/fiches/show-all-fiches/filters/filters-menu.button';
import { useCreatePlanAction } from '@/app/plans/plans/show-detailed-plan/data/use-upsert-axe';
import { CustomFilterBadges } from '@/app/ui/lists/filter-badges/use-filters-to-badges';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Checkbox, EmptyCard, Input, Pagination, Select } from '@/ui';
import classNames from 'classnames';
import { isEqual } from 'es-toolkit';
import { useState } from 'react';
import { Filters } from '../filters/types';
import {
  SortFicheActionSettings,
  useFicheActionGroupedActions,
  useFicheActionPagination,
  useFicheActionSearch,
  useFicheActionSelection,
  useFicheActionSorting,
  useGetFiches,
} from '../hooks';
import { FilterBadges } from './filter-badges';

const EmptyState = ({
  isReadOnly,
  collectiviteId,
}: {
  isReadOnly: boolean;
  collectiviteId: number;
}) => {
  const { mutate: createFicheAction } = useCreateFicheAction();
  const { mutate: createPlanAction } = useCreatePlanAction();

  return (
    <div className="col-span-full flex flex-col items-center p-12 text-center bg-primary-0 border border-primary-4 rounded-xl">
      <EmptyCard
        picto={(props) => <EmptyFichePicto {...props} />}
        title="Vous n'avez pas encore créé de fiche action !"
        subTitle="Une fois vos fiches action créées, vous les retrouvez toutes dans cette vue où vous pourrez les filtrer sur de nombreux critères."
        isReadonly={isReadOnly}
        actions={[
          {
            children: "Créer un plan d'action",
            onClick: () =>
              createPlanAction({
                collectivite_id: collectiviteId,
              }),
            variant: 'outlined',
          },
          {
            children: 'Créer une fiche action',
            onClick: () => createFicheAction(),
          },
        ]}
        variant="transparent"
      />
    </div>
  );
};

type Props = {
  filters: Filters;
  customFilterBadges?: CustomFilterBadges;
  resetFilters?: () => void;
  numberOfItemsPerPage?: number;
  sortSettings?: SortFicheActionSettings;
  enableGroupedActions?: boolean;
  isReadOnly?: boolean;
  containerClassName?: string;
  displayEditionMenu?: boolean;
  onUnlink?: (ficheId: number) => void;
};

export const FichesList = ({
  sortSettings = {
    defaultSort: 'modified_at',
  },
  numberOfItemsPerPage = 15,
  enableGroupedActions = false,
  isReadOnly,
  containerClassName,
  displayEditionMenu = false,
  onUnlink,
  filters,
}: Props) => {
  const { sort, sortOptions, handleSortChange } =
    useFicheActionSorting(sortSettings);

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
      filters,
      currentPage,
      numberOfItemsPerPage,
      sort,
      debouncedSearch
    );

  const {
    isGroupedActionsOn,
    handleGroupedActionsToggle,
    selectAllFeatureFlagEnabled,
  } = useFicheActionGroupedActions();

  const {
    selectedFicheIds,
    handleSelectFiche,
    handleSelectAll,
    resetSelection,
    selectAll,
  } = useFicheActionSelection(ficheResumes, currentPage);

  if (hasFiches === false) {
    return (
      <EmptyState
        isReadOnly={isReadOnly ?? false}
        collectiviteId={collectivite.collectiviteId}
      />
    );
  }

  return (
    <div
      className={classNames(
        'flex flex-col gap-8 bg-grey-2',
        containerClassName
      )}
    >
      <div className="relative bg-inherit">
        <div className="relative z-[1] bg-inherit flex max-xl:flex-col justify-between xl:items-center gap-4 py-6 border-y border-primary-3">
          <div className="flex max-md:flex-col gap-x-8 gap-y-4 md:items-center">
            {/** Tri */}
            <div className="w-full md:w-64">
              <Select
                options={sortOptions}
                onChange={handleSortChange}
                values={sort.field}
                customItem={(v) => (
                  <span className="text-grey-8">{v.label}</span>
                )}
                disabled={sortOptions.length === 1}
                small
              />
            </div>

            <div className="flex gap-x-8 gap-y-4 max-md:order-first text-sm">
              {enableGroupedActions && (
                <Checkbox
                  label="Appliquer des actions groupées"
                  variant="switch"
                  labelClassname="font-normal !text-grey-7"
                  checked={isGroupedActionsOn}
                  onChange={(evt) => {
                    if (isGroupedActionsOn) {
                      resetSelection();
                    }
                    handleGroupedActionsToggle(evt.currentTarget.checked);
                  }}
                  disabled={isLoading}
                />
              )}
            </div>
          </div>

          <div className="flex gap-x-8 gap-y-4">
            <Input
              type="search"
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

        {/* Apperçu du nombre de fiches sélectionnées */}
        {enableGroupedActions && !isReadOnly && (
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
              {selectAllFeatureFlagEnabled && (
                <Checkbox
                  label="Sélectionner toutes les actions"
                  checked={selectAll}
                  onChange={(evt) => handleSelectAll(evt.currentTarget.checked)}
                  disabled={isLoading || !ficheResumes?.data?.length}
                />
              )}
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
        )}
      </div>

      <FilterBadges />

      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      ficheResumes?.data?.length === 0 ? (
        <EmptyCard
          picto={(props) => <PictoExpert {...props} />}
          title="Aucune fiche action ne correspond à votre recherche"
          actions={[
            {
              children: 'Modifier le filtre',
              onClick: () => {
                // TODO: Implement settings modal
                console.log('Settings modal not implemented');
              },
            },
          ]}
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
                isEditable={displayEditionMenu}
                onUnlink={onUnlink ? () => onUnlink(fiche.id) : undefined}
                onSelect={
                  isGroupedActionsOn
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
                  fiche.plans?.[0]?.id
                    ? makeCollectivitePlanActionFicheUrl({
                        collectiviteId: collectivite?.collectiviteId,
                        ficheUid: fiche.id.toString(),
                        planActionUid: fiche.plans?.[0]?.id.toString(),
                      })
                    : makeCollectiviteFicheNonClasseeUrl({
                        collectiviteId: collectivite?.collectiviteId,
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
        </div>
      )}

      <ActionsGroupeesMenu {...{ isGroupedActionsOn, selectedFicheIds }} />
    </div>
  );
};
