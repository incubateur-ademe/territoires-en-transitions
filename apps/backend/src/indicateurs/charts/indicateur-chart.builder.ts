import { Injectable, Logger } from '@nestjs/common';
import { makeLegendData } from '@tet/backend/utils/echarts/chart-legend.utils';
import { CHART_FONT_FAMILY } from '@tet/backend/utils/echarts/get-horizontal-stackedbar-chart-option.utils';
import {
  INDICATEUR_VALEUR_TYPE_LABEL,
  IndicateurAvecValeursParSource,
  IndicateurPeriodes,
  IndicateurValeurType,
  IndicateurValeurTypeEnum,
  IndicateurValeurWithoutReferenceType,
  normalizeIndicateurReferenceObjectifs,
} from '@tet/domain/indicateurs';
import { PALETTE_LIGHT, preset } from '@tet/domain/utils';
import {
  DatasetComponentOption,
  EChartsOption,
  LineSeriesOption,
} from 'echarts/types/dist/echarts';
import { isNil } from 'es-toolkit';
import { DateTime } from 'luxon';
import { ValeursMoyenneDTO } from '../valeurs/get-moyenne-indicateur-valeurs/valeurs-moyenne.dto';
import { ValeursReferenceDTO } from '../valeurs/get-valeurs-reference/valeurs-reference.dto';
import {
  ChartLineStyle,
  ChartSurfaceStyle,
  DEFAULT_CHART_LINE_STYLE,
  DEFAULT_CHART_LINE_STYLES_BY_VALEUR_TYPE,
  DEFAULT_CHART_SURFACE_STYLE,
  DEFAULT_CHART_SURFACE_STYLES_BY_VALEUR_TYPE,
  INDICATEUR_CHART_LINE_STYLES_BY_SOURCE_ID,
} from './indicateur-chart-colors.constants';
import {
  IndicateurChartSegmentationWithValeurs,
  IndicateurChartSourceFilter,
} from './indicateur-chart.input';

const { colors } = preset.theme.extend;
const numberFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

type DatasetSeries = Readonly<{
  dataset: DatasetComponentOption;
  serie: LineSeriesOption;
}>;

type ChartPoint = { dateValeur: string; valeur: number | null };
type LineDatasetSeries = DatasetSeries & {
  dataset: { source: ChartPoint[] };
};

type BuildIndicateurChartInput = Readonly<{
  indicateurValeurs: IndicateurAvecValeursParSource;
  segmentation?: IndicateurChartSegmentationWithValeurs | null;
  sourcesFilter?: IndicateurChartSourceFilter;
  valeursReference?: ValeursReferenceDTO | null;
  valeursMoyenneCollectivites?: ValeursMoyenneDTO | null;
  showReferenceLineLabel?: boolean;
}>;

/**
 * Presentation boundary for ECharts options. Data loading and access control
 * remain in the application service; this builder transforms an already-loaded
 * indicator view into chart datasets and series.
 */
@Injectable()
export class IndicateurChartBuilder {
  private readonly logger = new Logger(IndicateurChartBuilder.name);

  private readonly forcedSourceLabels: Record<string, string> = {
    collectivite: 'de la collectivité',
    snbc: 'SNBC territorialisée',
  };
  private readonly bottomLegendLineHeight = 40;
  private readonly legendItemWidth = 300;
  private readonly titleLeftMargin = 28;
  private readonly titleFontSize = 24;
  private readonly titleSubtextFontSize = 18;

  adjustOptionsWithWidth(chartOption: EChartsOption, width: number): void {
    const safeWidth = Number.isFinite(width) ? Math.max(width, 0) : 0;
    const firstTitle = Array.isArray(chartOption.title)
      ? chartOption.title[0]
      : chartOption.title;
    if (firstTitle?.textStyle) {
      firstTitle.textStyle.width = Math.max(
        safeWidth - this.titleLeftMargin * 2,
        0
      );
    }

    if (isNil(chartOption.grid) || isNil(chartOption.legend)) {
      return;
    }

    const legend = Array.isArray(chartOption.legend)
      ? chartOption.legend[0]
      : chartOption.legend;
    const legendItems = legend?.data?.length ?? 0;
    const legendItemPerLine = Math.max(
      1,
      Math.floor(safeWidth / this.legendItemWidth)
    );
    const lineCount = Math.ceil(legendItems / legendItemPerLine);
    const bottom = lineCount * this.bottomLegendLineHeight;
    this.logger.log(
      `Legend items: ${legendItems}, legend item per line: ${legendItemPerLine}, line count: ${lineCount}, bottom: ${bottom}`
    );
    const grid = Array.isArray(chartOption.grid)
      ? chartOption.grid[0]
      : chartOption.grid;
    if (grid) {
      grid.bottom = bottom;
    }
  }

