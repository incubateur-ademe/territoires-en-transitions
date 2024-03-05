import {defaultColors, nivoColorsSet} from '../../chartsTheme';
import {ChartLegendItem} from '../ChartLegend';
import {DonutData} from './DonutChart';

/**
 * Conversion d'une valeur en %
 */
export const getPercentage = (value: number, data: number[]) => {
  let percentage = value / data.reduce((sum, curVal) => sum + curVal, 0);
  if (percentage < 0.01) {
    return Math.round(percentage * 10000) / 100;
  } else {
    return Math.round(percentage * 100);
  }
};

/**
 * Suppression des arcLinkLabels si deux tranches de faible
 * valeur se succèdent dans le graphe
 * Permet d'éviter le chevauchement des labels
 */
export const skipArcLinkLabel = (data: DonutData[]) => {
  const total = data.reduce(
    (total, currentValue) => total + currentValue.value,
    0
  );

  return data.reduce((isLabelSkipped, currentValue, index) => {
    if (
      currentValue.value / total < 0.05 &&
      index > 0 &&
      data[index - 1].value / total < 0.1
    ) {
      return true;
    }
    return isLabelSkipped;
  }, false);
};

/** Génère la liste des légendes pour le composant DonutChart */
export const generateDonutLegendItems = (
  data: DonutData[]
): ChartLegendItem[] => {
  // Légende réduite à afficher
  return data.map((d, index) => ({
    name: d.id,
    color: getLegendColor(d, data.length, index),
    symbole: d.symbole,
  }));
};

/** Renvoi la couleur de la data si définie, sinon utilise les couleurs de nivo */
const getLegendColor = (data: DonutData, dataLength: number, index: number) => {
  if (data.color) {
    return data.color;
  }
  if (dataLength <= defaultColors.length) {
    return defaultColors[index % defaultColors.length];
  }
  return nivoColorsSet[index % nivoColorsSet.length];
};
