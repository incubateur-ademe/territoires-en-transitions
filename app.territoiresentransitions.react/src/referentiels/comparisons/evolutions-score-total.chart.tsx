import { actionAvancementColors } from '@/app/app/theme';
import { ReactECharts, TOOLBOX_BASE } from '@/app/ui/charts/echarts';
import { ReferentielId } from '@/domain/referentiels';
import {
  SnapshotJalon,
  SnapshotJalonEnum,
} from '@/domain/referentiels/snapshots';
import { roundTo } from '@/domain/utils';
import type { EChartsOption } from 'echarts';
import { theme as importedTheme } from '../../ui/charts/chartsTheme';
import { SnapshotDetails } from '../use-snapshot';
import { sortByDate } from './utils';

const theme = importedTheme;

/**
 * Ensures a snapshot is always displayed in the correct position on the graph according to its date.
 */
const sortSnapshots = (snapshots: SnapshotDetails[], ascending = true) => {
  if (!snapshots?.length) return [];
  return [...snapshots].sort((a, b) => {
    if (a.jalon === 'pre_audit' && b.jalon === 'post_audit') return -1;
    if (a.jalon === 'post_audit' && b.jalon === 'pre_audit') return 1;
    return sortByDate(a.date, b.date, ascending);
  });
};

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

export const isAuditOrEMT = (jalon: SnapshotJalon, snapshotRef: string) => {
  return (
    jalon === SnapshotJalonEnum.PRE_AUDIT ||
    jalon === SnapshotJalonEnum.POST_AUDIT ||
    jalon === SnapshotJalonEnum.LABELLISATION_EMT
  );
};

export const ScoreTotalEvolutionsChart = ({
  snapshots: allSnapshots,
  referentielId,
  chartSize = 'lg',
  isDownloadable = false,
}: {
  snapshots: SnapshotDetails[];
  referentielId: ReferentielId;
  chartSize: 'sm' | 'lg';
  isDownloadable?: boolean;
}) => {
  const snapshots = sortSnapshots(allSnapshots, true);

  const nameLabels = snapshots?.map((snapshot) => {
    if (!snapshot.nom) {
      return 'Sans nom';
    }
    if (isAuditOrEMT(snapshot.jalon, snapshot.ref)) {
      return `\u2605 ${snapshot.nom}`;
    }
    return `${snapshot.nom}`;
  });

  const series = [
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
      data: snapshots?.map((snapshot) =>
        computePercentage(
          snapshot?.pointFait ?? 0,
          snapshot?.pointPotentiel ?? 0
        )
      ),
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
      data: snapshots?.map((snapshot) =>
        computePercentage(
          snapshot?.pointProgramme ?? 0,
          snapshot?.pointPotentiel ?? 0
        )
      ),
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
      data: snapshots?.map((snapshot) =>
        computePercentage(
          snapshot.pointPasFait ?? 0,
          snapshot.pointPotentiel ?? 0
        )
      ),
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
      data: snapshots?.map((snapshot) =>
        computePercentage(
          snapshot.pointNonRenseigne ?? 0,
          snapshot.pointPotentiel ?? 0
        )
      ),
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

        return `${circle}${params.seriesName}: ${params.value}% (${roundTo(
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
        max: 100,
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

const makeScoreSnapshotLabel = (pointFait: number, pointPotentiel: number) => {
  const percentage = roundTo((pointFait / pointPotentiel) * 100, 1);
  return `{percent|${percentage}%}\n${roundTo(pointFait, 1)}/${roundTo(
    pointPotentiel,
    1
  )} pts`;
};

const computePercentage = (point: number, pointPotentiel: number) => {
  return roundTo((point / pointPotentiel) * 100, 1);
};
