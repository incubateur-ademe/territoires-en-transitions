import { EChartsOption, PieSeriesOption } from 'echarts';

import { RouterOutput } from '@/api';
import { prioritesToState } from '@/app/app/pages/collectivite/PlansActions/components/BadgePriorite';
import { statutFicheActionToColor } from '@/app/plans/fiches/utils';
import { remToPx } from '@/app/ui/charts/echarts/remToPx';
import {
  CountByPropertyEnumType,
  ficheActionForCountBySchema,
  Priorite,
  Statut,
} from '@/domain/plans';
import { roundTo } from '@/domain/utils';
import { preset } from '@/ui';
import { cloneDeep } from 'es-toolkit';

const getItemColor = (
  countByProperty: CountByPropertyEnumType,
  value: string | number | boolean | null,
  nullColor: string
): string | null => {
  if (!value) {
    return nullColor;
  }

  switch (countByProperty) {
    case 'statut':
      return statutFicheActionToColor[value as Statut];

    case 'priorite': {
      const prioriteState = prioritesToState[value as Priorite];
      return preset.theme.extend.colors[prioriteState][1];
    }

    default:
      return null;
  }
};

type CountByResult =
  RouterOutput['plans']['fiches']['countBy']['countByResult'];

type Args = {
  displayItemsLabel: boolean;
  countByProperty: CountByPropertyEnumType;
  countByTotal: number;
  countByResult?: CountByResult;
  getCursorOnHover?: (args: {
    countByProperty: CountByPropertyEnumType;
    value: string | number | boolean | null;
  }) => 'not-allowed' | 'pointer';
};

export const getChartOption = ({
  getCursorOnHover,
  displayItemsLabel,
  countByProperty,
  countByTotal,
  countByResult,
}: Args): EChartsOption => {
  const { colors, fontSize, fontWeight } = preset.theme.extend;
  const DEFAULT_CURSOR = 'pointer';
  const pieChartData = countByResult
    ? Object.entries(countByResult)
        .map(([, { count, value, label }]) => {
          const itemColor = getItemColor(
            countByProperty,
            value,
            colors.grey[4]
          );

          const cursor = getCursorOnHover
            ? getCursorOnHover({
                countByProperty,
                value,
              })
            : DEFAULT_CURSOR;

          return {
            name: label || `${value}`,
            name_id: value,
            value: count,
            cursor,
            itemStyle: itemColor
              ? {
                  color: itemColor,
                }
              : undefined,
          };
        })
        .filter((item) => item.value)
    : [];

  const pieChartSeries: PieSeriesOption = {
    name:
      ficheActionForCountBySchema.shape[countByProperty].description ||
      countByProperty,
    type: 'pie',
    radius: ['40%', '80%'],
    avoidLabelOverlap: false,
    labelLine: {
      show: false,
    },
    label: {
      show: true,
      fontSize: `${remToPx(fontSize['base'])}px`,
      position: 'inside',
      formatter: '{c}',
    },
    emphasis: {
      label: { show: true },
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
    data: pieChartData,
  };

  const series: PieSeriesOption[] = [];
  if (displayItemsLabel) {
    // A bit a hack, but the way to have two labels: https://github.com/apache/echarts/issues/18383
    const itemlabelSeries: PieSeriesOption = cloneDeep(pieChartSeries);
    delete itemlabelSeries.emphasis;
    itemlabelSeries.label = {
      show: true,
      fontSize: `${remToPx(fontSize['base'])}px`,
      position: 'outside',
    };
    itemlabelSeries.labelLine = {
      show: true,
    };
    itemlabelSeries.avoidLabelOverlap = true;
    series.push(itemlabelSeries);
  }
  series.push(pieChartSeries);

  return {
    tooltip: {
      position: 'bottom',
      trigger: 'item',
      valueFormatter: (value) => {
        if (typeof value === 'number') {
          return `${value} (${roundTo((value / countByTotal) * 100, 0)}%)`;
        }
        return '';
      },
    },
    legend: {
      show: false,
    },
    title: {
      left: 'center',
      top: 'center',
      text: `${countByTotal}`,
      subtext: 'actions',
      itemGap: 0,
      textStyle: {
        color: colors.primary['9'],
        fontWeight: parseInt(fontWeight['bold']),
        fontSize: `${remToPx(fontSize['2xl'])}px`, // Better to set px instead of rem for SSR
      },
      subtextStyle: {
        color: colors.grey['6'],
        fontWeight: parseInt(fontWeight['normal']),
        fontSize: `${remToPx(fontSize['lg'])}px`, // Better to set px instead of rem for SSR
      },
    },
    series: series,
  };
};
