'use client';

import StatisticsDisplay from '../../StatisticsDisplay';

/**
 * Page de statistiques départementales
 *
 * @param params - URL param, permettant de récupérer departmentCode
 */

type RegionStatsProps = {
  params: {departmentCode: string};
};

const DepartmentStats = ({params: {departmentCode}}: RegionStatsProps) => {
  return <StatisticsDisplay departmentCode={departmentCode} />;
};

export default DepartmentStats;
