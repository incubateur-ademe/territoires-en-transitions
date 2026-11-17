import { fireEvent, render, screen } from '@testing-library/react';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurDefinitionProvider } from '../detail/indicateur-definition.context';
import { PrivateModeSwitch } from './private-mode-switch';

const indicateur = { id: 1, estConfidentiel: false } as IndicateurDetaille;

describe('PrivateModeSwitch', () => {
  it('lit l’indicateur et délègue la mise à jour au contexte de définition injecté', () => {
    const updateIndicateur = vi.fn();

    render(
      <IndicateurDefinitionProvider
        value={{
          indicateur,
          updateIndicateur,
          canMutateIndicateur: true,
          canMutateValeur: true,
        }}
      >
        <PrivateModeSwitch />
      </IndicateurDefinitionProvider>
    );
    fireEvent.click(screen.getByRole('checkbox'));

    expect(updateIndicateur).toHaveBeenCalledWith({ estConfidentiel: true });
  });
});
