import {PieTooltipProps, ResponsivePie} from '@nivo/pie';
import {defaultColors, nivoColorsSet, theme} from './chartsTheme';

/**
 * Suppression des arcLinkLabels si deux tranches de faible
 * valeur se succèdent dans le graphe
 * Permet d'éviter le chevauchement des labels
 */
const skipArcLinkLabel = (
  data: {
    id: string;
    value: number;
    color?: string;
  }[]
) => {
  const total = data.reduce(
    (total, currentValue) => total + currentValue.value,
    0
  );

  return data.reduce((isLabelSkipped, currentValue, index) => {
    if (
      currentValue.value / total < 0.05 &&
      index > 0 &&
      data[index - 1].value / total < 0.1
    ) {
      return true;
    }
    return isLabelSkipped;
  }, false);
};

const getTooltip = (
  {datum: {id, value, color}}: PieTooltipProps<{}>,
  isDefaultData: boolean,
  data: {
    id: string;
    value: number;
    color?: string;
  }[],
  unit: string
) => {
  if (isDefaultData) return null;

  let percentage = value / data.reduce((sum, curVal) => sum + curVal.value, 0);
  if (percentage < 0.01) {
    percentage = Math.round(percentage * 10000) / 100;
  } else {
    percentage = Math.round(percentage * 100);
  }

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
      ></div>
      <span style={{paddingBottom: '3px'}}>
        {id} :{' '}
        <strong>
          {Math.round(value * 10) / 10} {unit}
          {!!unit && value > 1 ? 's' : ''} ({percentage}%)
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
  label?: boolean;
  unit?: string;
  customMargin?: {top: number; right: number; bottom: number; left: number};
  zoomEffect?: boolean;
};

/**
 * Graphe donut générique à partir du composant nivo/pie
 *
 * @param data - tableau de données à afficher
 * @param label - (optionnel) affichage des labels sur le
 * @param customMargin
 * @param zoomEffect
 * graphe au lieu de la légende
 */

const DonutChart = ({
  data,
  label = false,
  unit = '',
  customMargin,
  zoomEffect = true,
}: DonutChartProps) => {
  const defaultData = [{id: 'NA', value: 1, color: '#ccc'}];

  let localData = data.map((d, index) => ({
    ...d,
    color: d.color
      ? d.color
      : data.length <= defaultColors.length
      ? defaultColors[index % defaultColors.length]
      : nivoColorsSet[index % nivoColorsSet.length],
  }));

  const isDefaultData = (): boolean => {
    return data.length === 0 || data.filter(d => d.value !== 0).length === 0;
  };

  return (
    <ResponsivePie
      data={isDefaultData() ? defaultData : localData}
      theme={theme}
      colors={{datum: 'data.color'}}
      margin={customMargin ?? {top: 40, right: 50, bottom: 60, left: 50}}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={zoomEffect ? 8 : 0}
      borderWidth={1}
      borderColor={{from: 'color', modifiers: [['darker', 0.2]]}}
      enableArcLinkLabels={
        (label || isDefaultData()) && !skipArcLinkLabel(data)
      }
      arcLinkLabelsDiagonalLength={10}
      arcLinkLabelsStraightLength={5}
      arcLinkLabelsTextColor="#333"
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{from: 'color'}}
      enableArcLabels={isDefaultData() ? false : true}
      arcLabel={d => `${Math.round(d.value)}`}
      arcLabelsSkipAngle={12}
      arcLabelsTextColor={{from: 'color', modifiers: [['darker', 2]]}}
      animate={true}
      tooltip={datum => getTooltip(datum, isDefaultData(), localData, unit)}
    />
  );
};

export default DonutChart;
