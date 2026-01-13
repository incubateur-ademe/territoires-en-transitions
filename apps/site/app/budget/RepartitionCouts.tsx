'use client';

import { defaultVarColors } from '@/site/components/charts/chartsTheme';
import DonutChart from '../../components/charts/DonutChart';
import { TTableauBudget } from './utils';

export type RepartitionCoutsProps = {
  titre: string;
  data: TTableauBudget;
};

const getChartData = (data: { [key: string]: { [key: string]: number } }) => {
  const chartData = [];

  for (const line in data) {
    const total = Object.values(data[line]).reduce(
      (total, currValue) => total + currValue,
      0
    );
    chartData.push({ id: line, value: total });
  }

  return chartData.sort((a, b) => b.value - a.value);
};

const RepartitionCouts = ({ titre, data }: RepartitionCoutsProps) => {
  const chartData = getChartData(data.tableau);

  return (
    <>
      <h5 className="text-primary-8 mb-10">{titre}</h5>
      <div className="max-sm:h-[300px] h-[430px] my-10 max-md:-mx-6">
        <DonutChart
          data={chartData}
          customColors={defaultVarColors}
          customMargin={{
            top: 30,
            right: 140,
            bottom: 30,
            left: 140,
          }}
          onlyDisplayPercentageValue
          invertedDisplay
          spaceBetweenPads
          startAngle={-10}
          arcLinkLabelsSkipAngle={15}
        />
      </div>
    </>
  );
};

export default RepartitionCouts;
