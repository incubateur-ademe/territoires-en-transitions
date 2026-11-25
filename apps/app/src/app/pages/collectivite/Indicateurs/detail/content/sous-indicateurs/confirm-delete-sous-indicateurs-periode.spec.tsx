import { appLabels } from '@/app/labels/catalog';
import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDeleteSousIndicateursPeriode } from './confirm-delete-sous-indicateurs-periode';

describe('ConfirmDeleteSousIndicateursPeriode', () => {
  it('aligne le message à gauche, comme les autres modales de confirmation', () => {
    const periode = IndicateurPeriodes.fromYear(2022);
    render(
      <ConfirmDeleteSousIndicateursPeriode
        periode={periode}
        onDismissConfirm={vi.fn()}
      />
    );

    const message = screen.getByText(
      appLabels.indicateurSuppressionPeriodeAttention(
        IndicateurPeriodes.format(periode)
      )
    );

    expect(message.className).not.toContain('text-center');
  });
});