  build({
    indicateurValeurs,
    sourcesFilter,
    segmentation,
    valeursReference,
    valeursMoyenneCollectivites,
    showReferenceLineLabel,
  }: BuildIndicateurChartInput): EChartsOption {
    const sources = sourcesFilter
      ? sourcesFilter.map(({ sourceId }) => sourceId)
      : Object.keys(indicateurValeurs.sources);

    const valeursDatasetsAndSeries = sources.flatMap((sourceId) => {
      const valeurTypes = sourcesFilter?.find(
        (source) => source.sourceId === sourceId
      )?.valeurTypes ?? [
        IndicateurValeurTypeEnum.RESULTAT,
        IndicateurValeurTypeEnum.OBJECTIF,
      ];
      return valeurTypes.flatMap((valeurType) =>
        this.makeIndicateurDatasetSeries(
          indicateurValeurs,
          sourceId,
          valeurType
        )
      );
    });

    // ECharts stacks time series by index, so every segment needs the same dates.
    const segmentDates = [
      ...new Set(
        segmentation?.indicateursEnfantValeurs?.flatMap(
          (indicateur) =>
            indicateur.sources[segmentation.source]?.valeurs.map(
              ({ dateValeur }) => dateValeur
            ) ?? []
        )
      ),
    ].sort();
    const segmentDatasetsAndSeries = segmentation?.indicateursEnfantValeurs
      ? segmentation.indicateursEnfantValeurs.flatMap(
          (indicateur, indicateurIndex) =>
            this.makeSegmentationDatasetSeries(
              indicateur,
              indicateurIndex,
              segmentation.source,
              segmentation.valeurType,
              PALETTE_LIGHT,
              segmentDates
            )
        )
      : [];

    const referenceDatasetsAndSeries = valeursReference
      ? this.makeReferenceDatasetsSeries(
          valeursReference,
          showReferenceLineLabel
        )
      : [];

    const moyenneDatasetsAndSeries = valeursMoyenneCollectivites
      ? this.makeLineDatasetSeries(
          indicateurValeurs.definition.id,
          valeursMoyenneCollectivites.valeurs.map(({ dateValeur, valeur }) => ({
            dateValeur,
            valeur,
          })),
          'moyenne',
          ''
        )
      : null;

    const allDatasetsAndSeries = [
      ...valeursDatasetsAndSeries,
      ...referenceDatasetsAndSeries,
      ...(moyenneDatasetsAndSeries ? [moyenneDatasetsAndSeries] : []),
      ...segmentDatasetsAndSeries,
    ];
    const dataset = allDatasetsAndSeries.map((item) => item.dataset);
    const series = allDatasetsAndSeries.map((item) => item.serie);

    return {
      useUTC: true,
      textStyle: { fontFamily: CHART_FONT_FAMILY },
      dataset,
      series,
      grid: {
        left: 32,
        right: 32,
        top: 80,
        bottom: this.bottomLegendLineHeight * 2,
        containLabel: true,
      },
      legend: {
        show: true,
        icon: 'roundRect',
        itemGap: 14,
        itemHeight: 12,
        itemWidth: 18,
        bottom: 0,
        textStyle: {
          color: colors.primary['9'],
          fontFamily: CHART_FONT_FAMILY,
          fontWeight: 500,
          fontSize: 14,
          lineHeight: 20,
        },
        data: makeLegendData(series),
      },
      xAxis: {
        type: 'time',
        splitLine: { show: true, lineStyle: { opacity: 0.5 } },
        maxInterval: 5 * 365 * 24 * 60 * 60 * 1000,
        minInterval: 365 * 24 * 60 * 60 * 1000,
        axisLabel: {
          fontFamily: CHART_FONT_FAMILY,
          formatter: '{yyyy}',
          color: colors.primary['9'],
          showMinLabel: true,
          showMaxLabel: true,
          margin: 15,
        },
      },
      yAxis: {
        type: 'value' as const,
        splitLine: { show: false },
        axisLabel: {
          fontFamily: CHART_FONT_FAMILY,
          color: colors.primary['9'],
          formatter: (value: number) => numberFormat.format(value),
        },
      },
      title: {
        left: this.titleLeftMargin,
        text: indicateurValeurs.definition.titre,
        subtext: indicateurValeurs.definition.unite,
        itemGap: indicateurValeurs.definition.titre ? 15 : 0,
        textStyle: {
          color: colors.primary['9'],
          overflow: 'break',
          fontSize: this.titleFontSize,
        },
        subtextStyle: {
          color: colors.grey['6'],
          fontWeight: 500,
          fontSize: this.titleSubtextFontSize,
        },
      },
    };
  }

