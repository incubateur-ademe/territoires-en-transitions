import {useEffect} from 'react';
import classNames from 'classnames';

import {Button, Select} from '@tet/ui';

import {TCollectiviteCarte} from '../data/useFilteredCollectivites';
import {
  Tfilters,
  TSetFilters,
  getNumberOfActiveFilters,
  TView,
} from '../data/filters';
import {Pagination} from 'ui/shared/Pagination';
import {Grid} from 'app/pages/CollectivitesEngagees/Views/Grid';
import {NB_CARDS_PER_PAGE} from 'app/pages/CollectivitesEngagees/data/utils';
import {TPlanCarte} from 'app/pages/CollectivitesEngagees/data/useFilteredPlans';
import {trierParOptions} from 'app/pages/CollectivitesEngagees/data/filtreOptions';
import {useOngletTracker} from 'core-logic/hooks/useOngletTracker';

// correspondances entre les identifiants des vues et les identifiants de tracking
const viewIdToTrackerId: Record<string, 'plans' | 'collectivites'> = {
  plan: 'plans',
  collectivite: 'collectivites',
};

export type CollectivitesEngageesView = {
  initialFilters: Tfilters;
  filters: Tfilters;
  setFilters: TSetFilters;
  canUserClickCard: boolean;
  isConnected: boolean;
};

export type Data = TCollectiviteCarte | TPlanCarte;

type ViewProps = CollectivitesEngageesView & {
  view: TView;
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
  const tracker = useOngletTracker();

  useEffect(() => {
    tracker(viewIdToTrackerId[view]);
  }, [view]);

  const viewToText: Record<TView, string> = {
    collectivite: 'collectivité',
    plan: 'plan',
  };

  const getTrierParOptions = () => {
    const options = [{value: 'nom', label: 'Ordre alphabétique'}];
    return view === 'collectivite' ? trierParOptions : options;
  };

  return (
    <div className="grow flex flex-col">
      <div className="flex flex-col gap-8 mb-8">
        <div className="flex flex-col-reverse gap-6 xl:flex-row xl:justify-between">
          {/** Trier par filtre */}
          <div className="mr-auto">
            <Select
              options={getTrierParOptions()}
              onChange={value =>
                setFilters({
                  ...filters,
                  trierPar: value ? [value as string] : undefined,
                })
              }
              values={filters.trierPar?.[0]}
              customItem={v => <span className="text-grey-9">{v.label}</span>}
              disabled={view === 'plan'}
            />
          </div>
          {/** Change view (collectivite | plan) */}
          <div className="flex items-center">
            <Button
              data-test="ToggleVueCollectivite"
              variant="outlined"
              icon="layout-grid-line"
              className={classNames('rounded-r-none', {
                '!bg-primary-2': view === 'collectivite',
              })}
              onClick={() => {
                setFilters({...filters, vue: ['collectivite']});
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
                '!bg-primary-2': view === 'plan',
              })}
              onClick={() => {
                setFilters({...filters, vue: ['plan']});
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
                    ? `Une ${viewToText[view]}`
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
              onClick={() => setFilters({...initialFilters, vue: [view]})}
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
      {dataCount !== 0 && (
        <div className="flex justify-center mt-6 md:mt-12">
          <Pagination
            nbOfPages={Math.ceil(dataCount / NB_CARDS_PER_PAGE)}
            selectedPage={filters.page ?? 1}
            onChange={selected => setFilters({...filters, page: selected})}
          />
        </div>
      )}
    </div>
  );
};

export default View;
