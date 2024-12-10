import {
  BarDatum,
  BarTooltipProps,
  ComputedDatum,
  ResponsiveBar,
} from '@nivo/bar';
import { defaultColors } from '../chartsTheme';

const getCustomColor = ({
  id,
  data,
}: {
  id: string | number;
  data: BarDatum;
}): string => `${data[`${id}_color`]}`;

const upperCaseFirstLetter = (value: string): string => {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}`;
};

const getLabel = (d: ComputedDatum<object>) => {
  if (d.value) {
    const roundedValue = Math.round(d.value);
    if (roundedValue !== 0) return roundedValue.toString();
  }
  return '';
};

const getTooltip = (
  { id, value, index, indexValue, color }: BarTooltipProps<object>,
  localIndexTitles: string[],
  unit: string,
  clickable: boolean
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
      {clickable && (
        <div className="text-[#929292] pt-4">Cliquez pour voir le détail</div>
      )}
    </div>
  );
};

export type BarChartProps = {
  data: BarDatum[];
  indexBy: string;
  keys: string[];
  indexTitles?: string[];
  layout?: 'horizontal' | 'vertical';
  groupMode?: 'grouped' | 'stacked';
  inverted?: boolean;
  customColors?: boolean;
  unit?: string;
  isIntoModal?: boolean;
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
 * @param groupMode 'grouped' | 'stacked' (optionnel)
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
  groupMode,
  inverted = false,
  customColors = false,
  unit = '',
  isIntoModal,
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
      theme={
        isIntoModal
          ? {
              labels: { text: { fontSize: 30, fontWeight: 'bold' } },
              axis: {
                ticks: { text: { fontSize: 22 } },
                legend: { text: { fontSize: 20 } },
              },
            }
          : {
              labels: { text: { fontSize: 14 } },
              axis: { ticks: { text: { fontSize: 13 } } },
            }
      }
      margin={{
        top: layout === 'horizontal' ? 20 : 85,
        right: 60,
        bottom: layout === 'horizontal' ? 80 : 70,
        left: isIntoModal ? 90 : 70,
      }}
      padding={layout === 'horizontal' ? 0.1 : 0.5}
      innerPadding={groupMode === 'grouped' ? 2 : 0}
      layout={layout}
      groupMode={groupMode}
      colors={
        customColors
          ? ({ id, data }) => getCustomColor({ id, data })
          : defaultColors
      }
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
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
        legendOffset: isIntoModal ? 60 : 45,
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
        legendOffset: isIntoModal ? -70 : -50,
      }}
      label={getLabel}
      enableGridX={layout === 'horizontal'}
      enableGridY={layout !== 'horizontal'}
      labelSkipWidth={layout === 'horizontal' ? 10 : 0}
      labelSkipHeight={layout !== 'horizontal' ? 10 : 0}
      tooltip={(d) =>
        getTooltip(
          d,
          localIndexTitles,
          unit,
          onSelectIndex !== undefined &&
            ((Object.prototype.hasOwnProperty.call(d.data, 'clickable') &&
              d.data.clickable === 'true') ||
              !Object.prototype.hasOwnProperty.call(d.data, 'clickable'))
        )
      }
      onClick={({ indexValue }) => {
        if (onSelectIndex) onSelectIndex(indexValue);
      }}
      onMouseEnter={(value) => {
        if (
          onSelectIndex &&
          ((Object.prototype.hasOwnProperty.call(value.data, 'clickable') &&
            value.data.clickable === 'true') ||
            !Object.prototype.hasOwnProperty.call(value.data, 'clickable'))
        ) {
          (document.body as HTMLInputElement).style.cursor = 'pointer';
        }
      }}
      onMouseLeave={(value) => {
        if (
          onSelectIndex &&
          ((Object.prototype.hasOwnProperty.call(value.data, 'clickable') &&
            value.data.clickable === 'true') ||
            !Object.prototype.hasOwnProperty.call(value.data, 'clickable'))
        )
          (document.body as HTMLInputElement).style.cursor = 'default';
      }}
    />
  );
};

export default BarChart;
