import {LineData} from './LineChart';
import {ChartLegendItem} from '../ChartLegend';
import {defaultColors, nivoColorsSet} from '../chartsTheme';
import {TIndicateurValeur} from 'app/pages/collectivite/Indicateurs/useIndicateurValeurs';

/** Génère la liste des légendes pour le composant LineChart */
export const generateLineLegendItems = (
  data: LineData[]
): ChartLegendItem[] => {
  // Légende réduite à afficher
  return data.map((d, index) => ({
    name: d.label ?? d.id,
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

/** Calcule la margin left appliquée au graphique en fonction de la taille des valeurs */
export const getLeftLineChartMargin = (valeurs: TIndicateurValeur[]) => {
  const leftAxisValues = valeurs.map(v => v.valeur);
  const maxValue = Math.round(Math.max(...leftAxisValues));
  const valueLength = maxValue.toString().length;
  // 10px étant +- la largeur d'un caractère, on multiplie par 10 pour obtenir la largeur en px
  return valueLength <= 1 ? 16 : valueLength * 10;
};
