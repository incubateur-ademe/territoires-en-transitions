import {
  useRattachements,
  useActiveCollectivites,
  useActiveUsers,
  useFunctionnalitiesUsageProportion,
  useCompletenessSlices,
} from 'core-logic/api/statisticsApiEndpoints';
import {StatisticsPage} from './StatisticsPage';

const StatisticsPageConnected = () => {
  const rattachements = useRattachements();
  const activeUsers = useActiveUsers();
  const activeCollectivites = useActiveCollectivites();
  const proportions = useFunctionnalitiesUsageProportion();
  const slices = useCompletenessSlices();
  const props = {
    rattachements,
    activeUsers,
    activeCollectivites,
    proportions,
    slices,
  };
  return <StatisticsPage {...props} />;
};

export default StatisticsPageConnected;
