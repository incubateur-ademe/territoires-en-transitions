import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { makeOption } from './utils';

describe('makeOption', () => {
  const initialTimeZone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'Europe/Paris';
  });

  afterAll(() => {
    if (initialTimeZone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = initialTimeZone;
    }
  });

  it('conserve le calendrier local des graphiques génériques', () => {
    const option = makeOption({ option: {} });
    const tooltip = option.tooltip as {
      axisPointer: {
        label: { formatter: (params: unknown) => string };
      };
    };
    const localNewYear = new Date(2030, 0, 1).getTime();
    expect(new Date(localNewYear).toISOString().startsWith('2029-')).toBe(true);

    expect(
      tooltip.axisPointer.label.formatter({
        axisDimension: 'x',
        value: localNewYear,
      })
    ).toBe('2030');
    expect(option).not.toHaveProperty('useUTC');
  });

  it('applique la stratégie temporelle au graphique et à son curseur', () => {
    const formatter = (value: number) => `période-${value}`;
    const option = makeOption({
      option: {},
      timeAxis: {
        useUTC: true,
        minInterval: 10,
        maxInterval: 20,
        formatter,
      },
    });
    const xAxis = option.xAxis as {
      minInterval: number;
      maxInterval: number;
      axisLabel: { formatter: typeof formatter };
    };
    const tooltip = option.tooltip as {
      axisPointer: {
        label: { formatter: (params: unknown) => string };
      };
    };

    expect(option.useUTC).toBe(true);
    expect(xAxis.minInterval).toBe(10);
    expect(xAxis.maxInterval).toBe(20);
    expect(xAxis.axisLabel.formatter).toBe(formatter);
    expect(
      tooltip.axisPointer.label.formatter({
        axisDimension: 'x',
        value: 123,
      })
    ).toBe('période-123');
  });
});
