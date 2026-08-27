import { appLabels } from '@/app/labels/catalog';
import {
  MetricCard,
  MetricCardProps,
} from '@/app/tableaux-de-bord/metrics/metric.card';
import { MetricCardSkeleton } from '@/app/tableaux-de-bord/metrics/metric.card-skeleton';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { capitalize } from '@tet/ui/labels/plural';
import { useTdbPersoFetchMetrics } from '../_hooks/use-tdb-perso-fetch-metrics';

// Type descriptor for metric cards
type MetricDescriptor = {
  isVisible: boolean;
  getCount: () => number;
  getTitle: (count: number) => string;
  link?: (args: { count: number }) => MetricCardProps['link'];
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
        link: metricDescriptor.link?.({ count }),
      },
    ];
  });
}

const Metrics = () => {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const { data: metrics, isLoading } = useTdbPersoFetchMetrics();

  const metricDescriptors: MetricDescriptor[] = [
    {
      isVisible: hasCollectivitePermission('plans.fiches.read_confidentiel'),
      getCount: () => metrics?.plans.piloteFichesCount || 0,
      getTitle: (count) =>
        capitalize(appLabels.action({ count, withoutCount: true })),
    },
    {
      isVisible: hasCollectivitePermission('plans.fiches.read_confidentiel'),
      getCount: () => metrics?.plans.piloteSubFichesCount || 0,
      getTitle: (count) =>
        capitalize(appLabels.sousAction({ count, withoutCount: true })),
    },
    {
      isVisible: hasCollectivitePermission(
        'indicateurs.indicateurs.read_confidentiel'
      ),
      getCount: () => metrics?.indicateurs.piloteCount || 0,
      getTitle: (count) =>
        capitalize(appLabels.indicateur({ count, withoutCount: true })),
    },
    {
      isVisible: hasCollectivitePermission('referentiels.read_confidentiel'),
      getCount: () => metrics?.referentiels.piloteMesuresCount || 0,
      getTitle: (count) =>
        capitalize(appLabels.sousMesure({ count, withoutCount: true })),
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
