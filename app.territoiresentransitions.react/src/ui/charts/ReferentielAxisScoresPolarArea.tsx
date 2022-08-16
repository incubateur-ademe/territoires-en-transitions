import {actionAvancementColors} from 'app/theme';
import {TooltipItem} from 'chart.js';
import {PolarArea} from 'react-chartjs-2';
import ChartDataLabels, {Context} from 'chartjs-plugin-datalabels';
import {AxisAvancementSample} from 'ui/charts/chartTypes';
import {addOpacityToHex} from 'utils/addOpacityToHex';
import {toFixed} from 'utils/toFixed';
import {CanvasDownloadButton} from 'ui/charts/CanvasDownloadButton';
import {Referentiel} from 'types/litterals';

export type ReferentielAxisScoresPolarAreaProps = {
  referentiel: Referentiel;
  data: AxisAvancementSample[];
  widthPx?: number;
};

export const ReferentielAxisScoresPolarArea = ({
  referentiel,
  data,
  widthPx = 500,
}: ReferentielAxisScoresPolarAreaProps) => {
  const canvasId = `axis_scores_polar_${referentiel}`;
  const formatedData = {
    labels: data.map(({label, potentielPoints: referentielPoints}) => [
      ...label,
      [`(${referentielPoints} points)`],
    ]),
    datasets: [
      {
        label: 'Réalisé',
        data: data.map(({percentages}) => percentages.fait),
        ...makeDatasetOption(actionAvancementColors.fait),
      },
      {
        label: 'Prévisionnel',
        data: data.map(
          ({percentages}) => percentages.fait + percentages.programme
        ),
        ...makeDatasetOption(actionAvancementColors.programme),
      },
    ],
  };

  return (
    <div className="flex flex-col items-center" style={{width: `${widthPx}px`}}>
      <div
        style={{paddingTop: '32px', marginBottom: '-32px'}}
        className="font-semibold text-center text-xl"
      >
        Scores par axe
      </div>
      <PolarArea
        id={canvasId}
        data={formatedData}
        plugins={[ChartDataLabels] as never}
        options={{
          layout: {padding: 110},
          plugins: {
            legend: {display: false},
            tooltip: {
              callbacks: {
                title: (tooltipItems: TooltipItem<'polarArea'>[]) => {
                  return tooltipItems[0].label;
                },
                label: (tooltipItem: TooltipItem<'polarArea'>) => {
                  return `${tooltipItem.dataset.label} : ${toFixed(
                    tooltipItem.raw as number,
                    1
                  )} %`;
                },
              },
            },
            datalabels: {
              formatter: (value: unknown, context: Context) => {
                return context?.chart?.data?.labels?.[context.dataIndex];
              },
              anchor: 'start',
              align: 'end',
              offset: 150,
            },
          },
          responsive: true,
          scales: {
            r: {
              pointLabels: {
                display: false,
              },
              min: 0,
              max: 100,
              ticks: {
                stepSize: 25,
                callback: function (tickValue: number | string) {
                  return tickValue + '%';
                },
              },
            },
          },
        }}
      />
      <CanvasDownloadButton
        fileName={`Scores par axes ${referentiel}.png`}
        canvasId={canvasId}
        buttonText={`Télécharger les scores par axes pour ${referentiel.toUpperCase()}`}
      />
    </div>
  );
};

const makeDatasetOption = (color: string) => ({
  backgroundColor: addOpacityToHex(color, 0.5),
  borderColor: color,
  borderWidth: 1,
  pointRadius: 1.5,
  fill: true,
});
