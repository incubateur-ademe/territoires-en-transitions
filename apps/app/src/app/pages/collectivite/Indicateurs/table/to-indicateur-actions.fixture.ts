import { vi } from 'vitest';
import type { IndicateurActionsValue } from '../detail/context/indicateur-actions.context';

export const toIndicateurActions = (
  overrides: Partial<IndicateurActionsValue> = {}
): IndicateurActionsValue => ({
  updateIndicateur: vi.fn(),
  updateTitre: vi.fn(),
  updateUnite: vi.fn(),
  updateCommentaire: vi.fn(),
  exportIndicateur: vi.fn(),
  deleteIndicateur: vi.fn(),
  saveValeur: vi.fn().mockResolvedValue(undefined),
  declarePeriode: vi.fn().mockResolvedValue(undefined),
  declarePeriodes: vi.fn().mockResolvedValue(undefined),
  deleteValeur: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});
