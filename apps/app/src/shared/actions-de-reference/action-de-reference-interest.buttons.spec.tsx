import { appLabels } from '@/app/labels/catalog';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionDeReferenceInterestButtons } from './action-de-reference-interest.buttons';

afterEach(cleanup);

describe('ActionDeReferenceInterestButtons', () => {
  it('une action sauvegardée affiche « Sauvegarder » par défaut', () => {
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
      })
    ).toBeTruthy();
  });

  it('une action sauvegardée affiche « Retirer » quand le libellé est fourni', () => {
    render(
      <ActionDeReferenceInterestButtons
        interest={{
          status: 'preselectionnee',
          onToggleSaved: vi.fn(),
          onDismiss: vi.fn(),
          savedActionLabel: appLabels.actionDeReferenceRetirer,
        }}
      />
    );

    expect(
      screen.getByRole('button', { name: appLabels.actionDeReferenceRetirer })
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', {
        name: appLabels.actionDeReferenceSauvegarder,
      })
    ).toBeNull();
  });
});
