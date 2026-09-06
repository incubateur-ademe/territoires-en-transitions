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

describe('IndicateurChart', () => {
  beforeEach(() => renderChart.mockReset());

  it('propage la périodicité mensuelle jusqu’à l’axe ECharts', () => {
    const period = IndicateurPeriods.parse('mensuelle', '2026-02');
    const preparedSource = {
      source: 'collectivite',
      libelle: '',
      ordreAffichage: -1,
      calculAuto: false,
      metadonnees: [],
      type: 'resultat',
      valeurs: [
        {
          id: 1,
          calculAuto: false,
          periode: period,
          periodeLabel: 'février 2026',
          dateValeurISO: '2026-02-01T00:00:00.000Z',
          valeur: 12,
          commentaire: null,
        },
      ],
    };
    const emptyPreparedData = {
      indicateurId: 1,
      dernierePeriodeModePrive: undefined,
      periodes: [period],
      sources: [],
      donneesCollectivite: undefined,
      valeursExistantes: [],
    };
    const chartInfo = {
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
});