  private getDatasetLabel(
    type: IndicateurValeurType,
    sourceId: string,
    sourceLabel?: string,
    segmentationLabel?: string
  ): string {
    const labelValeurType = INDICATEUR_VALEUR_TYPE_LABEL[type];
    const resolvedSourceLabel =
      this.forcedSourceLabels[sourceId] || sourceLabel || sourceId;
    return `${labelValeurType}${
      segmentationLabel ? ` ${segmentationLabel}` : ''
    }${
      sourceId || resolvedSourceLabel
        ? ` ${resolvedSourceLabel || sourceId}`
        : ''
    }`;
  }

  private getLineStyle(
    valeurType: IndicateurValeurType,
    sourceId: string
  ): ChartLineStyle {
    return {
      ...DEFAULT_CHART_LINE_STYLE,
      ...(DEFAULT_CHART_LINE_STYLES_BY_VALEUR_TYPE[valeurType] || {}),
      ...(INDICATEUR_CHART_LINE_STYLES_BY_SOURCE_ID[sourceId]?.[valeurType] ||
        {}),
    };
  }

  private getSurfaceStyle(
    valeurType: IndicateurValeurWithoutReferenceType
  ): ChartSurfaceStyle {
    return {
      ...DEFAULT_CHART_SURFACE_STYLE,
      ...(DEFAULT_CHART_SURFACE_STYLES_BY_VALEUR_TYPE[valeurType] || {}),
    };
  }

  private makeSegmentationDatasetSeries(
    indicateurAvecValeurs: IndicateurAvecValeursParSource,
    indicateurIndex: number,
    sourceId: string,
    valeurType: IndicateurValeurWithoutReferenceType,
    palette: string[],
    dates: string[]
  ): DatasetSeries[] {
    return this.makeIndicateurDatasetSeries(
      indicateurAvecValeurs,
      sourceId,
      valeurType,
      indicateurAvecValeurs.definition.titreCourt ??
        indicateurAvecValeurs.definition.titre,
      dates
    ).map(({ dataset, serie }) => ({
      dataset,
      serie: {
        ...serie,
        ...this.getSurfaceStyle(valeurType),
        // An isolated observation has no area, but still needs a visible point.
        symbol: (_value, { dataIndex }) =>
          dataset.source[dataIndex - 1]?.valeur == null &&
          dataset.source[dataIndex + 1]?.valeur == null
            ? 'circle'
            : 'none',
        symbolSize: 6,
        color: palette[indicateurIndex % palette.length],
        stack: 'total',
      },
    }));
  }

  private makeIndicateurDatasetSeries(
    indicateurAvecValeurs: IndicateurAvecValeursParSource,
    sourceId: string,
    valeurType: IndicateurValeurWithoutReferenceType,
    segmentationLabel?: string,
    dates?: string[]
  ): LineDatasetSeries[] {
    const source = indicateurAvecValeurs.sources[sourceId];
    if (!source) return [];

    const sourceLabel = source.metadonnees?.length
      ? source.metadonnees[0]?.producteur || source.libelle
      : source.libelle;
    const sourcePoints = source.valeurs
      .toSorted((left, right) =>
        left.dateValeur.localeCompare(right.dateValeur)
      )
      .map((valeur) => ({
        dateValeur: valeur.dateValeur,
        valeur: valeur[valeurType] ?? null,
      }));
    const pointsByDate = new Map(
      sourcePoints.map((point) => [point.dateValeur, point])
    );
    const points = dates
      ? dates.map(
          (dateValeur) =>
            pointsByDate.get(dateValeur) ?? { dateValeur, valeur: null }
        )
      : sourcePoints;
    const datasetSeries = this.makeLineDatasetSeries(
      indicateurAvecValeurs.definition.id,
      points,
      valeurType,
      sourceId,
      sourceLabel,
      segmentationLabel
    );
    return datasetSeries ? [datasetSeries] : [];
  }

