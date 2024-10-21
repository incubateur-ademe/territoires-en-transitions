import classNames from 'classnames';

import { Button, Pagination, Select } from '@tet/ui';

import { CollectiviteEngagee } from '@tet/api';
import { Grid } from 'app/pages/CollectivitesEngagees/Views/Grid';
import { trierParOptions } from 'app/pages/CollectivitesEngagees/data/filtreOptions';
import { NB_CARDS_PER_PAGE } from 'app/pages/CollectivitesEngagees/data/utils';
import {
  recherchesCollectivitesUrl,
  recherchesPlansUrl,
  RecherchesViewParam,
} from 'app/paths';
import { useFonctionTracker } from 'core-logic/hooks/useFonctionTracker';
import { useRouter, useSearchParams } from 'next/navigation';
import { getNumberOfActiveFilters, SetFilters } from '../data/filters';
import { TCollectiviteCarte } from '../data/useFilteredCollectivites';

export type CollectivitesEngageesView = {
  initialFilters: CollectiviteEngagee.Filters;
  filters: CollectiviteEngagee.Filters;
  setFilters: SetFilters;
  canUserClickCard: boolean;
  isConnected: boolean;
};

export type Data = TCollectiviteCarte | CollectiviteEngagee.TPlanCarte;

type ViewProps = CollectivitesEngageesView & {
  view: RecherchesViewParam;
  data: Data[];
  dataCount: number;
  isLoading: boolean;
  renderCard: (data: Data) => JSX.Element;
};

/** Vue générique pour la page colléctivité engagée */
const View = ({
  view,
  initialFilters,
  filters,
  setFilters,
  data,
  dataCount,
  isLoading,
  renderCard,
  isConnected,
}: ViewProps) => {
  const router = useRouter();
  const search = useSearchParams();
  const tracker = useFonctionTracker();

  const viewToText: Record<RecherchesViewParam, string> = {
    collectivites: 'collectivité',
    plans: 'plan',
  };

  const getTrierParOptions = () => {
    const options = [{ value: 'nom', label: 'Ordre alphabétique' }];
    return view === 'collectivites' ? trierParOptions : options;
  };

  return (
    <div className="grow flex flex-col">
      <div className="flex flex-col gap-8 mb-8">
        <div className="flex flex-col-reverse gap-6 xl:flex-row xl:justify-between">
          {/** Trier par filtre */}
          <div className="mr-auto">
            <Select
              options={getTrierParOptions()}
              onChange={(value) => {
                value &&
                  setFilters({
                    ...filters,
                    trierPar: [value as string],
                  });
              }}
              values={filters.trierPar?.[0]}
              customItem={(v) => <span className="text-grey-9">{v.label}</span>}
              disabled={view === 'plans'}
            />
          </div>
          {/** Change view (collectivite | plan) */}
          <div className="flex items-center">
            <Button
              data-test="ToggleVueCollectivite"
              variant="outlined"
              icon="layout-grid-line"
              className={classNames('rounded-r-none', {
                '!bg-primary-2': view === 'collectivites',
              })}
              onClick={() => {
                setFilters({ ...filters, page: 1 });
                router.push(
                  `${recherchesCollectivitesUrl}?${search.toString()}`
                );
              }}
            >
              Collectivités
            </Button>
            <Button
              data-test="ToggleVuePlan"
              disabled={!isConnected}
              variant="outlined"
              icon="list-unordered"
              className={classNames('rounded-l-none border-l-0', {
                '!bg-primary-2': view === 'plans',
              })}
              onClick={() => {
                setFilters({ ...filters, page: 1 });
                router.push(`${recherchesPlansUrl}?${search.toString()}`);
              }}
            >
              Plans d'action
            </Button>
          </div>
        </div>
        {/** Nombre de résultats | Désactiver les filtres */}
        <div className="flex flex-col gap-6 xl:flex-row xl:justify-between xl:items-center">
          <div className="grow min-h-[2.625rem] flex items-center">
            {dataCount > 0 && (
              <h4 className="mb-0 text-center leading-10 text-gray-500 md:text-left">
                <span className="text-primary-7">
                  {dataCount === 1
                    ? `1 ${viewToText[view]}`
                    : `${dataCount} ${viewToText[view]}s`}{' '}
                </span>
                <span className="text-primary-10">
                  {dataCount === 1 ? 'correspond' : 'correspondent'} à votre
                  recherche
                </span>
              </h4>
            )}
          </div>
          {getNumberOfActiveFilters(filters) > 0 && (
            <Button
              data-test="desactiver-les-filtres"
              onClick={() => setFilters(initialFilters)}
              icon="close-circle-fill"
              variant="outlined"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? 'Chargement...' : 'Désactiver tous les filtres'}
            </Button>
          )}
        </div>
      </div>
      {/** Grille des résultats */}
      <div className="grow">
        <Grid
          view={view}
          isLoading={isLoading}
          data={data}
          renderCard={renderCard}
          isConected={isConnected}
        />
      </div>
      {/** Pagination */}
      <Pagination
        className="mt-6 md:mt-12 mx-auto"
        selectedPage={filters.page ?? 1}
        nbOfElements={dataCount}
        maxElementsPerPage={NB_CARDS_PER_PAGE}
        onChange={(selected) => {
          setFilters({ ...filters, page: selected });
          tracker({ fonction: 'pagination', action: 'clic' });
        }}
        idToScrollTo="app-header"
      />
    </div>
  );
};

export default View;
