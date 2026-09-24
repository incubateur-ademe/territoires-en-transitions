import { Injectable, Logger } from '@nestjs/common';
import { makeLegendData } from '@tet/backend/utils/echarts/chart-legend.utils';
import { CHART_FONT_FAMILY } from '@tet/backend/utils/echarts/get-horizontal-stackedbar-chart-option.utils';
import {
  aggregateIndicateurValeurs,
  formatIndicateurPeriod,
  INDICATEUR_VALEUR_TYPE_LABEL,
  IndicateurAvecValeursParSource,
  IndicateurPeriodicite,
  IndicateurPeriods,
  IndicateurValeurType,
  IndicateurValeurTypeEnum,
  IndicateurValeurWithoutReferenceType,
  normalizeIndicateurReferenceObjectifs,
  resolveIndicateurSourceDisplayPeriodicite,
} from '@tet/domain/indicateurs';
import { PALETTE_LIGHT, preset } from '@tet/domain/utils';
import {
  DatasetComponentOption,
  EChartsOption,
  LineSeriesOption,
} from 'echarts/types/dist/echarts';
import { groupBy, isNil } from 'es-toolkit';
import { DateTime } from 'luxon';
import { ValeursMoyenneDTO } from '../valeurs/valeurs-moyenne.dto';
import { ValeursReferenceDTO } from '../valeurs/valeurs-reference.dto';
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
import { getIndicateurChartPeriodAdapter } from './indicateur-chart-period.adapter';

const { colors } = preset.theme.extend;
const numberFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

type DatasetSeries = Readonly<{
  dataset: DatasetComponentOption;
  serie: LineSeriesOption;
  stackId?: string;
}>;

