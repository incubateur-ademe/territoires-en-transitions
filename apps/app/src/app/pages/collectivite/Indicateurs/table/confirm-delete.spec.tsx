import { render, screen } from '@testing-library/react';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import type { PreparedValue } from '../data/prepare-data';
import { ConfirmDelete } from './confirm-delete';

describe('ConfirmDelete', () => {
  it('nomme explicitement la période mensuelle supprimée', () => {
    const valeur = {
      periode: IndicateurPeriods.parse('mensuelle', '2026-02'),
      periodeLabel: 'février 2026',
      resultat: 12,
      objectif: null,
    } as PreparedValue;

    render(
      <ConfirmDelete unite="t" valeur={valeur} onDismissConfirm={vi.fn()} />
    );

    expect(
      screen.getByText(
        'Attention, les données existantes pour la période février 2026 seront supprimées.'
      )
    ).toBeDefined();
  });
});
