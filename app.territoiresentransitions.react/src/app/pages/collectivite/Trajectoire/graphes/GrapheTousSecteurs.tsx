import {Dataset, makeLineSeries, makeOption, makeStackedSeries} from './utils';
import {ReactECharts} from './ReactECharts';

export type GrapheTousSecteursProps = {
  titre: string;
  unite: string;
  secteurs: Dataset[];
  objectifs: Dataset;
  resultats: Dataset;
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
  const secteursNonVides = secteurs.filter(s => !!s.source?.length);

  const objectifsEtResultats = [resultats, objectifs].filter(
    s => !!s?.source?.length
  );

  const option = makeOption({
    option: {
      dataset: [...objectifsEtResultats, ...secteursNonVides],
      series: [
        ...makeLineSeries(objectifsEtResultats),
        ...makeStackedSeries(secteursNonVides),
      ],
    },
    titre,
    unite,
  });

  return <ReactECharts option={option} settings={{ notMerge: true }} />;
};
