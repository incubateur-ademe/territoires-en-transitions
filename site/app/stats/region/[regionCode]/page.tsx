'use client';

import StatisticsDisplay from '../../StatisticsDisplay';

type RegionStatsProps = {
  params: {regionCode: string};
};

const RegionStats = ({params: {regionCode}}: RegionStatsProps) => {
  return <StatisticsDisplay regionCode={parseInt(regionCode)} />;
};

export default RegionStats;
