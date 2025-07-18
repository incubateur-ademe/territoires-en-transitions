import { DatumId, ResponsivePie } from '@nivo/pie';

import { getDataColor } from '@/app/ui/charts/utils';
import classNames from 'classnames';
import ChartLegend, { ChartLegendProps } from '../ChartLegend';
import { theme } from '../chartsTheme';
import { getDonutTooltip } from './DonutTooltip';
import {
  generateDonutLegendItems,
  getPercentage,
  skipArcLinkLabel,
} from './utils';

/** Format de données du composant Pie de nivo*/
export type DonutData = {
  id: string;
  value: number;
  color?: string;
  symbole?: (color: string) => React.ReactNode;
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
  onClick?: (id: DatumId) => void;
  /** Permet d'afficher et configurer la légende */
  legend?: ChartLegendProps;
  /** Classname du container, permet notamment de donner la hauteur du graphe.*/
  className?: string;
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
  className,
  legend,
}: DonutChartProps) => {
  /** Vérifie si le tableau de données est vide */
  const hasNoData =
    data.length === 0 || data.filter((d) => d.value !== 0).length === 0;

  /** Valeur par défault si le tableau de données est vide */
  const defaultData = [{ id: 'NA', value: 1, color: '#ccc' }];

  /** Ajoute des couleurs si aucune n'est définie */
  const localData = data.map((d, index) => ({
    ...d,
    color: getDataColor(d, data.length, index),
  }));

  return (
    <div className="flex flex-col">
      {/** Chart */}
      <div className={classNames('relative h-64', className)}>
        {/** Élement central */}
        {!!centeredElement && (
          <div className="absolute inset-0 flex">
            <div className="m-auto text-center">{centeredElement}</div>
          </div>
        )}
        <ResponsivePie
          data={hasNoData ? defaultData : localData}
          valueFormat={(value) =>
            displayPercentageValue
              ? `${getPercentage(
                  value,
                  localData.map((d) => d.value)
                )} %`
              : `${Math.round(value)}`
          }
          tooltip={(datum) =>
            !hasNoData && getDonutTooltip(datum, localData, unit)
          }
          onClick={({ id }) => onClick?.(id)}
          enableArcLinkLabels={
            (displayOutsideLabel || hasNoData) && !skipArcLinkLabel(data)
          }
          enableArcLabels={hasNoData ? false : true}
          /** Styles */
          theme={{
            ...theme,
            labels: { text: { fontSize: 14, fontWeight: 500 } },
          }}
          colors={{ datum: 'data.color' }}
          onMouseEnter={(_datum, event) => {
            if (onClick) {
              event.currentTarget.style.cursor = 'pointer';
            }
          }}
          animate={true}
          margin={{ top: 24, right: 24, bottom: 24, left: 24 }}
          // Taille du rond vide central
          innerRadius={0.5}
          // Distance entre les arcs
          padAngle={1}
          /** Styles des arcs */
          cornerRadius={4}
          // Agrandissement de l'arc au hover
          activeOuterRadiusOffset={!hasNoData ? 8 : undefined}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          arcLinkLabelsDiagonalLength={12}
          arcLinkLabelsStraightLength={6}
          arcLinkLabelsTextColor="#333"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={12}
          arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        />
      </div>
      {/** Légende */}
      {legend?.isOpen && (
        <ChartLegend {...legend} items={generateDonutLegendItems(data)} />
      )}
    </div>
  );
};

export default DonutChart;
