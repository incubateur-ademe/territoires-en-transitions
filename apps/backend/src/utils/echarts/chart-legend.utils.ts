import {
  LegendComponentOption,
  LineSeriesOption,
  PlainLegendComponentOption,
} from 'echarts/types/dist/echarts';

const getLegendItemStyle = (
  serie: LineSeriesOption
): PlainLegendComponentOption['itemStyle'] => {
  const baseItemStyle: PlainLegendComponentOption['itemStyle'] = {
    borderColor: serie.color as string,
    borderWidth: 2,
    borderType: serie.lineStyle?.type || 'solid',
  };
  if (serie.lineStyle?.type === 'dashed') {
    baseItemStyle.borderDashOffset = 1;
  }
  /**
   * TODO: serie.id?.toString().startsWith('cible') || serie.id === 'seuil'
              ? { borderType: 'dotted' as const }
   */

  return baseItemStyle;
};

export const makeLegendData = (
  series: LineSeriesOption[]
): LegendComponentOption['data'] =>
  series.map((serie) =>
    serie.stack
      ? (serie.name as string)
      : {
          name: serie.name as string,
          icon: 'line',
          itemStyle: getLegendItemStyle(serie),
        }
  );
