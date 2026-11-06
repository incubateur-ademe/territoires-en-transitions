'use client';

import { getFormattedNumber } from '@tet/domain/utils';
import { PieChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useRef } from 'react';
import { defaultColors } from './chartsTheme';

echarts.use([PieChart, TooltipComponent, LabelLayout, CanvasRenderer]);

const FONT_FAMILY = '"Marianne", arial, sans-serif';
const TEXT_COLOR = '#2A2A62';

/**
 * Conversion d'une valeur en %
 */
const getPercentage = (value: number, data: number[]) => {
  const percentage = value / data.reduce((sum, curVal) => sum + curVal, 0);
  if (percentage < 0.01) {
    return Math.round(percentage * 10000) / 100;
  } else {
    return Math.round(percentage * 100);
  }
};

/**
 * Formattage de la valeur
 */
const getAbsolute = (value: number, decimals: number) => {
  return getFormattedNumber(
    Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
  );
};

/**
 * Construction de la tooltip (en éléments DOM : les libellés viennent du CMS)
 */
const buildTooltip = ({
  name,
  value,
  color,
  values,
  unit,
  unitSingular,
  decimals,
  onlyDisplayPercentageValue,
}: {
  name: string;
  value: number;
  color: string;
  values: number[];
  unit: string;
  unitSingular: boolean;
  decimals: number;
  onlyDisplayPercentageValue: boolean;
}) => {
  const percentage = `${getPercentage(value, values)} %`;
  const absolute = `${getAbsolute(
    value,
    value < 1 ? Math.max(decimals, 2) : decimals
  )} ${unit}${!!unit && value > 1 && !unitSingular ? 's' : ''}`;

  const container = document.createElement('div');
  container.style.cssText = `display:flex;align-items:center;font-family:${FONT_FAMILY};font-size:14px;`;

  const pastille = document.createElement('div');
  pastille.style.cssText = `background-color:${color};width:12px;height:12px;margin-right:7px;`;

  const label = document.createElement('span');
  label.textContent = `${name} : `;
  const strong = document.createElement('strong');
  strong.textContent = onlyDisplayPercentageValue
    ? percentage
    : `${absolute} (${percentage})`;
  label.appendChild(strong);

  container.append(pastille, label);
  return container;
};

export type DonutChartProps = {
  data: {
    id: string;
    value: number;
    color?: string;
  }[];
  customColors?: string[];
  unit?: string;
  unitSingular?: boolean;
  decimals?: number;
  customMargin?: { top: number; right: number; bottom: number; left: number };
  zoomEffect?: boolean;
  onlyDisplayPercentageValue?: boolean;
  /** Arcs dessinés dans le sens anti-horaire */
  invertedDisplay?: boolean;
  /** Angle de départ en degrés, 0 = midi, sens horaire */
  startAngle?: number;
  spaceBetweenPads?: boolean;
  /** Angle minimal (en degrés) d'un arc pour afficher son libellé */
  arcLinkLabelsSkipAngle?: number;
  arcLinkLabelsThickness?: number;
};

/**
 * Graphe donut (ECharts)
 */
const DonutChart = ({
  data,
  customColors,
  unit = '',
  unitSingular = false,
  decimals = 1,
  customMargin = { top: 40, right: 40, bottom: 40, left: 40 },
  zoomEffect = true,
  onlyDisplayPercentageValue = false,
  invertedDisplay = false,
  startAngle = 0,
  spaceBetweenPads = false,
  arcLinkLabelsSkipAngle = 40,
  arcLinkLabelsThickness = 1,
}: DonutChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts>(null);

  // Initialisation, redimensionnement et nettoyage du graphe
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const colors = customColors ?? defaultColors;
    const localData = data.map((d, index) => ({
      ...d,
      color: d.color ?? colors[index % colors.length],
    }));
    const values = localData.map((d) => d.value);

    chartRef.current?.setOption(
      {
        textStyle: { fontFamily: FONT_FAMILY },
        tooltip: {
          trigger: 'item',
          formatter: (params: unknown) => {
            const { name, value, color } = params as {
              name: string;
              value: number;
              color: string;
            };
            return buildTooltip({
              name,
              value,
              color,
              values,
              unit,
              unitSingular,
              decimals,
              onlyDisplayPercentageValue,
            });
          },
        },
        series: [
          {
            type: 'pie',
            ...customMargin,
            radius: ['60%', '100%'],
            // ECharts : 90° = midi, sens anti-horaire
            startAngle: 90 - startAngle,
            clockwise: !invertedDisplay,
            padAngle: spaceBetweenPads ? 0.5 : 0,
            itemStyle: { borderRadius: spaceBetweenPads ? 7 : 0 },
            emphasis: { scale: zoomEffect, scaleSize: 8 },
            minShowLabelAngle: arcLinkLabelsSkipAngle,
            label: {
              position: 'outside',
              formatter: '{b}',
              color: TEXT_COLOR,
              fontSize: 12,
            },
            labelLine: {
              length: 10,
              length2: 10,
              lineStyle: { width: arcLinkLabelsThickness },
            },
            labelLayout: { hideOverlap: true },
            data: localData.map((d) => ({
              name: d.id,
              value: d.value,
              itemStyle: { color: d.color },
            })),
          },
        ],
      },
      { notMerge: true }
    );
  }, [
    data,
    customColors,
    unit,
    unitSingular,
    decimals,
    customMargin,
    zoomEffect,
    onlyDisplayPercentageValue,
    invertedDisplay,
    startAngle,
    spaceBetweenPads,
    arcLinkLabelsSkipAngle,
    arcLinkLabelsThickness,
  ]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default DonutChart;
