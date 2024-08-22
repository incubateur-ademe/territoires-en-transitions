/**
 * Affiche le graphique "Tous les secteurs"
 *
 * - Aires empilées des données sectorielles de la trajectoire SNBC territorialisée
 * - Mes objectifs (simple ligne)
 * - Mes résultats (simple ligne)
 */

import {useState} from 'react';
import {Datum} from '@nivo/line';
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
  objectifs: Datum[];
  resultats: Datum[];
};

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
    {id: 'objectifs', data: objectifs},
    {id: 'resultats', data: resultats},
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
            data: secteursNonVides,
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
            sliceTooltip: ({slice}) => {
              const annee = slice.points[0].data.x;
              const objectif = objectifs?.find(o => o.x === annee);
              const resultat = resultats?.find(o => o.x === annee);
              return (
                <div className="flex flex-col gap-1 bg-white p-4 font-normal text-primary-8 text-sm shadow-sm">
                  <span>
                    En <strong>{slice.points[0].data.xFormatted}</strong>
                  </span>
                  {slice.points
                    .sort((a, b) => (b.data.y as number) - (a.data.y as number))
                    .map(point => {
                    const secteur = secteursNonVides.find(
                      s => s.id === point.serieId
                    );
                    return (
                      secteur && (
                        <div className="flex items-center gap-3" key={point.id}>
                          {AreaSymbol(secteur.color)}
                          {secteur.label}
                          <strong>{point.data.yFormatted}</strong>
                        </div>
                      )
                    );
                  })}
                  {(objectif || resultat) && (
                    <div className="mt-2">
                      {objectif && (
                        <div className="flex items-center gap-3">
                          {SolidLineSymbol(LAYERS.objectifs.color)}
                          Objectif
                          <strong>{objectif.y?.toString()}</strong>
                        </div>
                      )}
                      {resultat && (
                        <div className="flex items-center gap-3">
                          {SolidLineSymbol(LAYERS.resultats.color)}
                          Résultat
                          <strong>{resultat.y?.toString()}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
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
