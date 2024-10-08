import {Route, useParams} from 'react-router-dom';
import AssocierCollectiviteBandeau from 'ui/collectivites/AssocierCollectiviteBandeau';
import Filters from './Filters/FiltersColonne';
import CollectivitesView from './Views/CollectivitesView';
import PlansView from 'app/pages/CollectivitesEngagees/Views/PlansView';

import {useSearchParams} from 'core-logic/hooks/query';
import {useAuth} from 'core-logic/api/auth/AuthProvider';

import {CollectiviteEngagee} from '@tet/api';
import {initialFilters, nameToShortNames} from './data/filters';
import {
  RecherchesViewParam,
  recherchesCollectivitesUrl,
  recherchesPlansUrl,
} from 'app/paths';

type Props = {
  sansCollectivite: boolean;
};

const DecouvrirLesCollectivites = ({sansCollectivite}: Props) => {
  const auth = useAuth();

  const {isConnected} = auth;

  const viewParam: {recherchesId: RecherchesViewParam} = useParams();
  const vue = viewParam.recherchesId;

  /** Filters */
  const [filters, setFilters] = useSearchParams<CollectiviteEngagee.Filters>(
    '',
    initialFilters,
    nameToShortNames
  );

  return (
    <div className="bg-primary-1 -mb-8">
      {sansCollectivite && <AssocierCollectiviteBandeau />}
      <div
        data-test="ToutesLesCollectivites"
        className="app fr-container py-16"
      >
        <div className="md:flex md:gap-6 xl:gap-12">
          {/* Filters column */}
          <Filters vue={vue} filters={filters} setFilters={setFilters} />
          {/* Results column */}
          <Route path={recherchesCollectivitesUrl}>
            <CollectivitesView
              initialFilters={initialFilters}
              filters={filters}
              setFilters={setFilters}
              isConnected={isConnected}
              canUserClickCard={!sansCollectivite && isConnected}
            />
            {/* {vue === 'collectivites' && (
            )} */}
          </Route>
          <Route path={recherchesPlansUrl}>
            <PlansView
              initialFilters={initialFilters}
              filters={{...filters, trierPar: ['nom']}}
              setFilters={setFilters}
              isConnected={isConnected}
              canUserClickCard={!sansCollectivite && isConnected}
            />
            {/* {vue === 'plans' && (
            )} */}
          </Route>
        </div>
      </div>
    </div>
  );
};

export default DecouvrirLesCollectivites;
