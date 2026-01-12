'use client';

import { getFormattedNumber } from '@/site/src/utils/getFormattedNumber';
import { PieTooltipProps, ResponsivePie } from '@nivo/pie';
import { defaultColors, theme as localTheme } from './chartsTheme';

/**
 * Conversion d'une valeur en %
 */
const getPercentage = (value: number, data: number[]) => {
  const percentage = value / data.reduce((sum, curVal) => sum + curVal, 0);
  if (percentage < 0.01) {
    return Math.round(percentage * 10000) / 100;
  } else {
    return Math.round(percentage * 100);
  }
};

/**
 * Formattage de la valeur
 */
const getAbsolute = (value: number, decimals: number) => {
  return getFormattedNumber(
    Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
  );
};

/**
 * Construction de la tooltip
 */
const getTooltip = (
  { datum: { id, value, color } }: PieTooltipProps<unknown>,
  data: {
    id: string;
    value: number;
    color?: string;
  }[],
  unit: string,
  unitSingular: boolean,
  decimals: number,
  onlyDisplayPercentageValue: boolean
) => {
  return (
    <div
      style={{
        fontFamily: '"Marianne", arial, sans-serif',
        fontSize: 14,
        background: '#fff',
        padding: '9px 12px',
        border: '1px solid #ccc',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: color,
          width: '12px',
          height: '12px',
          marginRight: '7px',
        }}
      />
      <span style={{ paddingBottom: '3px' }}>
        {id} :{' '}
        <strong>
          {onlyDisplayPercentageValue
            ? `${getPercentage(
                value,
                data.map((d) => d.value)
              )} %`
            : `${
                value < 1
                  ? getAbsolute(value, decimals < 2 ? 2 : decimals)
                  : getAbsolute(value, decimals)
              }
          ${unit}${!!unit && value > 1 && !unitSingular ? 's' : ''}
          (${getPercentage(
            value,
            data.map((d) => d.value)
          )} %)`}
        </strong>
      </span>
    </div>
  );
};

export type DonutChartProps = {
  data: {
    id: string;
    value: number;
    color?: string;
  }[];
  customColors?: string[];
  unit?: string;
  unitSingular?: boolean;
  decimals?: number;
  customMargin?: { top: number; right: number; bottom: number; left: number };
  zoomEffect?: boolean;
  displayPercentageValue?: boolean;
  onlyDisplayPercentageValue?: boolean;
  invertedDisplay?: boolean;
  startAngle?: number;
  spaceBetweenPads?: boolean;
  arcLinkLabelsSkipAngle?: number;
  arcLinkLabelsThickness?: number;
};

/**
 * Graphe donut à partir du composant nivo/pie
 */

const DonutChart = ({
  data,
  customColors,
  unit = '',
  unitSingular = false,
  decimals = 1,
  customMargin,
  zoomEffect = true,
  displayPercentageValue = false,
  onlyDisplayPercentageValue = false,
  invertedDisplay = false,
  startAngle = 0,
  spaceBetweenPads = false,
  arcLinkLabelsSkipAngle = 40,
  arcLinkLabelsThickness = 1,
}: DonutChartProps) => {
  const localData = data.map((d, index) => ({
    ...d,
    color: d.color
      ? d.color
      : customColors
      ? customColors[index % defaultColors.length]
      : defaultColors[index % defaultColors.length],
  }));

  return (
    <ResponsivePie
      data={localData}
      theme={localTheme}
      colors={{ datum: 'data.color' }}
      margin={customMargin ?? { top: 40, right: 40, bottom: 40, left: 40 }}
      startAngle={startAngle}
      endAngle={invertedDisplay ? -360 + startAngle : 360 + startAngle}
      innerRadius={0.6}
      padAngle={spaceBetweenPads ? 0.5 : 0}
      cornerRadius={spaceBetweenPads ? 7 : 0}
      activeOuterRadiusOffset={zoomEffect ? 8 : 0}
      borderWidth={0}
      enableArcLinkLabels={true}
      arcLinkLabelsSkipAngle={arcLinkLabelsSkipAngle}
      arcLinkLabelsDiagonalLength={10}
      arcLinkLabelsStraightLength={10}
      arcLinkLabelsThickness={arcLinkLabelsThickness}
      arcLinkLabelsOffset={5}
      arcLinkLabelsTextOffset={5}
      arcLinkLabelsTextColor="#2A2A62"
      arcLinkLabelsColor={{ from: 'color' }}
      enableArcLabels={false}
      animate={true}
      tooltip={(datum) =>
        getTooltip(
          datum,
          localData,
          unit,
          unitSingular,
          decimals,
          onlyDisplayPercentageValue
        )
      }
      valueFormat={(value) =>
        displayPercentageValue || onlyDisplayPercentageValue
          ? `${getPercentage(
              value,
              localData.map((d) => d.value)
            )} %`
          : `${
              value < 1
                ? getAbsolute(value, decimals < 2 ? 2 : decimals)
                : getAbsolute(value, decimals)
            }`
      }
    />
  );
};

export default DonutChart;
