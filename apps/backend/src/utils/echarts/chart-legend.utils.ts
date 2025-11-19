import {
  LegendComponentOption,
  LineSeriesOption,
} from 'echarts/types/dist/echarts';

// TODO: change this
const estLignePointillee = ({ id }: { id?: string | number }) =>
  typeof id !== 'string' || !id.startsWith('resultat');

export const makeLegendData = (
  series: LineSeriesOption[]
): LegendComponentOption['data'] =>
  series.map((serie) =>
    serie.stack
      ? (serie.name as string)
      : {
          name: serie.name as string,
          icon: 'line',
          itemStyle: Object.assign(
            {
              borderColor: serie.color as string,
              borderWidth: 2,
            },
            serie.id?.toString().startsWith('cible') || serie.id === 'seuil'
              ? { borderType: 'dotted' as const }
              : estLignePointillee(serie)
              ? { borderDashOffset: 1, borderType: 'dashed' as const }
              : { borderType: 'solid' as const }
          ),
        }
  );
