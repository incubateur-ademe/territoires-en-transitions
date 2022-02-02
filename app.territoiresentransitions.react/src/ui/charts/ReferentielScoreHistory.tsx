import {actionAvancementColors} from 'app/theme';
import {TooltipItem} from 'chart.js';
import {Line} from 'react-chartjs-2';
import {addOpacityToHex} from 'utils/addOpacityToHex';

export type ReferentielScoreHistoryProps = {
  referentielMaxPoints: number;
  data: {date: string; pointsFait: number; pointsProgramme: number}[];
  widthPx?: number;
};
export const ReferentielScoreHistory = ({
  referentielMaxPoints,
  data,
  widthPx = 500,
}: ReferentielScoreHistoryProps) => {
  const makeDatasetOption = (color: string) => ({
    backgroundColor: addOpacityToHex(color, 0.3),
    borderColor: color,
    borderWidth: 0.5,
    pointRadius: 1.5,
    fill: true,
  });
  const formatedData = {
    labels: data.map(sample => sample.date),
    datasets: [
      {
        label: 'Réalisé',
        data: data.map(sample => sample.pointsFait),
        ...makeDatasetOption(actionAvancementColors.fait),
      },
      {
        label: 'Programmé',
        data: data.map(sample => sample.pointsProgramme),
        ...makeDatasetOption(actionAvancementColors.programme),
      },
    ],
  };
  return (
    <div style={{width: `${widthPx}px`}}>
      <div className="font-semibold text-center text-xl">
        Évolution du score du référentiel (sur {referentielMaxPoints} points){' '}
      </div>
      <Line
        data={formatedData}
        options={{
          plugins: {
            legend: {display: false},
            tooltip: {
              callbacks: {
                label: (data: TooltipItem<'line'>) =>
                  `${data.dataset.label} : ${data.raw}%`,
              },
            },
          },
          responsive: true,
          scales: {
            y: {
              min: 0,
              stacked: true,
              max: 100,
              ticks: {
                stepSize: 25,
                callback: function () {
                  return '';
                },
              },
              title: {display: true, text: '%'},
            },
          },
        }}
      />
    </div>
  );
};
