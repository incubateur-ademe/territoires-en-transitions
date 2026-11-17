import { fireEvent, render, screen } from '@testing-library/react';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import {
  IndicateurActionsProvider,
  type IndicateurActionsValue,
} from '../detail/indicateur-actions.context';
import { IndicateurDataProvider } from '../detail/indicateur-data.context';
import { PrivateModeSwitch } from './private-mode-switch';

const indicateur = { id: 1, estConfidentiel: false } as IndicateurDetaille;

const toActions = (
  overrides: Partial<IndicateurActionsValue>
): IndicateurActionsValue => ({
  updateIndicateur: vi.fn(),
  exportIndicateur: vi.fn(),
  deleteIndicateur: vi.fn(),
  saveValeur: vi.fn().mockResolvedValue(undefined),
  declarePeriode: vi.fn().mockResolvedValue(undefined),
  declarePeriodes: vi.fn().mockResolvedValue(undefined),
  deleteValeur: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('PrivateModeSwitch', () => {
  it('lit l’indicateur et délègue la mise à jour au contexte d’actions injecté', () => {
    const updateIndicateur = vi.fn();

    render(
      <IndicateurDataProvider
        value={{
          indicateur,
          canMutateIndicateur: true,
          canMutateValeur: true,
        }}
      >
        <IndicateurActionsProvider value={toActions({ updateIndicateur })}>
          <PrivateModeSwitch />
        </IndicateurActionsProvider>
      </IndicateurDataProvider>
    );
    fireEvent.click(screen.getByRole('checkbox'));

    expect(updateIndicateur).toHaveBeenCalledWith({ estConfidentiel: true });
  });
});
