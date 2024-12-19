/**
 * Affiche le graphique de la trajectoire d'un secteur
 *
 * - Trajectoire (simple ligne hachurée)
 * - Mes objectifs (simple ligne)
 * - Mes résultats (simple ligne)
 */

import {
  Dataset,
  LAYERS,
  ReactECharts,
  makeLineSeries,
  makeOption,
} from '@/app/ui/charts/echarts';

export type GrapheSecteurProps = {
  titre: string;
  unite: string;
  secteur: Dataset;
  objectifs: Dataset;
  resultats: Dataset;
};

export const GrapheSecteur = ({
  titre,
  unite,
  secteur,
  objectifs,
  resultats,
}: GrapheSecteurProps) => {
  const dataset = [
    resultats,
    objectifs,
    {
      ...secteur,
      id: 'trajectoire',
      name: LAYERS.trajectoire.label,
      color: LAYERS.trajectoire.color,
      source: secteur.source,
    },
  ].filter((s) => !!s.source?.length);

  const option = makeOption({
    option: {
      dataset,
      series: makeLineSeries(dataset),
    },
    titre,
    unite,
  });

  return <ReactECharts option={option} />;
};
