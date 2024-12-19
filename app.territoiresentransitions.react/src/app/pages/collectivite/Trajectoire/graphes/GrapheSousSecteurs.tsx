import {
  COULEURS_SECTEUR,
  ReactECharts,
  makeOption,
  makeStackedSeries,
} from '@/app/ui/charts/echarts';
import { DatasetComponentOption } from 'echarts';

export type GrapheSousSecteursProps = {
  titre: string;
  unite: string;
  sousSecteurs: DatasetComponentOption[];
};

/**
 * Affiche le graphique sous-sectoriel
 *
 * - Aires empilées des sous-secteurs associés au secteur affiché.
 */
export const GrapheSousSecteurs = ({
  titre,
  unite,
  sousSecteurs,
}: GrapheSousSecteursProps) => {
  // affecte d'abord les couleurs avant de filtrer les dataset vides
  const sousSecteursNonVides = sousSecteurs
    .map((s, i) => ({
      ...s,
      dimensions: ['x', 'y'],
      color: COULEURS_SECTEUR[i % COULEURS_SECTEUR.length],
    }))
    .filter((s) => !!s.source?.length);

  const option = makeOption({
    option: {
      dataset: sousSecteursNonVides,
      series: makeStackedSeries(sousSecteursNonVides),
    },
    titre,
    unite,
  });

  return <ReactECharts option={option} />;
};