  private makeLineDatasetSeries(
    indicateurId: number,
    valeurs: ChartPoint[],
    valeurType: IndicateurValeurType,
    sourceId: string,
    sourceLabel?: string,
    segmentationLabel?: string
  ): LineDatasetSeries | null {
    const datasetId = `${indicateurId}-${valeurType}${
      sourceId ? `-${sourceId}` : ''
    }`;
    const datasetName = this.getDatasetLabel(
      valeurType,
      sourceId,
      sourceLabel,
      segmentationLabel
    );
    const dataset: LineDatasetSeries['dataset'] = {
      id: datasetId,
      name: datasetName,
      source: valeurs,
      dimensions: ['dateValeur', 'valeur'],
    };
    if (!valeurs.some(({ valeur }) => valeur !== null)) return null;

    return {
      dataset,
      serie: {
        id: datasetId,
        datasetId,
        name: datasetName,
        type: 'line',
        emphasis: { focus: 'series' },
        ...this.getLineStyle(valeurType, sourceId),
        connectNulls: false,
      },
    };
  }

  private makeReferenceValueDatasetSeries(
    referenceValueType: 'cible' | 'seuil',
    value: number,
    unite: string,
    showMarkLineLabel?: boolean
  ): DatasetSeries {
    const lineStyle = this.getLineStyle(referenceValueType, referenceValueType);
    const dataDate = DateTime.now().startOf('year');
    const datasetLabel = `${this.getDatasetLabel(
      referenceValueType,
      ''
    )} : ${value} ${unite}`;

    return {
      dataset: {
        id: referenceValueType,
        name: datasetLabel,
        source: [
          {
            date: dataDate.toISODate(),
            annee: dataDate.year,
            valeur: value,
          },
        ],
        dimensions: ['date', 'valeur'],
      },
      serie: {
        id: referenceValueType,
        datasetId: referenceValueType,
        type: 'line',
        name: datasetLabel,
        ...lineStyle,
        symbol: 'none',
        emphasis: { focus: 'series' },
        markLine: {
          animation: false,
          silent: true,
          label: {
            show: showMarkLineLabel,
            formatter: (params) =>
              typeof params.value === 'number'
                ? numberFormat.format(params.value)
                : '',
          },
          ...lineStyle,
          symbol: 'none',
          symbolSize: 0,
          data: [{ type: 'max' }],
        },
      },
    };
  }

  private makeReferenceObjectifsDatasetSeries(
    objectifs: NonNullable<ValeursReferenceDTO['objectifs']>,
    unite: string,
    libelle: string | null,
    showMarkLineLabel?: boolean
  ): DatasetSeries {
    const lineStyle = this.getLineStyle('cible', 'cible');
    const objectifsByHorizon = normalizeIndicateurReferenceObjectifs(objectifs);
    const valeurs = objectifsByHorizon.map(({ horizon, valeur }) => ({
      date: IndicateurPeriodes.toDateValeur(horizon),
      valeur,
    }));
    const datasetName =
      objectifsByHorizon.length === 1
        ? `Objectif ${IndicateurPeriodes.serialize(
            objectifsByHorizon[0].horizon
          )} : ${objectifsByHorizon[0].valeur} ${unite}`
        : libelle ?? 'Objectifs';
    const datasetId = 'cible-objectifs';

    return {
      dataset: {
        id: datasetId,
        name: datasetName,
        source: valeurs,
        dimensions: ['date', 'valeur'],
      },
      serie: {
        id: datasetId,
        datasetId,
        type: 'line',
        name: datasetName,
        ...lineStyle,
        symbol: 'circle',
        emphasis: { focus: 'series' },
        markLine:
          valeurs.length === 1
            ? {
                animation: false,
                silent: true,
                label: {
                  show: showMarkLineLabel,
                  formatter: (params) =>
                    typeof params.value === 'number'
                      ? numberFormat.format(params.value)
                      : '',
                },
                ...lineStyle,
                symbol: 'none',
                symbolSize: 0,
                data: [{ type: 'max' }],
              }
            : undefined,
      },
    };
  }

  private makeReferenceDatasetsSeries(
    valeursReference: ValeursReferenceDTO,
    showMarkLineLabel?: boolean
  ): DatasetSeries[] {
    const { cible, seuil, objectifs, unite, libelle } = valeursReference;
    const datasetsSeries: DatasetSeries[] = [];
    if (!isNil(cible)) {
      datasetsSeries.push(
        this.makeReferenceValueDatasetSeries(
          'cible',
          cible,
          unite,
          showMarkLineLabel
        )
      );
    }
    if (!isNil(seuil)) {
      datasetsSeries.push(
        this.makeReferenceValueDatasetSeries(
          'seuil',
          seuil,
          unite,
          showMarkLineLabel
        )
      );
    }
    if (objectifs?.length) {
      datasetsSeries.push(
        this.makeReferenceObjectifsDatasetSeries(
          objectifs,
          unite,
          libelle,
          showMarkLineLabel
        )
      );
    }
    return datasetsSeries;
  }
}
