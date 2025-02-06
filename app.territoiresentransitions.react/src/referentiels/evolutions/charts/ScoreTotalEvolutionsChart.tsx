import { ReactECharts } from '@/app/ui/charts/echarts';
import type { EChartsOption } from 'echarts';
import { actionAvancementColors } from '@/app/app/theme';
import { SnapshotDetails } from '../../use-snapshot';
import { sortByDate } from '../utils';
import { theme as importedTheme } from '../../../ui/charts/chartsTheme';

const ScoreTotalEvolutionsChart = ({
  allSnapshots,
}: {
  allSnapshots: SnapshotDetails[];
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
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const,
      },
      formatter: (params: any) => {
        return params
          .map((param: any) => {
            const circle = `<span style="display: inline-block; margin-right: 4px; border-radius: 10px; width: 10px; height: 10px; background-color: ${param.color};"></span>`;
            return `${circle}${param.seriesName}: ${param.value}%`;
          })
          .join('<br/>');
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
          interval: 0, // needed to avoid overlapping labels in synthèse de l'état des lieux view (which is small)
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
