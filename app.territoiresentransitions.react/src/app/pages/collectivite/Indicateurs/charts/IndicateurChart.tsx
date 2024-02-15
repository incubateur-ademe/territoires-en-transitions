import {CSSProperties} from 'react';
import {CustomLayerProps} from '@nivo/line';
import classNames from 'classnames';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {ChartCardContent} from 'ui/charts/ChartCard';
import LineChart, {
  LineChartProps,
  getLabelsBySerieId,
} from 'ui/charts/LineChart';
import {defaultColors} from 'ui/charts/chartsTheme';
import {useIndicateurValeurs} from '../useIndicateurValeurs';
import {useIndicateurChartInfo} from './useIndicateurChartInfo';
import {
  getChartTitle,
  getDistinctYears,
  getXTickValues,
  prepareData,
} from './utils';
import {PathLine, SliceTooltip, getLineStyleBySerieId} from './SliceTooltip';
import {Card} from './Card';
import {CardNoData, IconIndicateurPrive} from './CardNoData';
import {TIndicateurChartProps, TIndicateurChartBaseProps} from './types';
import {Badge} from '@tet/ui';

/**
 * Affiche un graphique de type "lignes" combinant les valeurs objectif/résultat
 */
export const IndicateurChartBase = (props: TIndicateurChartBaseProps) => {
  const {valeurs, definition, variant, className} = props;
  if (!valeurs) return null;

  const data = prepareData(valeurs, defaultColors[0]);
  const labelBySerieId = getLabelsBySerieId(data);
  const isZoomed = variant === 'zoomed';
  const title = getChartTitle(definition, isZoomed);

  const annees = getDistinctYears(valeurs);
  const anneeMax =
    annees?.length < 4 ? Math.max(...annees) + (4 - annees.length) : 'auto';

  const chart = (
    <LineChart
      {...({
        data,
        // utilise les couleurs des séries plutôt que les couleurs par défaut
        colors: {datum: 'color'},
        // surcharge les couches du graphe pour utiliser un style de lignes personnalisé
        layers: [
          'grid',
          'markers',
          'areas',
          generateStyledLines(getLineStyleBySerieId),
          'slices',
          'points',
          'axes',
          'legends',
        ],
        axisBottom: {
          legendPosition: 'end',
          tickSize: 5,
          tickPadding: 12,
          tickRotation: 0,
          tickValues: getXTickValues(valeurs, isZoomed),
          format: '%Y',
        },
        xScale: {
          type: 'time',
          precision: 'year',
          format: '%Y',
          min: 'auto',
          max: anneeMax,
        },
        // légende au bas du graphique
        legends: [
          {
            anchor: 'bottom',
            direction: 'row',
            translateY: isZoomed ? 65 : 55,
            itemWidth: 120,
            itemHeight: 20,
            data: data as any,
            // avec un symbole personnalisé pour afficher une ligne pleine ou pointillée
            symbolShape: ({fill, id}) => (
              <PathLine
                serieId={id}
                stroke={fill}
                transform="translate(0, 9)"
              />
            ),
          },
        ],
        // infobulle par année
        sliceTooltip: props => (
          <SliceTooltip
            {...props}
            labels={labelBySerieId}
            indicateur={definition}
          />
        ),
        axisLeftLegend: definition.unite,
      } as LineChartProps)}
    />
  );

  return (
    <Card
      className={classNames(
        {'rounded-none h-[35rem]': isZoomed, relative: !isZoomed},
        className
      )}
      dataTest={`chart-${definition.id}`}
    >
      {!isZoomed && definition.confidentiel && <IconIndicateurPrive />}
      {!isZoomed && definition.participation_score && (
        <Badge title="Participe au score CAE" state="standard" />
      )}
      <ChartCardContent
        chart={chart}
        chartInfo={{
          title,
          chartClassname: isZoomed ? 'h-[28rem]' : 'h-[14.5rem]',
          downloadedFileName: isZoomed ? definition.nom : undefined,
        }}
      />
    </Card>
  );
};

/** Génère les lignes en appliquant le style correspondant à l'id de la série */
export const generateStyledLines =
  (getStyleById: (serieId: string | number) => CSSProperties | undefined) =>
  ({series, lineGenerator, xScale, yScale}: CustomLayerProps) => {
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
        style={getStyleById(id)}
      />
    ));
  };

/** Charge les données et affiche le graphique */
const IndicateurChart = (props: TIndicateurChartProps) => {
  const {definition, importSource, variant} = props;

  const isReadonly = useCurrentCollectivite()?.readonly ?? true;

  // lit les données nécessaires à l'affichage du graphe
  const {data: chartInfo, isLoading: isLoadingInfo} = useIndicateurChartInfo(
    definition.id
  );
  const {id: grapheId, count, total, confidentiel} = chartInfo || {};

  // charge les valeurs à afficher dans le graphe
  const {data: valeurs, isLoading} = useIndicateurValeurs({
    id: grapheId,
    importSource,
    isDetail: variant === 'zoomed',
  });
  const noDataAvailable = !isLoading && !isLoadingInfo && !valeurs?.length;

  if (!chartInfo) return null;

  return noDataAvailable ? (
    <CardNoData
      className={props.className}
      definition={chartInfo}
      variant={variant}
      isReadonly={isReadonly}
      aCompleter={{count, total}}
      confidentiel={confidentiel}
    />
  ) : (
    <IndicateurChartBase {...props} definition={chartInfo} valeurs={valeurs!} />
  );
};

export default IndicateurChart;
