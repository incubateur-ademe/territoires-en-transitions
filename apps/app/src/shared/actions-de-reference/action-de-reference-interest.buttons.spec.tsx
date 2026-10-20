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

  it('une action sauvegardée propose « Retirer » à la place de « Sauvegarder »', () => {
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
      screen.getByRole('button', { name: appLabels.actionDeReferenceRetirer })
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', {
        name: appLabels.actionDeReferenceSauvegarder,
      })
    ).toBeNull();
  });
});
