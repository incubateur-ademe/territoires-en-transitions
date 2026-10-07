import { escape as escapeHtml, round } from 'es-toolkit';
import { actionAvancementColors } from '@/app/app/theme';
import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import {
  EChartsOption,
  ReactECharts,
  TOOLBOX_BASE,
} from '@/app/ui/charts/echarts';
import {
  ReferentielId,
  SnapshotJalon,
  SnapshotJalonEnum,
} from '@tet/domain/referentiels';
import type { BarSeriesOption } from 'echarts/charts';
import { theme as importedTheme } from '../../ui/charts/chartsTheme';
import { SnapshotListItem } from '../use-snapshot';
import { hasMixedReferentielVersions } from './has-mixed-referentiel-versions';

const theme = importedTheme;

const sizeConfig = {
  chartSize: {
    sm: { xAxisLabelWidth: 100 },
    lg: { xAxisLabelWidth: 'auto' as const },
  },
} as const;

/**
 * Adjusts the width of the x-axis labels based on the number of snapshots and the size of the chart.
 * The width is fixed for small charts and auto for large charts.
 * @param snapshotsCount - The number of snapshots.
 * @param sizeOptions - The size options.
 * @param chartSize - The size of the chart.
 * @returns The width of the x-axis labels.
 */
const adjustXAxisLabelWidth = (
  snapshotsCount: number,
  sizeOptions: typeof sizeConfig,
  chartSize: 'sm' | 'lg'
) => {
  const SMALL_FIXED_WIDTH = 70;
  const MEDIUM_FIXED_WIDTH = 100;

  if (snapshotsCount > 10) {
    return SMALL_FIXED_WIDTH;
  }
  if (snapshotsCount > 4) {
    return MEDIUM_FIXED_WIDTH;
  }
  return sizeOptions.chartSize[chartSize]?.xAxisLabelWidth;
};

const isAuditOrEMT = (jalon: SnapshotJalon) => {
  return (
    jalon === SnapshotJalonEnum.PRE_AUDIT ||
    jalon === SnapshotJalonEnum.POST_AUDIT ||
    jalon === SnapshotJalonEnum.LABELLISATION_EMT
  );
};

