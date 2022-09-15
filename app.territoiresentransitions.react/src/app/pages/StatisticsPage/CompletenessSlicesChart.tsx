import {Doughnut} from 'react-chartjs-2';
import {ChartData} from 'chart.js';
import {referentielToName} from 'app/labels';
import {Referentiel} from 'types/litterals';
import {CompletenessSlice} from 'core-logic/api/statisticsApiEndpoints';

export type TCompletenessSlicesChartProps = {
  slices: CompletenessSlice[];
  referentiel: Referentiel;
  widthPx: number;
};

const referentielToColors = {
  eci: ['#ffe0d4', '#ffc0aa', '#ffa082', '#ff7e5a', '#ff5733'],
  cae: ['#F5FCFF', '#DBF3FA', '#B7E9F7', '#7AD7F0', '#55A1E3'],
};

const SliceLabels: {[key: string]: string} = {
  '0:0': '0 %',
  '100:100': '100 %',
};

const formatLabel = (label: string): string =>
  SliceLabels[label] ? SliceLabels[label] : `de ${label.replace(':', ' à ')} %`;

const getChartData = (
  slices: CompletenessSlice[],
  referentiel: Referentiel
): ChartData<'doughnut'> => {
  const labels: string[] = [];
  const data: number[] = [];
  slices.forEach(slice => {
    labels.push(formatLabel(slice.bucket));
    data.push(slice[referentiel]);
  });

  return {
    labels,
    datasets: [
      {
        label: referentielToName[referentiel],
        data,
        backgroundColor: referentielToColors[referentiel],
        hoverOffset: 4,
      },
    ],
  };
};

export const CompletenessSlicesChart = (
  props: TCompletenessSlicesChartProps
) => {
  const {slices, referentiel, widthPx} = props;
  const data = getChartData(slices, referentiel);
  return (
    <div style={{width: widthPx, marginLeft: 0}}>
      <div className="font-semibold text-center text-md pb-4">
        {referentielToName[referentiel]}
      </div>
      <Doughnut
        data={data}
        options={{
          plugins: {
            legend: {display: true, position: 'bottom'},
            tooltip: {
              callbacks: {
                label: ({label, raw}) => ` ${label} : ${raw} collectivités`,
              },
            },
          },
        }}
      />
    </div>
  );
};
