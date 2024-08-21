/**
 * Affiche le graphique "Tous les secteurs"
 *
 * - Aires empilées des données sectorielles de la trajectoire SNBC territorialisée
 * - Mes objectifs (simple ligne)
 * - Mes résultats (simple ligne)
 */

import {useState} from 'react';
import {Button} from '@tet/ui';
import Chart from 'ui/charts/Chart';
import {LineData} from 'ui/charts/Line/LineChart';
import {theme} from 'ui/charts/chartsTheme';
import {AreaSymbol, SolidLineSymbol} from 'ui/charts/ChartLegend';
import {COLORS, LAYERS} from './constants';

type LayerKey = keyof typeof LAYERS;

export type TrajectoireChartProps = {
  titre: string;
  unite: string;
  secteurs: LineData[];
  objectifs: LineData;
  resultats: LineData;
};

export const TrajectoireChart = ({
  titre,
  unite,
  secteurs,
  objectifs,
  resultats,
}: TrajectoireChartProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const secteursNonVides = secteurs.filter(s => !!s.data?.length);
  const objectifsEtResultats = [objectifs, resultats].filter(
    s => !!s.data?.length
  );

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
            data: secteursNonVides.toReversed(),
            colors: COLORS,
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
            axisLeftLegend: unite,
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
            legend: {
              isOpen: true,
              className: 'text-primary-8 font-medium',
              size: 'sm',
              items: [
                ...secteursNonVides.map(({label}, i) => ({
                  name: label!,
                  color: COLORS[i % COLORS.length],
                  symbole: AreaSymbol,
                })),
                ...objectifsEtResultats.map(({id}) => ({
                  name: LAYERS[id as LayerKey].label,
                  color: LAYERS[id as LayerKey].color,
                  symbole: SolidLineSymbol,
                })),
              ],
            },
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
                return [objectifs, resultats].map(serie =>
                  serie?.data?.length ? (
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
                  ) : undefined
                );
              },
            ],
          },
        }}
      />
    </>
  );
};