export const ScoreTotalEvolutionsChart = ({
  snapshots: orderedSnapshots,
  referentielId,
  chartSize = 'lg',
  isDownloadable = false,
}: {
  snapshots: SnapshotListItem[];
  referentielId: ReferentielId;
  chartSize: 'sm' | 'lg';
  isDownloadable?: boolean;
}) => {
  const snapshots = [...orderedSnapshots].reverse();
  const showReferentielVersion = hasMixedReferentielVersions(snapshots);

  const nameLabels = snapshots.map((snapshot) => {
    if (!snapshot.nom) {
      return 'Sans nom';
    }
    if (isAuditOrEMT(snapshot.jalon)) {
      return `\u2605 ${snapshot.nom}`;
    }
    return `${snapshot.nom}`;
  });

  const dataFait = snapshots.map((snapshot) =>
    computePercentage(snapshot.pointFait, snapshot.pointPotentiel)
  );
  const dataProgramme = snapshots.map((snapshot) =>
    computePercentage(snapshot.pointProgramme, snapshot.pointPotentiel)
  );
  const dataPasFait = snapshots.map((snapshot) =>
    computePercentage(snapshot.pointPasFait, snapshot.pointPotentiel)
  );
  const dataNonRenseigne = snapshots.map((snapshot) =>
    computePercentage(snapshot.pointNonRenseigne ?? 0, snapshot.pointPotentiel)
  );

  const series: BarSeriesOption[] = [
    {
      name: 'Fait',
      type: 'bar' as const,
      stack: 'total',
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.fait,
      },
      data: dataFait,
    },
    {
      name: 'Programmé',
      type: 'bar' as const,
      stack: 'total',
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.programme,
      },
      data: dataProgramme,
    },
    {
      name: 'Pas fait',
      type: 'bar' as const,
      stack: 'total',
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.pas_fait,
      },
      data: dataPasFait,
    },
    {
      name: 'Non renseigné',
      type: 'bar' as const,
      stack: 'total',
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.non_renseigne,
      },
      data: dataNonRenseigne,
      label: {
        show: true,
        position: 'top' as const,
        distance: 5,
        formatter: (params: any) =>
          makeScoreSnapshotLabel(
            snapshots[params.dataIndex].pointFait,
            snapshots[params.dataIndex].pointPotentiel
          ),
        align: 'center' as const,
        fontWeight: 'normal' as const,
        fontFamily: theme.fontFamily,
        fontSize: 14,
        rich: {
          percent: {
            fontWeight: 'bold' as const,
            fontSize: 14,
          },
        },
      },
    },
  ];

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: any) => {
        const circle = `<span style="display: inline-block; margin-right: 4px; border-radius: 10px; width: 10px; height: 10px; background-color: ${params.color};"></span>`;
        const snapshot = snapshots[params.dataIndex];
        let points = 0;

        switch (params.seriesName) {
          case 'Fait':
            points = snapshot.pointFait;
            break;
          case 'Programmé':
            points = snapshot.pointProgramme;
            break;
          case 'Pas fait':
            points = snapshot.pointPasFait;
            break;
          case 'Non renseigné':
            points = snapshot.pointNonRenseigne ?? 0;
            break;
        }

        return `${circle}${params.seriesName}: ${params.value}% (${round(
          points,
          1
        )} pts)`;
      },
      textStyle: {
        fontFamily: theme.fontFamily,
        color: theme.textColor,
      },
    },
    legend: {
      data: ['Non renseigné', 'Pas fait', 'Programmé', 'Fait'],
      bottom: 0,
      textStyle: {
        color: theme.textColor,
        fontSize: theme?.axis?.legend?.text?.fontSize,
        fontFamily: theme?.axis?.legend?.text?.fontFamily,
      },
    },
    grid: {
      left: '0%',
      right: '0%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category' as const,
        data: nameLabels,
        // Le typage d'echarts ne déclare que `show` sur l'info-bulle d'un axe,
        // mais le libellé survolé lit bien le `formatter` (avec `tickIndex`).
        tooltip: {
          show: true,
          formatter: (params: { tickIndex: number }) =>
            makeSnapshotTooltip(
              snapshots[params.tickIndex],
              showReferentielVersion
            ),
        } as { show: boolean },
        axisLabel: {
          fontFamily: theme.fontFamily,
          color: theme.textColor,
          fontSize: 14,
          padding: [15, 0, 0, 0],
          interval: 0,
          width: adjustXAxisLabelWidth(snapshots.length, sizeConfig, chartSize),
          overflow: 'break',
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
      },
    ],
    yAxis: [
      {
        type: 'value' as const,
        name: '%',
        min: 0,
        // `101` au lieu de `100` théorique pour éviter que echarts fasse disparaître le label
        // lorsque la somme des pourcentages de chaque série qui compose la barre dépasse 100.
        // À cause des arrondis, on a parfois une somme de 100.1% au lieu de 100%.
        max: 101,
        interval: 10,
        axisLabel: {
          formatter: '{value}',
          fontFamily: theme.fontFamily,
        },
        nameTextStyle: {
          fontFamily: theme.fontFamily,
          padding: [0, 0, 0, -30],
        },
      },
    ],
    toolbox: isDownloadable
      ? {
          ...TOOLBOX_BASE,
          top: 1,
          right: 3,
          feature: {
            saveAsImage: {
              ...TOOLBOX_BASE.feature.saveAsImage,
              name: `${referentielId}_referentiel_progression-total`,
            },
          },
        }
      : undefined,
    series,
  };

  return <ReactECharts option={option} style={{ height: 500 }} />;
};

const makeSnapshotTooltip = (
  snapshot: SnapshotListItem,
  showReferentielVersion: boolean
) =>
  [
    `<strong>${escapeHtml(snapshot.nom ?? '')}</strong>`,
    getTextFormattedDate({ date: snapshot.date }),
    snapshot.jalon === SnapshotJalonEnum.DATE_PERSONNALISEE &&
    snapshot.createdByName
      ? appLabels.sauvegardeCreeePar(escapeHtml(snapshot.createdByName))
      : null,
    showReferentielVersion && snapshot.referentielVersion
      ? appLabels.sauvegardeVersionReferentiel(
          escapeHtml(snapshot.referentielVersion)
        )
      : null,
  ]
    .filter(Boolean)
    .join('<br/>');

const computePercentage = (point: number, pointPotentiel: number) => {
  return round((point / pointPotentiel) * 100, 1);
};

const makeScoreSnapshotLabel = (pointFait: number, pointPotentiel: number) => {
  const percentage = computePercentage(pointFait, pointPotentiel);
  return `{percent|${percentage}%}\n${round(pointFait, 1)}/${round(
    pointPotentiel,
    1
  )} pts`;
};
