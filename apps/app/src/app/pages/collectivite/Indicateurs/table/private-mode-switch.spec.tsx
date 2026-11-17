import { fireEvent, render, screen } from '@testing-library/react';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import type { IndicateurChartInfo } from '../data/use-indicateur-chart';
import {
  IndicateurActionsProvider,
  type IndicateurActionsValue,
} from '../detail/indicateur-actions.context';
import { IndicateurDataProvider } from '../detail/indicateur-data.context';
import { PrivateModeSwitch } from './private-mode-switch';

const indicateur = { id: 1, estConfidentiel: false } as IndicateurDetaille;
const chartInfo = {} as IndicateurChartInfo;

describe('PrivateModeSwitch', () => {
  it('lit l’indicateur et délègue la mise à jour au contexte d’actions injecté', () => {
    const updateIndicateur = vi.fn();
    const actions = { updateIndicateur } as unknown as IndicateurActionsValue;

    render(
      <IndicateurDataProvider
        value={{
          indicateur,
          chartInfo,
          canMutateIndicateur: true,
          canMutateValeur: true,
        }}
      >
        <IndicateurActionsProvider value={actions}>
          <PrivateModeSwitch />
        </IndicateurActionsProvider>
      </IndicateurDataProvider>
    );
    fireEvent.click(screen.getByRole('checkbox'));

    expect(updateIndicateur).toHaveBeenCalledWith({ estConfidentiel: true });
  });
});
