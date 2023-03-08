'use client';

import StatisticsDisplay from '../../StatisticsDisplay';

type RegionStatsProps = {
  params: {departmentCode: string};
};

const DepartmentStats = ({params: {departmentCode}}: RegionStatsProps) => {
  return <StatisticsDisplay departmentCode={departmentCode} />;
};

export default DepartmentStats;
