import {actionAvancementColors} from 'app/theme';
import {TooltipItem} from 'chart.js';
import {Bar} from 'react-chartjs-2';
import {AxisAvancementSample} from 'ui/charts/chartTypes';
import {Spacer} from 'ui/shared/Spacer';
import {addOpacityToHex} from 'utils/addOpacityToHex';
import {toFixed} from 'utils/toFixed';

export type ReferentielAxisAvancementStackedBarProps = {
  data: AxisAvancementSample[];
  widthPx?: number;
};
export const ReferentielAxisAvancementStackedBar = ({
  data,
  widthPx = 500,
}: ReferentielAxisAvancementStackedBarProps) => {
  const formatedData = {
    labels: data.map(sample => sample.label),
    datasets: [
      {
        label: 'Fait',
        data: data.map(sample => sample.percentages.fait),
        ...makeDatasetOption(actionAvancementColors.fait),
      },
      {
        label: 'Programmé',
        data: data.map(sample => sample.percentages.programme),
        ...makeDatasetOption(actionAvancementColors.programme),
      },
      {
        label: 'Pas fait',
        data: data.map(sample => sample.percentages.pas_fait),
        ...makeDatasetOption(actionAvancementColors.pas_fait),
      },
      {
        label: 'Non renseigné',
        data: data.map(sample => sample.percentages.non_renseigne),
        ...makeDatasetOption(actionAvancementColors.non_renseigne),
      },
    ],
  };
  return (
    <div style={{width: `${widthPx}px`, marginLeft: '0px'}}>
      <div className="font-semibold text-center text-xl">
        État d'avancement par axes
      </div>
      <Spacer size={2} />
      <Bar
        data={formatedData}
        height={85 * data.length}
        width={widthPx}
        options={{
          indexAxis: 'y',
          plugins: {
            legend: {display: false},
            tooltip: {
              callbacks: {
                title: items => {
                  const dataIndex = items?.[0].dataIndex;
                  return data[dataIndex]?.label.map(s => s[0]).join(' ');
                },
                label: (data: TooltipItem<'bar'>) => {
                  return `${data.dataset.label} : ${toFixed(
                    data.raw as number,
                    1
                  )} %`;
                },
              },
            },
          },
          responsive: true,

          scales: {
            x: {
              min: 0,
              max: 100,
              stacked: true,
              ticks: {
                stepSize: 25,
                backdropPadding: 0,
                callback: function () {
                  return '';
                },
              },
              title: {display: true, text: '%'},
            },
            y: {
              position: 'left',
              stacked: true,
              ticks: {padding: 0},
              afterFit: function (scaleInstance) {
                scaleInstance.width = 175; // largeur libellés à gauche
              },
            },
            z: {
              position: 'right',
              labels: data.map(
                ({potentielPoints: maxPoints}) => `(${maxPoints} points)`
              ),
            },
          },
        }}
      />
    </div>
  );
};

const makeDatasetOption = (color: string) => ({
  backgroundColor: addOpacityToHex(color, 0.7),
  borderColor: color,
  borderWidth: 0,
  fill: true,
});
