import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { DonutData } from '@/app/ui/charts/Donut/DonutChart';
import { defaultColors, extendedColors } from '@/app/ui/charts/chartsTheme';

/**
 * Définition des titres des axes pour les graphes
 * de scores par axe
 */

export const getIndexTitles = (
  scoreData: readonly ActionListItem[],
  addTotal: boolean
) => {
  const indexTitles = scoreData.map(
    (d) => `${d.actionId.split('_')[1]}. ${d.nom}`
  );
  if (addTotal) indexTitles.push('Total');

  return indexTitles;
};

/** Renvoie la couleur de la data si définie, sinon une couleur de la palette */
export const getDataColor = (
  data: DonutData,
  dataLength: number,
  index: number
) => {
  if (data.color) {
    return data.color;
  }
  if (dataLength <= defaultColors.length) {
    return defaultColors[index % defaultColors.length];
  }
  return extendedColors[index % extendedColors.length];
};
