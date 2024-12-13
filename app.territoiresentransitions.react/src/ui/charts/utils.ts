import { TScoreAuditRowData } from '@/app/app/pages/collectivite/AuditComparaison/types';
import { DonutData } from 'ui/charts/Donut/DonutChart';
import { LineData } from 'ui/charts/Line/LineChart';
import { defaultColors, nivoColorsSet } from 'ui/charts/chartsTheme';
import { ProgressionRow } from 'ui/charts/old/BarChartCardWithSubrows';

/**
 * Définition des titres des axes pour les graphes
 * de scores par axe
 */

export const getIndexTitles = (
  scoreData: readonly (ProgressionRow | TScoreAuditRowData)[],
  addTotal: boolean
) => {
  const indexTitles = scoreData.map(
    (d) => `${d.action_id.split('_')[1]}. ${d.nom}`
  );
  if (addTotal) indexTitles.push('Total');

  return indexTitles;
};

/** Renvoi la couleur de la data si définie, sinon utilise les couleurs de nivo */
export const getDataColor = (
  data: LineData | DonutData,
  dataLength: number,
  index: number
) => {
  if (data.color) {
    return data.color;
  }
  if (dataLength <= defaultColors.length) {
    return defaultColors[index % defaultColors.length];
  }
  return nivoColorsSet[index % nivoColorsSet.length];
};
