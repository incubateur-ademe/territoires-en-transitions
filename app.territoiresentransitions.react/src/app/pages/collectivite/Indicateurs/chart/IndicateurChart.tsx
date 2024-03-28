import classNames from 'classnames';
import {CustomLayerProps} from '@nivo/line';

import {TIndicateurValeur} from '../useIndicateurValeurs';
import {getXTickValues, indicateurBaseData, prepareData} from './utils';
import PictoIndicateurVide from 'ui/pictogrammes/PictoIndicateurVide';
import Chart, {ChartInfosProps} from 'ui/charts/Chart';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import {LineChartProps} from 'ui/charts/Line/LineChart';
import {SliceTooltip} from 'app/pages/collectivite/Indicateurs/chart/SliceTooltip';

/** Data issues de l'api pour générer les données formatées pour Nivo */
export type IndicateurChartData = {
  /** Unité affichée pour l'axe des abscisses et le tooltip */
  unite?: string;
  /** Valeurs d'un indicateur issues de l'API  */
  valeurs: TIndicateurValeur[];
};

/** Props du graphique générique Indicateur */
export type IndicateurChartProps = {
  /** Data issues de l'api pour générer les données formatées pour Nivo */
  data: IndicateurChartData;
  /** Booléen de chargement des données et infos du graphique */
  isLoading: boolean;
  /** ClassName du container */
  className?: string;
  /** Configuration du graphique */
  chartConfig?: Omit<LineChartProps, 'data'>;
  /** Information du graphique pour la modale de téléchargement */
  chartInfos?: ChartInfosProps;
};

/** Charge les données d'un indicateur et affiche le graphique */
const IndicateurChart = ({
  data,
  isLoading,
  className,
  chartConfig,
  chartInfos,
}: IndicateurChartProps) => {
  const noData = data.valeurs.length === 0;

  /**
   * On déconstruit chartConfig afin de faire un traitement sur la valeur `gridXValues`
   * et quand même spread le reste des valeurs dans `axisBottom`
   */
  const {axisBottom, ...config} = chartConfig ?? {};

  /** Permet de faire matcher le nombre de ligne de la grille avec le nombre de valeur affichées sur les ordonnées */
  const axisBottomTickValues = config?.gridXValues
    ? getXTickValues(data.valeurs, parseInt(config?.gridXValues as string))
    : getXTickValues(data.valeurs);

  return (
    <div
      className={classNames('grow flex items-center justify-center', className)}
    >
      {
        // Chargement
        isLoading ? (
          <div
            className={classNames(
              'flex justify-center items-center',
              config.className
            )}
          >
            <SpinnerLoader className="w-8 h-8 fill-primary-5" />
          </div>
        ) : // Pas de données
        noData ? (
          <PictoIndicateurVide className="grow" />
        ) : (
          // Graphique
          <Chart
            line={{
              chart: {
                data: prepareData(data.valeurs),
                theme: {
                  axis: {
                    ticks: {
                      text: {
                        fontSize: 14,
                      },
                    },
                  },
                },
                colors: {datum: 'color'},
                className,
                layers: [
                  'grid',
                  'markers',
                  'areas',
                  generateStyledLines,
                  'slices',
                  'points',
                  'axes',
                  'legends',
                ],
                xScale: {
                  type: 'time',
                  precision: 'year',
                  format: '%Y',
                  min: 'auto',
                  max: 'auto',
                },
                gridXValues: axisBottomTickValues,
                axisBottom: {
                  format: '%Y',
                  tickValues: axisBottomTickValues,
                  ...axisBottom,
                },
                gridYValues: 5,
                axisLeft: {
                  tickValues: config.gridYValues ?? 5,
                },
                axisLeftLegend: data.unite,
                sliceTooltip: props => (
                  <SliceTooltip {...props} unite={data.unite ?? ''} />
                ),
                ...config,
              },
            }}
            infos={chartInfos}
          />
        )
      }
    </div>
  );
};

export default IndicateurChart;

/** Génère les lignes en appliquant le style correspondant à l'id de la série */
const generateStyledLines = ({
  series,
  lineGenerator,
  xScale,
  yScale,
}: CustomLayerProps) => {
  return series.map(({id, data, color}) => (
    <path
      key={id}
      d={
        lineGenerator(
          data.map(d => ({
            x: (xScale as any)(d.data.x),
            y: (yScale as any)(d.data.y),
          }))
        ) || undefined
      }
      fill="none"
      stroke={color}
      style={indicateurBaseData[id].style}
    />
  ));
};
