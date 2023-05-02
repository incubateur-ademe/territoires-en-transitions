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
  const scoreTotal =
    Math.round(
      repartitionPhases.reduce(
        (total, currValue) => (total += currValue.value),
        0
      ) * 10
    ) / 10;

  return (
    <ChartCard
      chartType="donut"
      chartProps={{data: repartitionPhases, label: true}}
      chartInfo={{
        title: `Répartition du score "Réalisé" par phase (${scoreTotal} point${
          scoreTotal === 0 || scoreTotal === 1 ? '' : 's'
        })`,
        legend: repartitionPhases.map((el, index) => ({
          name: el.id,
          color: defaultColors[index % defaultColors.length],
        })),
        expandable: true,
        downloadedFileName: `${referentiel}-realise-par-phase`,
      }}
    />
  );
};

export default ProgressionParPhase;
