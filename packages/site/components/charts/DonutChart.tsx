/* eslint-disable react/jsx-no-undef */
import {PieTooltipProps, ResponsivePie} from '@nivo/pie';
import {animated} from '@react-spring/web';
import {getFormattedNumber} from 'src/utils/getFormattedNumber';
import {defaultColors, theme as localTheme} from './chartsTheme';

/**
 * Découpe le label pour l'affichage sur plusieurs lignes
 */
const splitLabel = (label: string) => {
  let newLabel = [];
  let currentLabel = label;

  while (currentLabel.length > 0) {
    let newContent = currentLabel.slice(0, 5);
    const contentEnd = currentLabel.slice(5).split(' ')[0];
    newContent += contentEnd;
    newLabel.push(newContent);
    currentLabel = currentLabel.slice(newContent.length);
  }

  return newLabel;
};

/**
 * Conversion d'une valeur en %
 */
const getPercentage = (value: number, data: number[]) => {
  let percentage = value / data.reduce((sum, curVal) => sum + curVal, 0);
  if (percentage < 0.01) {
    return Math.round(percentage * 10000) / 100;
  } else {
    return Math.round(percentage * 100);
  }
};

/**
 * Construction de la tooltip
 */
const getTooltip = (
  {datum: {id, value, color}}: PieTooltipProps<{}>,
  data: {
    id: string;
    value: number;
    color?: string;
  }[],
  unit: string,
  unitSingular: boolean,
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
      <span style={{paddingBottom: '3px'}}>
        {id} :{' '}
        <strong>
          {getFormattedNumber(Math.round(value * 10) / 10)} {unit}
          {!!unit && value > 1 && !unitSingular ? 's' : ''} (
          {getPercentage(
            value,
            data.map(d => d.value),
          )}
          %)
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
  unit?: string;
  unitSingular?: boolean;
  customMargin?: {top: number; right: number; bottom: number; left: number};
  zoomEffect?: boolean;
  displayPercentageValue?: boolean;
};

/**
 * Graphe donut à partir du composant nivo/pie
 */

const DonutChart = ({
  data,
  unit = '',
  unitSingular = false,
  customMargin,
  zoomEffect = true,
  displayPercentageValue = false,
}: DonutChartProps) => {
  let localData = data.map((d, index) => ({
    ...d,
    color: d.color ? d.color : defaultColors[index % defaultColors.length],
  }));

  return (
    <ResponsivePie
      data={localData}
      theme={localTheme}
      colors={{datum: 'data.color'}}
      margin={customMargin ?? {top: 40, right: 40, bottom: 40, left: 40}}
      innerRadius={0.6}
      padAngle={0}
      cornerRadius={0}
      activeOuterRadiusOffset={zoomEffect ? 8 : 0}
      borderWidth={0}
      enableArcLinkLabels={true}
      arcLinkLabelsSkipAngle={30}
      arcLinkLabelsDiagonalLength={10}
      arcLinkLabelsStraightLength={10}
      arcLinkLabelsThickness={1}
      arcLinkLabelsOffset={5}
      arcLinkLabelsTextOffset={5}
      arcLinkLabelsTextColor="#2A2A62"
      arcLinkLabelComponent={datum => {
        return (
          <animated.g opacity={datum.style.opacity}>
            <animated.path
              fill="none"
              stroke="#2A2A62"
              strokeWidth={datum.style.thickness}
              d={datum.style.path}
              offset={10}
            />
            {splitLabel(datum.label).map((segment, i) => (
              <animated.text
                y={i * 12}
                key={`arcLinkLabel_segment_${segment}`}
                transform={datum.style.textPosition}
                textAnchor={datum.style.textAnchor}
                dominantBaseline="center"
                style={{
                  fontFamily: '"Marianne", arial, sans-serif',
                  fontWeight: 600,
                  fontSize: 11,
                  fill: '#2A2A62',
                }}
              >
                {segment}
              </animated.text>
            ))}
            <animated.text
              y={splitLabel(datum.label).length * 12 + 6}
              transform={datum.style.textPosition}
              textAnchor={datum.style.textAnchor}
              dominantBaseline="center"
              style={{
                fontFamily: '"Marianne", arial, sans-serif',
                fontWeight: 600,
                fontSize: 11,
                fill: '#5555C3',
              }}
            >
              {getFormattedNumber(Math.round(datum.datum.value * 10) / 10)}
            </animated.text>
          </animated.g>
        );
      }}
      enableArcLabels={false}
      animate={true}
      tooltip={datum => getTooltip(datum, localData, unit, unitSingular)}
      valueFormat={value =>
        displayPercentageValue
          ? `${getPercentage(
              value,
              localData.map(d => d.value),
            )} %`
          : `${getFormattedNumber(Math.round(value))}`
      }
    />
  );
};

export default DonutChart;
