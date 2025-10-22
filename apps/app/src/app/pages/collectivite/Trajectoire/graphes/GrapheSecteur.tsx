/**
 * Affiche le graphique de la trajectoire d'un secteur
 *
 * - Trajectoire (simple ligne hachurée)
 * - Mes objectifs (simple ligne)
 * - Mes résultats (simple ligne)
 */

import {
  Dataset,
  PALETTE_LIGHT,
  ReactECharts,
  makeLineSeries,
  makeOption,
  makeStackedSeries,
} from '@/app/ui/charts/echarts';
import { DatasetComponentOption } from 'echarts';
import { LAYERS } from './layer-parameters';

export type GrapheSecteurProps = {
  titre: string;
  unite: string;
  secteur: Dataset;
  sousSecteurs: DatasetComponentOption[] | null | undefined;
  objectifs: Dataset;
  resultats: Dataset;
};

export const GrapheSecteur = ({
  titre,
  unite,
  secteur,
  sousSecteurs,
  objectifs,
  resultats,
}: GrapheSecteurProps) => {
  const objectifsEtResultatsSecteur = [
    resultats,
    objectifs,
    {
      ...secteur,
      id: 'trajectoire',
      name: LAYERS.trajectoire.label,
      color: LAYERS.trajectoire.color,
      source: secteur?.source,
    },
  ].filter((s) => !!s.source?.length);

  const sousSecteursNonVides = sousSecteurs
    ? sousSecteurs
        .map((s, i) => ({
          ...s,
          dimensions: ['x', 'y'],
          color: PALETTE_LIGHT[i % PALETTE_LIGHT.length],
        }))
        .filter((s) => !!s.source?.length)
    : [];

  const dataset = [...objectifsEtResultatsSecteur, ...sousSecteursNonVides];
  const series = [
    ...makeLineSeries(objectifsEtResultatsSecteur),
    ...makeStackedSeries(sousSecteursNonVides),
  ];

  const option = makeOption({
    option: {
      dataset,
      series: series,
    },
    titre,
    unite,
  });

  return <ReactECharts option={option} />;
};
