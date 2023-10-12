import {Metadata} from 'next';
import StatisticsDisplay from '../../StatisticsDisplay';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Statistiques',
  };
}

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
