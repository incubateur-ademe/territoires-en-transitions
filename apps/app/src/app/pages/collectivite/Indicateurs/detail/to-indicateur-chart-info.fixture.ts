import { vi } from 'vitest';
import type { IndicateurChartInfo } from '../data/use-indicateur-chart';

export const toIndicateurChartInfo = (
  overrides: Partial<IndicateurChartInfo> = {}
): IndicateurChartInfo =>
  ({
    getColorBySourceId: vi.fn(() => '#6a6af4'),
    getSourceLabel: vi.fn(
      (sourceId: string, libelle: string) => `${sourceId} ${libelle}`
    ),
    ...overrides,
  } as IndicateurChartInfo);
