import { preset } from '@/ui';
import type {
  DatasetComponentOption,
  EChartsOption,
  LegendComponentOption,
  LineSeriesOption,
} from 'echarts';

const { colors } = preset.theme.extend;

// pour formater les chiffres
const NumFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

// icône bouton "télécharger"
export const DOWNLOAD_ICON =
  'path://M11 22S23 22 23 22 23 23.33 23 23.33 11 23.33 11 23.33 11 22 11 22ZM17.67 15.33S22.33 15.33 22.33 15.33 17 20.67 17 20.67 11.67 15.33 11.67 15.33 16.33 15.33 16.33 15.33 16.33 10 16.33 10 17.67 10 17.67 10 17.67 15.33 17.67 15.33Z';

// texture pour les surfaces "objectif"
const DOTTED_AREA: LineSeriesOption['itemStyle'] = {
  decal: {
    symbol: 'circle',
    symbolSize: 0.3,
    dashArrayX: [
      [18, 18],
      [0, 18, 18, 0],
    ],
    dashArrayY: [9, 0],
  },
};

export type Dataset = DatasetComponentOption & {
  color?: string;
  typeSource?: string;
};

// formate une date pour un axe `type='time'`
export const getAnnee = (date?: Date | string) => {
  const annee = getYear(date);
  return {
    annee,
    anneeISO: getAnneeISO(annee),
  };
};

export const getYear = (date?: Date | string | number) =>
  new Date(date || Date.now()).getFullYear();
export const getAnneeISO = (annee: number) => `${annee}-01-01T00:00:00.000Z`;

// génère le paramétrage de séries de données sous forme de surfaces empilées
export const makeStackedSeries = (dataset: Dataset[]): LineSeriesOption[] =>
  dataset.map((ds) => ({
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
    itemStyle: ds.typeSource === 'objectif' ? DOTTED_AREA : undefined,
    lineStyle: { width: 0 },
  }));

const estLignePointillee = ({ id }: { id?: string | number }) =>
  typeof id !== 'string' || !id.startsWith('resultat');

// génère le paramétrage de séries de données sous forme de lignes
export const makeLineSeries = (dataset: Dataset[]): LineSeriesOption[] =>
  dataset.map((ds) => ({
    id: ds.id,
    datasetId: ds.id,
    name: ds.name,
    color: ds.color,
    type: 'line',
    smooth: true,
    emphasis: { focus: 'series' },
    symbol: ds.id === 'trajectoire' ? 'none' : 'circle',
    symbolSize: ds.id?.toString().startsWith('resultat') ? 8 : 4,
    lineStyle: estLignePointillee(ds)
      ? { type: 'dashed', width: 2 }
      : { width: 2 },
  }));

// génère le paramétrage des séries pour les valeurs de référence (cible/seuil/objectifs)
export const makeReferenceSeries = (
  dataset: Dataset[],
  showMarkLineLabel: boolean
): LineSeriesOption[] =>
  dataset.map((ds) => ({
    id: ds.id,
    datasetId: ds.id,
    name: ds.name,
    color: ds.color,
    type: 'line',
    smooth: true,
    emphasis: { focus: 'series' },
    symbol: ds.id === 'cible-objectifs' ? 'circle' : 'none',
    lineStyle: { type: 'dotted', width: 2 },
    animation: false,
    markLine:
      ds.source?.length === 1
        ? {
            animation: false,
            silent: true,
            label: {
              show: showMarkLineLabel,
              formatter: (params) =>
                typeof params.value === 'number'
                  ? NumFormat.format(params.value)
                  : '',
            },
            symbol: 'none',
            lineStyle: { width: 2, type: 'dotted' },
            data: [{ type: 'max' }],
          }
        : undefined,
  }));

// génère le paramétrage des données de la légende à partir des paramètres des lignes
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

type OptionsProps = {
  option?: EChartsOption;
  titre?: string;
  unite?: string;
  disableToolbox?: boolean;
  hideMinMaxLabel?: boolean;
};

// configure la toolbox pour les graphiques (bouton télécharger)
export const TOOLBOX_BASE = {
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
      name: undefined,
      icon: DOWNLOAD_ICON,
    },
  },
} as const;

// génère le paramétrage du graphe
export const makeOption = ({
  option = {},
  titre,
  unite,
  disableToolbox = false,
  hideMinMaxLabel = false,
}: OptionsProps): EChartsOption => {
  const {
    grid: customGrid,
    legend: customLegend,
    title: customTitle,
    tooltip: customTooltip,
    ...otherOptions
  } = option;

  return {
    textStyle: {
      fontFamily: '"Marianne", arial, sans-serif',
    },
    grid: {
      left: '1%',
      right: '3%',
      top: '12%',
      bottom: '12%',
      containLabel: true,
      ...customGrid,
    },
    legend: {
      icon: 'roundRect',
      itemGap: 14,
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
      ...customLegend,
    },
    xAxis: {
      type: 'time',
      splitLine: { show: true, lineStyle: { opacity: 0.5 } },
      // graduation de 5 en 5 années
      maxInterval: 12 * 365 * 24 * 50 * 60 * 1000,
      minInterval: 365 * 24 * 50 * 60 * 1000,
      axisLabel: {
        formatter: '{yyyy}',
        color: colors.primary['9'],
        showMinLabel: !hideMinMaxLabel,
        showMaxLabel: !hideMinMaxLabel,
        margin: 15,
      },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        color: colors.primary['9'],
        formatter: (value: number) => NumFormat.format(value),
      },
    },
    title: {
      text: titre,
      subtext: unite,
      itemGap: titre ? 15 : 0,
      textStyle: {
        color: colors.primary['9'],
      },
      subtextStyle: {
        color: colors.grey['6'],
        fontWeight: 500,
      },
      ...customTitle,
    },
    tooltip: {
      trigger: 'axis',
      order: 'valueDesc',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
          formatter: (params) =>
            params.axisDimension === 'x'
              ? new Date(params.value).getFullYear().toString()
              : NumFormat.format(params.value as number),
        },
      },
      valueFormatter: (value) => NumFormat.format(value as number),
      ...customTooltip,
    },
    toolbox: !disableToolbox
      ? {
          ...TOOLBOX_BASE,
          top: 1,
          right: '3%',
          feature: {
            saveAsImage: {
              ...TOOLBOX_BASE.feature.saveAsImage,
              name: titre,
            },
          },
        }
      : undefined,
    ...otherOptions,
  };
};
