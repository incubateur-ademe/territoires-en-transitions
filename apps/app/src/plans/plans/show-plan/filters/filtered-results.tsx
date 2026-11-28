import type { SousActionsMatches } from '@/app/plans/fiches/list-all-fiches/data/use-count-sous-actions-matches';
import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { FicheSousActionsCountLink } from '@/app/plans/fiches/components/card/fiche-sous-actions-count.link';
import { FicheCard } from '@/app/plans/fiches/components/card/fiche.card';
import { FicheCardSkeleton } from '@/app/plans/fiches/components/card/fiche.skeleton';
import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { SousActionsMatchesEmpty } from '@/app/plans/fiches/list-all-fiches/sous-actions-scope/sous-actions-matches.empty';
import { SousActionsMatchesSummary } from '@/app/plans/fiches/list-all-fiches/sous-actions-scope/sous-actions-matches.summary';
import {
  CurrentFiltersKeys,
  usePlanFilters,
} from '@/app/plans/plans/show-plan/filters/plan-filters.context';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { BadgeFilters, FilterCategory, Spacer, VisibleWhen } from '@tet/ui';

const ficheListGridClassName = 'grid md:grid-cols-2 gap-4';

const FilteredResultsSummary = ({
  count,
  sousActionsMatches,
}: {
  count: number;
  sousActionsMatches?: SousActionsMatches;
}) => {
  return (
    <span className="text-sm text-gray-400">
      {appLabels.resultat({ count })}
      <SousActionsMatchesSummary
        sousActionsMatches={sousActionsMatches}
        totalActionsCount={count}
      />
    </span>
  );
};

const FilteredResultsEmpty = () => {
  return (
    <div className="mt-16 mb-8">
      {appLabels.aucuneActionCorrespondRecherche}
    </div>
  );
};

const FilteredResultsList = ({
  planId,
  collectivite,
  filteredResults,
  currentUserId,
}: {
  planId: number;
  collectivite: CollectiviteCurrent;
  filteredResults: FicheListItem[];
  currentUserId: string;
}) => {
  return (
    <div className={ficheListGridClassName}>
      {filteredResults.map((fiche) => (
        <FicheCard
          key={fiche.id}
          ficheAction={fiche}
          link={makeCollectiviteActionUrl({
            planId,
            collectiviteId: collectivite.collectiviteId,
            ficheUid: fiche.id.toString(),
          })}
          currentCollectivite={collectivite}
          currentUserId={currentUserId}
          footerExtra={
            fiche.sousActionsCount ? (
              <FicheSousActionsCountLink fiche={fiche} planId={planId} />
            ) : undefined
          }
        />
      ))}
    </div>
  );
};

type Props = {
  planId: number;
  collectivite: CollectiviteCurrent;
  currentUserId: string;
};

export const FilteredResults = ({
  planId,
  collectivite,
  currentUserId,
}: Props) => {
  const {
    filters,
    isLoading,
    getFilterValuesLabels,
    getFilterLabel,
    resetFilters,
    onDeleteFilterValue,
    onDeleteFilterCategory,
    filteredResults,
    sousActionsMatches,
    includeSousActions,
  } = usePlanFilters();
  const withSousActionsMatches = !!filters.withSousActionsMatches;

  const filtersToDisplay = {
    referents: filters.referents,
    statuts: filters.statuts,
    priorites: filters.priorites,
    pilotes: filters.pilotes,
    suivi: filters.suivi,
  };
  const hasFilteredContent = filteredResults.length > 0;

  const filterCategories: FilterCategory<CurrentFiltersKeys>[] = (
    Object.entries(filtersToDisplay) as [string, string[] | undefined][]
  )
    .filter(([, value]) => Array.isArray(value) === true && value.length > 0)
    .map(([key, value]) => {
      const currentKey: CurrentFiltersKeys = key as CurrentFiltersKeys;
      const filterValueLabels = getFilterValuesLabels(
        currentKey,
        value as string[]
      );

      return {
        key: key as CurrentFiltersKeys,
        title: getFilterLabel(currentKey),
        selectedFilters: filterValueLabels,
      } as FilterCategory<CurrentFiltersKeys>;
    })
    .concat(
      withSousActionsMatches
        ? [
            {
              key: 'withSousActionsMatches',
              title: getFilterLabel('withSousActionsMatches'),
              selectedFilters: [],
              onlyShowCategory: true,
            } satisfies FilterCategory<CurrentFiltersKeys>,
          ]
        : []
    );

  return (
    <>
      <FilteredResultsSummary
        count={filteredResults.length}
        sousActionsMatches={
          withSousActionsMatches ? sousActionsMatches : undefined
        }
      />
      <Spacer height={0.5} />
      <BadgeFilters<CurrentFiltersKeys>
        filterCategories={filterCategories}
        onDeleteFilterValue={onDeleteFilterValue}
        onDeleteFilterCategory={onDeleteFilterCategory}
        onClearAllFilters={resetFilters}
      />
      <Spacer height={2} />
      {isLoading ? (
        <div className={ficheListGridClassName}>
          {[1, 2, 3, 4].map((i) => (
            <FicheCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <VisibleWhen condition={hasFilteredContent}>
            <FilteredResultsList
              planId={planId}
              collectivite={collectivite}
              filteredResults={filteredResults}
              currentUserId={currentUserId}
            />
          </VisibleWhen>
          <VisibleWhen condition={hasFilteredContent === false}>
            {withSousActionsMatches ? (
              <FilteredResultsEmpty />
            ) : (
              <SousActionsMatchesEmpty
                sousActionsMatches={sousActionsMatches}
                onIncludeSousActions={includeSousActions}
              />
            )}
          </VisibleWhen>
        </>
      )}
    </>
  );
};
