import { preset } from '@/backend/notifications/templates/components/preset';
import { makeLegendData } from '@/backend/utils/echarts/chart-legend.utils';
import { Injectable } from '@nestjs/common';
import {
  DatasetComponentOption,
  EChartsOption,
  LineSeriesOption,
} from 'echarts/types/dist/echarts';
import { isNil } from 'es-toolkit';
import {
  INDICATEUR_VALEUR_TYPE_LABEL,
  IndicateurValeurEnum,
  IndicateurValeurType,
} from '../shared/models/indicateur-valeur-type.enum';
import { IndicateurAvecValeursParSource } from '../valeurs/indicateur-valeur.table';
import { COLLECTIVITE_SOURCE_ID } from '../valeurs/valeurs.constants';
import {
  DEFAULT_CHART_LINE_STYLE,
  INDICATEUR_CHART_COLORS,
} from './indicateur-chart-colors.constants';

const { colors } = preset.theme.extend;

const NumFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

@Injectable()
export class IndicateurChartService {
  constructor() {}

  private getSourceLabel(
    sourceId: string,
    libelle: string,
    type: IndicateurValeurType
  ) {
    const label = INDICATEUR_VALEUR_TYPE_LABEL[type];
    switch (sourceId) {
      case 'collectivite':
        return `${label} de la collectivité`;
      case 'snbc':
        return `${label} SNBC territorialisée`;
      case 'moyenne':
        return libelle;
      default:
        return `${label} ${libelle}`;
    }
  }

  async getChartData(indicateurAvecValeurs: IndicateurAvecValeursParSource) {
    // TODO: transpose code from useIndicateurChartInfo

    //color: getColorBySourceId(source, type),
    const sourceId = COLLECTIVITE_SOURCE_ID;
    const valeurType = IndicateurValeurEnum.RESULTAT;
    const source = indicateurAvecValeurs.sources[sourceId];

    const datasetId = `${valeurType}-${sourceId}`;
    const datasetName = this.getSourceLabel(
      sourceId,
      source.metadonnees?.length
        ? source.metadonnees?.[0]?.producteur || source.libelle
        : source.libelle,
      valeurType
    );
    const dataset: DatasetComponentOption[] = [
      {
        id: datasetId,
        name: datasetName,
        source: source.valeurs
          .map((valeur) => {
            if (isNil(valeur[valeurType])) {
              return null;
            }

            const annee = new Date(valeur.dateValeur).getFullYear();

            return {
              date: valeur.dateValeur,
              annee,
              valeur: valeur[valeurType],
            };
          })
          .filter((v) => v !== null),
        dimensions: ['date', 'valeur'],
      },
    ];
    const lineStyle = {
      ...DEFAULT_CHART_LINE_STYLE,
      ...(INDICATEUR_CHART_COLORS[sourceId]?.[valeurType] || {}),
    };

    const series: LineSeriesOption[] = [
      {
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
      },
    ];

    const chartOptions: EChartsOption = {
      textStyle: {
        fontFamily: '"Marianne", arial, sans-serif',
      },
      grid: {
        left: 32,
        right: 32,
        bottom: 80,
        containLabel: true,
      },
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
        text: indicateurAvecValeurs.definition.titre,
        subtext: indicateurAvecValeurs.definition.unite,
        itemGap: indicateurAvecValeurs.definition.titre ? 15 : 0,
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
