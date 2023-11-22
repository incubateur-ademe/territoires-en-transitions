'use client';

import DonutChart from '@components/charts/DonutChart';
import {TTableauBudget} from './utils';
import {useEffect, useState} from 'react';

export type RepartitionCoutsProps = {
  titre: string;
  data: TTableauBudget;
};

const getChartData = (data: {[key: string]: {[key: string]: number}}) => {
  let chartData = [];

  for (const line in data) {
    const total = Object.values(data[line]).reduce(
      (total, currValue) => total + currValue,
      0,
    );
    chartData.push({id: line, value: total});
  }

  return chartData;
};

const RepartitionCouts = ({titre, data}: RepartitionCoutsProps) => {
  const chartData = getChartData(data.tableau);
  const [windowWidth, setWindowWidth] = useState<number | undefined>();
  // 640px = breakpoint sm

  useEffect(() => {
    // Initialisation de windowWith au chargement de la page
    setWindowWidth(window.innerWidth);

    // Détecte le changement de taille de la fenêtre
    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
    return () =>
      window.removeEventListener('resize', () =>
        setWindowWidth(window.innerWidth),
      );
  }, []);

  return (
    <>
      <h5>{titre}</h5>
      <div className="max-sm:h-[300px] h-[430px] my-10 max-md:-mx-6">
        <DonutChart
          data={chartData}
          customColors={['#6A6AF4', '#5555C3', '#F0F0FE', '#C3C3FB', '#A5A5F8']}
          customMargin={{
            top: 30,
            right: 140,
            bottom: 30,
            left: 140,
          }}
          onlyDisplayPercentageValue
          invertedDisplay
          spaceBetweenPads
          displayValueInArcLinkLabel={false}
          arcLinkLabelOnSeveralLines={
            windowWidth && windowWidth > 640 ? false : true
          }
          startAngle={-10}
          arcLinkLabelsSkipAngle={0}
          arcLinkLabelsThickness={
            windowWidth && windowWidth > 640 ? 0 : undefined
          }
          arcLinkLabelFontSize={
            windowWidth && windowWidth > 640 ? 14 : undefined
          }
        />
      </div>
    </>
  );
};

export default RepartitionCouts;
