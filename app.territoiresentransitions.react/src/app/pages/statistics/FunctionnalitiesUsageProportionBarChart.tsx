import {Bar} from 'react-chartjs-2';
import type {ChartData} from 'chart.js';
import {getFunctionnalitiesUsageProportion} from 'core-logic/api/statisticsApiEndpoints';
import {useEffect, useState} from 'react';

const functionnalityNameToLabel: Record<string, string> = {
  fiche_action: "Plan d'action",
  cae_referentiel: 'Référentiel CAE',
  eci_referentiel: 'Référentiel ECI',
  indicateur_personnalise: 'Indicateurs\n personnalisés',
  indicateur_referentiel: 'Indicateurs référentiel',
};

export const FunctionnalitiesUsageProportionBarChart = (props: {
  chartTitle: string;
  yAxisTitle: string;
  xAxisTitle: string;
}) => {
  const [chartData, setChartData] = useState({} as ChartData);

  useEffect(() => {
    getFunctionnalitiesUsageProportion().then(
      functionnalitiesUsageProportion => {
        const data: ChartData = {
          labels: Object.keys(functionnalitiesUsageProportion).map(
            name => functionnalityNameToLabel[name] ?? name
          ),
          datasets: [
            {
              data: Object.values(functionnalitiesUsageProportion).map(
                ratio => ratio * 100
              ),
              fill: true,
              backgroundColor: '#000091',
            },
          ],
        };
        setChartData(data);
      }
    );
  }, []);

  return (
    <div>
      <div className="w-full h-64 my-6">
        <div className="sm text-left font-bold text-bf500 ml-12">
          {props.chartTitle}
        </div>
        <Bar
          className="p-5"
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              x: {
                title: {display: true, text: props.xAxisTitle},
              },
              y: {
                title: {display: true, text: props.yAxisTitle},
                min: 0,
                max: 100,
              },
            },
          }}
        />
      </div>
    </div>
  );
};
