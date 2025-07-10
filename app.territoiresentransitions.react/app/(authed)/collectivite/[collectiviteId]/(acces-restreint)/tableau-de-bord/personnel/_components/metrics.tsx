import { useCollectiviteId } from '@/api/collectivites';
import { useUser } from '@/api/users/user-provider';
import {
  makeCollectiviteIndicateursListUrl,
  makeCollectivitePlansActionsLandingUrl,
  makeCollectivitePlansActionsNouveauUrl,
  makeCollectiviteToutesLesFichesUrl,
  makeTdbCollectiviteUrl,
} from '@/app/app/paths';
import { MetricCard } from '@/app/tableaux-de-bord/metrics/metric.card';
import { MetricCardSkeleton } from '@/app/tableaux-de-bord/metrics/metric.card-skeleton';

import { useTdbPersoFetchMetrics } from '../_hooks/use-tdb-perso-fetch-metrics';

const Metrics = () => {
  const collectiviteId = useCollectiviteId();

  const { id: userId } = useUser();

  const { data: metrics, isLoading } = useTdbPersoFetchMetrics();

  const mesuresCount = metrics?.referentiels.piloteMesuresCount || 0;
  const plansCount = metrics?.plans.count || 0;
  const fichesCount = metrics?.plans.piloteFichesCount || 0;
  const indicateursCount = metrics?.indicateurs.piloteCount || 0;

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
      {isLoading ? (
        [1, 2, 3, 4].map((i) => <MetricCardSkeleton key={i} />)
      ) : (
        <>
          <MetricCard
            title={`Plan${plansCount > 1 ? 's' : ''} d'action`}
            count={plansCount}
            link={
              plansCount > 0
                ? {
                    href: makeCollectivitePlansActionsLandingUrl({
                      collectiviteId,
                    }),
                    children: 'Voir tous les plans',
                  }
                : {
                    href: makeCollectivitePlansActionsNouveauUrl({
                      collectiviteId,
                    }),
                    children: 'Créer un plan',
                  }
            }
          />
          <MetricCard
            title={`Fiche${fichesCount > 1 ? 's' : ''} pilotée${
              fichesCount > 1 ? 's' : ''
            }`}
            count={fichesCount}
            link={
              fichesCount > 0
                ? {
                    href: `${makeCollectiviteToutesLesFichesUrl({
                      collectiviteId,
                    })}?up=${userId}`,
                    children: 'Voir les fiches',
                  }
                : undefined
            }
          />
          <MetricCard
            title={`Indicateur${indicateursCount > 1 ? 's' : ''} piloté${
              indicateursCount > 1 ? 's' : ''
            }`}
            count={indicateursCount}
            link={
              indicateursCount > 0
                ? {
                    href: makeCollectiviteIndicateursListUrl({
                      collectiviteId,
                      listId: 'mes-indicateurs',
                    }),
                    children: 'Voir les indicateurs',
                  }
                : undefined
            }
          />
          <MetricCard
            title={`Mesure${mesuresCount > 0 ? 's' : ''} pilotée${
              mesuresCount > 0 ? 's' : ''
            }`}
            count={mesuresCount}
            link={
              mesuresCount > 0
                ? {
                    href: makeTdbCollectiviteUrl({
                      collectiviteId,
                      view: 'personnel',
                      module: 'mesures-dont-je-suis-pilote',
                    }),
                    children: 'Voir les mesures',
                  }
                : undefined
            }
          />
        </>
      )}
    </div>
  );
};

export default Metrics;
