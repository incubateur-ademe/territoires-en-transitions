import {useMemo} from 'react';

import AssocierCollectiviteBandeau from 'ui/collectivites/AssocierCollectiviteBandeau';
import Filters from './Filters/FiltersColonne';
import CollectivitesView from './Views/CollectivitesView';
import PlansView from 'app/pages/CollectivitesEngagees/Views/PlansView';

import {useSearchParams} from 'core-logic/hooks/query';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {useAuth} from 'core-logic/api/auth/AuthProvider';

import {CollectiviteEngagee} from '@tet/api';
import {
  initialFilters,
  nameToShortNames,
} from 'app/pages/CollectivitesEngagees/data/filters';
import {Route, useParams} from 'react-router-dom';
import {
  RecherchesViewParam,
  recherchesCollectivitesUrl,
  recherchesPlansUrl,
} from 'app/paths';

const CollectivitesEngagees = () => {
  const ownedCollectivites = useOwnedCollectivites();

  const hasCollectivites = useMemo(
    () => ownedCollectivites?.length !== 0,
    [ownedCollectivites]
  );

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
      {!hasCollectivites && <AssocierCollectiviteBandeau />}
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
              canUserClickCard={hasCollectivites && isConnected}
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
              canUserClickCard={hasCollectivites && isConnected}
            />
            {/* {vue === 'plans' && (
            )} */}
          </Route>
        </div>
      </div>
    </div>
  );
};

export default CollectivitesEngagees;
