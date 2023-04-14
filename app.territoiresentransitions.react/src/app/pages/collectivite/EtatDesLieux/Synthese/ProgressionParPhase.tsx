import ChartCard from 'ui/charts/ChartCard';
import {defaultColors} from 'ui/charts/chartsTheme';

type ProgressionParPhaseProps = {
  repartitionPhases: {id: string; value: number}[];
  referentiel: string;
};

const ProgressionParPhase = ({
  referentiel,
  repartitionPhases,
}: ProgressionParPhaseProps) => {
  return (
    <ChartCard
      chartType="donut"
      chartProps={{data: repartitionPhases, label: true}}
      chartInfo={{
        title: 'Progression par phase',
        legend: repartitionPhases.map((el, index) => ({
          name: el.id,
          color: defaultColors[index % defaultColors.length],
        })),
        expandable: true,
        downloadedFileName: `${referentiel}-phase`,
      }}
    />
  );
};

export default ProgressionParPhase;
