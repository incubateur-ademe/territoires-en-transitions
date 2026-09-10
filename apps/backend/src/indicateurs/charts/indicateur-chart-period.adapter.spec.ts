import { describe, expect, it } from 'vitest';
import { getIndicateurChartPeriodAdapter } from './indicateur-chart-period.adapter';

describe('getIndicateurChartPeriodAdapter', () => {
  it('délègue le libellé calendaire annuel au domaine', () => {
    const adapter = getIndicateurChartPeriodAdapter('annuelle');

    expect(adapter.formatTick(Date.UTC(2026, 8, 15))).toBe('2026');
    expect(adapter.useUTC).toBe(true);
    expect(adapter.minInterval).toBe(365 * 24 * 60 * 60 * 1000);
    expect(adapter.maxInterval).toBe(5 * 365 * 24 * 60 * 60 * 1000);
  });

  it('délègue le libellé calendaire mensuel au domaine en UTC', () => {
    const adapter = getIndicateurChartPeriodAdapter('mensuelle');

    expect(adapter.formatTick(Date.UTC(2026, 1, 15))).toBe('février 2026');
    expect(adapter.useUTC).toBe(true);
    expect(adapter.minInterval).toBe(28 * 24 * 60 * 60 * 1000);
    expect(adapter.maxInterval).toBe(365 * 24 * 60 * 60 * 1000);
  });

  it("refuse une valeur d'axe invalide", () => {
    const adapter = getIndicateurChartPeriodAdapter('mensuelle');

    expect(() => adapter.formatTick('not-a-date')).toThrow(
      /axe temporel invalide/
    );
  });
});
