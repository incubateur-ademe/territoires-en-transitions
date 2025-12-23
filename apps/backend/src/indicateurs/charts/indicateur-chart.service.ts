import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { makeLegendData } from '@tet/backend/utils/echarts/chart-legend.utils';
import {
  CollectiviteAvecType,
  PersonnalisationReponsesPayload,
} from '@tet/domain/collectivites';
import {
  DEFAULT_SEGMENTATION,
  INDICATEUR_VALEUR_TYPE_LABEL,
  IndicateurAvecValeursParSource,
  IndicateurSegmentation,
  IndicateurValeurType,
  IndicateurValeurTypeEnum,
  IndicateurValeurWithoutReferenceType,
  ORDERED_SEGMENTATIONS,
} from '@tet/domain/indicateurs';
import { PALETTE_LIGHT, preset } from '@tet/domain/utils';
import {
  DatasetComponentOption,
  EChartsOption,
  LineSeriesOption,
} from 'echarts/types/dist/echarts';
import { intersection, isNil } from 'es-toolkit';
import { DateTime } from 'luxon';
import { DefinitionListItem } from '../definitions/list-definitions/list-definitions.output';
import { ListDefinitionsService } from '../definitions/list-definitions/list-definitions.service';
import CrudValeursService from '../valeurs/crud-valeurs.service';
import { ValeursMoyenneDTO } from '../valeurs/valeurs-moyenne.dto';
import ValeursMoyenneService from '../valeurs/valeurs-moyenne.service';
import { ValeursReferenceDTO } from '../valeurs/valeurs-reference.dto';
import ValeursReferenceService from '../valeurs/valeurs-reference.service';
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
  IndicateurChartInput,
  IndicateurChartSegmentation,
  IndicateurChartSegmentationWithValeurs,
  IndicateurChartSourceFilter,
} from './indicateur-chart.input';

const { colors } = preset.theme.extend;

const NumFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

@Injectable()
export class IndicateurChartService {
  private readonly logger = new Logger(IndicateurChartService.name);

  private readonly FORCED_SOURCE_LABELS: Record<string, string> = {
    collectivite: 'de la collectivité',
    snbc: 'SNBC territorialisée',
  };
  private readonly BOTTOM_LEGEND_LINE_HEIGHT = 40;
  private readonly LEGEND_ITEM_WIDTH = 300;
  private readonly TITLE_LEFT_MARGIN = 28;

  constructor(
    private readonly indicateurDefinitionService: ListDefinitionsService,
    private readonly indicateurValeursService: CrudValeursService,
    private readonly valeurReferenceService: ValeursReferenceService,
    private readonly valeursMoyenneService: ValeursMoyenneService
  ) {}

