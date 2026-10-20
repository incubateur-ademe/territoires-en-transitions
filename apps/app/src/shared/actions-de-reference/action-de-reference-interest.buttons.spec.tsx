import { appLabels } from '@/app/labels/catalog';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionDeReferenceInterestButtons } from './action-de-reference-interest.buttons';

afterEach(cleanup);

describe('ActionDeReferenceInterestButtons', () => {
  it('une action disponible propose « Sauvegarder »', () => {
    render(
      <ActionDeReferenceInterestButtons
        interest={{
          status: 'disponible',
          onToggleSaved: vi.fn(),
          onDismiss: vi.fn(),
        }}
      />
    );

    expect(
      screen.getByRole('button', {
        name: appLabels.actionDeReferenceSauvegarder,
      })
    ).toBeTruthy();
  });

  it('une action disponible a son bouton « Sauvegarder » relâché', () => {
    render(
      <ActionDeReferenceInterestButtons
        interest={{
          status: 'disponible',
          onToggleSaved: vi.fn(),
          onDismiss: vi.fn(),
        }}
      />
    );

    expect(
      screen.getByRole('button', {
        name: appLabels.actionDeReferenceSauvegarder,
        pressed: false,
      })
    ).toBeTruthy();
  });

  it('une action sauvegardée garde « Sauvegarder », enfoncé', () => {
    render(
      <ActionDeReferenceInterestButtons
        interest={{
          status: 'preselectionnee',
          onToggleSaved: vi.fn(),
          onDismiss: vi.fn(),
        }}
      />
    );

    expect(
      screen.getByRole('button', {
        name: appLabels.actionDeReferenceSauvegarder,
        pressed: true,
      })
    ).toBeTruthy();
  });
});
