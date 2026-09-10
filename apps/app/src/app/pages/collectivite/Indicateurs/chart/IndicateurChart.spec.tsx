import { render } from '@testing-library/react';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IndicateurChartInfo } from '../data/use-indicateur-chart';
import IndicateurChart from './IndicateurChart';

const { renderChart } = vi.hoisted(() => ({ renderChart: vi.fn() }));

vi.mock('@/app/ui/charts/echarts/ReactECharts', () => ({
  ReactECharts: (props: { option: unknown }) => {
    renderChart(props.option);
    return <div data-testid="echarts" />;
  },
}));

vi.mock('../data/use-indicateur-sources', () => ({
  useGetColorBySourceId: () => () => '#000091',
}));

vi.mock('./use-resize-graph-on-container-size-update', () => ({
  useResizeGraphOnContainerSizeUpdate: vi.fn(),
}));

function makeMonthlyChartInfo(months: number[]): IndicateurChartInfo {
  const periods = months.map((month) =>
    IndicateurPeriods.parse(
      'mensuelle',
      `2026-${String(month).padStart(2, '0')}`
    )
  );
  const preparedSource = {
    source: 'collectivite',
    libelle: '',
    ordreAffichage: -1,
    calculAuto: false,
    metadonnees: [],
    type: 'resultat',
    valeurs: periods.map((period, index) => ({
      id: index + 1,
      calculAuto: false,
      periode: period,
      periodeLabel: `mois ${months[index]}`,
      dateValeurISO: `${IndicateurPeriods.toDateValeur(period)}T00:00:00.000Z`,
      valeur: (index + 1) * 12,
      commentaire: null,
    })),
  };
  const emptyPreparedData = {
    indicateurId: 1,
    dernierePeriodeModePrive: undefined,
    periodes: periods,
    sources: [],
    donneesCollectivite: undefined,
    valeursExistantes: [],
  };
  return {
    data: {
      unite: 't',
      periodicite: 'mensuelle',
      valeurs: {
        resultats: {
          ...emptyPreparedData,
          sources: [preparedSource],
          donneesCollectivite: preparedSource,
        },
        objectifs: emptyPreparedData,
        segments: [],
      },
    },
    segmentItemParId: new Map(),
    sourceFilter: { valeursReference: undefined },
  } as unknown as IndicateurChartInfo;
}

describe('IndicateurChart', () => {
  beforeEach(() => renderChart.mockReset());

  it('propage la périodicité mensuelle jusqu’à l’axe ECharts', () => {
    const chartInfo = makeMonthlyChartInfo([2]);

    render(
      <IndicateurChart
        chartInfo={chartInfo}
        isLoading={false}
        variant="detail"
      />
    );

    expect(renderChart).toHaveBeenCalledOnce();
    const option = renderChart.mock.calls[0][0] as {
      useUTC: boolean;
      dataset: Array<{ source: Array<{ dateValeurISO: string }> }>;
      xAxis: { axisLabel: { formatter: (value: number) => string } };
    };
    expect(option.useUTC).toBe(true);
    expect(option.dataset[0].source).toEqual([
      { dateValeurISO: '2026-02-01T00:00:00.000Z', valeur: 12 },
    ]);
    expect(option.xAxis.axisLabel.formatter(Date.UTC(2026, 1, 1))).toBe(
      'février 2026'
    );
  });

  it.each(['detail', 'modal', 'thumbnail'] as const)(
    'keeps every monthly point with annual ticks in the %s chart',
    (variant) => {
      const chartInfo = makeMonthlyChartInfo(
        Array.from({ length: 12 }, (_, month) => month + 1)
      );
      chartInfo.periodiciteAffichage = 'annuelle';
      const originalValues = structuredClone(chartInfo.data);

      render(
        <IndicateurChart
          chartInfo={chartInfo}
          isLoading={false}
          variant={variant}
        />
      );

      const option = renderChart.mock.calls[0][0] as {
        dataset: Array<{
          source: Array<{ dateValeurISO: string; valeur: number }>;
        }>;
        xAxis: {
          minInterval: number;
          axisLabel: { formatter: (value: number) => string };
        };
        tooltip: {
          axisPointer: {
            label: { formatter: (params: unknown) => string };
          };
        };
      };
      expect(option.dataset[0].source).toEqual(
        originalValues.valeurs.resultats.sources[0].valeurs.map(
          ({ dateValeurISO, valeur }) => ({ dateValeurISO, valeur })
        )
      );
      expect(option.dataset[0].source).toHaveLength(12);
      expect(option.xAxis.axisLabel.formatter(Date.UTC(2026, 1, 1))).toBe(
        '2026'
      );
      expect(option.xAxis.minInterval).toBeGreaterThan(
        300 * 24 * 60 * 60 * 1000
      );
      expect(
        option.tooltip.axisPointer.label.formatter({
          axisDimension: 'x',
          value: Date.UTC(2026, 1, 1),
        })
      ).toBe('février 2026');
      expect(chartInfo.data).toEqual(originalValues);
    }
  );
});
