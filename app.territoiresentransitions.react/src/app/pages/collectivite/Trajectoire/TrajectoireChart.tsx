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

const COLORS = [
  '#FEF1D8',
  '#F7B1C2',
  '#A4E7C7',
  '#D8EEFE',
  '#B8D6F7',
  '#FFD0BB',
  '#FBE7B5',
  '#D9D9D9',
];
const LAYERS = {
  objectifs: {color: '#F5895B', label: 'Objectifs'},
  resultats: {color: '#6A6AF4', label: 'Résultats'},
};
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
            data: secteurs,
            colors: COLORS,
            theme,
            margin: {top: 5, right: 5, bottom: 100, left: 50},
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
            legend: {isOpen: false},
            legends: [
              // légende des secteurs
              {
                anchor: 'bottom',
                direction: 'row',
                translateY: 70,
                itemsSpacing: 10,
                itemWidth: 120,
                itemHeight: 20,
                symbolSize: 12,
                symbolShape: ({x, y, fill}) => {
                  return (
                    <rect
                      x={x}
                      y={y + 2}
                      fill={fill}
                      width={14}
                      height={10}
                      radius={2}
                    />
                  );
                },
              },
              // légende des lignes objectifs/résultats
              {
                anchor: 'bottom',
                direction: 'row',
                translateY: 95,
                itemWidth: 120,
                itemHeight: 20,
                symbolShape: ({x, y, fill}) => {
                  return (
                    <rect x={x} y={y + 7} fill={fill} width={11} height={2} />
                  );
                },
                data: [objectifs, resultats]
                  .filter(serie => serie?.data?.length)
                  .map(serie => ({
                    id: serie.id,
                    ...LAYERS[serie.id as LayerKey],
                  })),
              },
            ],
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
