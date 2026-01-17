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
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useTdbPersoFetchMetrics } from '../_hooks/use-tdb-perso-fetch-metrics';

// Type descriptor for metric cards
type MetricDescriptor = {
  isVisible: boolean;
  getCount: () => number;
  getTitle: (count: number) => string;
  link: (args: { count: number }) => MetricCardProps['link'];
};

function getMetricsToDisplay(
  metricDescriptors: MetricDescriptor[]
): MetricCardProps[] {
  return metricDescriptors.flatMap((metricDescriptor) => {
    if (!metricDescriptor.isVisible) {
      return [];
    }

    const count = metricDescriptor.getCount();
    return [
      {
        title: metricDescriptor.getTitle(count),
        count,
        link: metricDescriptor.link({ count }),
      },
    ];
  });
}

const Metrics = () => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const { data: metrics, isLoading } = useTdbPersoFetchMetrics();

  const metricDescriptors: MetricDescriptor[] = [
    {
      isVisible: hasCollectivitePermission('plans.read'),
      getCount: () => metrics?.plans.count || 0,
      getTitle: (count) => `Plan${count > 1 ? 's' : ''}`,
      link: ({ count }) => {
        if (count > 0) {
          return {
            href: makeCollectivitePlansActionsListUrl({ collectiviteId }),
            children: 'Voir tous les plans',
          };
        }
        if (hasCollectivitePermission('plans.mutate')) {
          return {
            href: makeCollectivitePlansActionsNouveauUrl({ collectiviteId }),
            children: 'Créer un plan',
          };
        }
        return undefined;
      },
    },
    {
      isVisible: hasCollectivitePermission('plans.fiches.read'),
      getCount: () => metrics?.plans.piloteFichesCount || 0,
      getTitle: (count) =>
        `Action${count > 1 ? 's' : ''} pilotée${count > 1 ? 's' : ''}`,
      link: ({ count }) =>
        count > 0
          ? {
              href: makeCollectiviteToutesLesFichesUrl({
                collectiviteId,
                ficheViewType: 'mes-actions',
              }),
              children: 'Voir les actions',
            }
          : undefined,
    },
    {
      isVisible: hasCollectivitePermission('indicateurs.indicateurs.read'),
      getCount: () => metrics?.indicateurs.piloteCount || 0,
      getTitle: (count) =>
        `Indicateur${count > 1 ? 's' : ''} piloté${count > 1 ? 's' : ''}`,
      link: ({ count }) =>
        count > 0
          ? {
              href: makeCollectiviteIndicateursListUrl({
                collectiviteId,
                listId: 'mes-indicateurs',
              }),
              children: 'Voir les indicateurs',
            }
          : undefined,
    },
    {
      isVisible: hasCollectivitePermission('referentiels.read'),
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
    ? getMetricsToDisplay(metricDescriptors)
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
