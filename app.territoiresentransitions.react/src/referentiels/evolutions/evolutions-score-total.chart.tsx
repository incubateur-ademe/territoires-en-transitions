import { ReactECharts } from '@/app/ui/charts/echarts';
import type { EChartsOption } from 'echarts';
import { actionAvancementColors } from '@/app/app/theme';
import { SnapshotDetails } from '../use-snapshot';
import { sortByDate } from './utils';
import { theme as importedTheme } from '../../ui/charts/chartsTheme';

const ScoreTotalEvolutionsChart = ({
  allSnapshots,
  chartSize = 'lg',
}: {
  allSnapshots: SnapshotDetails[];
  chartSize: 'sm' | 'lg';
}) => {
  /**
   * Ensures a snapshot is always displayed in the correct position on the graph according to its date.
   */
  const sortSnapshots = (snapshots: SnapshotDetails[], ascending = true) => {
    if (!snapshots?.length) return [];
    return [...snapshots].sort((a, b) => sortByDate(a.date, b.date, ascending));
  };

  const snapshots = sortSnapshots(allSnapshots, true);

  const nameLabels = snapshots?.map((snapshot) => {
    if (!snapshot.nom) {
      return 'Sans nom';
    }
    return `${snapshot.nom}`;
  });

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
        computePercentage(snapshot.pointPasFait, snapshot.pointPotentiel)
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

        return `${circle}${params.seriesName}: ${
          params.value
        }% (${troncateIfZero(points.toFixed(1))} pts)`;
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
      left: '3%',
      right: '4%',
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
    series,
  };

  return (
    <div className="flex flex-col">
      <ReactECharts option={option} style={{ height: 500 }} />
    </div>
  );
};
export default ScoreTotalEvolutionsChart;

const makeScoreSnapshotLabel = (pointFait: number, pointPotentiel: number) => {
  const percentage = troncateIfZero(
    computePercentage(pointFait, pointPotentiel)
  );
  return `{percent|${percentage}%} ${troncateIfZero(
    pointFait.toFixed(1)
  )}/${troncateIfZero(pointPotentiel.toFixed(1))} pts`;
};

const computePercentage = (point: number, pointPotentiel: number) => {
  return ((point / pointPotentiel) * 100).toFixed(1);
};

const troncateIfZero = (value: string) => {
  return value.endsWith('.0') ? value.slice(0, -2) : value;
};
