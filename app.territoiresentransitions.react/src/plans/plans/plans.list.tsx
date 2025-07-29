'use client';

import { useEffect, useState } from 'react';

import { useCollectiviteId } from '@/api/collectivites';
import {
  FetchFilter,
  SortPlansActionValue,
} from '@/api/plan-actions/plan-actions.list/domain/fetch-options.schema';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import PlanCard, { PlanCardDisplay } from '@/app/plans/plans/card/plan.card';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import FilterBadges, { useFiltersToBadges } from '@/app/ui/lists/filter-badges';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button, ButtonGroup, Pagination, Select } from '@/ui';
import { OpenState } from '@/ui/utils/types';

type sortByOptionsType = {
  label: string;
  value: SortPlansActionValue;
  direction: 'asc' | 'desc';
};

type SortSettings<T> = {
  /** Tri par défaut */
  defaultSort: T;
  /** Options à afficher dans le sélecteur de tri */
  sortOptionsDisplayed?: T[];
};

type SortIndicateurSettings = SortSettings<SortPlansActionValue>;

const sortByOptions: sortByOptionsType[] = [
  {
    label: 'Ordre alphabétique',
    value: 'nom',
    direction: 'asc',
  },
  {
    label: 'Date de création',
    value: 'created_at',
    direction: 'desc',
  },
];

type Props = {
  filtres: FetchFilter;
  settings?: (openState: OpenState) => React.ReactNode;
  resetFilters?: () => void;
  maxNbOfCards?: number;
  sortSettings?: SortIndicateurSettings;
};

export const PlansList = ({
  filtres,
  resetFilters,
  settings,
  maxNbOfCards = 9,
  sortSettings = {
    defaultSort: 'nom',
  },
}: Props) => {
  const collectiviteId = useCollectiviteId();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  /** Tri sélectionné */
  const [sort, setSort] = useState<SortPlansActionValue>(
    sortSettings.defaultSort
  );

  /** Mode d'affichage pour les statuts des fiches */
  const [display, setDisplay] = useState<PlanCardDisplay>('row');

  /** Page courante */
  const [currentPage, setCurrentPage] = useState(1);

  /** Récupère les plans d'action */
  const { plans, totalCount, isLoading } = useListPlans(collectiviteId, {
    limit: maxNbOfCards,
    page: currentPage,
    sort: {
      field: sort === 'nom' ? 'nom' : 'createdAt',
      direction:
        sortByOptions.find((o) => o.value === sort)?.direction || 'asc',
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [isLoading]);

  const { data: filterBadges } = useFiltersToBadges({
    filters: filtres,
    customValues: {
      planActions: plans.length === totalCount && 'Tous les plans',
    },
  });

  return (
    <>
      <div className="flex items-center gap-8 py-6 border-y border-primary-3">
        {/** Tri */}
        <div className="w-64">
          <Select
            options={sortByOptions}
            onChange={(value) => setSort(value as SortPlansActionValue)}
            values={sort}
            customItem={(v) => <span className="text-grey-8">{v.label}</span>}
            small
          />
        </div>
        {/** Nombre total de résultats */}
        <span className="shrink-0 text-grey-7 mr-auto">
          {isLoading ? '--' : totalCount}
          {` `}
          {`plan`}
          {totalCount > 1 ? 's' : ''}
        </span>
        <ButtonGroup
          activeButtonId={display}
          className="max-w-fit"
          size="sm"
          buttons={[
            {
              children: 'Diagramme',
              icon: 'pie-chart-2-line',
              onClick: () => setDisplay('circular'),
              id: 'circular',
            },
            {
              children: 'Progression',
              icon: 'layout-grid-line',
              onClick: () => setDisplay('row'),
              id: 'row',
            },
          ]}
        />
        {/** Bouton d'édition des filtres (une modale avec bouton ou un ButtonMenu) */}
        {settings?.({ isOpen: isSettingsOpen, setIsOpen: setIsSettingsOpen })}
      </div>
      {/** Liste des filtres appliqués */}
      {!!filterBadges?.length && (
        <FilterBadges badges={filterBadges} resetFilters={resetFilters} />
      )}

      {/** Chargement */}
      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      plans.length === 0 ? (
        <div className="flex flex-col items-center gap-2 m-auto">
          <PictoDocument className="w-32 h-32" />
          <p className="text-primary-8">
            Aucun plan d&apos;action ne correspond à votre recherche
          </p>

          <Button
            size="sm"
            onClick={() => {
              setIsSettingsOpen(true);
            }}
          >
            Modifier le filtre
          </Button>
        </div>
      ) : (
        /** Liste des fiches actions */
        // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
        <div>
          <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                display={display}
                link={makeCollectivitePlanActionUrl({
                  collectiviteId: plan.collectiviteId,
                  planActionUid: plan.id.toString(),
                })}
                openInNewTab
              />
            ))}
          </div>
          <Pagination
            className="mx-auto mt-16"
            selectedPage={currentPage}
            nbOfElements={totalCount}
            maxElementsPerPage={maxNbOfCards}
            idToScrollTo="app-header"
            onChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
};
