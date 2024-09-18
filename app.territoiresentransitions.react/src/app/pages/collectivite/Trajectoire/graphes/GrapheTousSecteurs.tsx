import {useState} from 'react';
import {Datum} from '@nivo/line';
import {Button} from '@tet/ui';
import Chart from 'ui/charts/Chart';
import {LineData} from 'ui/charts/Line/LineChart';
import {AreaSymbol, SolidLineSymbol} from 'ui/charts/ChartLegend';
import {genInfobulleParAnnee} from './InfobulleParAnnee';
import {COMMON_CHART_PROPS, COULEURS_SECTEUR, LAYERS} from './constants';
import {ANNEE_JALON2, ANNEE_REFERENCE} from '../constants';

type LayerKey = keyof typeof LAYERS;

export type GrapheTousSecteursProps = {
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
export const GrapheTousSecteurs = ({
  titre,
  unite,
  secteurs,
  objectifs,
  resultats,
}: GrapheTousSecteursProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // affecte d'abord les couleurs avant de filtrer les dataset vides
  const secteursNonVides = secteurs
    .map((s, i) => ({
      ...s,
      color: COULEURS_SECTEUR[i % COULEURS_SECTEUR.length],
    }))
    .filter(s => !!s.data?.length);

  const objectifsEtResultats = [
    {id: 'objectifs', data: objectifs, color: LAYERS.objectifs.color},
    {id: 'resultats', data: resultats, color: LAYERS.resultats.color},
  ].filter(s => !!s?.data?.length);

  const minDate = getMinDate(objectifs, resultats);
  const maxY = getMaxY([objectifs, resultats], secteursNonVides);

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
            xScale: {
              type: 'time',
              precision: 'year',
              format: '%Y',
              min: minDate,
              max: `${ANNEE_JALON2 + 1}`,
            },
            yScale: {
              type: 'linear',
              min: 'auto',
              max: maxY,
              stacked: true,
            },
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
            sliceTooltip: genInfobulleParAnnee({
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

/*
 * Les objectifs/résultats sont représentés sur un layer différent des données
 * sectorielles. On doit donc déterminer la date minimum pour l'axe des
 * abscisses, qui peut être antérieure à l'année de référence de la trajectoire.
 */
const getMinDate = (objectifs: Datum[], resultats: Datum[]) => {
  const minTimestampObjectifsResultats = Math.min(
    getMinTimestamp(objectifs),
    getMinTimestamp(resultats)
  );
  const minDate =
    minTimestampObjectifsResultats &&
    minTimestampObjectifsResultats !== Infinity
      ? new Date(minTimestampObjectifsResultats)
      : new Date(`${ANNEE_REFERENCE}-01-01`);
  return minDate;
};

const getMinTimestamp = (data: Datum[]) =>
  data?.length
    ? Math.min(...data.map(({x}) => (x as Date).getTime()))
    : Infinity;

// On détermine aussi la valeur maximum pour les ordonnées
const getMaxY = (objectifsEtResultats: Datum[][], secteurs: LineData[]) => {
  // somme des valeurs des secteurs superposés par année (à cause de l'option
  // `yscale.stacked` du graphe)
  const sommeSecteursParAnnee = new Map<number, number>();
  secteurs.forEach(secteur => {
    secteur.data.forEach(d => {
      const annee = (d.x as Date).getFullYear();
      sommeSecteursParAnnee.set(
        annee,
        (sommeSecteursParAnnee.get(annee) || 0) + (d.y as number)
      );
    });
  });

  // puis le max entre ses sommes et les valeurs max des objectifs/résultats
  const max = Math.max(
    ...objectifsEtResultats.map(d => getMaxValueY(d)),
    ...sommeSecteursParAnnee.values()
  );
  return max === -Infinity ? 'auto' : max;
};

const getMaxValueY = (data: Datum[]) =>
  data?.length ? Math.max(...data.map(({y}) => y as number)) : -Infinity;