  private getDatasetLabel(
    type: IndicateurValeurType,
    sourceId: string,
    sourceLabel?: string,
    segmentationLabel?: string
  ) {
    const labelValeurType = INDICATEUR_VALEUR_TYPE_LABEL[type];
    sourceLabel =
      this.FORCED_SOURCE_LABELS[sourceId] || sourceLabel || sourceId;

    return `${labelValeurType}${
      segmentationLabel ? ` ${segmentationLabel}` : ''
    }${sourceId || sourceLabel ? ` ${sourceLabel || sourceId}` : ''}`;
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

  adjustOptionsWithWidth(chartOption: EChartsOption, width: number) {
    const firstTitle = Array.isArray(chartOption.title)
      ? chartOption.title[0]
      : chartOption.title;
    if (firstTitle?.textStyle) {
      firstTitle.textStyle.width = width - this.TITLE_LEFT_MARGIN * 2;
    }

    if (isNil(chartOption.grid) || isNil(chartOption.legend)) {
      return;
    }

    // Empirically calculated bottom margin for the legend
    // TODO: find a better way to calculate this
    const legend = Array.isArray(chartOption.legend)
      ? chartOption.legend[0]
      : chartOption.legend;
    const legendItems = legend.data?.length ?? 0;
    const legendItemPerLine = Math.floor(width / this.LEGEND_ITEM_WIDTH);
    const lineCount = Math.ceil(legendItems / legendItemPerLine);
    const bottom = lineCount * this.BOTTOM_LEGEND_LINE_HEIGHT;
    this.logger.log(
      `Legend items: ${legendItems}, legend item per line: ${legendItemPerLine}, line count: ${lineCount}, bottom: ${bottom}`
    );
    const grid = Array.isArray(chartOption.grid)
      ? chartOption.grid[0]
      : chartOption.grid;
    if (!grid) {
      return;
    }
    grid.bottom = bottom;
  }

  getIndicateurAvecValeursSegmentationDatasetSeries(
    indicateurAvecValeurs: IndicateurAvecValeursParSource,
    indicateurIndex: number,
    sourceId: string,
    valeurType: IndicateurValeurWithoutReferenceType,
    palette: string[]
  ): { dataset: DatasetComponentOption; serie: LineSeriesOption } | null {
    const datasetSeries = this.getIndicateurAvecValeursDatasetSeries(
      indicateurAvecValeurs,
      sourceId,
      valeurType,
      indicateurAvecValeurs.definition.titreCourt ??
        indicateurAvecValeurs.definition.titre
    );
    if (!datasetSeries) {
      return null;
    }
    const segmentationSerie: LineSeriesOption = {
      ...datasetSeries.serie,
      ...this.getSurfaceStyle(valeurType),
      color: palette[indicateurIndex % palette.length],
      stack: 'total',
    };

    return {
      dataset: datasetSeries.dataset,
      serie: segmentationSerie,
    };
  }

  getIndicateurAvecValeursDatasetSeries(
    indicateurAvecValeurs: IndicateurAvecValeursParSource,
    sourceId: string,
    valeurType: 'resultat' | 'objectif',
    segmentationLabel?: string
  ): { dataset: DatasetComponentOption; serie: LineSeriesOption } | null {
    const source = indicateurAvecValeurs.sources[sourceId];
    if (!source) {
      return null;
    }

    const sourceLabel = source.metadonnees?.length
      ? source.metadonnees?.[0]?.producteur || source.libelle
      : source.libelle;

    const valeurs = source.valeurs
      .map((valeur) => {
        if (isNil(valeur[valeurType])) {
          return null;
        }

        return {
          dateValeur: valeur.dateValeur,
          valeur: valeur[valeurType],
        };
      })
      .filter((v) => v !== null);

    if (!valeurs?.length) {
      return null;
    }

    return this.getLineDatasetSeries(
      indicateurAvecValeurs.definition.id,
      valeurs,
      valeurType,
      sourceId,
      sourceLabel,
      segmentationLabel
    );
  }

  getLineDatasetSeries(
    indicateurId: number,
    valeurs: { dateValeur: string; valeur: number }[],
    valeurType: IndicateurValeurType,
    sourceId: string,
    sourceLabel?: string,
    segmentationLabel?: string
  ): { dataset: DatasetComponentOption; serie: LineSeriesOption } | null {
    const datasetId = `${indicateurId}-${valeurType}${
      sourceId ? `-${sourceId}` : ''
    }`;
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

    if (!dataset.source?.length) {
      return null;
    }

    const lineStyle = this.getLineStyle(valeurType, sourceId);
    const serie: LineSeriesOption = {
      id: datasetId,
      datasetId,
      name: datasetName,
      type: 'line',
      emphasis: { focus: 'series' },
      ...lineStyle,
    };

    return {
      dataset,
      serie: serie,
    };
  }

  getReferenceValueDatasetSeries(
    referenceValueType: 'cible' | 'seuil',
    date: string | null,
    value: number,
    unite: string,
    showMarkLineLabel?: boolean
  ): {
    dataset: DatasetComponentOption;
    serie: LineSeriesOption;
  } {
    const lineStyle = this.getLineStyle(referenceValueType, referenceValueType);

    // Create a dataset with the current year and the value
    const dataDate = date
      ? DateTime.fromISO(date)
      : DateTime.now().startOf('year');

    const datasetLabel = `${this.getDatasetLabel(
      referenceValueType,
      '',
      dataDate.year.toString()
    )} : ${value} ${unite}`;
    const datasetId = `${referenceValueType}${
      date ? `-${dataDate.toISODate()}` : ''
    }`;

    const dataset: DatasetComponentOption = {
      id: datasetId,
      name: datasetLabel,
      source: [
        {
          date: dataDate.toISODate(),
          annee: dataDate.year,
          valeur: value,
        },
      ],
      dimensions: ['date', 'valeur'],
    };

    const serie: LineSeriesOption = {
      id: datasetId,
      datasetId: datasetId,
      type: 'line',
      name: datasetLabel,
      ...lineStyle,
      symbol: date ? lineStyle.symbol : 'none',
      emphasis: {
        focus: 'series',
      },
      markLine: {
        animation: false,
        silent: true,
        label: {
          show: showMarkLineLabel,
          formatter: (params) =>
            typeof params.value === 'number'
              ? NumFormat.format(params.value)
              : '',
        },
        ...lineStyle,
        symbol: 'none',
        symbolSize: 0,
        data: [{ type: 'max' }],
      },
    };

    return {
      dataset,
      serie,
    };
  }

  getReferenceDatasetsSeries(
    valeursReference: ValeursReferenceDTO,
    showMarkLineLabel?: boolean
  ): { dataset: DatasetComponentOption; serie: LineSeriesOption }[] {
    const { cible, seuil, objectifs, unite } = valeursReference;
    const datasetsSeries: {
      dataset: DatasetComponentOption;
      serie: LineSeriesOption;
    }[] = [];
    if (!isNil(cible)) {
      datasetsSeries.push(
        this.getReferenceValueDatasetSeries(
          'cible',
          null,
          cible,
          unite,
          showMarkLineLabel
        )
      );
    }
    if (seuil) {
      datasetsSeries.push(
        this.getReferenceValueDatasetSeries(
          'seuil',
          null,
          seuil,
          unite,
          showMarkLineLabel
        )
      );
    }

    if (objectifs?.length) {
      // TODO: to be checked with PO when more widely used (for now, max one cible-objectif)
      // Do we want one horizontal line per objectif ?
      datasetsSeries.push(
        ...objectifs.map((objectif) =>
          this.getReferenceValueDatasetSeries(
            'cible',
            objectif.dateValeur,
            objectif.valeur,
            unite,
            showMarkLineLabel
          )
        )
      );
    }

    return datasetsSeries;
  }

  private getOrderedSegmentations(childDefinitions: DefinitionListItem[]) {
    //Segmentations are based on categories of the child definitions
    // TODO: to be improved
    const indicateursBySegmentation = childDefinitions.reduce<{
      [seg in IndicateurSegmentation]?: number[];
    }>((acc, definition) => {
      // It's possible to have an indicateur in several segmentations but it's an exception/anomaly (e.g. cae_3.c both vecteur and vecteur_filiere because it's the only filiere of the vecteur gaz )
      // In theory, an indicateur should be in only one segmentation
      let foundSegmentations: IndicateurSegmentation[] = intersection(
        definition.categories?.map((c) => c.nom) ?? [],
        ORDERED_SEGMENTATIONS
      ) as IndicateurSegmentation[];
      if (!foundSegmentations.length) {
        foundSegmentations = [DEFAULT_SEGMENTATION];
      }
      foundSegmentations.forEach((s) => {
        if (!acc[s]) {
          acc[s] = [];
        }
        acc[s].push(definition.id);
      });
      return acc;
    }, {});

    const orderedAvailableSegmentations = ORDERED_SEGMENTATIONS.filter((s) =>
      Object.keys(indicateursBySegmentation).includes(s)
    );

    return {
      orderedAvailableSegmentations,
      indicateursBySegmentation,
    };
  }

  private getBestSourceAndValeurType(
    indicateursEnfantValeurs: IndicateurAvecValeursParSource[],
    source?: string,
    valeurType?: 'resultat' | 'objectif'
  ): { source: string; valeurType: 'resultat' | 'objectif' } | null {
    // Build a counter for each source and valeur type
    // And return the best one (the one with the most values) > TODO: can be improved with other criteria (e.g. more recent values, etc.)
    const counter = indicateursEnfantValeurs.reduce<{
      [key: string]: {
        source: string;
        valeurType: 'resultat' | 'objectif';
        count: number;
      };
    }>((acc, indicateur) => {
      const sources = source ? [source] : Object.keys(indicateur.sources);
      const valeurTypes = valeurType
        ? [valeurType]
        : [
            IndicateurValeurTypeEnum.RESULTAT,
            IndicateurValeurTypeEnum.OBJECTIF,
          ];
      sources.forEach((source) => {
        valeurTypes.forEach((valeurType) => {
          const key = `${source}-${valeurType}`;
          if (!acc[key]) {
            acc[key] = {
              source,
              valeurType,
              count: 0,
            };
          }
          acc[key].count +=
            indicateur.sources[source].valeurs?.filter(
              (v) => !isNil(v[valeurType]) !== null
            ).length ?? 0;
        });
      });

      return acc;
    }, {});

    const bestSourceAndValeurTypes = Object.values(counter).sort(
      (a, b) => b.count - a.count
    );
    if (!bestSourceAndValeurTypes.length) {
      return null;
    }
    return bestSourceAndValeurTypes[0];
  }

  private async getIndicateursSegmentationValeurs(
    collectiviteId: number,
    definition: DefinitionListItem,
    segmentation: IndicateurChartSegmentation
  ): Promise<IndicateurChartSegmentationWithValeurs | null> {
    const indicateursEnfantIds =
      definition.estAgregation && definition.enfants?.length
        ? definition.enfants.map((e) => e.id)
        : [];
    if (!indicateursEnfantIds.length) {
      return null;
    }
    const indicateursEnfantDefinitions =
      await this.indicateurDefinitionService.listDefinitions({
        collectiviteId,
        filters: {
          indicateurIds: indicateursEnfantIds,
        },
        queryOptions: {
          page: 1,
          limit: indicateursEnfantIds.length,
        },
      });

    const { orderedAvailableSegmentations, indicateursBySegmentation } =
      this.getOrderedSegmentations(indicateursEnfantDefinitions.data);

    if (!segmentation.type) {
      this.logger.log(
        `No segmentation provided, using first one in : ${orderedAvailableSegmentations.join(
          ', '
        )}`
      );
    }
    const segmentationType = segmentation.type
      ? segmentation.type
      : orderedAvailableSegmentations[0];

    const segmentatedIndicateursEnfantIds =
      indicateursBySegmentation[segmentationType];
    if (!segmentatedIndicateursEnfantIds?.length) {
      return null;
    }

    const indicateursEnfantValeurs = (
      await this.indicateurValeursService.getIndicateurValeursGroupees({
        collectiviteId,
        indicateurIds: segmentatedIndicateursEnfantIds,
      })
    ).indicateurs;

    const sourceAndValeurType =
      segmentation.source && segmentation.valeurType
        ? {
            source: segmentation.source,
            valeurType: segmentation.valeurType,
          }
        : this.getBestSourceAndValeurType(
            indicateursEnfantValeurs,
            segmentation.source,
            segmentation.valeurType
          );
    if (!sourceAndValeurType) {
      return null;
    }

    return {
      type: segmentationType,
      indicateursEnfantValeurs,
      ...sourceAndValeurType,
    };
  }

  async getIndicateurValeursAndChartData(
    args: IndicateurChartInput & {
      collectiviteAvecType?: CollectiviteAvecType;
      personnalisationReponses?: PersonnalisationReponsesPayload;
      chartSize?: { width: number; height: number };
    },
    user?: AuthUser
  ): Promise<{
    indicateurValeurs: IndicateurAvecValeursParSource;
    indicateurSegmentation?: IndicateurChartSegmentationWithValeurs | null;
    valeursMoyenneCollectivites?: ValeursMoyenneDTO | null;
    valeursReference?: ValeursReferenceDTO | null;
    chartData: EChartsOption;
  }> {
    const {
      collectiviteId,
      indicateurId,
      identifiantReferentiel,
      sources,
      collectiviteAvecType,
      personnalisationReponses,
      includeReferenceValeurs,
      includeMoyenne,
      includeSegmentation,
      chartSize,
    } = args;

    if (!indicateurId && !identifiantReferentiel) {
      // TODO: use result
      throw new BadRequestException(
        'Either indicateurId or identifiantReferentiel must be provided'
      );
    }

    const definition = indicateurId
      ? await this.indicateurDefinitionService.getDefinition(indicateurId)
      : await this.indicateurDefinitionService.getDefinitionByIdentifiantReferentiel(
          identifiantReferentiel ?? ''
        );

    // Parallelize all independent queries
    const [
      indicateurValeurs,
      valeursReference,
      valeursMoyenneCollectivites,
      indicateurSegmentation,
    ] = await Promise.all([
      // Always fetch indicateur valeurs
      this.indicateurValeursService
        .getIndicateurValeursGroupees({
          collectiviteId,
          indicateurIds: [definition.id],
          sources: sources?.map((s) => s.sourceId),
        })
        .then((result) => result.indicateurs[0]),
      // Conditionally fetch reference valeurs
      includeReferenceValeurs
        ? this.valeurReferenceService
            .getValeursReference({
              collectiviteId,
              indicateurIds: [definition.id],
              collectiviteAvecType,
              personnalisationReponses,
            })
            .then((result) =>
              result.find((v) => v?.indicateurId === definition.id)
            )
        : Promise.resolve(null),
      // Conditionally fetch moyenne collectivites
      includeMoyenne
        ? this.valeursMoyenneService.getMoyenneCollectivites(
            {
              collectiviteId,
              indicateurId: definition.id,
            },
            user
          )
        : Promise.resolve(null),
      // Conditionally fetch segmentation
      includeSegmentation
        ? this.getIndicateursSegmentationValeurs(
            collectiviteId,
            definition,
            includeSegmentation
          )
        : Promise.resolve(null),
    ]);
    const chartData = this.getChartData({
      indicateurValeurs,
      valeursReference,
      valeursMoyenneCollectivites,
      sourcesFilter: sources,
      segmentation: indicateurSegmentation,
    });

    if (chartSize?.width) {
      this.adjustOptionsWithWidth(chartData, chartSize.width);
    }

    return {
      indicateurValeurs,
      indicateurSegmentation,
      valeursReference,
      valeursMoyenneCollectivites,
      chartData,
    };
  }

  getChartData(args: {
    indicateurValeurs: IndicateurAvecValeursParSource;
    segmentation?: IndicateurChartSegmentationWithValeurs | null;
    sourcesFilter?: IndicateurChartSourceFilter;
    valeursReference?: ValeursReferenceDTO | null;
    valeursMoyenneCollectivites?: ValeursMoyenneDTO | null;
    showReferenceLineLabel?: boolean;
  }): EChartsOption {
    const {
      indicateurValeurs,
      sourcesFilter,
      segmentation,
      valeursReference,
      valeursMoyenneCollectivites,
      showReferenceLineLabel,
    } = args;
    const sources = sourcesFilter
      ? sourcesFilter.map((s) => s.sourceId)
      : Object.keys(indicateurValeurs.sources);

    const valeursDatasetsAndSeries = sources
      .map((sourceId) => {
        const valeurTypes = sourcesFilter?.find((s) => s.sourceId === sourceId)
          ?.valeurTypes ?? [
          IndicateurValeurTypeEnum.RESULTAT,
          IndicateurValeurTypeEnum.OBJECTIF,
        ];
        return valeurTypes.map((valeurType) =>
          this.getIndicateurAvecValeursDatasetSeries(
            indicateurValeurs,
            sourceId,
            valeurType
          )
        );
      })
      .flat()
      .filter((ds) => ds !== null);

    const segmentDatasetsAndSeries =
      segmentation && segmentation.indicateursEnfantValeurs
        ? segmentation.indicateursEnfantValeurs
            .map((indicateur, indicateurIndex) => {
              return this.getIndicateurAvecValeursSegmentationDatasetSeries(
                indicateur,
                indicateurIndex,
                segmentation.source,
                segmentation.valeurType,
                PALETTE_LIGHT
              );
            })
            .filter((ds) => ds !== null)
        : [];

    const referenceDatasetsAndSeries = valeursReference
      ? this.getReferenceDatasetsSeries(
          valeursReference,
          showReferenceLineLabel
        )
      : [];

    const moyenneDatasetsAndSeries = valeursMoyenneCollectivites
      ? this.getLineDatasetSeries(
          indicateurValeurs.definition.id,
          valeursMoyenneCollectivites.valeurs,
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

    const dataset = allDatasetsAndSeries.map((ds) => ds.dataset);
    const series = allDatasetsAndSeries.map((ds) => ds.serie);

    const chartOptions: EChartsOption = {
      dataset,
      series,
      grid: {
        left: 32,
        right: 32,
        top: 80,
        bottom: this.BOTTOM_LEGEND_LINE_HEIGHT * 2,
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
          fontWeight: 500,
          fontSize: 14,
          lineHeight: 20,
        },

        data: makeLegendData(series),
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
          showMinLabel: true,
          showMaxLabel: true,
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
        left: this.TITLE_LEFT_MARGIN,
        text: indicateurValeurs.definition.titre,
        subtext: indicateurValeurs.definition.unite,
        itemGap: indicateurValeurs.definition.titre ? 15 : 0,
        textStyle: {
          color: colors.primary['9'],
          overflow: 'break',
        },
        subtextStyle: {
          color: colors.grey['6'],
          fontWeight: 500,
        },
      },
    };

    return chartOptions;
  }
}
