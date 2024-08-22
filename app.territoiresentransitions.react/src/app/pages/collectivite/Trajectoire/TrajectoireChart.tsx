import {useState} from 'react';
import {Datum} from '@nivo/line';
import {Button} from '@tet/ui';
import Chart from 'ui/charts/Chart';
import {LineData} from 'ui/charts/Line/LineChart';
import {theme} from 'ui/charts/chartsTheme';
import {AreaSymbol, SolidLineSymbol} from 'ui/charts/ChartLegend';
import {COLORS, LAYERS} from './constants';
import {makeTrajectoireChartSliceTooltip} from './TrajectoireChartSliceTooltip';

type LayerKey = keyof typeof LAYERS;

export type TrajectoireChartProps = {
  titre: string;
  unite: string;
  secteurs: LineData[];
  objectifs: Datum[];
  resultats: Datum[];
};

/**
 * Affiche le graphique "Tous les secteurs"
 *
 * - Aires empilées des données sectorielles de la trajectoire SNBC territorialisée
 * - Mes objectifs (simple ligne)
 * - Mes résultats (simple ligne)
 */
export const TrajectoireChart = ({
  titre,
  unite,
  secteurs,
  objectifs,
  resultats,
}: TrajectoireChartProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // affecte d'abord les couleurs avant de filtrer les dataset vides
  const secteursNonVides = secteurs
    .map((s, i) => ({...s, color: COLORS[i % COLORS.length]}))
    .filter(s => !!s.data?.length);

  const objectifsEtResultats = [
    {id: 'objectifs', data: objectifs, color: LAYERS.objectifs.color},
    {id: 'resultats', data: resultats, color: LAYERS.resultats.color},
  ].filter(s => !!s?.data?.length);

  return (
    <>
      <div className="flex justify-between">
        <h3 className="ml-2">{titre}</h3>
        <Button
          className="h-fit"
          icon="download-fill"
          title="Télécharger"
          size="xs"
          variant="outlined"
          onClick={() => setIsOpen(true)}
        />
      </div>
      <Chart
        infos={{
          title: titre,
          fileName: titre,
          modal: {isOpen, setIsOpen, size: 'xl'},
        }}
        line={{
          chart: {
            ...COMMON_CHART_PROPS,
            axisLeftLegend: unite,
            data: secteursNonVides,
            legend: {
              isOpen: true,
              className: 'text-primary-8 font-medium',
              size: 'sm',
              items: [
                ...secteursNonVides.map(({label, color}, i) => ({
                  name: label!,
                  color,
                  symbole: AreaSymbol,
                })),
                ...objectifsEtResultats.map(({id}) => ({
                  name: LAYERS[id as LayerKey].label,
                  color: LAYERS[id as LayerKey].color,
                  symbole: SolidLineSymbol,
                })),
              ],
            },
            sliceTooltip: makeTrajectoireChartSliceTooltip({
              objectifsEtResultats,
              secteurs: secteursNonVides,
            }),
            layers: [
              'grid',
              'markers',
              'axes',
              'areas',
              'crosshair',
              'lines',
              'points',
              'slices',
              'mesh',
              'legends',
              // couche séparée pour les lignes objectifs/résultats car
              // `enableArea` est fixé globalement
              ({lineGenerator, xScale, yScale}) => {
                return objectifsEtResultats.map(serie => (
                  <path
                    d={lineGenerator(
                      serie.data.map(d => ({
                        x: (xScale as any)(d.x),
                        y: (yScale as any)(d.y),
                      }))
                    )}
                    fill="none"
                    stroke={LAYERS[serie.id as LayerKey].color}
                    style={{
                      strokeWidth: 4,
                    }}
                  />
                ));
              },
            ],
          },
        }}
      />
    </>
  );
};

// propriétés communes avec le graphe sous-sectoriel
export const COMMON_CHART_PROPS = {
  colors: {datum: 'color'},
  theme,
  margin: {top: 5, right: 5, bottom: 55, left: 50},
  xScale: {type: 'point'},
  yScale: {
    type: 'linear',
    min: 0,
    max: 'auto',
    stacked: true,
  },
  yFormat: ' >-.2f',
  axisBottom: {
    legendPosition: 'end',
    tickSize: 5,
    tickPadding: 12,
    tickRotation: -35,
  },
  enableArea: true,
  areaOpacity: 0.8,
  enablePoints: false,
  lineWidth: 0,
  curve: 'natural',
  enableSlices: 'x',
  animate: true,
  motionConfig: 'slow',
} as const;
