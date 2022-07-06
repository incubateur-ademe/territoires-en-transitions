import {actionAvancementColors} from 'app/theme';
import {TooltipItem} from 'chart.js';
import {Bar} from 'react-chartjs-2';
import {Referentiel} from 'types/litterals';
import {AxisAvancementSample} from 'ui/charts/chartTypes';
import {CanvasDownloadButton} from 'ui/charts/CanvasDownloadButton';
import {addOpacityToHex} from 'utils/addOpacityToHex';
import {toFixed} from 'utils/toFixed';

export type ReferentielAxisAvancementStackedBarProps = {
  data: AxisAvancementSample[];
  widthPx?: number;
  referentiel: Referentiel;
};
export const ReferentielAxisAvancementStackedBar = ({
  data,
  widthPx = 500,
  referentiel,
}: ReferentielAxisAvancementStackedBarProps) => {
  const canvasId = `axis_avancement_bar_${referentiel}`;
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
    <div
      className="flex flex-col items-center gap-2"
      style={{width: `${widthPx}px`, marginLeft: '0px'}}
    >
      <div className="font-semibold text-center text-xl">
        État d'avancement par axes
      </div>
      <Bar
        id={canvasId}
        data={formatedData}
        height={58 * data.length}
        width={widthPx}
        options={{
          indexAxis: 'y',
          plugins: {
            legend: {display: false},
            tooltip: {
              callbacks: {
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
                font: {size: 10},
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
              ticks: {padding: 0, font: {size: 10}},
              afterFit: function (scaleInstance) {
                scaleInstance.width = 120; // largeur libellés à gauche
              },
            },
            z: {
              ticks: {
                font: {size: 8},
              },
              position: 'right',
              labels: data.map(
                ({potentielPoints: maxPoints}) => `(${maxPoints} points)`
              ),
            },
          },
        }}
      />
      <CanvasDownloadButton
        fileName={`État d'avancement par axes ${referentiel}.png`}
        canvasId={canvasId}
        buttonText={`Télécharger l'état d'avancement par axes pour ${referentiel.toUpperCase()}`}
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
