import {Line} from 'react-chartjs-2';
import type {ChartData, ChartDataset} from 'chart.js';
import {DailyCount} from 'core-logic/api/statisticsApiEndpoints';
import {useEffect, useState} from 'react';
import * as R from 'ramda';
import 'chartjs-adapter-moment';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const getDataset = (dates: Date[], dailyCount: DailyCount[]): ChartDataset => {
  const color = '#000091';
  const data = R.map(date => {
    const userCountForDay = R.find(
      dailyUserCount =>
        new Date(dailyUserCount.date).getTime() === date.getTime(),
      dailyCount
    );
    return userCountForDay ? userCountForDay.cumulated_count : NaN;
  }, dates);

  const datastet = {
    data,
    fill: false,
    backgroundColor: color,
    borderColor: color,
    strokeColor: color,
    borderWidth: 2,
    pointRadius: 2,
    pointHoverRadius: 3,
    tension: 0.2,
    spanGaps: true,
  };

  return datastet;
};

export const DailyCountLineChart = (props: {
  chartTitle: string;
  unit: 'day' | 'week' | 'month' | 'quarter' | 'year';
  getDailyCount: () => Promise<DailyCount[]>;
  yAxisTitle: string;
  yMin: number;
}) => {
  const [chartData, setChartData] = useState({} as ChartData);

  useEffect(() => {
    props.getDailyCount().then(dailyCounts => {
      const dates = dailyCounts.map(
        dailyUserCount => new Date(dailyUserCount.date)
      );
      const dataset = getDataset(dates, dailyCounts);
      const data: ChartData = {
        labels: dates,
        datasets: [dataset],
      };
      setChartData(data);
    });
  }, []);

  return (
    <div>
      <div className="h-64 w-96 my-6">
        <div className="xs text-left font-bold text-bf500">
          {props.chartTitle}
        </div>
        <Line
          className="py-5"
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
              y: {
                title: {display: true, text: props.yAxisTitle},
                min: props.yMin,
              },

              x: {
                type: 'time',
                time: {
                  unit: props.unit,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
};
