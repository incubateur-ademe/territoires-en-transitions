import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { makeLegendData } from '@tet/backend/utils/echarts/chart-legend.utils';
import {
  CollectiviteAvecType,
  PersonnalisationReponsesPayload,
} from '@tet/domain/collectivites';
import {
  INDICATEUR_VALEUR_TYPE_LABEL,
  IndicateurAvecValeursParSource,
  IndicateurValeurType,
  IndicateurValeurTypeEnum,
} from '@tet/domain/indicateurs';
import { preset } from '@tet/domain/utils';
import {
  DatasetComponentOption,
  EChartsOption,
  LineSeriesOption,
} from 'echarts/types/dist/echarts';
import { isNil } from 'es-toolkit';
import { DateTime } from 'luxon';
import CrudValeursService from '../valeurs/crud-valeurs.service';
import { ValeursMoyenneDTO } from '../valeurs/valeurs-moyenne.dto';
import ValeursMoyenneService from '../valeurs/valeurs-moyenne.service';
import { ValeursReferenceDTO } from '../valeurs/valeurs-reference.dto';
import ValeursReferenceService from '../valeurs/valeurs-reference.service';
import {
  ChartLineStyle,
  DEFAULT_CHART_LINE_STYLE,
  DEFAULT_CHART_LINE_STYLES_BY_VALEUR_TYPE,
  INDICATEUR_CHART_LINE_STYLES_BY_SOURCE_ID,
} from './indicateur-chart-colors.constants';

const { colors } = preset.theme.extend;

const NumFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

@Injectable()
export class IndicateurChartService {
  private readonly logger = new Logger(IndicateurChartService.name);

  constructor(
    private readonly indicateurValeursService: CrudValeursService,
    private readonly valeurReferenceService: ValeursReferenceService,
    private readonly valeursMoyenneService: ValeursMoyenneService
  ) {}

  private getDatasetLabel(
    type: IndicateurValeurType,
    sourceId: string,
    sourceLabel?: string
  ) {
    const labelValeurType = INDICATEUR_VALEUR_TYPE_LABEL[type];
    switch (sourceId) {
      case 'collectivite':
        return `${labelValeurType} de la collectivité`;
      case 'snbc':
        return `${labelValeurType} SNBC territorialisée`;
      /*case 'moyenne':
        return libelle;*/
      default:
        return `${labelValeurType}${
          sourceId || sourceLabel ? ` ${sourceLabel || sourceId}` : ''
        }`;
    }
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

  getIndicateurAvecValeursDatasetSeries(
    indicateurAvecValeurs: IndicateurAvecValeursParSource,
    sourceId: string,
    valeurType: 'resultat' | 'objectif'
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
      valeurs,
      valeurType,
      sourceId,
      sourceLabel
    );
  }

  getLineDatasetSeries(
    valeurs: { dateValeur: string; valeur: number }[],
    valeurType: IndicateurValeurType,
    sourceId: string,
    sourceLabel?: string
  ): { dataset: DatasetComponentOption; serie: LineSeriesOption } | null {
    const datasetId = `${valeurType}${sourceId ? `-${sourceId}` : ''}`;
    const datasetName = this.getDatasetLabel(valeurType, sourceId, sourceLabel);

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
      //symbol: ds.id === 'trajectoire' ? 'none' : 'circle',
      //symbolSize: ds.id?.toString().startsWith('resultat') ? 8 : 4,
      /*lineStyle: estLignePointillee(ds)
              ? { type: 'dashed', width: 2 }
              : { width: 2 } */
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

  async getIndicateurValeursAndChartData(
    args: {
      collectiviteId: number;
      indicateurId: number;
      collectiviteAvecType?: CollectiviteAvecType;
      personnalisationReponses?: PersonnalisationReponsesPayload;
      includeReferenceValeurs?: boolean;
      includeMoyenne?: boolean;
    },
    user?: AuthUser
  ): Promise<{
    indicateurValeurs: IndicateurAvecValeursParSource;
    valeursMoyenneCollectivites?: ValeursMoyenneDTO | null;
    valeursReference?: ValeursReferenceDTO | null;
    chartData: EChartsOption;
  }> {
    const {
      collectiviteId,
      indicateurId,
      collectiviteAvecType,
      personnalisationReponses,
      includeReferenceValeurs,
      includeMoyenne,
    } = args;

    const indicateurValeurs = await this.indicateurValeursService
      .getIndicateurValeursGroupees({
        collectiviteId,
        indicateurIds: [indicateurId],
      })
      .then((result) => result.indicateurs[0]);

    const valeursReference = includeReferenceValeurs
      ? await this.valeurReferenceService
          .getValeursReference({
            collectiviteId,
            indicateurIds: [indicateurId],
            collectiviteAvecType,
            personnalisationReponses,
          })
          .then((result) =>
            result.find((v) => v?.indicateurId === indicateurId)
          )
      : null;

    const valeursMoyenneCollectivites = includeMoyenne
      ? await this.valeursMoyenneService.getMoyenneCollectivites(
          {
            collectiviteId,
            indicateurId,
          },
          user
        )
      : null;

    const chartData = this.getChartData({
      indicateurValeurs,
      valeursReference,
      valeursMoyenneCollectivites,
    });

    return {
      indicateurValeurs,
      valeursReference,
      valeursMoyenneCollectivites,
      chartData,
    };
  }

  getChartData(args: {
    indicateurValeurs: IndicateurAvecValeursParSource;
    valeursReference?: ValeursReferenceDTO | null;
    valeursMoyenneCollectivites?: ValeursMoyenneDTO | null;
    showReferenceLineLabel?: boolean;
  }): EChartsOption {
    const {
      indicateurValeurs,
      valeursReference,
      valeursMoyenneCollectivites,
      showReferenceLineLabel,
    } = args;
    const sources = Object.keys(indicateurValeurs.sources);

    const valeursDatasetsAndSeries = sources
      .map((sourceId) => {
        return [
          this.getIndicateurAvecValeursDatasetSeries(
            indicateurValeurs,
            sourceId,
            IndicateurValeurTypeEnum.RESULTAT
          ),
          this.getIndicateurAvecValeursDatasetSeries(
            indicateurValeurs,
            sourceId,
            IndicateurValeurTypeEnum.OBJECTIF
          ),
        ];
      })
      .flat()
      .filter((ds) => ds !== null);

    const referenceDatasetsAndSeries = valeursReference
      ? this.getReferenceDatasetsSeries(
          valeursReference,
          showReferenceLineLabel
        )
      : [];

    const moyenneDatasetsAndSeries = valeursMoyenneCollectivites
      ? this.getLineDatasetSeries(
          valeursMoyenneCollectivites.valeurs,
          'moyenne',
          ''
        )
      : null;

    const allDatasetsAndSeries = [
      ...valeursDatasetsAndSeries,
      ...referenceDatasetsAndSeries,
      ...(moyenneDatasetsAndSeries ? [moyenneDatasetsAndSeries] : []),
    ];

    const dataset = allDatasetsAndSeries.map((ds) => ds.dataset);
    const series = allDatasetsAndSeries.map((ds) => ds.serie);

    const chartOptions: EChartsOption = {
      dataset,
      series,
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
        left: 28,
        text: indicateurValeurs.definition.titre,
        subtext: indicateurValeurs.definition.unite,
        itemGap: indicateurValeurs.definition.titre ? 15 : 0,
        textStyle: {
          color: colors.primary['9'],
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
