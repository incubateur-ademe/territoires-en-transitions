'use client';

import StatisticsDisplay from '../../StatisticsDisplay';

/**
 * Page de statistiques régionales
 *
 * @param params - URL param, permettant de récupérer regionCode
 */

type RegionStatsProps = {
  params: {regionCode: string};
};

const RegionStats = ({params: {regionCode}}: RegionStatsProps) => {
  return <StatisticsDisplay regionCode={regionCode} />;
};

export default RegionStats;
