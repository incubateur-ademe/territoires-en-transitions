import PlansView from '@/app/app/pages/CollectivitesEngagees/Views/PlansView';
import { Route } from 'react-router-dom';
import Filters from './Filters/FiltersColonne';
import CollectivitesView from './Views/CollectivitesView';

import { useUser } from '@/api/users/user-provider';
import { useSearchParams } from '@/app/core-logic/hooks/query';

import { CollectiviteEngagee, getRejoindreCollectivitePath } from '@/api';
import {
  recherchesCollectivitesUrl,
  recherchesPlansUrl,
} from '@/app/app/paths';
import { useSansCollectivite } from '@/app/core-logic/hooks/useSansCollectivite';
import { Alert, Button } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { initialFilters, nameToShortNames } from './data/filters';

const DecouvrirLesCollectivites = () => {
  const user = useUser();
  const isConnected = !!user;

  const sansCollectivite = useSansCollectivite();

  /** Filters */
  const [filters, setFilters] = useSearchParams<CollectiviteEngagee.Filters>(
    recherchesCollectivitesUrl,
    initialFilters,
    nameToShortNames
  );

  return (
    <>
      {!!sansCollectivite && (
        <Alert
          fullPageWidth
          state="info"
          title="Pour accéder à plus de détails sur chacune des collectivités engagées dans le programme, vous devez être membre d’au moins une collectivité."
          className="border-b border-b-info-3"
          footer={
            <Button
              dataTest="btn-AssocierCollectivite"
              size="sm"
              href={getRejoindreCollectivitePath(document.location.origin)}
            >
              Rejoindre une collectivité
            </Button>
          }
        />
      )}
      <PageContainer dataTest="ToutesLesCollectivites" bgColor="primary">
        <div className="md:flex md:gap-6 xl:gap-12">
          <Route path={recherchesCollectivitesUrl}>
            <Filters
              vue="collectivites"
              filters={filters}
              setFilters={setFilters}
            />
            <CollectivitesView
              initialFilters={initialFilters}
              filters={filters}
              setFilters={setFilters}
              isConnected={isConnected}
              canUserClickCard={!sansCollectivite && isConnected}
            />
          </Route>
          <Route path={recherchesPlansUrl}>
            <Filters vue="plans" filters={filters} setFilters={setFilters} />
            <PlansView
              initialFilters={initialFilters}
              filters={{ ...filters, trierPar: ['nom'] }}
              setFilters={setFilters}
              isConnected={isConnected}
              canUserClickCard={!sansCollectivite && isConnected}
            />
          </Route>
        </div>
      </PageContainer>
    </>
  );
};

export default DecouvrirLesCollectivites;
