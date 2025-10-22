import {
  Dataset,
  ReactECharts,
  makeLineSeries,
  makeOption,
  makeStackedSeries,
} from '@/app/ui/charts/echarts';

export type GrapheTousSecteursProps = {
  titre: string;
  unite: string;
  secteurs: Dataset[];
  objectifs: Dataset;
  resultats: Dataset;
  emissionsNettes: Dataset | null;
};

/**
 * Affiche le graphique "Tous les secteurs"
 *
 * - Aires empilées des données sectorielles de la trajectoire SNBC territorialisée
 * - Mes objectifs (simple ligne)
 * - Mes résultats (simple ligne)
 * - Émissions nettes (simple ligne, pour GES seulement)
 */
export const GrapheTousSecteurs = ({
  titre,
  unite,
  secteurs,
  objectifs,
  resultats,
  emissionsNettes,
}: GrapheTousSecteursProps) => {
  const secteursNonVides = secteurs.filter((s) => !!s.source?.length);
  const objectifsEtResultats = [resultats, objectifs].filter(
    (s) => !!s?.source?.length
  );

  let dataset = [...objectifsEtResultats, ...secteursNonVides];
  let series = [
    ...makeLineSeries(objectifsEtResultats),
    ...makeStackedSeries(secteursNonVides),
  ];

  if (emissionsNettes) {
    dataset = [emissionsNettes, ...dataset];
    series = [...makeLineSeries([emissionsNettes]), ...series];
  }

  const option = makeOption({
    option: { dataset, series },
    titre,
    unite,
  });

  return <ReactECharts option={option} />;
};
