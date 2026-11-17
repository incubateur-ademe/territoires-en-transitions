import { fireEvent, render, screen } from '@testing-library/react';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurActionsProvider } from '../detail/indicateur-actions.context';
import { IndicateurDataProvider } from '../detail/indicateur-data.context';
import { toIndicateurActions } from '../detail/to-indicateur-actions.fixture';
import { PrivateModeSwitch } from './private-mode-switch';

const indicateur = { id: 1, estConfidentiel: false } as IndicateurDetaille;

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
        <IndicateurActionsProvider
          value={toIndicateurActions({ updateIndicateur })}
        >
          <PrivateModeSwitch />
        </IndicateurActionsProvider>
      </IndicateurDataProvider>
    );
    fireEvent.click(screen.getByRole('checkbox'));

    expect(updateIndicateur).toHaveBeenCalledWith({ estConfidentiel: true });
  });
});
