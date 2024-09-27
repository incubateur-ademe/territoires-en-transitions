import type {
  DatasetComponentOption,
  LineSeriesOption,
  EChartsOption,
  LegendComponentOption,
} from 'echarts';
import {preset} from '@tet/ui';

const {colors} = preset.theme.extend;

// pour formater les chiffres
const NumFormat = Intl.NumberFormat('fr', {maximumFractionDigits: 3});

// icône bouton "télécharger"
const DOWNLOAD_ICON =
  'path://M11 22S23 22 23 22 23 23.33 23 23.33 11 23.33 11 23.33 11 22 11 22ZM17.67 15.33S22.33 15.33 22.33 15.33 17 20.67 17 20.67 11.67 15.33 11.67 15.33 16.33 15.33 16.33 15.33 16.33 10 16.33 10 17.67 10 17.67 10 17.67 15.33 17.67 15.33Z';

export type Dataset = DatasetComponentOption & {
  color?: string;
};

// génère le paramétrage de séries de données sous forme de surfaces empilées
export const makeStackedSeries = (dataset: Dataset[]): LineSeriesOption[] =>
  dataset.map(ds => ({
    datasetId: ds.id,
    name: ds.name,
    color: ds.color,
    type: 'line',
    smooth: true,
    emphasis: {
      focus: 'series',
      areaStyle: {
        opacity: 0.9,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowBlur: 2,
      },
    },
    stack: 'total',
    symbol: 'none',
    areaStyle: {},
    lineStyle: {width: 0},
  }));

const estLignePointillee = ({id}: {id?: string | number}) =>
  id === 'objectifs' || id === 'trajectoire';

// génère le paramétrage de séries de données sous forme de lignes
export const makeLineSeries = (dataset: Dataset[]): LineSeriesOption[] =>
  dataset.map(ds => ({
    id: ds.id,
    datasetId: ds.id,
    name: ds.name,
    color: ds.color,
    type: 'line',
    smooth: true,
    emphasis: {focus: 'series'},
    symbol: ds.id === 'trajectoire' ? 'none' : 'circle',
    lineStyle: estLignePointillee(ds) ? {type: 'dashed', width: 2} : {width: 2},
  }));

// génère le paramétrage des données de la légende à partir des paramètres des lignes
export const makeLegendData = (
  series: LineSeriesOption[]
): LegendComponentOption['data'] =>
  // @ts-expect-error
  series.map(serie =>
    serie.stack
      ? serie.name
      : {
          name: serie.name,
          icon: 'line',
          itemStyle: Object.assign(
            {
              borderColor: serie.color,
              borderWidth: 2,
            },
            estLignePointillee(serie)
              ? {borderDashOffset: 1, borderType: 'dashed'}
              : {borderType: 'solid'}
          ),
        }
  );

// génère le paramétrage du graphe
export const makeOption = ({
  option,
  titre,
  unite,
}: {
  option?: EChartsOption;
  titre: string;
  unite: string;
}): EChartsOption => ({
  textStyle: {
    fontFamily: '"Marianne", arial, sans-serif',
  },
  grid: {
    left: '3%',
    right: '3%',
    top: '17%',
    bottom: '12%',
    containLabel: true,
  },
  legend: {
    icon: 'roundRect',
    itemHeight: 12,
    itemWidth: 18,
    bottom: 0,
    textStyle: {
      color: colors.primary['9'],
      fontWeight: 500,
      fontSize: 14,
      lineHeight: 20,
    },
    data:
      option?.series && Array.isArray(option?.series)
        ? makeLegendData(option.series as LineSeriesOption[])
        : undefined,
  },
  xAxis: {
    type: 'time',
    splitLine: {show: true, lineStyle: {opacity: 0.5}},
    minorSplitLine: {show: true},
    // graduation de 5 en 5 années
    maxInterval: 6 * 365 * 24 * 50 * 60 * 1000,
    axisLabel: {
      formatter: '{yyyy}',
      color: colors.primary['9'],
      showMinLabel: true,
      showMaxLabel: true,
      margin: 15,
    },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: colors.primary['9'],
      formatter: value => NumFormat.format(value),
    },
  },
  title: {
    text: titre,
    subtext: unite,
    textStyle: {
      color: colors.primary['9'],
    },
    subtextStyle: {
      color: colors.primary['8'],
    },
  },
  tooltip: {
    trigger: 'axis',
    order: 'valueDesc',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985',
        formatter: params =>
          params.axisDimension === 'x'
            ? new Date(params.value).getFullYear().toString()
            : NumFormat.format(params.value as number),
      },
    },
    valueFormatter: value => NumFormat.format(value as number),
  },
  toolbox: {
    top: 1,
    right: 10,
    borderType: 'solid',
    borderWidth: 0.5,
    borderColor: colors.primary.DEFAULT,
    borderRadius: 8,
    padding: 10,
    iconStyle: {
      color: colors.primary.DEFAULT,
      borderWidth: 0,
    },
    emphasis: {
      iconStyle: {
        // @ts-expect-error les props `text*` fonctionnent mais ne sont pas dans le typage
        textBackgroundColor: '#222',
        textFill: '#fff',
        textBorderRadius: 3,
        textPadding: [5, 8],
        color: colors.primary.DEFAULT,
      },
    },
    feature: {
      saveAsImage: {
        title: 'Télécharger',
        name: titre,
        icon: DOWNLOAD_ICON,
      },
    },
  },
  ...option,
});
