import { useEffect, useState } from 'react';

import {
  FetchFilter,
  SortPlansActionValue,
} from '@/api/plan-actions/plan-actions.list/domain/fetch-options.schema';
import { usePlansActionsListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import PlanActionCard from '@/app/app/pages/collectivite/PlansActions/PlanAction/list/card/PlanActionCard';
import { ModuleDisplay } from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { Filters } from '@/app/plans/plans/list-all-plans/plan-card-with-filters.list/filters';
import FilterBadges, { useFiltersToBadges } from '@/app/ui/lists/filter-badges';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Pagination } from '@/ui';

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
  resetFilters?: () => void;
  /** Nombre de plans à afficher sur une page */
  maxNbOfCards?: number;
  sortSettings?: SortIndicateurSettings;
  displaySettings?: {
    display: ModuleDisplay;
    setDisplay: (display: ModuleDisplay) => void;
  };
};

/** Liste de fiches action avec tri et options de fitlre */
const PlansActionListe = ({
  filtres,
  resetFilters,
  maxNbOfCards = 9,
  sortSettings = {
    defaultSort: 'nom',
  },
  displaySettings,
}: Props) => {
  /** Tri sélectionné */
  const [sort, setSort] = useState<SortPlansActionValue>(
    sortSettings.defaultSort
  );

  /** Page courante */
  const [currentPage, setCurrentPage] = useState(1);

  /** Récupère les plans d'action */
  const { data, isLoading } = usePlansActionsListe({
    withSelect: ['axes'],
    options: {
      filtre: {},
      page: currentPage,
      limit: maxNbOfCards,
      sort: [
        {
          field: sort,
          direction:
            sortByOptions.find((o) => o.value === sort)?.direction || 'asc',
        },
      ],
    },
  });
  useEffect(() => {
    setCurrentPage(1);
  }, [isLoading]);
  const { data: filterBadges } = useFiltersToBadges({ filters: filtres });

  return (
    <>
      <Filters
        sortedBy={sort}
        onChangeSort={setSort}
        plansCount={data?.count}
        cardDisplay={displaySettings?.display ?? 'row'}
        onDisplayChange={displaySettings?.setDisplay ?? (() => {})}
      />

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
      data?.plans.length === 0 ? (
        <div className="flex flex-col items-center gap-2 m-auto">
          <PictoDocument className="w-32 h-32" />
          <p className="text-primary-8">
            Aucun plan d&apos;action ne correspond à votre recherche
          </p>
        </div>
      ) : (
        /** Liste des fiches actions */
        // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
        <div>
          <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {data?.plans.map((plan) => (
              <PlanActionCard
                key={plan.id}
                plan={plan}
                display={displaySettings?.display}
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
            nbOfElements={data?.count ?? 0}
            maxElementsPerPage={maxNbOfCards}
            idToScrollTo="app-header"
            onChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
};

export default PlansActionListe;
