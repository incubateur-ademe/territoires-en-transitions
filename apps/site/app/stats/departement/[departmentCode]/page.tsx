import { Metadata } from 'next';
import StatisticsDisplay from '../../StatisticsDisplay';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Statistiques',
  };
}

/**
 * Page de statistiques départementales
 *
 * @param params - URL param, permettant de récupérer departmentCode
 */

type RegionStatsProps = {
  params: Promise<{ departmentCode: string }>;
};

const DepartmentStats = async ({ params }: RegionStatsProps) => {
  const { departmentCode } = await params;
  return <StatisticsDisplay departmentCode={departmentCode} />;
};

export default DepartmentStats;
