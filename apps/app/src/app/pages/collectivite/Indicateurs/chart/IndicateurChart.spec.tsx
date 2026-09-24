import { act, render } from '@testing-library/react';
import {
  IndicateurPeriods,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareData } from '../data/prepare-data';
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

function makeMonthlyChartInfo(
  months: number[],
  periodiciteAffichage: IndicateurPeriodicite = 'mensuelle'
): IndicateurChartInfo {
  const periods = months.map((month) =>
    IndicateurPeriods.parse(
      'mensuelle',
      `2026-${String(month).padStart(2, '0')}`
    )
  );
  const resultats = prepareData(
    {
      definition: { id: 1, periodicite: 'mensuelle' },
      sources: {
        collectivite: {
          source: 'collectivite',
          libelle: '',
          ordreAffichage: -1,
          metadonnees: [],
          valeurs: periods.map((period, index) => ({
            id: index + 1,
            periodicite: 'mensuelle',
            dateValeur: period.dateDebut,
            resultat: (index + 1) * 12,
          })),
        },
      },
    } as unknown as NonNullable<Parameters<typeof prepareData>[0]>,
    'resultat',
    true,
    [],
    { periodiciteAffichage, aggregationResultat: 'somme' }
  );
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
        resultats,
        objectifs: emptyPreparedData,
        segments: [],
      },
    },
    periodiciteAffichage,
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
    'displays the annual sum in the %s chart',
    (variant) => {
      const chartInfo = makeMonthlyChartInfo(
        Array.from({ length: 12 }, (_, month) => month + 1),
        'annuelle'
      );
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
      expect(option.dataset[0].source).toEqual([
        { dateValeurISO: '2026-01-01T00:00:00.000Z', valeur: 936 },
      ]);
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
      ).toBe('2026');
      expect(chartInfo.data).toEqual(originalValues);
    }
  );
  it('distingue les versions d’une même source dans la légende et ses infobulles', () => {
    const chartInfo = makeMonthlyChartInfo([2]);
    const source = chartInfo.data.valeurs.resultats.sources[0];
    chartInfo.data.valeurs.resultats.sources = [2024, 2025].map((year) => ({
      ...source,
      source: 'external',
      seriesKey: `external:mensuelle:${year}`,
      periodiciteSource: 'mensuelle',
      libelle: 'Données externes',
      metadonnees: [
        {
          id: year,
          sourceId: 'external',
          dateVersion: `${year}-01-01`,
          nomDonnees: 'Relevés',
          diffuseur: null,
          producteur: null,
          methodologie: null,
          limites: null,
        },
      ],
    }));
    render(<IndicateurChart chartInfo={chartInfo} isLoading={false} />);
    const option = renderChart.mock.calls[0][0] as {
      dataset: Array<{ name: string }>;
      legend: { tooltip: { formatter: (params: { name: string }) => string } };
    };
    expect(new Set(option.dataset.map(({ name }) => name)).size).toBe(2);
    act(() => {
      expect(
        option.legend.tooltip.formatter({ name: option.dataset[0].name })
      ).toContain('2024');
      expect(
        option.legend.tooltip.formatter({ name: option.dataset[1].name })
      ).toContain('2025');
    });
  });
});
