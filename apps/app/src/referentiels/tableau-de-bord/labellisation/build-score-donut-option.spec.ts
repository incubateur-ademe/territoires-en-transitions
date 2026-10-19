// @vitest-environment node
import * as echarts from 'echarts';
import { describe, expect, it } from 'vitest';
import { buildScoreDonutOption } from './build-score-donut-option';

const createParams = (value: number) => ({
  componentType: 'series',
  componentSubType: 'pie',
  componentIndex: 0,
  seriesType: 'pie',
  seriesIndex: 0,
  name: 'Fait',
  dataIndex: 0,
  data: { name: 'Fait', value },
  value,
  marker: '<span></span>',
  percent: 100,
  $vars: [],
});

describe('buildScoreDonutOption', () => {
  it.each([
    { values: [37.4, 6.3, 56.3], expected: [37.4, 6.3, 56.3] },
    { values: [37.44, 6.33, 56.23], expected: [37.4, 6.3, 56.2] },
  ])(
    'arrondit chaque score indépendamment pour $values',
    ({ values, expected }) => {
      const option = buildScoreDonutOption({
        array: values.map((value, index) => ({ id: `${index}`, value })),
        max_personnalise: 100,
      });
      const chart = echarts.init(null, undefined, {
        renderer: 'svg',
        ssr: true,
        width: 256,
        height: 256,
      });

      try {
        chart.setOption(option);
        const svg = chart.renderToSVGString();

        for (const label of expected) {
          expect(svg).toContain(`>${label.toLocaleString()}%</text>`);
        }
      } finally {
        chart.dispose();
      }
    }
  );

  it('utilise le potentiel personnalisé pour les libellés et les infobulles', () => {
    const option = buildScoreDonutOption({
      array: [{ id: 'Fait', value: 149.76 }],
      max_personnalise: 400,
    });
    const params = createParams(149.76);

    expect(option.series[0].label.formatter(params)).toMatch(/^37[.,]4%$/);
    expect(option.tooltip.formatter(params)).toMatch(/\(37[.,]4%\)/);
  });

  it('affiche zéro lorsque le potentiel est nul', () => {
    const option = buildScoreDonutOption({ array: [], max_personnalise: 0 });

    const params = createParams(0);

    expect(option.series[0].label.formatter(params)).toBe('0%');
    expect(option.tooltip.formatter(params)).toContain('(0%)');
  });
});
