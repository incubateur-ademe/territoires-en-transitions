import {LineData} from './LineChart';
import {ChartLegendItem} from '../ChartLegend';
import {defaultColors, nivoColorsSet} from '../chartsTheme';

/** Génère la liste des légendes pour le composant LineChart */
export const generateLineLegendItems = (
  data: LineData[]
): ChartLegendItem[] => {
  // Légende réduite à afficher
  return data.map((d, index) => ({
    name: d.id,
    color: getLegendColor(d, data.length, index),
    symbole: d.symbole,
  }));
};

/** Renvoi la couleur de la data si définie, sinon utilise les couleurs de nivo */
const getLegendColor = (data: LineData, dataLength: number, index: number) => {
  if (data.color) {
    return data.color;
  }
  if (dataLength <= defaultColors.length) {
    return defaultColors[index % defaultColors.length];
  }
  return nivoColorsSet[index % nivoColorsSet.length];
};
