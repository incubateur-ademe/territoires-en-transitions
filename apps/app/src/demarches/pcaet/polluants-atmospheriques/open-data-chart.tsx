'use client';

import { ReactECharts } from '@/app/ui/charts/echarts/ReactECharts';
import { Accordion, preset } from '@tet/ui';
import { useMemo } from 'react';
import { GridRow } from './grid-model';

type Props = {
  rows: GridRow[];
  years: number[];
  openDataAvailableCount: number;
};

export const OpenDataChart = ({
  rows,
  years,
  openDataAvailableCount,
}: Props) => {
  if (openDataAvailableCount === 0) return null;

  const { series, pollutantLabels } = useMemo(() => {
    const colors = preset.theme.extend.colors;

    // Un groupe de séries par année
    const seriesByYear = years
      .map((year, yearIdx) => {
        const data = rows.map((row) => {
          const cell = row.cells.find((c) => c.year === year);
          return cell?.proposal ?? null;
        });

        const hasData = data.some((v) => v !== null);
        if (!hasData) return null;

        return {
          name: String(year),
          type: 'bar' as const,
          data,
          barMaxWidth: 20,
          itemStyle: {
            color:
              Object.values(colors.primary)[
                (yearIdx + 3) % Object.values(colors.primary).length
              ] ?? colors.primary[7],
            borderRadius: [2, 2, 0, 0],
          },
        };
      })
      .filter(Boolean);

    const pollutantLabels = rows.map(
      (r) => `${r.sectorLabel} — ${r.pollutantLabel}`
    );

    return { series: seriesByYear, pollutantLabels };
  }, [rows, years]);

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      valueFormatter: (v: number | null) =>
        v !== null ? `${v.toLocaleString('fr-FR')} kt` : '—',
    },
    legend: {
      top: 0,
      left: 'center',
      textStyle: { fontSize: 11 },
    },
    grid: { top: 36, bottom: 80, left: 16, right: 16, containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: pollutantLabels,
      axisLabel: {
        interval: 0,
        rotate: 35,
        fontSize: 10,
        overflow: 'truncate',
        width: 120,
      },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        fontSize: 10,
        formatter: (v: number) =>
          v >= 1000 ? `${(v / 1000).toLocaleString('fr-FR')}k` : String(v),
      },
    },
    series,
  };

  return (
    <Accordion
      title="Voir le graphique de données"
      icon="bar-chart-2-line"
      containerClassname="border border-primary-3 rounded-xl bg-primary-1/30 overflow-hidden"
      headerClassname="px-4 py-3 text-sm font-medium text-primary-9 hover:bg-primary-1"
      content={
        <div className="px-4 pb-4">
          <p className="text-xs text-grey-6 mb-3 mt-1">
            Ces valeurs sont issues des données nationales open data et peuvent
            pré-remplir les cellules vides de votre grille.
          </p>
          <ReactECharts option={option} style={{ height: 320 }} />
        </div>
      }
    />
  );
};