type BuildIndicateurChartInput = Readonly<{
  indicateurValeurs: IndicateurAvecValeursParSource;
  periodiciteAffichage?: IndicateurPeriodicite;
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
    periodiciteAffichage,
    sourcesFilter,
    segmentation,
    valeursReference,
    valeursMoyenneCollectivites,
    showReferenceLineLabel,
  }: BuildIndicateurChartInput): EChartsOption {
    const sources = sourcesFilter
      ? sourcesFilter.map(({ sourceId }) => sourceId)
      : Object.keys(indicateurValeurs.sources);
    const displayPeriodicite = resolveIndicateurSourceDisplayPeriodicite(
      indicateurValeurs.definition.periodicite,
      sources.flatMap(
        (sourceId) =>
          indicateurValeurs.sources[sourceId]?.valeurs.map(
            ({ periodicite }) => periodicite
          ) ?? []
      ),
      periodiciteAffichage
    );
    const chartPeriod = getIndicateurChartPeriodAdapter(displayPeriodicite);

    const valeursDatasetsAndSeries = sources
      .flatMap((sourceId) => {
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
            valeurType,
            displayPeriodicite
          )
        );
      })
      .filter((datasetSeries): datasetSeries is DatasetSeries =>
        Boolean(datasetSeries)
      );

    const segmentDatasetsAndSeries = segmentation?.indicateursEnfantValeurs
      ? segmentation.indicateursEnfantValeurs
          .flatMap((indicateur, indicateurIndex) =>
            this.makeSegmentationDatasetSeries(
              indicateur,
              indicateurIndex,
              segmentation.source,
              segmentation.valeurType,
              PALETTE_LIGHT,
              displayPeriodicite
            )
          )
          .filter((datasetSeries): datasetSeries is DatasetSeries =>
            Boolean(datasetSeries)
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
          aggregateIndicateurValeurs(
            valeursMoyenneCollectivites.valeurs.map((valeur) => ({
              dateValeur: valeur.dateValeur,
              periodicite: indicateurValeurs.definition.periodicite,
              resultat: valeur.valeur,
            })),
            {
              periodiciteAffichage: displayPeriodicite,
              aggregationResultat:
                indicateurValeurs.definition.aggregationResultat,
            }
          ).map(({ dateValeur, resultat }) => ({
            dateValeur,
            valeur: resultat ?? null,
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
      useUTC: chartPeriod.useUTC,
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
        maxInterval: chartPeriod.maxInterval,
        minInterval: chartPeriod.minInterval,
        axisLabel: {
          fontFamily: CHART_FONT_FAMILY,
          formatter: chartPeriod.formatTick,
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
    periodiciteAffichage: IndicateurPeriodicite
  ): DatasetSeries[] {
    return this.makeIndicateurDatasetSeries(
      indicateurAvecValeurs,
      sourceId,
      valeurType,
      periodiciteAffichage,
      indicateurAvecValeurs.definition.titreCourt ??
        indicateurAvecValeurs.definition.titre
    ).map(({ dataset, serie, stackId }) => ({
      dataset,
      serie: {
        ...serie,
        ...this.getSurfaceStyle(valeurType),
        color: palette[indicateurIndex % palette.length],
        stack: stackId,
      },
    }));
  }

  private makeIndicateurDatasetSeries(
    indicateurAvecValeurs: IndicateurAvecValeursParSource,
    sourceId: string,
    valeurType: IndicateurValeurWithoutReferenceType,
    periodiciteAffichage: IndicateurPeriodicite,
    segmentationLabel?: string
  ): DatasetSeries[] {
    const source = indicateurAvecValeurs.sources[sourceId];
    if (!source) return [];

    const sourceLabel = source.metadonnees?.length
      ? source.metadonnees[0]?.producteur || source.libelle
      : source.libelle;
    const valeurs = aggregateIndicateurValeurs(source.valeurs, {
      periodiciteAffichage,
      aggregationResultat: indicateurAvecValeurs.definition.aggregationResultat,
      aggregationObjectif: indicateurAvecValeurs.definition.aggregationObjectif,
    });
    const groups = Object.entries(
      groupBy(
        valeurs,
        (valeur) =>
          `${valeur.periodiciteSource}-${valeur.metadonneeId ?? 'local'}`
      )
    );
    return groups.flatMap(([identity, group]) => {
      const points = group.map((valeur) => ({
        dateValeur: valeur.dateValeur,
        valeur: valeur[valeurType] ?? null,
      }));
      if (!points.some(({ valeur }) => valeur !== null)) return [];
      const metadonnee = source.metadonnees?.find(
        ({ id }) => id === group[0].metadonneeId
      );
      const showSourceCadence =
        groups.length > 1 ||
        group[0].periodiciteSource !== periodiciteAffichage;
      const label = showSourceCadence
        ? `${metadonnee?.producteur || sourceLabel || sourceId} (${
            group[0].periodiciteSource
          }${metadonnee ? `, ${metadonnee.dateVersion}` : ''}${
            group[0].metadonneeId != null ? `, #${group[0].metadonneeId}` : ''
          })`
        : sourceLabel;
      const datasetSeries = this.makeLineDatasetSeries(
        indicateurAvecValeurs.definition.id,
        points,
        valeurType,
        sourceId,
        label,
        showSourceCadence && this.forcedSourceLabels[sourceId]
          ? `${segmentationLabel ?? ''} (${group[0].periodiciteSource}${
              metadonnee ? `, ${metadonnee.dateVersion}` : ''
            }${
              group[0].metadonneeId != null ? `, #${group[0].metadonneeId}` : ''
            })`.trim()
          : segmentationLabel,
        groups.length > 1 ? identity : undefined
      );
      return datasetSeries
        ? [
            {
              ...datasetSeries,
              stackId: `${sourceId}:${group[0].periodiciteSource}:${
                group[0].metadonneeId ?? 'local'
              }`,
            },
          ]
        : [];
    });
  }

  private makeLineDatasetSeries(
    indicateurId: number,
    valeurs: { dateValeur: string; valeur: number | null }[],
    valeurType: IndicateurValeurType,
    sourceId: string,
    sourceLabel?: string,
    segmentationLabel?: string,
    identitySuffix?: string
  ): DatasetSeries | null {
    const datasetId = `${indicateurId}-${valeurType}${
      sourceId ? `-${sourceId}` : ''
    }${identitySuffix ? `-${identitySuffix}` : ''}`;
    const datasetName = this.getDatasetLabel(
      valeurType,
      sourceId,
      sourceLabel,
      segmentationLabel
    );
    const dataset: DatasetComponentOption = {
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
      date: IndicateurPeriods.toDateValeur(horizon),
      valeur,
    }));
    const datasetName =
      objectifsByHorizon.length === 1
        ? `Objectif ${formatIndicateurPeriod(
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
