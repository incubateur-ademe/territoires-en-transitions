import { ChartLegendItem } from '../ChartLegend';
import { getDataColor } from '../utils';
import { DonutData } from './DonutChart';

/**
 * Conversion d'une valeur en %
 */
export const getPercentage = (value: number, data: number[]) => {
  const percentage = value / data.reduce((sum, curVal) => sum + curVal, 0);
  if (percentage < 0.01) {
    return Math.round(percentage * 10000) / 100;
  } else {
    return Math.round(percentage * 100);
  }
};

/** Génère la liste des légendes pour le composant DonutChart */
export const generateDonutLegendItems = (
  data: DonutData[]
): ChartLegendItem[] => {
  // Légende réduite à afficher
  return data.map((d, index) => ({
    name: d.id,
    color: getDataColor(d, data.length, index),
    symbole: d.symbole,
  }));
};
