import { appLabels } from '@/app/labels/catalog';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDetachSousIndicateur } from './confirm-detach-sous-indicateur';

describe('ConfirmDetachSousIndicateur', () => {
  it('aligne le message à gauche, comme les autres modales de confirmation', () => {
    render(
      <ConfirmDetachSousIndicateur label="Papier" onDismissConfirm={vi.fn()} />
    );

    const message = screen.getByText(
      appLabels.indicateurSousIndicateurDissocierInfo
    );

    expect(message.className).not.toContain('text-center');
  });
});
