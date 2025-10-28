import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-context/user-provider';
import {
  makeCollectiviteIndicateursListUrl,
  makeCollectivitePlansActionsListUrl,
  makeCollectivitePlansActionsNouveauUrl,
  makeCollectiviteToutesLesFichesUrl,
  makeTdbCollectiviteUrl,
} from '@/app/app/paths';
import {
  MetricCard,
  MetricCardProps,
} from '@/app/tableaux-de-bord/metrics/metric.card';
import { MetricCardSkeleton } from '@/app/tableaux-de-bord/metrics/metric.card-skeleton';

import { PersonalMetricsResponse } from '@/domain/metrics';
import { PermissionOperation, PermissionOperationEnum } from '@/domain/users';
import { useTdbPersoFetchMetrics } from '../_hooks/use-tdb-perso-fetch-metrics';

function getMetricsToDisplay(
  collectiviteId: number,
  permissions?: PermissionOperation[],
  metrics?: PersonalMetricsResponse
) {
  if (!metrics) {
    return [];
  }

  const metricsToDisplay: MetricCardProps[] = [];

  if (
    permissions?.includes(PermissionOperationEnum['PLANS.EDITION']) ||
    permissions?.includes(PermissionOperationEnum['PLANS.LECTURE'])
  ) {
    const plansCount = metrics?.plans.count || 0;
    metricsToDisplay.push({
      title: `Plan${plansCount > 1 ? 's' : ''} d'action`,
      count: plansCount,
      link:
        plansCount > 0
          ? {
              href: makeCollectivitePlansActionsListUrl({ collectiviteId }),
              children: 'Voir tous les plans',
            }
          : permissions?.includes(PermissionOperationEnum['PLANS.EDITION'])
          ? {
              href: makeCollectivitePlansActionsNouveauUrl({
                collectiviteId,
              }),
              children: 'Créer un plan',
            }
          : undefined,
    });
  }

  if (
    permissions?.includes(PermissionOperationEnum['PLANS.FICHES.LECTURE']) ||
    permissions?.includes(PermissionOperationEnum['PLANS.FICHES.EDITION'])
  ) {
    const fichesCount = metrics?.plans.piloteFichesCount || 0;
    metricsToDisplay.push({
      title: `Action${fichesCount > 1 ? 's' : ''} pilotée${
        fichesCount > 1 ? 's' : ''
      }`,
      count: fichesCount,
      link:
        fichesCount > 0
          ? {
              href: makeCollectiviteToutesLesFichesUrl({ collectiviteId }),
              children: 'Voir les actions',
            }
          : undefined,
    });
  }

  if (
    permissions?.includes(PermissionOperationEnum['INDICATEURS.LECTURE']) ||
    permissions?.includes(PermissionOperationEnum['INDICATEURS.EDITION'])
  ) {
    const indicateursCount = metrics?.indicateurs.piloteCount || 0;
    metricsToDisplay.push({
      title: `Indicateur${indicateursCount > 1 ? 's' : ''} piloté${
        indicateursCount > 1 ? 's' : ''
      }`,
      count: indicateursCount,
      link:
        indicateursCount > 0
          ? {
              href: makeCollectiviteIndicateursListUrl({ collectiviteId }),
              children: 'Voir les indicateurs',
            }
          : undefined,
    });
  }

  if (
    permissions?.includes(PermissionOperationEnum['REFERENTIELS.LECTURE']) ||
    permissions?.includes(PermissionOperationEnum['REFERENTIELS.EDITION'])
  ) {
    const mesuresCount = metrics?.referentiels.piloteMesuresCount || 0;
    metricsToDisplay.push({
      title: `Mesure${mesuresCount > 0 ? 's' : ''} pilotée${
        mesuresCount > 0 ? 's' : ''
      }`,
      count: mesuresCount,
      link:
        mesuresCount > 0
          ? {
              href: makeTdbCollectiviteUrl({
                collectiviteId,
                view: 'personnel',
                module: 'mesures-dont-je-suis-pilote',
              }),
              children: 'Voir les mesures',
            }
          : undefined,
    });
  }

  return metricsToDisplay;
}

const Metrics = () => {
  const { collectiviteId, niveauAcces, permissions } = useCurrentCollectivite();

  const { id: userId } = useUser();

  const { data: metrics, isLoading } = useTdbPersoFetchMetrics();

  const metricsToDisplay = getMetricsToDisplay(
    collectiviteId,
    permissions,
    metrics
  );

  return (
    <div
      className={`grid sm:grid-cols-${Math.min(
        metricsToDisplay.length,
        2
      )} md:grid-cols-${Math.min(metricsToDisplay.length, 4)} gap-4`}
    >
      {isLoading ? (
        metricsToDisplay.map((metric, i) => <MetricCardSkeleton key={i} />)
      ) : (
        <>
          {metricsToDisplay.map((metricProps, i) => (
            <MetricCard key={i} {...metricProps} />
          ))}
        </>
      )}
    </div>
  );
};

export default Metrics;
