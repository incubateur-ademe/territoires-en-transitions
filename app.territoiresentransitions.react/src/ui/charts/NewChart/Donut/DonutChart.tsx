import {
  CompletePieSvgProps,
  MouseEventHandler,
  PieSvgProps,
  ResponsivePie,
} from '@nivo/pie';

import {defaultColors, nivoColorsSet, theme} from '../../chartsTheme';
import {getPercentage, skipArcLinkLabel} from './utils';
import {getDonutTooltip} from './DonutTooltip';

/** Format de données du composant Pie de nivo*/
export type DonutData = {
  id: string;
  value: number;
  color?: string;
};

/** Types du graphique Donut */
export type DonutChartProps = {
  /** tableau de données à afficher */
  data: DonutData[];
  /** unité des valeurs */
  unit?: string;
  /** affichage des labels sur le côté des arcs */
  displayOutsideLabel?: boolean;
  /** Affiche les valeurs en pourcentage */
  displayPercentageValue?: boolean;
  /** affichage d'un élément au centre du donut */
  centeredElement?: React.ReactNode;
  /** Clique sur un arc */
  onClick?: () => void;
};

/**
 * Graphe donut générique à partir du composant nivo/pie
 *
 * https://nivo.rocks/pie/
 */
const DonutChart = ({
  data,
  unit,
  displayOutsideLabel = false,
  displayPercentageValue = false,
  centeredElement,
  onClick,
}: DonutChartProps) => {
  /** Vérifie si le tableau de données est vide */
  const hasNoData =
    data.length === 0 || data.filter(d => d.value !== 0).length === 0;

  /** Valeur par défault si le tableau de données est vide */
  const defaultData = [{id: 'NA', value: 1, color: '#ccc'}];

  /** Ajoute des couleurs si aucune n'est définie */
  const localData = data.map((d, index) => ({
    ...d,
    color: d.color
      ? d.color
      : data.length <= defaultColors.length
      ? defaultColors[index % defaultColors.length]
      : nivoColorsSet[index % nivoColorsSet.length],
  }));

  return (
    <div className="h-full relative">
      {/** Élement central */}
      <div className="absolute inset-0 flex">
        <div className="m-auto text-center">{centeredElement}</div>
      </div>
      {/** Chart */}
      <ResponsivePie
        data={hasNoData ? defaultData : localData}
        valueFormat={value =>
          displayPercentageValue
            ? `${getPercentage(
                value,
                localData.map(d => d.value)
              )} %`
            : `${Math.round(value)}`
        }
        tooltip={datum => !hasNoData && getDonutTooltip(datum, localData, unit)}
        layers={['arcs', 'arcLabels', 'arcLinkLabels', 'legends']}
        onClick={onClick}
        enableArcLinkLabels={
          (displayOutsideLabel || hasNoData) && !skipArcLinkLabel(data)
        }
        enableArcLabels={hasNoData ? false : true}
        /** Styles */
        theme={theme}
        onMouseEnter={(_datum, event) => {
          if (!!onClick) {
            event.currentTarget.style.cursor = 'pointer';
          }
        }}
        animate={true}
        margin={{top: 24, right: 24, bottom: 24, left: 24}}
        // Taille du rond vide central
        innerRadius={0.5}
        // Distance entre les arcs
        padAngle={1}
        /** Styles des arcs */
        cornerRadius={4}
        // Agrandissement de l'arc au hover
        activeOuterRadiusOffset={!hasNoData ? 8 : undefined}
        borderWidth={1}
        borderColor={{from: 'color', modifiers: [['darker', 0.2]]}}
        arcLinkLabelsDiagonalLength={12}
        arcLinkLabelsStraightLength={6}
        arcLinkLabelsTextColor="#333"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{from: 'color'}}
        arcLabelsSkipAngle={12}
        arcLabelsTextColor={{from: 'color', modifiers: [['darker', 2]]}}
      />
    </div>
  );
};

export default DonutChart;
