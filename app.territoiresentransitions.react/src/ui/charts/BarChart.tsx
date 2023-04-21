import {BarTooltipProps, ComputedDatum, ResponsiveBar} from '@nivo/bar';
import {defaultColors} from './chartsTheme';

const getCustomColor = ({
  id,
  data,
}: {
  id: string | number;
  data: {[key: string]: string};
}) => `${data[`${id}_color`]}`;

const upperCaseFirstLetter = (value: string): string => {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}`;
};

const getLabel = (d: ComputedDatum<{}>) => {
  if (d.value) {
    const roundedValue = Math.round(d.value);
    if (roundedValue !== 0) return roundedValue.toString();
  }
  return '';
};

const getTooltip = (
  {id, value, index, indexValue, color}: BarTooltipProps<{}>,
  localIndexTitles: string[],
  unit: string
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
        flexDirection: 'column',
        alignItems: 'start',
      }}
    >
      <div>
        {localIndexTitles.length ? localIndexTitles[index] : indexValue}
      </div>
      <div
        style={{
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
        <span>
          {id} :{' '}
          <strong>
            {Math.round(value * 10) / 10} {unit}
          </strong>
        </span>
      </div>
    </div>
  );
};

export type BarChartProps = {
  data: {}[];
  indexBy: string;
  keys: string[];
  indexTitles?: string[];
  layout?: 'horizontal' | 'vertical';
  inverted?: boolean;
  customColors?: boolean;
  unit?: string;
  onSelectIndex?: (index: string | number) => void;
};

/**
 * Graphe bar générique à partir du composant nivo/bar
 *
 * @param data - tableau de données à afficher
 * @param indexBy string - élément de data utilisé pour indexer les autres données
 * @param keys string[] - éléments utilisés pour déterminer chaque série de données
 * @param indexTitles string[] (optionnel) - permet d'afficher des valeurs différentes de indexBy dans la tooltip
 * @param layout 'horizontal' | 'vertical' (optionnel) - orientation du graphe, par défaut vertical
 * @param inverted boolean (optionnel) - inverse l'ordre d'affichage des valeurs sur l'axe indexBy
 * @param customColors boolean (optionnel) - signale la présence de couleurs custom dans le tableau data
 * @param unit string (optionnel) - unité des éléments listés dans keys
 * @param onSelectIndex renvoie l'index de l'élément sur lequel on a cliqué
 */

const BarChart = ({
  data,
  indexBy,
  keys,
  indexTitles = [],
  layout,
  inverted = false,
  customColors = false,
  unit = '',
  onSelectIndex,
}: BarChartProps) => {
  let localData = [];
  let localIndexTitles: string[] = [];

  if (inverted) {
    for (let i = data.length - 1; i >= 0; i--) {
      localData.push(data[i]);
      if (indexTitles) localIndexTitles.push(indexTitles[i]);
    }
  } else {
    localData = [...data];
    localIndexTitles = [...indexTitles];
  }

  return (
    <ResponsiveBar
      data={localData}
      keys={keys}
      indexBy={indexBy}
      margin={{top: 50, right: 60, bottom: 70, left: 70}}
      layout={layout}
      colors={customColors ? getCustomColor : defaultColors}
      borderColor={{from: 'color', modifiers: [['darker', 1.6]]}}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend:
          layout === 'horizontal'
            ? upperCaseFirstLetter(unit)
            : upperCaseFirstLetter(indexBy),
        legendPosition: 'middle',
        legendOffset: 45,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: -45,
        legend:
          layout === 'horizontal'
            ? upperCaseFirstLetter(indexBy)
            : upperCaseFirstLetter(unit),
        legendPosition: 'middle',
        legendOffset: -50,
      }}
      label={getLabel}
      enableGridX={layout === 'horizontal'}
      enableGridY={layout === 'vertical'}
      labelSkipWidth={layout === 'horizontal' ? 10 : 0}
      labelSkipHeight={layout !== 'horizontal' ? 10 : 0}
      tooltip={d => getTooltip(d, localIndexTitles, unit)}
      onClick={({indexValue}) => {
        if (onSelectIndex) onSelectIndex(indexValue);
      }}
      onMouseEnter={() => {
        if (onSelectIndex)
          (document.body as HTMLInputElement).style.cursor = 'pointer';
      }}
      onMouseLeave={() => {
        if (onSelectIndex)
          (document.body as HTMLInputElement).style.cursor = 'default';
      }}
    />
  );
};

export default BarChart;
