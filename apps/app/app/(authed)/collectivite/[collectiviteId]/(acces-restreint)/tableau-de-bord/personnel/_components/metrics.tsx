import { useCurrentCollectivite } from '@/api/collectivites';
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

import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PermissionOperation } from '@/domain/users';
import { useTdbPersoFetchMetrics } from '../_hooks/use-tdb-perso-fetch-metrics';

// Type descriptor for metric cards
type MetricDescriptor = {
  isVisibleWithPermissions: (permissions?: PermissionOperation[]) => boolean;
  getCount: () => number;
  getTitle: (count: number) => string;
  link: (args: {
    count: number;
    permissions?: PermissionOperation[];
  }) => MetricCardProps['link'];
};

function getMetricsToDisplay(
  metricDescriptors: MetricDescriptor[],
  permissions?: PermissionOperation[]
): MetricCardProps[] {
  return metricDescriptors.flatMap((metricDescriptor) => {
    if (!metricDescriptor.isVisibleWithPermissions(permissions)) {
      return [];
    }

    const count = metricDescriptor.getCount();
    return [
      {
        title: metricDescriptor.getTitle(count),
        count,
        link: metricDescriptor.link({ count, permissions }),
      },
    ];
  });
}

const Metrics = () => {
  const { collectiviteId, permissions } = useCurrentCollectivite();

  const { data: metrics, isLoading } = useTdbPersoFetchMetrics();

  const metricDescriptors: MetricDescriptor[] = [
    {
      isVisibleWithPermissions: (perms) =>
        hasPermission(perms, 'plans.lecture'),
      getCount: () => metrics?.plans.count || 0,
      getTitle: (count) => `Plan${count > 1 ? 's' : ''} d'action`,
      link: ({ count }) => {
        if (count > 0) {
          return {
            href: makeCollectivitePlansActionsListUrl({ collectiviteId }),
            children: 'Voir tous les plans',
          };
        }
        if (hasPermission(permissions, 'plans.edition')) {
          return {
            href: makeCollectivitePlansActionsNouveauUrl({ collectiviteId }),
            children: 'Créer un plan',
          };
        }
        return undefined;
      },
    },
    {
      isVisibleWithPermissions: (perms) =>
        hasPermission(perms, 'plans.fiches.lecture'),
      getCount: () => metrics?.plans.piloteFichesCount || 0,
      getTitle: (count) =>
        `Action${count > 1 ? 's' : ''} pilotée${count > 1 ? 's' : ''}`,
      link: ({ count }) =>
        count > 0
          ? {
              href: makeCollectiviteToutesLesFichesUrl({ collectiviteId }),
              children: 'Voir les actions',
            }
          : undefined,
    },
    {
      isVisibleWithPermissions: (perms) =>
        hasPermission(perms, 'indicateurs.lecture'),
      getCount: () => metrics?.indicateurs.piloteCount || 0,
      getTitle: (count) =>
        `Indicateur${count > 1 ? 's' : ''} piloté${count > 1 ? 's' : ''}`,
      link: ({ count }) =>
        count > 0
          ? {
              href: makeCollectiviteIndicateursListUrl({ collectiviteId }),
              children: 'Voir les indicateurs',
            }
          : undefined,
    },
    {
      isVisibleWithPermissions: (perms) =>
        hasPermission(perms, 'referentiels.lecture'),
      getCount: () => metrics?.referentiels.piloteMesuresCount || 0,
      getTitle: (count) =>
        `Mesure${count > 0 ? 's' : ''} pilotée${count > 0 ? 's' : ''}`,
      link: ({ count }) =>
        count > 0
          ? {
              href: makeTdbCollectiviteUrl({
                collectiviteId,
                view: 'personnel',
                module: 'mesures-dont-je-suis-pilote',
              }),
              children: 'Voir les mesures',
            }
          : undefined,
    },
  ];

  const metricsToDisplay = metrics
    ? getMetricsToDisplay(metricDescriptors, permissions)
    : [];

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
