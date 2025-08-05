'use client';
import PlansView from '@/app/app/pages/CollectivitesEngagees/Views/PlansView';
import ReferentielsView from './Views/ReferentielsView';

import { useUser } from '@/api/users/user-provider';
import { useSearchParams } from '@/app/core-logic/hooks/query';

import { CollectiviteEngagee, getRejoindreCollectivitePath } from '@/api';
import { recherchesCollectivitesUrl } from '@/app/app/paths';
import { useSansCollectivite } from '@/app/core-logic/hooks/useSansCollectivite';
import { Alert, Button } from '@/ui';
import { usePathname } from 'next/navigation';
import CollectivitesView from './Views/CollectivitesView';
import { initialFilters, nameToShortNames } from './data/filters';

const DecouvrirLesCollectivites = () => {
  const user = useUser();
  const isConnected = !!user;

  const sansCollectivite = useSansCollectivite();

  const pathname = usePathname();
  const selectedView = pathname.split('/').pop();

  /** Filters */
  const [filters, setFilters, _count, setView] =
    useSearchParams<CollectiviteEngagee.Filters>(
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
              size="xs"
              href={getRejoindreCollectivitePath(document.location.origin)}
            >
              Rejoindre une collectivité
            </Button>
          }
        />
      )}

      {selectedView === 'collectivites' && (
        <CollectivitesView
          initialFilters={initialFilters}
          filters={filters}
          setFilters={setFilters}
          setView={setView}
          isConnected={isConnected}
          canUserClickCard={!sansCollectivite && isConnected}
        />
      )}
      {selectedView === 'referentiels' && (
        <ReferentielsView
          initialFilters={initialFilters}
          filters={filters}
          setFilters={setFilters}
          setView={setView}
          isConnected={isConnected}
          canUserClickCard={!sansCollectivite && isConnected}
        />
      )}
      {selectedView === 'plans' && (
        <PlansView
          initialFilters={initialFilters}
          filters={{ ...filters }}
          setFilters={setFilters}
          setView={setView}
          isConnected={isConnected}
          canUserClickCard={!sansCollectivite && isConnected}
        />
      )}
    </>
  );
};

export default DecouvrirLesCollectivites;
