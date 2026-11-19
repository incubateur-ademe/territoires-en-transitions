import type {
  SousIndicateurChartValeurs,
  SousIndicateursChartData,
} from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-chart.rules';
import { SOUS_INDICATEURS_TOTAL_COLOR } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-colors';
import { makeIndicateurPeriodTimeAxis } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import { appLabels } from '@/app/labels/catalog';
import {
  type Dataset,
  type EChartsOption,
  makeLegendData,
  makeLineSeries,
  makeOption,
} from '@/app/ui/charts/echarts';
import type { IndicateurPeriodicite } from '@tet/domain/indicateurs';
import type { LineSeriesOption } from 'echarts/charts';
import { makeSegmentSeries } from '../../../chart/make-segment-series';

const STACK_KEY = 'sous-indicateurs';
const DATASET_DIMENSIONS = ['dateValeurISO', 'valeur'];
const OBJECTIF_POINT_SIZE = 8;

export type ChartPresentation = Readonly<{
  unite: string;
  periodicite: IndicateurPeriodicite;
}>;

type SeriesDataset = Dataset & {
  source: { dateValeurISO: string; valeur: number | null }[];
};

type ChartSeries = Readonly<{
  datasets: SeriesDataset[];
  series: LineSeriesOption[];
}>;

type StackedData = Extract<SousIndicateursChartData, { mode: 'stacked' }>;
type LinesData = Extract<SousIndicateursChartData, { mode: 'lines' }>;

const toLeafDatasetId = (indicateurId: number): string =>
  `sous-indicateur-${indicateurId}`;

const toResultatLineDatasetId = (indicateurId: number): string =>
  `resultat-sous-indicateur-${indicateurId}`;

const toObjectifLineDatasetId = (indicateurId: number): string =>
  `objectif-sous-indicateur-${indicateurId}`;

const RESULTAT_TOTAL_DATASET_ID = 'resultat-total';
const OBJECTIF_TOTAL_DATASET_ID = 'objectif-total';

const toObjectifName = (label: string): string =>
  appLabels.indicateurSousIndicateursObjectifDe({ label });

const isObjectifSeries = ({ id }: LineSeriesOption): boolean =>
  typeof id === 'string' && id.startsWith('objectif');

const withHollowObjectifPoints = (
  series: readonly LineSeriesOption[]
): LineSeriesOption[] =>
  series.map((serie) =>
    isObjectifSeries(serie)
      ? { ...serie, symbol: 'emptyCircle', symbolSize: OBJECTIF_POINT_SIZE }
      : serie
  );

const listLegendSeries = (
  series: readonly LineSeriesOption[]
): LineSeriesOption[] => [
  ...series.filter(({ stack }) => stack === undefined),
  ...series.filter(({ stack }) => stack !== undefined),
];

const toDataset = ({
  id,
  name,
  color,
  dates,
  valeurs,
}: {
  id: string;
  name: string;
  color: string;
  dates: readonly string[];
  valeurs: SousIndicateurChartValeurs;
}): SeriesDataset => ({
  id,
  name,
  color,
  source: dates.map((date, index) => ({
    dateValeurISO: `${date}T00:00:00.000Z`,
    valeur: valeurs[index],
  })),
  dimensions: DATASET_DIMENSIONS,
});

const toOptionalDatasets = ({
  id,
  name,
  color,
  dates,
  valeurs,
}: {
  id: string;
  name: string;
  color: string;
  dates: readonly string[];
  valeurs: SousIndicateurChartValeurs | null;
}): SeriesDataset[] => {
  if (valeurs === null) {
    return [];
  }
  return [toDataset({ id, name, color, dates, valeurs })];
};

const toStackedChartSeries = ({
  dates,
  leaves,
  resultatTotal,
  objectifTotal,
}: StackedData): ChartSeries => {
  const leafDatasets = leaves.map(({ indicateurId, label, color, valeurs }) =>
    toDataset({
      id: toLeafDatasetId(indicateurId),
      name: label,
      color,
      dates,
      valeurs,
    })
  );
  const resultatTotalDatasets = toOptionalDatasets({
    id: RESULTAT_TOTAL_DATASET_ID,
    name: appLabels.indicateurSousIndicateursTotal,
    color: SOUS_INDICATEURS_TOTAL_COLOR,
    dates,
    valeurs: resultatTotal,
  });
  const objectifTotalDatasets = toOptionalDatasets({
    id: OBJECTIF_TOTAL_DATASET_ID,
    name: toObjectifName(appLabels.indicateurSousIndicateursTotal),
    color: SOUS_INDICATEURS_TOTAL_COLOR,
    dates,
    valeurs: objectifTotal,
  });
  const totalDatasets = [...resultatTotalDatasets, ...objectifTotalDatasets];
  return {
    datasets: [...leafDatasets, ...totalDatasets],
    series: [
      ...makeSegmentSeries(leafDatasets).map((series) => ({
        ...series,
        stack: STACK_KEY,
      })),
      ...makeLineSeries(totalDatasets),
    ],
  };
};

const toLinesChartSeries = ({ dates, lines }: LinesData): ChartSeries => {
  const datasets = lines.flatMap(
    ({ indicateurId, label, color, resultatValeurs, objectifValeurs }) => [
      ...toOptionalDatasets({
        id: toResultatLineDatasetId(indicateurId),
        name: label,
        color,
        dates,
        valeurs: resultatValeurs,
      }),
      ...toOptionalDatasets({
        id: toObjectifLineDatasetId(indicateurId),
        name: toObjectifName(label),
        color,
        dates,
        valeurs: objectifValeurs,
      }),
    ]
  );
  return { datasets, series: makeLineSeries(datasets) };
};

export const toSousIndicateursChartSeries = (
  data: SousIndicateursChartData
): ChartSeries => {
  const { datasets, series } =
    data.mode === 'stacked'
      ? toStackedChartSeries(data)
      : toLinesChartSeries(data);
  return { datasets, series: withHollowObjectifPoints(series) };
};

export const toSousIndicateursChartOption = ({
  data,
  unite,
  periodicite,
}: ChartPresentation &
  Readonly<{ data: SousIndicateursChartData }>): EChartsOption => {
  const { datasets, series } = toSousIndicateursChartSeries(data);
  return makeOption({
    option: {
      dataset: datasets,
      series,
      legend: { data: makeLegendData(listLegendSeries(series)) },
      grid: { left: 32, right: 32, bottom: 80 },
      title: { left: 28 },
    },
    unite,
    timeAxis: makeIndicateurPeriodTimeAxis(periodicite),
    disableToolbox: true,
    hideMinMaxLabel: data.dates.length <= 1,
  });
};
